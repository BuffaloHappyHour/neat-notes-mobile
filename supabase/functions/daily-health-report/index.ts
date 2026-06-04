import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SLACK_WEBHOOK_APP_HEALTH = Deno.env.get('SLACK_WEBHOOK_APP_HEALTH')!;
const REVENUECAT_API_KEY = Deno.env.get('REVENUECAT_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const REVENUECAT_PROJECT_ID = Deno.env.get('REVENUECAT_PROJECT_ID')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function pct(a: number, b: number): string {
  if (b === 0) return '0%';
  return `${((a / b) * 100).toFixed(1)}%`;
}

function trend(val: number): string {
  if (val > 0) return `↑ ${val}`;
  if (val < 0) return `↓ ${Math.abs(val)}`;
  return `→ 0`;
}

async function getTastingFunnel() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('analytics_events')
    .select('event_name')
    .in('event_name', ['tasting_start', 'tasting_saved', 'tasting_save_failed'])
    .gte('created_at', since);

  const started = data?.filter(e => e.event_name === 'tasting_start').length ?? 0;
  const saved = data?.filter(e => e.event_name === 'tasting_saved').length ?? 0;
  const failed = data?.filter(e => e.event_name === 'tasting_save_failed').length ?? 0;

  return { started, saved, failed };
}

async function getActiveUsers() {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: data24h } = await supabase
    .from('analytics_events')
    .select('user_id')
    .gte('created_at', since24h);

  const { data: data7d } = await supabase
    .from('analytics_events')
    .select('user_id')
    .gte('created_at', since7d);

  const unique24h = new Set(data24h?.map(e => e.user_id)).size;
  const unique7d = new Set(data7d?.map(e => e.user_id)).size;

  return { unique24h, unique7d };
}

async function getErrorBreakdown() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('analytics_events')
    .select('properties')
    .eq('event_name', 'tasting_save_failed')
    .gte('created_at', since);

  const breakdown: Record<string, number> = {};
  data?.forEach(e => {
    const msg = e.properties?.message ?? 'unknown';
    // Shorten known messages
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

  const { data } = await supabase
    .from('analytics_events')
    .select('user_id')
    .eq('event_name', 'insights_screen_viewed')
    .gte('created_at', since);

  return data?.length ?? 0;
}

async function getRevenueCatMetrics() {
  try {
    const res = await fetch(
      `https://api.revenuecat.com/v2/projects/${REVENUECAT_PROJECT_ID}/metrics/overview`,
      {
        headers: {
          Authorization: `Bearer ${REVENUECAT_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) return null;
    const data = await res.json();

    // Extract key metrics from RevenueCat overview
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
  } catch {
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
    const [funnel, users, errors, insightsViews, rc] = await Promise.all([
      getTastingFunnel(),
      getActiveUsers(),
      getErrorBreakdown(),
      getInsightsViews(),
      getRevenueCatMetrics(),
    ]);

    const saveRate = pct(funnel.saved, funnel.started);
    const failRate = pct(funnel.failed, funnel.started);
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    });

    const errorLines = Object.entries(errors)
      .map(([k, v]) => `  • ${k}: ${v}`)
      .join('\n') || '  • None 🎉';

    const rcSection = rc
      ? `*💰 Revenue (RevenueCat)*\n` +
        `  • MRR: $${(rc.mrr / 100).toFixed(2)} ${rc.mrrChange != null ? `(${trend(rc.mrrChange)}%)` : ''}\n` +
        `  • Active subscribers: ${rc.activeSubs}\n` +
        `  • New today: ${rc.newSubs ?? '—'}\n` +
        `  • Churned today: ${rc.churned ?? '—'}`
      : `*💰 Revenue*\n  • RevenueCat unavailable`;

    const blocks = [
      {
        type: 'header',
        text: { type: 'plain_text', text: `🥃 Neat Notes — Daily Health Report` },
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
            `*📊 Tasting Funnel (last 24h)*\n` +
            `  • Started: ${funnel.started}\n` +
            `  • Saved: ${funnel.saved} (${saveRate})\n` +
            `  • Failed: ${funnel.failed} (${failRate})`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text:
            `*👥 Active Users*\n` +
            `  • Last 24h: ${users.unique24h}\n` +
            `  • Last 7d: ${users.unique7d}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*🔍 Insights Screen Views (24h)*\n  • ${insightsViews}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*⚠️ Save Errors (24h)*\n${errorLines}`,
        },
      },
      { type: 'divider' },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: rcSection },
      },
    ];

    await postToSlack(blocks);

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});