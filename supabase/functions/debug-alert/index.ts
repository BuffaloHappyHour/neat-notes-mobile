import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SLACK_WEBHOOK_APP_DEBUG = Deno.env.get('SLACK_WEBHOOK_APP_DEBUG')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// How many failures in the window before we alert
const ALERT_THRESHOLD = 3;
const WINDOW_MINUTES = 15;

function friendlyError(message: string): string {
  if (message.includes('event_id_fkey')) return '🔗 Stale event_id (deleted event in app state)';
  if (message.includes('flavor_tags')) return '🏷️ Null flavor_tags sent from client';
  if (message.includes('row-level security')) return '🔒 RLS violation';
  return `❓ ${message}`;
}

async function checkRecentFailures() {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('analytics_events')
    .select('user_id, properties, created_at')
    .eq('event_name', 'tasting_save_failed')
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

async function postToSlack(blocks: object[]) {
  await fetch(SLACK_WEBHOOK_APP_DEBUG, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks }),
  });
}

serve(async (req) => {
  try {
    // Support both webhook trigger (POST from pg_net) and manual invocation
    const failures = await checkRecentFailures();

    if (failures.length < ALERT_THRESHOLD) {
      return new Response(
        JSON.stringify({ ok: true, message: `${failures.length} failures, below threshold` }),
        { status: 200 }
      );
    }

    // Group by error type
    const grouped: Record<string, { count: number; users: Set<string> }> = {};
    failures.forEach(f => {
      const msg = f.properties?.message ?? 'unknown';
      if (!grouped[msg]) grouped[msg] = { count: 0, users: new Set() };
      grouped[msg].count++;
      grouped[msg].users.add(f.user_id);
    });

    const errorLines = Object.entries(grouped)
      .map(([msg, { count, users }]) =>
        `  • ${friendlyError(msg)}\n    ${count} failure${count > 1 ? 's' : ''}, ${users.size} user${users.size > 1 ? 's' : ''} affected`
      )
      .join('\n');

    const latest = new Date(failures[0].created_at).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York',
    });

    const blocks = [
      {
        type: 'header',
        text: { type: 'plain_text', text: `🚨 Neat Notes — Save Failures Spike` },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text:
            `*${failures.length} tasting save failures* in the last ${WINDOW_MINUTES} minutes\n` +
            `Last seen at ${latest} ET`,
        },
      },
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Error breakdown:*\n${errorLines}`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Threshold: ${ALERT_THRESHOLD}+ failures in ${WINDOW_MINUTES}min window`,
          },
        ],
      },
    ];

    await postToSlack(blocks);

    return new Response(JSON.stringify({ ok: true, alerted: true, failures: failures.length }), {
      status: 200,
    });
  } catch (err) {
    console.error(err);

    // Also alert Slack on function error
    await fetch(SLACK_WEBHOOK_APP_DEBUG, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `❌ *debug-alert function itself errored:* ${String(err)}`,
      }),
    });

    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});