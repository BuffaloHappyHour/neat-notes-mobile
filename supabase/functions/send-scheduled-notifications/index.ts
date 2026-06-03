// @ts-ignore Deno
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FRIDAY_MESSAGES = [
  { title: "Friday Pour 🥃", body: "What are you pouring this weekend?" },
  { title: "Friday Pour 🥃", body: "Friday night calls for something good. What's in your glass?" },
  { title: "Friday Pour 🥃", body: "Weekend's here. Time to log something worth remembering." },
  { title: "Friday Pour 🥃", body: "Any new pours on the radar this weekend?" },
  { title: "Friday Pour 🥃", body: "Your palate is waiting. What are you drinking tonight?" },
  { title: "Friday Pour 🥃", body: "Friday pour incoming — what did you pick?" },
  { title: "Friday Pour 🥃", body: "The weekend bottle. What did you reach for?" },
  { title: "Friday Pour 🥃", body: "Something neat, something new, or an old favorite? Log it." },
  { title: "Know Your Palate", body: "When did you last try something outside your usual style? Your diversity score will thank you." },
  { title: "Know Your Palate", body: "Your palate grows when you challenge it. Try a proof range you don't normally reach for." },
  { title: "Know Your Palate", body: "New flavor territory = better insights. What style haven't you logged yet?" },
  { title: "Know Your Palate", body: "Consistency is good. Range is better. Try something different this weekend." },
];

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

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
    // ── 1. Select message for this week ──────────────────────────────────────
    const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    const message = FRIDAY_MESSAGES[weekNumber % 12];

    // ── 2. Supabase service role client (bypasses RLS) ───────────────────────
    // @ts-ignore Deno
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    // @ts-ignore Deno
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authHeaders: Record<string, string> = {
      apikey: serviceRoleKey ?? "",
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    };

    // ── 3a. Fetch eligible user_ids (notify_scheduled = true) ────────────────
    const npRes = await fetch(
      `${supabaseUrl}/rest/v1/notification_preferences?select=user_id&notify_scheduled=eq.true`,
      { headers: authHeaders }
    );

    if (!npRes.ok) {
      const msg = await npRes.text();
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: JSON_HEADERS,
      });
    }

    const npRows: Array<{ user_id: string }> = await npRes.json();
    const eligibleIds = npRows.map((r) => r.user_id).filter(Boolean);

    if (eligibleIds.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, failed: 0, message: "No eligible users" }),
        { status: 200, headers: JSON_HEADERS }
      );
    }

    // ── 3b. Fetch push tokens for eligible users ──────────────────────────────
    const idList = eligibleIds.join(",");
    const tokensRes = await fetch(
      `${supabaseUrl}/rest/v1/user_push_tokens?select=token,platform&user_id=in.(${idList})`,
      { headers: authHeaders }
    );

    if (!tokensRes.ok) {
      const msg = await tokensRes.text();
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: JSON_HEADERS,
      });
    }

    const tokenRows: Array<{ token: string; platform: string }> =
      await tokensRes.json();
    const tokens = tokenRows.map((r) => r.token).filter(Boolean);

    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, failed: 0, message: "No tokens found" }),
        { status: 200, headers: JSON_HEADERS }
      );
    }

    // ── 4. Send via Expo Push API in batches of 100 ──────────────────────────
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < tokens.length; i += 100) {
      const batch = tokens.slice(i, i + 100);
      const messages = batch.map((token) => ({
        to: token,
        title: message.title,
        body: message.body,
        sound: "default",
      }));

      try {
        const pushRes = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(messages),
        });

        if (pushRes.ok) {
          const result = await pushRes.json();
          const data: Array<{ status: string }> = result.data ?? [];
          for (const item of data) {
            if (item.status === "ok") {
              sent++;
            } else {
              failed++;
            }
          }
        } else {
          failed += batch.length;
        }
      } catch {
        failed += batch.length;
      }
    }

    console.log(`Notifications sent=${sent} failed=${failed} message="${message.title}"`);

    // ── 5. Return result ─────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        sent,
        failed,
        message: `${message.title}: ${message.body}`,
      }),
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
