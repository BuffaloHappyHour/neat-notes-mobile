// @ts-ignore Deno
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const JSON_HEADERS = { "Content-Type": "application/json" };

function buildEmailHtml(firstName: string): string {
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
              <p style="font-family:Georgia,serif;font-size:17px;font-style:italic;color:#BE9663;margin:0 0 24px;">your palate profile is waiting.</p>

              <!-- Body copy -->
              <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#DDD6CA;line-height:1.8;margin:0 0 28px;">Your account is ready. Now it's time to log your first pour. Over the next few days, sit down with your favorite glass and pay attention to what you experience. One tasting is all it takes to start seeing patterns in your flavor preferences, style, and palate.</p>

              <!-- Feature box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(190,150,99,0.08);border:1px solid rgba(190,150,99,0.20);border-radius:8px;margin:0 0 28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:600;color:#BE9663;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;">WHAT YOU UNLOCK</p>
                    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#DDD6CA;margin:0 0 8px;">&#8250; Your flavor profile across 225 flavor nodes</p>
                    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#DDD6CA;margin:0 0 8px;">&#8250; Style preferences and palate patterns</p>
                    <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#DDD6CA;margin:0;">&#8250; Personalized whiskey recommendations</p>
                  </td>
                </tr>
              </table>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
                <tr>
                  <td style="background:#BE9663;border-radius:8px;">
                    <a href="https://neatnotesapp.com/open?utm_source=email&utm_medium=activation&utm_campaign=first_pour" style="display:inline-block;padding:14px 28px;color:#151515;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;">Log your first pour</a>
                  </td>
                </tr>
              </table>

              <!-- App update line -->
              <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:rgba(244,241,234,0.45);margin:0 0 12px;line-height:1.6;">
                If you have not opened the app recently, you may need to update it for the best experience.
                <a href="https://apps.apple.com/app/apple-store/id6759411695?pt=128573141&ct=email&mt=8" style="color:#BE9663;text-decoration:none;">iOS</a>
                or
                <a href="https://play.google.com/store/apps/details?id=com.neatnotesapp.neatnotes&utm_source=email&utm_medium=activation" style="color:#BE9663;text-decoration:none;">Android</a>.
              </p>

              <!-- Fallback -->
              <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:rgba(244,241,234,0.45);margin:0;">Button not working? <a href="https://neatnotesapp.com" style="color:#BE9663;text-decoration:none;">Visit neatnotesapp.com</a></p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid rgba(190,150,99,0.10);padding:20px 36px;">
              <p style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:rgba(244,241,234,0.35);margin:0;line-height:1.6;">You received this because you created a Neat Notes account. <a href="https://neatnotesapp.com" style="color:rgba(244,241,234,0.35);text-decoration:underline;">Unsubscribe</a></p>
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

    // LAPSED EMAIL CLOCK RESET PATTERN:
    // For lapsed re-engagement emails, do not use lifetime dedup.
    // Instead check: has a lapsed email been sent AND was last_tasting_at
    // BEFORE that send date? If last_tasting_at is more recent than the
    // last lapsed email, the user logged after receiving it -- reset the
    // clock and make them eligible again.
    // Query: sent_behavioral_notifications WHERE segment = 'email_lapsed_30d'
    // AND sent_at > user's last_tasting_at -> skip. Otherwise eligible.

    // Lifetime deduplication — no time window, once per user ever
    async function alreadySentSet(candidates: string[]): Promise<Set<string>> {
      if (candidates.length === 0) return new Set();
      try {
        const rows = await rest(
          `sent_behavioral_notifications?select=user_id&user_id=in.(${candidates.join(",")})&segment=eq.email_activation`
        ) as Array<{ user_id: string }>;
        return new Set(rows.map((r) => r.user_id));
      } catch {
        return new Set();
      }
    }

    async function recordSends(userIds: string[]): Promise<void> {
      if (userIds.length === 0) return;
      const sentAt = new Date().toISOString();
      const sentDate = sentAt.split("T")[0];
      const rows = userIds.map((user_id) => ({
        user_id,
        segment: "email_activation",
        sent_at: sentAt,
        sent_date: sentDate,
      }));
      try {
        await fetch(`${supabaseUrl}/rest/v1/sent_behavioral_notifications`, {
          method: "POST",
          headers: { ...authHeaders, Prefer: "resolution=ignore-duplicates" },
          body: JSON.stringify(rows),
        });
      } catch { /* non-fatal */ }
    }

    // Paginates auth admin API to build id → email map for the given user ID set
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

    // ── Find zero-tasting users ───────────────────────────────────────────────

    type ProfileRow = { id: string; first_name: string | null };
    const profileRows = await rest(
      "profiles?select=id,first_name"
    ) as ProfileRow[];

    // Users who have ≥1 tasting via metrics view (efficient)
    type MetricRow = { user_id: string };
    const hasTastingRows = await rest(
      "user_metrics_lifetime_current?select=user_id&tasting_count=gte.1"
    ) as MetricRow[];
    const hasTastingSet = new Set(hasTastingRows.map((r) => r.user_id));

    const zeroTastingProfiles = profileRows.filter((r) => !hasTastingSet.has(r.id));
    const candidateIds = zeroTastingProfiles.map((r) => r.id);

    if (candidateIds.length === 0) {
      console.log("send-activation-email: no zero-tasting users found");
      return new Response(
        JSON.stringify({ sent: 0, skipped: 0, failed: 0 }),
        { status: 200, headers: JSON_HEADERS }
      );
    }

    // Deduplicate — skip users already sent this email
    const alreadySent = await alreadySentSet(candidateIds);
    let toSend = zeroTastingProfiles.filter((r) => !alreadySent.has(r.id));
    let skipped = candidateIds.length - toSend.length;

    // 7-day global email frequency cap — one email per user per week across all campaigns
    if (toSend.length > 0) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      type FreqCapRow = { user_id: string };
      const freqCapRows = await rest(
        `sent_behavioral_notifications?select=user_id&user_id=in.(${toSend.map((r) => r.id).join(",")})&segment=like.email%&sent_at=gte.${sevenDaysAgo}`
      ) as FreqCapRow[];
      const freqCapSet = new Set(freqCapRows.map((r) => r.user_id));
      const freqCapSkipped = toSend.filter((r) => freqCapSet.has(r.id)).length;
      toSend = toSend.filter((r) => !freqCapSet.has(r.id));
      skipped += freqCapSkipped;
      if (freqCapSkipped > 0) console.log(`send-activation-email: global_freq_cap_skipped=${freqCapSkipped}`);
    }

    if (toSend.length === 0) {
      console.log(`send-activation-email: all ${skipped} candidates already contacted`);
      return new Response(
        JSON.stringify({ sent: 0, skipped, failed: 0 }),
        { status: 200, headers: JSON_HEADERS }
      );
    }

    // Fetch emails via Admin API
    const toSendIdSet = new Set(toSend.map((r) => r.id));
    const emailMap = await getEmailMap(toSendIdSet);

    // ── Send emails via Resend ────────────────────────────────────────────────

    let sent = 0;
    let failed = 0;
    const sentIds: string[] = [];

    for (const user of toSend) {
      const email = emailMap[user.id];
      if (!email) continue;

      const firstName = user.first_name ?? "there";

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
            subject: "Your palate profile is waiting",
            html: buildEmailHtml(firstName),
          }),
        });

        if (res.ok) {
          sent++;
          sentIds.push(user.id);
        } else {
          failed++;
          const errText = await res.text();
          console.error(`Resend error user=${user.id}: ${errText}`);
        }
      } catch (e) {
        failed++;
        console.error(`Send exception user=${user.id}:`, e);
      }
    }

    await recordSends(sentIds);
    console.log(`send-activation-email complete sent=${sent} skipped=${skipped} failed=${failed}`);

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
