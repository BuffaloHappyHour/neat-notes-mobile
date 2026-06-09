import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SLACK_WEBHOOK_ACQUISITION_FUNNEL = Deno.env.get('SLACK_WEBHOOK_ACQUISITION_FUNNEL')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const EXCLUDED_USER_IDS = [
  '50a365b5-4f94-4043-a652-7a5a4cf6f1c5',
  '9484147d-0d97-4ee7-ae9d-7fea0175a47a',
  'bfae8e51-ca88-452e-a25d-e97f97288b1e',
];

const rate = (a: number, b: number): string =>
  b === 0 ? '—' : `${((a / b) * 100).toFixed(1)}%`;

const emoji = (a: number, b: number): string => {
  if (b === 0) return '⚪';
  const pct = (a / b) * 100;
  if (pct >= 50) return '🟢';
  if (pct >= 20) return '🟡';
  return '🔴';
};

async function getAllTimeMetrics() {
  let profilesQuery: any = supabase.from('profiles').select('id, is_premium');
  if (EXCLUDED_USER_IDS.length > 0) profilesQuery = profilesQuery.not('id', 'in', `(${EXCLUDED_USER_IDS.join(',')})`);

  let tastingsQuery: any = supabase.from('tastings').select('user_id').not('user_id', 'is', null);
  if (EXCLUDED_USER_IDS.length > 0) tastingsQuery = tastingsQuery.not('user_id', 'in', `(${EXCLUDED_USER_IDS.join(',')})`);

  let eventsQuery: any = supabase
    .from('analytics_events')
    .select('user_id, event_name')
    .in('event_name', ['insights_screen_viewed', 'purchase_tapped'])
    .not('user_id', 'is', null);
  if (EXCLUDED_USER_IDS.length > 0) eventsQuery = eventsQuery.not('user_id', 'in', `(${EXCLUDED_USER_IDS.join(',')})`);

  const [profilesRes, tastingsRes, eventsRes] = await Promise.all([
    profilesQuery,
    tastingsQuery,
    eventsQuery,
  ]);

  const profiles = profilesRes.data ?? [];
  const total_accounts = profiles.length;
  const is_premium = profiles.filter((p: any) => p.is_premium).length;

  const tastingCountByUser = new Map<string, number>();
  for (const t of (tastingsRes.data ?? [])) {
    const uid = t.user_id as string;
    tastingCountByUser.set(uid, (tastingCountByUser.get(uid) ?? 0) + 1);
  }
  const first_tasting = tastingCountByUser.size;
  let second_tasting = 0;
  for (const count of tastingCountByUser.values()) {
    if (count >= 2) second_tasting++;
  }

  const events = eventsRes.data ?? [];
  const insights_viewed = new Set(
    events.filter((e: any) => e.event_name === 'insights_screen_viewed').map((e: any) => e.user_id)
  ).size;
  const purchase_tapped = new Set(
    events.filter((e: any) => e.event_name === 'purchase_tapped').map((e: any) => e.user_id)
  ).size;

  return { total_accounts, first_tasting, second_tasting, insights_viewed, purchase_tapped, is_premium };
}

async function getLast30DaysMetrics() {
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  let profilesQuery: any = supabase.from('profiles').select('id, is_premium, created_at, updated_at');
  if (EXCLUDED_USER_IDS.length > 0) profilesQuery = profilesQuery.not('id', 'in', `(${EXCLUDED_USER_IDS.join(',')})`);

  // All tastings ordered asc so dates[0] = first, dates[1] = second per user
  let tastingsQuery: any = supabase
    .from('tastings')
    .select('user_id, created_at')
    .not('user_id', 'is', null)
    .order('created_at', { ascending: true });
  if (EXCLUDED_USER_IDS.length > 0) tastingsQuery = tastingsQuery.not('user_id', 'in', `(${EXCLUDED_USER_IDS.join(',')})`);

  let eventsQuery: any = supabase
    .from('analytics_events')
    .select('user_id, event_name')
    .in('event_name', ['insights_screen_viewed', 'purchase_tapped'])
    .not('user_id', 'is', null)
    .gte('created_at', since30d);
  if (EXCLUDED_USER_IDS.length > 0) eventsQuery = eventsQuery.not('user_id', 'in', `(${EXCLUDED_USER_IDS.join(',')})`);

  const [profilesRes, tastingsRes, eventsRes] = await Promise.all([
    profilesQuery,
    tastingsQuery,
    eventsQuery,
  ]);

  const profiles = profilesRes.data ?? [];
  const new_accounts = profiles.filter((p: any) => p.created_at >= since30d).length;
  const new_premium = profiles.filter((p: any) => p.is_premium && p.updated_at >= since30d).length;

  const tastingsByUser = new Map<string, string[]>();
  for (const t of (tastingsRes.data ?? [])) {
    const uid = t.user_id as string;
    if (!tastingsByUser.has(uid)) tastingsByUser.set(uid, []);
    tastingsByUser.get(uid)!.push(t.created_at as string);
  }

  let new_first_tastings = 0;
  let new_second_tastings = 0;
  for (const dates of tastingsByUser.values()) {
    // dates[0] is oldest tasting for this user (ORDER BY created_at ASC)
    if (dates[0] >= since30d) new_first_tastings++;
    if (dates.length >= 2 && dates[1] >= since30d) new_second_tastings++;
  }

  const events = eventsRes.data ?? [];
  const new_insights_viewed = new Set(
    events.filter((e: any) => e.event_name === 'insights_screen_viewed').map((e: any) => e.user_id)
  ).size;
  const new_purchase_tapped = new Set(
    events.filter((e: any) => e.event_name === 'purchase_tapped').map((e: any) => e.user_id)
  ).size;

  return {
    new_accounts,
    new_first_tastings,
    new_second_tastings,
    new_insights_viewed,
    new_purchase_tapped,
    new_premium,
  };
}

async function getTastingSaveFunnel() {
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('analytics_events')
    .select('event_name')
    .in('event_name', ['tasting_intent', 'tasting_saved'])
    .gte('created_at', since30d);

  const events = data ?? [];
  const tasting_intent = events.filter((e: any) => e.event_name === 'tasting_intent').length;
  const tasting_saved = events.filter((e: any) => e.event_name === 'tasting_saved').length;

  return { tasting_intent, tasting_saved };
}

async function postToSlack(blocks: object[]) {
  await fetch(SLACK_WEBHOOK_ACQUISITION_FUNNEL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks }),
  });
}

serve(async () => {
  try {
    const [allTime, last30d, saveFunnel] = await Promise.all([
      getAllTimeMetrics(),
      getLast30DaysMetrics(),
      getTastingSaveFunnel(),
    ]);

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    const blocks = [
      {
        type: 'header',
        text: { type: 'plain_text', text: '📊 Neat Notes — Acquisition Funnel' },
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: today }],
      },
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text:
            `*🏆 All Time Funnel*\n` +
            `  • Accounts created: ${allTime.total_accounts}\n` +
            `  → First Tasting: ${allTime.first_tasting} (${rate(allTime.first_tasting, allTime.total_accounts)}) ${emoji(allTime.first_tasting, allTime.total_accounts)}\n` +
            `  → Second Tasting: ${allTime.second_tasting} (${rate(allTime.second_tasting, allTime.first_tasting)} of first) ${emoji(allTime.second_tasting, allTime.first_tasting)}\n` +
            `  → Insights Viewed: ${allTime.insights_viewed} (${rate(allTime.insights_viewed, allTime.first_tasting)} of first) ${emoji(allTime.insights_viewed, allTime.first_tasting)}\n` +
            `  → Upgrade Tapped: ${allTime.purchase_tapped} (${rate(allTime.purchase_tapped, allTime.insights_viewed)} of insights) ${emoji(allTime.purchase_tapped, allTime.insights_viewed)}\n` +
            `  → Premium: ${allTime.is_premium} (${rate(allTime.is_premium, allTime.purchase_tapped)} of tapped) ${emoji(allTime.is_premium, allTime.purchase_tapped)}`,
        },
      },
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text:
            `*📅 Last 30 Days*\n` +
            `  • New Accounts: ${last30d.new_accounts}\n` +
            `  → First Tasting: ${last30d.new_first_tastings} (${rate(last30d.new_first_tastings, last30d.new_accounts)}) ${emoji(last30d.new_first_tastings, last30d.new_accounts)}\n` +
            `  → Second Tasting: ${last30d.new_second_tastings} (${rate(last30d.new_second_tastings, last30d.new_first_tastings)} of first) ${emoji(last30d.new_second_tastings, last30d.new_first_tastings)}\n` +
            `  → Insights Viewed: ${last30d.new_insights_viewed} (${rate(last30d.new_insights_viewed, last30d.new_first_tastings)} of first) ${emoji(last30d.new_insights_viewed, last30d.new_first_tastings)}\n` +
            `  → Upgrade Tapped: ${last30d.new_purchase_tapped} (${rate(last30d.new_purchase_tapped, last30d.new_insights_viewed)} of insights) ${emoji(last30d.new_purchase_tapped, last30d.new_insights_viewed)}\n` +
            `  → New Premium: ${last30d.new_premium}`,
        },
      },
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text:
            `*💾 Tasting Completion Rate (30 days)*\n` +
            `  • Whiskey selected (intent): ${saveFunnel.tasting_intent}\n` +
            `  • Completed & saved: ${saveFunnel.tasting_saved} (${rate(saveFunnel.tasting_saved, saveFunnel.tasting_intent)}) ${emoji(saveFunnel.tasting_saved, saveFunnel.tasting_intent)}`,
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
