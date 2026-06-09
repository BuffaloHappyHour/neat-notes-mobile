import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SLACK_WEBHOOK_APP_HEALTH = Deno.env.get('SLACK_WEBHOOK_APP_HEALTH')!;
const REVENUECAT_API_KEY = Deno.env.get('REVENUECAT_API_KEY_V2')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const REVENUECAT_PROJECT_ID = Deno.env.get('REVENUECAT_PROJECT_ID')!;
const APP_STORE_KEY_ID = Deno.env.get('APP_STORE_KEY_ID')!;
const APP_STORE_ISSUER_ID = Deno.env.get('APP_STORE_ISSUER_ID')!;
const APP_STORE_PRIVATE_KEY = Deno.env.get('APP_STORE_PRIVATE_KEY')!;
const APP_STORE_APP_ID = Deno.env.get('APP_STORE_APP_ID')!;
const APP_STORE_VENDOR_NUMBER = Deno.env.get('APP_STORE_VENDOR_NUMBER')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const EXCLUDED_USER_IDS = [
  '50a365b5-4f94-4043-a652-7a5a4cf6f1c5',
  '9484147d-0d97-4ee7-ae9d-7fea0175a47a',
  'bfae8e51-ca88-452e-a25d-e97f97288b1e',
];

function pct(a: number, b: number): string {
  if (b === 0) return '0%';
  return `${((a / b) * 100).toFixed(1)}%`;
}

function trend(val: number): string {
  if (val > 0) return `↑ ${val}`;
  if (val < 0) return `↓ ${Math.abs(val)}`;
  return `→ 0`;
}

async function getAppStoreToken(): Promise<string> {
  const privateKeyPem = APP_STORE_PRIVATE_KEY
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');

  const binaryDer = Uint8Array.from(atob(privateKeyPem), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'ES256', kid: APP_STORE_KEY_ID, typ: 'JWT' };
  const payload = {
    iss: APP_STORE_ISSUER_ID,
    iat: now,
    exp: now + 1200,
    aud: 'appstoreconnect-v1',
  };

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

  const signingInput = `${encode(header)}.${encode(payload)}`;
  const signingBytes = new TextEncoder().encode(signingInput);

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    signingBytes
  );

  const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${signingInput}.${sigBase64}`;
}

async function getAppStoreMetrics() {
  try {
    const token = await getAppStoreToken();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    const params = new URLSearchParams({
      'filter[frequency]': 'DAILY',
      'filter[reportType]': 'SALES',
      'filter[reportSubType]': 'SUMMARY',
      'filter[vendorNumber]': APP_STORE_VENDOR_NUMBER,
      'filter[reportDate]': dateStr,
    });

    const res = await fetch(
      `https://api.appstoreconnect.apple.com/v1/salesReports?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/a-gzip',
        },
      }
    );

    if (!res.ok) {
      console.error('Sales report error:', res.status, await res.text());
      return null;
    }

    const buffer = await res.arrayBuffer();
    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    writer.write(new Uint8Array(buffer));
    writer.close();

    const reader = ds.readable.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const text = new TextDecoder().decode(
      chunks.reduce((acc, chunk) => {
        const merged = new Uint8Array(acc.length + chunk.length);
        merged.set(acc);
        merged.set(chunk, acc.length);
        return merged;
      }, new Uint8Array())
    );

    const lines = text.trim().split('\n');
    const headers = lines[0].split('\t');
    const rows = lines.slice(1).map(line => {
      const vals = line.split('\t');
      return Object.fromEntries(headers.map((h, i) => [h, vals[i]]));
    });

    let downloads = 0;
    let updates = 0;

    for (const row of rows) {
      const units = parseInt(row['Units'] ?? '0', 10);
      const type = row['Product Type Identifier'] ?? '';
      if (type === '1') downloads += units;
      if (type === '7') updates += units;
    }

    return { downloads, updates, date: dateStr };
  } catch (err) {
    console.error('App Store metrics error:', err);
    return null;
  }
}

// --- All existing functions unchanged below ---

async function getTastingFunnel() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('analytics_events')
    .select('event_name, properties')
    .in('event_name', ['tasting_start', 'tasting_saved', 'tasting_edit_saved', 'tasting_save_failed'])
    .gte('created_at', since);

  const startedIds = new Set(data?.filter(e => e.event_name === 'tasting_start').map(e => e.properties?.session_id).filter(Boolean));
  const savedIds = new Set(data?.filter(e => e.event_name === 'tasting_saved' || e.event_name === 'tasting_edit_saved').map(e => e.properties?.session_id).filter(Boolean));
  const editedIds = new Set(data?.filter(e => e.event_name === 'tasting_edit_saved').map(e => e.properties?.session_id).filter(Boolean));
  const failedIds = new Set(data?.filter(e => e.event_name === 'tasting_save_failed').map(e => e.properties?.session_id).filter(Boolean));

  const startedRaw = data?.filter(e => e.event_name === 'tasting_start').length ?? 0;
  const savedRaw = data?.filter(e => e.event_name === 'tasting_saved' || e.event_name === 'tasting_edit_saved').length ?? 0;
  const editedRaw = data?.filter(e => e.event_name === 'tasting_edit_saved').length ?? 0;
  const failedRaw = data?.filter(e => e.event_name === 'tasting_save_failed').length ?? 0;

  return {
    started: startedIds.size || startedRaw,
    saved: savedIds.size || savedRaw,
    edited: editedIds.size || editedRaw,
    failed: failedIds.size || failedRaw,
  };
}

async function getActiveUsers() {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: data24h } = await supabase.from('analytics_events').select('user_id').gte('created_at', since24h);
  const { data: data7d } = await supabase.from('analytics_events').select('user_id').gte('created_at', since7d);
  return {
    unique24h: new Set(data24h?.map(e => e.user_id)).size,
    unique7d: new Set(data7d?.map(e => e.user_id)).size,
  };
}

async function getErrorBreakdown() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase.from('analytics_events').select('properties').eq('event_name', 'tasting_save_failed').gte('created_at', since);
  const breakdown: Record<string, number> = {};
  data?.forEach(e => {
    const msg = e.properties?.message ?? 'unknown';
    let label = msg;
    if (msg.includes('event_id_fkey')) label = 'stale event_id';
    else if (msg.includes('flavor_tags')) label = 'null flavor_tags';
    else if (msg.includes('row-level security')) label = 'RLS violation';
    breakdown[label] = (breakdown[label] ?? 0) + 1;
  });
  return breakdown;
}

async function getInsightsViews() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase.from('analytics_events').select('user_id').eq('event_name', 'insights_screen_viewed').gte('created_at', since);
  return data?.length ?? 0;
}

async function getRevenueCatMetrics() {
  try {
    const res = await fetch(
      `https://api.revenuecat.com/v2/projects/${REVENUECAT_PROJECT_ID}/metrics/overview`,
      { headers: { Authorization: `Bearer ${REVENUECAT_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    if (!res.ok) {
      console.error('RevenueCat error:', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const metrics = data?.metrics ?? [];
    const find = (id: string) => metrics.find((m: any) => m.id === id);
    const mrr = find('mrr');
    const activeSubs = find('active_subscriptions');
    const newSubs = find('new_paid_subscriptions');
    const churned = find('churned_paid_subscriptions');
    return {
      mrr: mrr?.value ?? null,
      mrrChange: mrr?.percentage_change ?? null,
      activeSubs: activeSubs?.value ?? null,
      newSubs: newSubs?.value ?? null,
      churned: churned?.value ?? null,
    };
  } catch { return null; }
}

async function getNewSignups() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  let query: any = supabase.from('profiles').select('id, is_premium').gte('created_at', since);
  if (EXCLUDED_USER_IDS.length > 0) query = query.not('id', 'in', `(${EXCLUDED_USER_IDS.join(',')})`);
  const { data } = await query;
  return { total: data?.length ?? 0, premium: data?.filter((r: any) => r.is_premium).length ?? 0 };
}

async function getAppVersions() {
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase.from('profiles').select('app_version').gte('app_version_updated_at', since7d).not('id', 'in', `(${EXCLUDED_USER_IDS.join(',')})`);
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const v = row.app_version ?? 'unknown';
    counts[v] = (counts[v] ?? 0) + 1;
  }
  return counts;
}

async function getFirstTimeTasters() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  let recentQuery: any = supabase.from('tastings').select('user_id').gte('created_at', since).not('user_id', 'is', null);
  if (EXCLUDED_USER_IDS.length > 0) recentQuery = recentQuery.not('user_id', 'in', `(${EXCLUDED_USER_IDS.join(',')})`);
  const { data: recentData } = await recentQuery;
  const recentUserIds = [...new Set(recentData?.map((r: any) => r.user_id).filter(Boolean) ?? [])];
  if (recentUserIds.length === 0) return 0;
  const { data: priorData } = await supabase.from('tastings').select('user_id').in('user_id', recentUserIds).lt('created_at', since);
  const hadPrior = new Set(priorData?.map((r: any) => r.user_id) ?? []);
  return recentUserIds.filter(id => !hadPrior.has(id)).length;
}

async function getAppStoreRatings() {
  try {
    const token = await getAppStoreToken();

    const res = await fetch(
      `https://api.appstoreconnect.apple.com/v1/apps/${APP_STORE_APP_ID}/customerReviews?sort=-createdDate&limit=5`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) {
      console.error('App Store ratings error:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const reviews = data?.data ?? [];

    const ratingsRes = await fetch(
      `https://api.appstoreconnect.apple.com/v1/apps/${APP_STORE_APP_ID}/appStoreVersions?filter[platform]=IOS&limit=1&fields[appStoreVersions]=averageUserRating,userRatingCount`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let avgRating = null;
    let ratingCount = null;

    if (ratingsRes.ok) {
      const ratingsData = await ratingsRes.json();
      const version = ratingsData?.data?.[0]?.attributes;
      avgRating = version?.averageUserRating ?? null;
      ratingCount = version?.userRatingCount ?? null;
    }

    const recentReviews = reviews.slice(0, 3).map((r: any) => {
      const { rating, title, body } = r.attributes;
      const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
      const snippet = body?.length > 80 ? body.slice(0, 80) + '…' : body;
      return `  ${stars} _"${snippet}"_`;
    });

    return { avgRating, ratingCount, recentReviews };
  } catch (err) {
    console.error('App Store ratings error:', err);
    return null;
  }
}

async function postToSlack(blocks: object[]) {
  await fetch(SLACK_WEBHOOK_APP_HEALTH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks }),
  });
}

serve(async () => {
  try {
    const [funnel, users, errors, insightsViews, rc, signups, firstTimers, appVersions, appStore, ratings] = await Promise.all([
      getTastingFunnel(),
      getActiveUsers(),
      getErrorBreakdown(),
      getInsightsViews(),
      getRevenueCatMetrics(),
      getNewSignups(),
      getFirstTimeTasters(),
      getAppVersions(),
      getAppStoreMetrics(),
      getAppStoreRatings(),
    ]);

    const newSaved = funnel.saved - funnel.edited;
    const saveRate = pct(newSaved, funnel.started);
    const failRate = pct(funnel.failed, funnel.started);
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    const errorLines = Object.entries(errors).map(([k, v]) => `  • ${k}: ${v}`).join('\n') || '  • None 🎉';

    const rcSection = rc
      ? `*💰 Revenue (RevenueCat)*\n` +
        `  • MRR: $${(rc.mrr / 100).toFixed(2)} ${rc.mrrChange != null ? `(${trend(rc.mrrChange)}%)` : ''}\n` +
        `  • Active subscribers: ${rc.activeSubs}\n` +
        `  • New today: ${rc.newSubs ?? '—'}\n` +
        `  • Churned today: ${rc.churned ?? '—'}`
      : `*💰 Revenue*\n  • RevenueCat unavailable`;

    const appStoreSection = appStore
      ? `*🍎 App Store (yesterday)*\n` +
        `  • Downloads: ${appStore.downloads}\n` +
        `  • Updates: ${appStore.updates}`
      : `*🍎 App Store*\n  • Data unavailable`;

    const blocks = [
      { type: 'header', text: { type: 'plain_text', text: `🥃 Neat Notes — Daily Health Report` } },
      { type: 'context', elements: [{ type: 'mrkdwn', text: today }] },
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text:
            `*📊 Tasting Funnel (last 24h)*\n` +
            `  • Started: ${funnel.started}\n` +
            `  • Saved (new): ${newSaved} (${saveRate})\n` +
            `  • Saved (edit): ${funnel.edited}\n` +
            `  • Failed: ${funnel.failed} (${failRate})`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*👥 Active Users*\n  • Last 24h: ${users.unique24h}\n  • Last 7d: ${users.unique7d}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text:
            `*🆕 New Users (24h)*\n` +
            `  • Signups: ${signups.total}${signups.premium > 0 ? ` (${signups.premium} premium)` : ''}\n` +
            `  • First-time tasters: ${firstTimers}`,
        },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*🔍 Insights Screen Views (24h)*\n  • ${insightsViews}` },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*⚠️ Save Errors (24h)*\n${errorLines}` },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text:
            `*📱 App Versions (active last 7d)*\n` +
            (Object.keys(appVersions).length === 0
              ? '  • No data yet'
              : Object.entries(appVersions).sort((a, b) => b[1] - a[1]).map(([v, n]) => `  • ${v}: ${n}`).join('\n')),
        },
      },
      { type: 'divider' },
      { type: 'section', text: { type: 'mrkdwn', text: rcSection } },
      { type: 'section', text: { type: 'mrkdwn', text: appStoreSection } },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ratings
            ? `*⭐ Ratings & Reviews*\n` +
              `  • Avg rating: ${ratings.avgRating ? ratings.avgRating.toFixed(1) + ' / 5.0' : '—'}\n` +
              `  • Total ratings: ${ratings.ratingCount ?? '—'}\n` +
              (ratings.recentReviews.length > 0
                ? `  *Recent:*\n` + ratings.recentReviews.join('\n')
                : `  • No recent reviews`)
            : `*⭐ Ratings & Reviews*\n  • Data unavailable`,
        },
      },
    ];

    await postToSlack(blocks);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});