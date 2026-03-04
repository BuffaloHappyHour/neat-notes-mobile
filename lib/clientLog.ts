// lib/clientLog.ts
import { supabase } from "./supabase";

/**
 * Fire-and-forget client diagnostics for TestFlight debugging.
 * - Never throws
 * - Keeps payload small
 */
export async function logClientEvent(
  event: string,
  payload?: { screen?: string; detail?: Record<string, any> }
) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return;

    const screen = payload?.screen ?? null;

    // Keep detail JSON small + safe
    const detail = payload?.detail ? sanitizeDetail(payload.detail) : null;

    await supabase.from("client_logs").insert({
      user_id: user.id,
      event,
      screen,
      detail,
    });
  } catch {
    // swallow
  }
}

function sanitizeDetail(input: Record<string, any>) {
  const out: Record<string, any> = {};
  const bannedKeys = new Set([
    "access_token",
    "refresh_token",
    "token",
    "password",
    "anon_key",
    "supabaseKey",
  ]);

  for (const [k, v] of Object.entries(input)) {
    if (bannedKeys.has(k)) continue;

    // avoid huge blobs
    if (typeof v === "string" && v.length > 500) {
      out[k] = v.slice(0, 500) + "…";
      continue;
    }

    out[k] = v;
  }

  return out;
}