// @ts-ignore Deno
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOGO_BASE64 =
  "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";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const JSON_HEADERS = {
  ...CORS_HEADERS,
  "Content-Type": "application/json",
};

type Snapshot = {
  participants: number;
  total_tastings: number;
  unique_whiskies: number;
  avg_rating: number;
  first_tasting: string;
  last_tasting: string;
};

type BottleFlavor = { label: string; level: number; selections: number };

type Bottle = {
  display_name: string;
  whiskey_type: string | null;
  proof: number | null;
  tasting_count: number;
  avg_rating: number;
  nose_enjoyed: number;
  nose_neutral: number;
  nose_not_for_me: number;
  taste_enjoyed: number;
  taste_neutral: number;
  taste_not_for_me: number;
  bottle_flavors?: BottleFlavor[];
};

type RatingBand = { band: string; count: number };

type Flavor = { label: string; level: number; selections: number };

type Reactions = {
  nose_enjoyed: number;
  nose_neutral: number;
  nose_not_for_me: number;
  taste_enjoyed: number;
  taste_neutral: number;
  taste_not_for_me: number;
};

type Analytics = {
  event_name: string;
  snapshot: Snapshot;
  bottles: Bottle[];
  rating_bands: RatingBand[];
  flavors: Flavor[];
  reactions: Reactions;
};

type EventRow = {
  name: string;
  starts_at: string | null;
  venue_name_free: string | null;
  venue_city: string | null;
  venue_state: string | null;
  branding_logo_url: string | null;
};

function esc(s: unknown): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function sectionHeader(title: string): string {
  return `
    <div style="margin-top:48px;margin-bottom:18px;">
      <h2 style="font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:600;color:#F4F1EA;letter-spacing:0.3px;margin:0;">${esc(title)}</h2>
      <div style="height:1px;background:#BE9663;margin-top:10px;opacity:0.55;"></div>
    </div>`;
}

function reactionRow(
  label: string,
  enjoyed: number,
  neutral: number,
  notForMe: number
): string {
  const total = enjoyed + neutral + notForMe;
  if (total === 0) return "";
  const ePct = Math.round((enjoyed / total) * 100);
  const nPct = Math.round((neutral / total) * 100);
  const mPct = 100 - ePct - nPct;
  return `
    <div style="margin-bottom:22px;">
      <div style="font-family:'Montserrat',sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#BE9663;margin-bottom:8px;">${esc(label)}</div>
      <div style="display:flex;height:26px;border-radius:4px;overflow:hidden;">
        ${ePct > 0 ? `<div style="flex:${ePct};background:#79B58B;display:flex;align-items:center;justify-content:center;font-family:'Montserrat',sans-serif;font-size:10px;color:#fff;">${ePct}%</div>` : ""}
        ${nPct > 0 ? `<div style="flex:${nPct};background:rgba(190,150,99,0.3);display:flex;align-items:center;justify-content:center;font-family:'Montserrat',sans-serif;font-size:10px;color:#F4F1EA;">${nPct}%</div>` : ""}
        ${mPct > 0 ? `<div style="flex:${mPct};background:#D46A6A;display:flex;align-items:center;justify-content:center;font-family:'Montserrat',sans-serif;font-size:10px;color:#fff;">${mPct}%</div>` : ""}
      </div>
      <div style="display:flex;gap:16px;margin-top:6px;">
        <span style="font-family:'Montserrat',sans-serif;font-size:10px;color:rgba(244,241,234,0.45);">Enjoyed ${enjoyed}</span>
        <span style="font-family:'Montserrat',sans-serif;font-size:10px;color:rgba(244,241,234,0.45);">Neutral ${neutral}</span>
        <span style="font-family:'Montserrat',sans-serif;font-size:10px;color:rgba(244,241,234,0.45);">Not for me ${notForMe}</span>
      </div>
    </div>`;
}

function buildHTML(a: Analytics, ev: EventRow, logoSrc: string): string {
  const snap = a.snapshot;
  const bottles = a.bottles ?? [];
  const bands = a.rating_bands ?? [];
  const flavors = a.flavors ?? [];
  const reactions = a.reactions;

  const sortedBottles = [...bottles].sort((x, y) => y.avg_rating - x.avg_rating);
  const maxBandCount = Math.max(...bands.map((b) => b.count), 1);

  const noseTotal =
    reactions.nose_enjoyed + reactions.nose_neutral + reactions.nose_not_for_me;
  const tasteTotal =
    reactions.taste_enjoyed + reactions.taste_neutral + reactions.taste_not_for_me;
  const hasReactions = noseTotal > 0 || tasteTotal > 0;

  const location = [ev.venue_city, ev.venue_state].filter(Boolean).join(", ");
  const dateLocation = [fmtDate(ev.starts_at), location].filter(Boolean).join(" · ");

  const topBottle = sortedBottles[0];
  const topFlavor = flavors[0];

  // ── Bottle rows ──────────────────────────────────────────────────────────────
  const bottleRows = sortedBottles
    .map((bot) => {
      const barWidth = Math.round((bot.avg_rating / 100) * 180);
      const meta = [
        bot.whiskey_type,
        bot.proof != null ? `${bot.proof}°` : null,
      ]
        .filter(Boolean)
        .join(" · ");
      return `
        <tr style="border-bottom:1px solid rgba(190,150,99,0.14);">
          <td style="padding:14px 20px 14px 0;vertical-align:top;">
            <div style="font-family:'Cormorant Garamond',serif;font-size:18px;color:#F4F1EA;line-height:1.3;">${esc(bot.display_name)}</div>
            ${
              meta
                ? `<span style="display:inline-block;margin-top:5px;padding:2px 9px;border-radius:999px;border:1px solid rgba(190,150,99,0.38);font-family:'Montserrat',sans-serif;font-size:10px;color:#BE9663;letter-spacing:0.4px;">${esc(meta)}</span>`
                : ""
            }
          </td>
          <td style="padding:14px;text-align:center;vertical-align:middle;font-family:'Montserrat',sans-serif;font-size:14px;color:#F4F1EA;white-space:nowrap;">${bot.tasting_count}</td>
          <td style="padding:14px 0;vertical-align:middle;width:210px;">
            <div style="font-family:'Montserrat',sans-serif;font-size:15px;font-weight:500;color:#BE9663;">${bot.avg_rating.toFixed(1)}</div>
            <div style="margin-top:5px;width:180px;height:4px;border-radius:2px;background:rgba(190,150,99,0.18);">
              <div style="width:${barWidth}px;height:4px;border-radius:2px;background:#BE9663;"></div>
            </div>
          </td>
        </tr>`;
    })
    .join("");

  // ── Rating distribution ───────────────────────────────────────────────────
  const bandRows = bands
    .map((band) => {
      const fillPct = Math.round((band.count / maxBandCount) * 100);
      return `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
          <div style="width:70px;font-family:'Montserrat',sans-serif;font-size:12px;color:rgba(244,241,234,0.5);flex-shrink:0;">${esc(band.band)}</div>
          <div style="flex:1;height:10px;border-radius:2px;background:rgba(190,150,99,0.15);">
            <div style="width:${fillPct}%;height:10px;border-radius:2px;background:#BE9663;"></div>
          </div>
          <div style="width:28px;text-align:right;font-family:'Montserrat',sans-serif;font-size:12px;color:rgba(244,241,234,0.5);flex-shrink:0;">${band.count}</div>
        </div>`;
    })
    .join("");

  // ── Flavor signal cards ───────────────────────────────────────────────────
  const flavorCards = sortedBottles
    .filter((bot) => bot.bottle_flavors && bot.bottle_flavors.length > 0)
    .map((bot) => {
      const pills = (bot.bottle_flavors ?? [])
        .map(
          (f) =>
            `<span style="display:inline-block;margin:3px;padding:4px 11px;border-radius:999px;border:1px solid rgba(190,150,99,0.32);font-family:'Montserrat',sans-serif;font-size:11px;color:#F4F1EA;${f.level === 3 ? "font-style:italic;" : ""}">${esc(f.label)} ×${f.selections}</span>`
        )
        .join("");
      return `
        <div style="margin-bottom:18px;padding-left:16px;border-left:3px solid #BE9663;">
          <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:600;color:#F4F1EA;margin-bottom:8px;">${esc(bot.display_name)}</div>
          <div style="line-height:1;">${pills}</div>
        </div>`;
    })
    .join("");

  // ── Summary text ──────────────────────────────────────────────────────────
  let summaryText = `The ${esc(ev.name)} tasting generated strong app engagement, with ${snap.participants} attendees logging ${snap.total_tastings} tasting entries across ${snap.unique_whiskies} featured bottles.`;
  if (topBottle) {
    summaryText += ` ${esc(topBottle.display_name)} was the top performer with an average score of ${topBottle.avg_rating.toFixed(1)}.`;
  }
  if (topFlavor) {
    summaryText += ` The room's dominant flavor signal was ${esc(topFlavor.label)}.`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neat Notes – ${esc(ev.name)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Montserrat:wght@400;500&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#1a1714;color:#F4F1EA;font-family:'Montserrat',sans-serif;">
<div style="max-width:800px;margin:0 auto;padding:60px;">

  <!-- ── 1. HEADER ── -->
  <div style="display:flex;align-items:flex-start;gap:18px;margin-bottom:28px;">
    <img src="${logoSrc}" style="height:48px;width:auto;flex-shrink:0;" alt="Neat Notes">
    <div>
      <div style="font-family:'Montserrat',sans-serif;font-size:11px;letter-spacing:4px;text-transform:uppercase;font-variant:small-caps;color:#BE9663;font-weight:500;line-height:1.2;">Neat Notes</div>
      <div style="font-family:'Montserrat',sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(190,150,99,0.65);margin-top:3px;">Event Report${ev.venue_name_free ? ` &middot; ${esc(ev.venue_name_free)}` : ""}</div>
    </div>
  </div>
  <h1 style="font-family:'Cormorant Garamond',serif;font-size:52px;font-weight:600;color:#F4F1EA;line-height:1.08;margin:0 0 12px;">${esc(ev.name)}</h1>
  <div style="font-family:'Montserrat',sans-serif;font-size:13px;color:rgba(244,241,234,0.55);letter-spacing:0.4px;">${esc(dateLocation)}</div>

  <!-- ── 2. STATS ROW ── -->
  <div style="display:flex;gap:14px;margin-top:40px;">
    ${[
      { label: "TASTERS", value: snap.participants },
      { label: "TASTINGS", value: snap.total_tastings },
      { label: "BOTTLES", value: snap.unique_whiskies },
    ]
      .map(
        (s) => `
    <div style="flex:1;border:1px solid rgba(190,150,99,0.38);border-radius:8px;padding:22px 16px;text-align:center;background:rgba(190,150,99,0.04);">
      <div style="font-family:'Cormorant Garamond',serif;font-size:42px;font-weight:600;color:#BE9663;line-height:1;">${s.value}</div>
      <div style="font-family:'Montserrat',sans-serif;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:rgba(244,241,234,0.45);margin-top:7px;">${s.label}</div>
    </div>`
      )
      .join("")}
  </div>

  <!-- ── 3. BOTTLES RANKED ── -->
  ${sectionHeader("Bottles Ranked")}
  <table style="width:100%;border-collapse:collapse;">
    <thead>
      <tr>
        <th style="text-align:left;padding-bottom:10px;font-family:'Montserrat',sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(190,150,99,0.65);font-weight:500;">Whiskey</th>
        <th style="text-align:center;padding-bottom:10px;font-family:'Montserrat',sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(190,150,99,0.65);font-weight:500;width:60px;">Logs</th>
        <th style="text-align:left;padding-bottom:10px;padding-left:0;font-family:'Montserrat',sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(190,150,99,0.65);font-weight:500;width:210px;">Avg</th>
      </tr>
    </thead>
    <tbody>${bottleRows}</tbody>
  </table>

  <!-- ── 4. RATING DISTRIBUTION ── -->
  ${
    bands.length > 0
      ? `${sectionHeader("How the Room Rated")}${bandRows}`
      : ""
  }

  <!-- ── 5. FLAVOR SIGNAL ── -->
  ${
    flavorCards
      ? `${sectionHeader("Flavor Signal")}${flavorCards}`
      : ""
  }

  <!-- ── 6. ROOM REACTIONS ── -->
  ${
    hasReactions
      ? `${sectionHeader("Room Reactions")}
         ${reactionRow("Nose", reactions.nose_enjoyed, reactions.nose_neutral, reactions.nose_not_for_me)}
         ${reactionRow("Taste", reactions.taste_enjoyed, reactions.taste_neutral, reactions.taste_not_for_me)}`
      : ""
  }

  <!-- ── 7. REP-FRIENDLY SUMMARY ── -->
  ${sectionHeader("Rep-Friendly Summary")}
  <div style="font-family:'Montserrat',sans-serif;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;font-variant:small-caps;color:#BE9663;margin-bottom:14px;">For Brand &amp; Venue Partners</div>
  <div style="border:1px solid rgba(190,150,99,0.32);border-radius:8px;padding:26px;background:rgba(190,150,99,0.04);">
    <p style="font-family:'Montserrat',sans-serif;font-size:14px;line-height:1.75;color:#F4F1EA;margin:0;">${summaryText}</p>
  </div>

  <!-- ── 8. FOOTER ── -->
  <div style="margin-top:64px;border-top:1px solid rgba(190,150,99,0.38);padding-top:24px;text-align:center;">
    <div style="font-family:'Montserrat',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;font-variant:small-caps;color:#BE9663;">Neat Notes &middot; Intelligent Whiskey Journal</div>
    <div style="font-family:'Montserrat',sans-serif;font-size:10px;color:rgba(244,241,234,0.35);margin-top:7px;letter-spacing:0.8px;">@neatnotesapp &middot; neatnotesapp.com</div>
  </div>

</div>
</body>
</html>`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Missing authorization header" }),
      { status: 401, headers: JSON_HEADERS }
    );
  }

  let event_id: string | undefined;
  try {
    const body = await req.json();
    event_id = body?.event_id;
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  if (!event_id) {
    return new Response(
      JSON.stringify({ error: "Missing event_id" }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const authHeaders = {
      apikey: anonKey,
      Authorization: authHeader,
      "Content-Type": "application/json",
    };

    // ── 1. RPC ──────────────────────────────────────────────────────────────
    const rpcRes = await fetch(
      `${supabaseUrl}/rest/v1/rpc/get_event_analytics`,
      {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ p_event_id: event_id }),
      }
    );

    if (!rpcRes.ok) {
      let msg = `HTTP ${rpcRes.status}`;
      try {
        const e = await rpcRes.json();
        msg = e.message ?? msg;
      } catch { /* empty */ }
      if (msg.includes("Not authorized")) {
        return new Response(
          JSON.stringify({ error: "Not authorized" }),
          { status: 403, headers: JSON_HEADERS }
        );
      }
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 500, headers: JSON_HEADERS }
      );
    }

    const analytics: Analytics = await rpcRes.json();

    // ── 2. Event details ─────────────────────────────────────────────────────
    const evtRes = await fetch(
      `${supabaseUrl}/rest/v1/events` +
        `?select=name,starts_at,venue_name_free,venue_city,venue_state,branding_logo_url` +
        `&id=eq.${encodeURIComponent(event_id)}&limit=1`,
      { headers: authHeaders }
    );

    if (!evtRes.ok) {
      let msg = `HTTP ${evtRes.status}`;
      try {
        const e = await evtRes.json();
        msg = e.message ?? msg;
      } catch { /* empty */ }
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 500, headers: JSON_HEADERS }
      );
    }

    const evtRows: EventRow[] = await evtRes.json();
    const ev = evtRows[0];
    if (!ev) {
      return new Response(
        JSON.stringify({ error: "Event not found" }),
        { status: 404, headers: JSON_HEADERS }
      );
    }

    // ── 3. Logo ──────────────────────────────────────────────────────────────
    const logoSrc = ev.branding_logo_url
      ? ev.branding_logo_url
      : `data:image/png;base64,${LOGO_BASE64}`;

    // ── 4. Return HTML ───────────────────────────────────────────────────────
    const html = buildHTML(analytics, ev, logoSrc);

    return new Response(html, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "text/html",
        "Content-Disposition": 'attachment; filename="neat-notes-event-report.html"',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
});
