// @ts-ignore Deno
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/*
  Bootstrap migration — run once before deploying:

  CREATE TABLE IF NOT EXISTS public.sent_behavioral_notifications (
    id        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    segment   text        NOT NULL,
    sent_at   timestamptz NOT NULL DEFAULT now(),
    sent_date date        NOT NULL DEFAULT CURRENT_DATE
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_sent_behavioral_daily
    ON public.sent_behavioral_notifications (user_id, segment, sent_date);
  ALTER TABLE public.sent_behavioral_notifications ENABLE ROW LEVEL SECURITY;
*/

const JSON_HEADERS = { "Content-Type": "application/json" };

const SEGMENTS = {
  a: {
    title: "Your Palate Is Forming 🥃",
    body: "You've logged 3 pours. Your flavor profile is starting to take shape.",
  },
  b: {
    title: "Double Digits",
    body: "10 pours logged. Your palate profile is ready to explore in Insights.",
  },
  c: {
    title: "Still Exploring?",
    body: "It's been a week. What have you been drinking?",
  },
  d: {
    title: "Your Data Is Ready",
    body: "You have enough pours to unlock your full palate profile.",
  },
};

// ── Expo batch sender ─────────────────────────────────────────────────────────

async function sendExpoBatch(
  tokens: string[],
  title: string,
  body: string
): Promise<number> {
  let sent = 0;
  for (let i = 0; i < tokens.length; i += 100) {
    const batch = tokens.slice(i, i + 100);
    const messages = batch.map((token) => ({ to: token, title, body, sound: "default" }));
    try {
      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(messages),
      });
      if (res.ok) {
        const result = await res.json();
        const data: Array<{ status: string }> = result.data ?? [];
        sent += data.filter((d) => d.status === "ok").length;
      }
    } catch { /* non-fatal per batch */ }
  }
  return sent;
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: {} });
  }

  // @ts-ignore Deno
  if (req.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: JSON_HEADERS,
    });
  }

  try {
    // @ts-ignore Deno
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    // @ts-ignore Deno
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authHeaders: Record<string, string> = {
      apikey: serviceRoleKey ?? "",
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    };

    const now = Date.now();
    const h24Ago = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const d7Ago  = new Date(now - 7  * 24 * 60 * 60 * 1000).toISOString();
    const d14Ago = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
    const d30Ago = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

    // ── Helpers ───────────────────────────────────────────────────────────────

    async function rest(path: string): Promise<unknown[]> {
      const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, { headers: authHeaders });
      return res.ok ? await res.json() : [];
    }

    async function getTokenMap(userIds: string[]): Promise<Record<string, string>> {
      if (userIds.length === 0) return {};
      const rows = await rest(
        `user_push_tokens?select=user_id,token&user_id=in.(${userIds.join(",")})`
      ) as Array<{ user_id: string; token: string }>;
      return Object.fromEntries(rows.filter((r) => r.token).map((r) => [r.user_id, r.token]));
    }

    // Returns set of user_ids already sent this segment within the window
    async function alreadySentSet(
      candidates: string[],
      segment: string,
      since: string
    ): Promise<Set<string>> {
      if (candidates.length === 0) return new Set();
      try {
        const rows = await rest(
          `sent_behavioral_notifications?select=user_id&user_id=in.(${candidates.join(",")})&segment=eq.${segment}&sent_at=gte.${since}`
        ) as Array<{ user_id: string }>;
        return new Set(rows.map((r) => r.user_id));
      } catch {
        return new Set();
      }
    }

    // INSERT … ON CONFLICT DO NOTHING via Prefer header
    async function recordSends(userIds: string[], segment: string): Promise<void> {
      if (userIds.length === 0) return;
      const sentAt = new Date().toISOString();
      const sentDate = sentAt.split("T")[0];
      const rows = userIds.map((user_id) => ({ user_id, segment, sent_at: sentAt, sent_date: sentDate }));
      try {
        await fetch(`${supabaseUrl}/rest/v1/sent_behavioral_notifications`, {
          method: "POST",
          headers: {
            ...authHeaders,
            Prefer: "resolution=ignore-duplicates",
          },
          body: JSON.stringify(rows),
        });
      } catch { /* non-fatal */ }
    }

    // ── Notification preferences ──────────────────────────────────────────────

    type NpRow = { user_id: string; notify_behavioral: boolean; notify_premium_nudge: boolean };
    const npRows = await rest(
      "notification_preferences?select=user_id,notify_behavioral,notify_premium_nudge"
    ) as NpRow[];

    const behavioralIds  = new Set(npRows.filter((r) => r.notify_behavioral).map((r) => r.user_id));
    const premiumNudgeIds = new Set(npRows.filter((r) => r.notify_premium_nudge).map((r) => r.user_id));

    const counts = { a: 0, b: 0, c: 0, d: 0 };

    // ── SEGMENTS A & B — tasting milestones ───────────────────────────────────
    //
    // Find users who logged their N-th tasting in the last 24 hours:
    // 1. Users active in last 24h
    // 2. Cross-reference with user_metrics_90d_current tasting_count

    const recentRows = await rest(
      `tastings?select=user_id&created_at=gte.${h24Ago}`
    ) as Array<{ user_id: string }>;

    const recentActiveIds = [
      ...new Set(recentRows.map((r) => r.user_id).filter((id) => behavioralIds.has(id))),
    ];

    if (recentActiveIds.length > 0) {
      type MetricRow = { user_id: string; tasting_count: number };
      const metricRows = await rest(
        `user_metrics_90d_current?select=user_id,tasting_count&user_id=in.(${recentActiveIds.join(",")})`
      ) as MetricRow[];

      // Segment A — exactly 3 tastings
      const segAIds = metricRows.filter((r) => r.tasting_count === 3).map((r) => r.user_id);
      if (segAIds.length > 0) {
        const tokenMap = await getTokenMap(segAIds);
        counts.a = await sendExpoBatch(Object.values(tokenMap), SEGMENTS.a.title, SEGMENTS.a.body);
        console.log(`Segment A sent=${counts.a}`);
      }

      // Segment B — exactly 10 tastings
      const segBIds = metricRows.filter((r) => r.tasting_count === 10).map((r) => r.user_id);
      if (segBIds.length > 0) {
        const tokenMap = await getTokenMap(segBIds);
        counts.b = await sendExpoBatch(Object.values(tokenMap), SEGMENTS.b.title, SEGMENTS.b.body);
        console.log(`Segment B sent=${counts.b}`);
      }
    }

    // ── SEGMENT C — 7-day inactive ────────────────────────────────────────────
    //
    // Users who: have ≥1 tasting in metrics, none in last 7 days,
    // notify_behavioral=true, not sent in last 30 days.

    const activeIn7dRows = await rest(
      `tastings?select=user_id&created_at=gte.${d7Ago}`
    ) as Array<{ user_id: string }>;
    const activeIn7d = new Set(activeIn7dRows.map((r) => r.user_id));

    type MetricRow2 = { user_id: string; tasting_count: number };
    const allMetricRows = await rest(
      "user_metrics_90d_current?select=user_id,tasting_count&tasting_count=gte.1"
    ) as MetricRow2[];

    const segCCandidates = allMetricRows
      .filter((r) => !activeIn7d.has(r.user_id) && behavioralIds.has(r.user_id))
      .map((r) => r.user_id);

    if (segCCandidates.length > 0) {
      const alreadySentC = await alreadySentSet(segCCandidates, "c", d30Ago);
      const segCToSend = segCCandidates.filter((id) => !alreadySentC.has(id));

      if (segCToSend.length > 0) {
        const tokenMap = await getTokenMap(segCToSend);
        const sentIds = segCToSend.filter((id) => tokenMap[id]);
        counts.c = await sendExpoBatch(Object.values(tokenMap), SEGMENTS.c.title, SEGMENTS.c.body);
        await recordSends(sentIds, "c");
        console.log(`Segment C sent=${counts.c}`);
      }
    }

    // ── SEGMENT D — premium nudge ─────────────────────────────────────────────
    //
    // Users with ≥5 tastings, notify_premium_nudge=true, not premium,
    // not nudged in last 14 days.
    //
    // Assumes profiles.is_premium boolean column (synced from RevenueCat).

    type MetricRow3 = { user_id: string; tasting_count: number };
    const nudgeMetricRows = await rest(
      "user_metrics_90d_current?select=user_id,tasting_count&tasting_count=gte.5"
    ) as MetricRow3[];

    const nudgeCandidates = nudgeMetricRows
      .filter((r) => premiumNudgeIds.has(r.user_id))
      .map((r) => r.user_id);

    if (nudgeCandidates.length > 0) {
      // Exclude already-premium users (profiles.is_premium = true)
      type ProfileRow = { id: string };
      const premiumProfileRows = await rest(
        `profiles?select=id&id=in.(${nudgeCandidates.join(",")})&is_premium=eq.true`
      ) as ProfileRow[];
      const premiumSet = new Set(premiumProfileRows.map((r) => r.id));

      const nonPremiumCandidates = nudgeCandidates.filter((id) => !premiumSet.has(id));
      const alreadySentD = await alreadySentSet(nonPremiumCandidates, "d", d14Ago);
      const segDToSend = nonPremiumCandidates.filter((id) => !alreadySentD.has(id));

      if (segDToSend.length > 0) {
        const tokenMap = await getTokenMap(segDToSend);
        const sentIds = segDToSend.filter((id) => tokenMap[id]);
        counts.d = await sendExpoBatch(Object.values(tokenMap), SEGMENTS.d.title, SEGMENTS.d.body);
        await recordSends(sentIds, "d");
        console.log(`Segment D sent=${counts.d}`);
      }
    }

    // ── Response ──────────────────────────────────────────────────────────────

    const total = counts.a + counts.b + counts.c + counts.d;
    console.log(`Behavioral notifications complete total=${total}`, counts);

    return new Response(
      JSON.stringify({ segments: counts, total }),
      { status: 200, headers: JSON_HEADERS }
    );
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errMessage }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
});
