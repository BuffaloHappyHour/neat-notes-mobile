// @ts-ignore Deno
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const JSON_HEADERS = { "Content-Type": "application/json" };

const EXCLUDED_USER_IDS = [
  "50a365b5-4f94-4043-a652-7a5a4cf6f1c5",
  "9484147d-0d97-4ee7-ae9d-7fea0175a47a",
  "bfae8e51-ca88-452e-a25d-e97f97288b1e",
];

type LapsedParams = {
  firstName: string;
  tastingCount: number;
  topFlavor: string;
  topWhiskey: string;
  topRating: number;
};

function buildEmailHtml(p: LapsedParams): string {
  const { firstName, tastingCount, topFlavor, topWhiskey, topRating } = p;
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#151515;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#151515;">
    <tr>
      <td align="center" style="padding:40px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#1F1F1F;border:1px solid rgba(190,150,99,0.16);border-radius:12px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td align="center" style="background:#151515;padding:32px 24px 24px;">
              <img src="https://vfqbioksbylatydjqdhg.supabase.co/storage/v1/object/public/Brand%20Assets/NN_Icon_Transparent.png" width="72" height="72" alt="Neat Notes" style="display:block;border:0;">
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 36px 36px;">

              <!-- Greeting -->
              <p style="font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#F4F1EA;margin:0 0 8px;">Hi ${firstName},</p>

              <!-- Subheading -->
              <p style="font-family:Georgia,serif;font-size:17px;font-style:italic;color:#BE9663;margin:0 0 24px;">your palate profile is still here.</p>

              <!-- Body copy -->
              <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#DDD6CA;line-height:1.8;margin:0 0 24px;">It has been a while since your last pour. But your ${tastingCount} tastings are still here, and so is everything your palate told us. Your top flavor was ${topFlavor}, and your highest rated pour was ${topWhiskey} at ${topRating} points.</p>

              <!-- Stats box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(190,150,99,0.08);border:1px solid rgba(190,150,99,0.20);border-radius:8px;margin:0 0 24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:600;color:#BE9663;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;">YOUR TASTING PROFILE</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#A0968A;padding:0 0 8px;">Pours logged</td>
                        <td align="right" style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#F4F1EA;font-weight:600;padding:0 0 8px;">${tastingCount}</td>
                      </tr>
                      <tr>
                        <td style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#A0968A;padding:0 0 8px;">Dominant flavor</td>
                        <td align="right" style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#F4F1EA;font-weight:600;padding:0 0 8px;">${topFlavor}</td>
                      </tr>
                      <tr>
                        <td style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#A0968A;padding:0 0 8px;">Highest rated pour</td>
                        <td align="right" style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#F4F1EA;font-weight:600;padding:0 0 8px;">${topWhiskey}</td>
                      </tr>
                      <tr>
                        <td style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#A0968A;padding:0;">Top score</td>
                        <td align="right" style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#F4F1EA;font-weight:600;padding:0;">${topRating}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Second paragraph -->
              <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#DDD6CA;line-height:1.8;margin:0 0 28px;">No pitch. Just a reminder that your profile is waiting. Log one pour whenever you are ready and pick up right where you left off.</p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
                <tr>
                  <td style="background:#BE9663;border-radius:8px;">
                    <a href="https://neatnotesapp.com/open?route=log&utm_source=email&utm_medium=lapsed&utm_campaign=reengagement" style="display:inline-block;padding:14px 28px;color:#151515;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;">Log a pour</a>
                  </td>
                </tr>
              </table>

              <!-- Fallback -->
              <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:rgba(244,241,234,0.45);margin:0;">Button not working? <a href="https://neatnotesapp.com" style="color:#BE9663;text-decoration:none;">Visit neatnotesapp.com</a></p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid rgba(190,150,99,0.10);padding:20px 36px;">
              <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:rgba(244,241,234,0.35);margin:0;line-height:1.6;">You received this because you have an active Neat Notes account. <a href="https://neatnotesapp.com" style="color:rgba(244,241,234,0.35);text-decoration:underline;">Unsubscribe</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
    // @ts-ignore Deno
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const authHeaders: Record<string, string> = {
      apikey: serviceRoleKey ?? "",
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    };

    // ── Helpers ───────────────────────────────────────────────────────────────

    async function rest(path: string): Promise<unknown[]> {
      const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, { headers: authHeaders });
      return res.ok ? await res.json() : [];
    }

    async function recordSends(rows: Array<{ user_id: string; segment: string }>): Promise<void> {
      if (rows.length === 0) return;
      const sentAt = new Date().toISOString();
      const sentDate = sentAt.split("T")[0];
      const payload = rows.map(({ user_id, segment }) => ({
        user_id,
        segment,
        sent_at: sentAt,
        sent_date: sentDate,
      }));
      try {
        await fetch(`${supabaseUrl}/rest/v1/sent_behavioral_notifications`, {
          method: "POST",
          headers: { ...authHeaders, Prefer: "resolution=ignore-duplicates" },
          body: JSON.stringify(payload),
        });
      } catch { /* non-fatal */ }
    }

    // Paginates auth admin API to build id -> email map for the given user ID set
    async function getEmailMap(userIds: Set<string>): Promise<Record<string, string>> {
      const emailMap: Record<string, string> = {};
      let page = 1;
      const perPage = 1000;
      while (true) {
        try {
          const res = await fetch(
            `${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
            { headers: authHeaders }
          );
          if (!res.ok) break;
          const data = await res.json() as { users?: Array<{ id: string; email?: string }> };
          const users = data.users ?? [];
          for (const u of users) {
            if (userIds.has(u.id) && u.email) emailMap[u.id] = u.email;
          }
          if (users.length < perPage) break;
          page++;
        } catch { break; }
      }
      return emailMap;
    }

    // ── 1. Eligible profiles: free users, non-excluded ────────────────────────

    const excludedSet = new Set(EXCLUDED_USER_IDS);

    type ProfileRow = { id: string; first_name: string | null; is_premium: boolean };
    const profileRows = await rest(
      "profiles?select=id,first_name,is_premium"
    ) as ProfileRow[];

    const profileMap = new Map<string, ProfileRow>();
    for (const r of profileRows) {
      if (!excludedSet.has(r.id) && !r.is_premium) profileMap.set(r.id, r);
    }

    // ── 2. Users with >= 3 tastings, last_tasting_at more than 60 days ago ────

    const since60d = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

    type MetricRow = { user_id: string; tasting_count: number; last_tasting_at: string };
    const metricRows = await rest(
      `user_metrics_lifetime_current?select=user_id,tasting_count,last_tasting_at&tasting_count=gte.3&last_tasting_at=lte.${since60d}`
    ) as MetricRow[];

    const metricMap = new Map<string, MetricRow>(
      metricRows.map((r) => [r.user_id, r])
    );

    // ── 3. Intersect: free profiles with qualifying metrics ───────────────────

    type Candidate = {
      id: string;
      firstName: string;
      tastingCount: number;
      lastTastingAt: string;
      segment: string;
    };

    const candidates: Candidate[] = [];
    for (const [id, profile] of profileMap) {
      const metric = metricMap.get(id);
      if (metric == null) continue;
      candidates.push({
        id,
        firstName: profile.first_name ?? "there",
        tastingCount: metric.tasting_count,
        lastTastingAt: metric.last_tasting_at,
        segment: "email_lapsed",
      });
    }

    if (candidates.length === 0) {
      console.log("send-lapsed-email: no eligible candidates");
      return new Response(
        JSON.stringify({ sent: 0, skipped: 0, failed: 0 }),
        { status: 200, headers: JSON_HEADERS }
      );
    }

    // ── 4. Dedup with clock reset ─────────────────────────────────────────────
    // LAPSED EMAIL CLOCK RESET PATTERN: fetch most recent send per user for this segment.
    // If sent_at > last_tasting_at, user has not logged since the email -- skip.
    // If sent_at < last_tasting_at, user logged after the email -- eligible again.

    const candidateIds = candidates.map((c) => c.id);

    type SentRow = { user_id: string; sent_at: string };
    const sentRows = await rest(
      `sent_behavioral_notifications?select=user_id,sent_at&user_id=in.(${candidateIds.join(",")})&segment=eq.email_lapsed&order=sent_at.desc`
    ) as SentRow[];

    const lastSentMap = new Map<string, string>();
    for (const r of sentRows) {
      if (!lastSentMap.has(r.user_id)) lastSentMap.set(r.user_id, r.sent_at);
    }

    let toSend = candidates.filter((c) => {
      const lastSent = lastSentMap.get(c.id);
      if (!lastSent) return true;
      return lastSent < c.lastTastingAt;
    });
    let skipped = candidates.length - toSend.length;

    // 7-day global email frequency cap -- one email per user per week across all campaigns
    if (toSend.length > 0) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      type FreqCapRow = { user_id: string };
      const freqCapRows = await rest(
        `sent_behavioral_notifications?select=user_id&user_id=in.(${toSend.map((c) => c.id).join(",")})&segment=like.email%&sent_at=gte.${sevenDaysAgo}`
      ) as FreqCapRow[];
      const freqCapSet = new Set(freqCapRows.map((r) => r.user_id));
      const freqCapSkipped = toSend.filter((c) => freqCapSet.has(c.id)).length;
      toSend = toSend.filter((c) => !freqCapSet.has(c.id));
      skipped += freqCapSkipped;
      if (freqCapSkipped > 0) console.log(`send-lapsed-email: global_freq_cap_skipped=${freqCapSkipped}`);
    }

    if (toSend.length === 0) {
      console.log(`send-lapsed-email: all ${skipped} candidates already contacted`);
      return new Response(
        JSON.stringify({ sent: 0, skipped, failed: 0 }),
        { status: 200, headers: JSON_HEADERS }
      );
    }

    // ── 5. Per-user tasting data: top whiskey and dominant flavor ─────────────

    const toSendIds = toSend.map((c) => c.id);

    type TastingRow = {
      user_id: string;
      rating: number | null;
      whiskey_name: string | null;
      flavor_tags: string[] | null;
      whiskeys: { display_name: string } | null;
    };
    const tastingRows = await rest(
      `tastings?select=user_id,rating,whiskey_name,flavor_tags,whiskeys(display_name)&user_id=in.(${toSendIds.join(",")})`
    ) as TastingRow[];

    const tastingsByUser = new Map<string, TastingRow[]>();
    for (const t of tastingRows) {
      if (!tastingsByUser.has(t.user_id)) tastingsByUser.set(t.user_id, []);
      tastingsByUser.get(t.user_id)!.push(t);
    }

    type UserData = { topWhiskey: string; topRating: number; topFlavor: string };
    const userDataMap = new Map<string, UserData>();

    for (const [userId, tastings] of tastingsByUser) {
      let topWhiskey = "your top pour";
      let topRating = 0;
      for (const t of tastings) {
        if (t.rating != null && t.rating > topRating) {
          topRating = t.rating;
          topWhiskey = t.whiskeys?.display_name ?? t.whiskey_name ?? "your top pour";
        }
      }

      const flavorCounts = new Map<string, number>();
      for (const t of tastings) {
        for (const tag of (t.flavor_tags ?? [])) {
          flavorCounts.set(tag, (flavorCounts.get(tag) ?? 0) + 1);
        }
      }
      let topFlavor = "complex";
      let topFlavCount = 0;
      for (const [flavor, count] of flavorCounts) {
        if (count > topFlavCount) {
          topFlavCount = count;
          topFlavor = flavor;
        }
      }

      userDataMap.set(userId, { topWhiskey, topRating, topFlavor });
    }

    // ── 6. Fetch emails via Admin API ─────────────────────────────────────────

    const toSendIdSet = new Set(toSendIds);
    const emailMap = await getEmailMap(toSendIdSet);

    // ── 7. Send emails ────────────────────────────────────────────────────────

    let sent = 0;
    let failed = 0;
    const sentRecords: Array<{ user_id: string; segment: string }> = [];

    for (const candidate of toSend) {
      const email = emailMap[candidate.id];
      if (!email) continue;

      const data = userDataMap.get(candidate.id);
      const topWhiskey = data?.topWhiskey ?? "your top pour";
      const topRating = data?.topRating ?? 0;
      const topFlavor = data?.topFlavor ?? "complex";

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Neat Notes <hello@neatnotesapp.com>",
            to: [email],
            subject: `You logged ${candidate.tastingCount} whiskies. We saved your palate profile.`,
            html: buildEmailHtml({
              firstName: candidate.firstName,
              tastingCount: candidate.tastingCount,
              topFlavor,
              topWhiskey,
              topRating,
            }),
          }),
        });

        if (res.ok) {
          sent++;
          sentRecords.push({ user_id: candidate.id, segment: candidate.segment });
        } else {
          failed++;
          const errText = await res.text();
          console.error(`Resend error user=${candidate.id}: ${errText}`);
        }
      } catch (e) {
        failed++;
        console.error(`Send exception user=${candidate.id}:`, e);
      }
    }

    await recordSends(sentRecords);
    console.log(`send-lapsed-email complete sent=${sent} skipped=${skipped} failed=${failed}`);

    return new Response(
      JSON.stringify({ sent, skipped, failed }),
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
