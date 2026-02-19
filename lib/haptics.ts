import * as Haptics from "expo-haptics";
import { supabase } from "./supabase";

/**
 * Intentional haptics only.
 * - Respects profiles.haptics_enabled (boolean)
 * - Caches result briefly to avoid extra network calls
 */

let cachedEnabled: boolean | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30_000;

async function getHapticsEnabled(): Promise<boolean> {
  const now = Date.now();
  if (cachedEnabled !== null && now - cachedAt < CACHE_TTL_MS) {
    return cachedEnabled;
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user?.id) {
      cachedEnabled = false;
      cachedAt = now;
      return false;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("haptics_enabled")
      .eq("id", user.id)
      .maybeSingle();

    if (error) throw new Error(error.message);

    // Default: ON if null/undefined (feels premium), but still "intentional only"
    const enabled = data?.haptics_enabled;
    cachedEnabled = typeof enabled === "boolean" ? enabled : true;
    cachedAt = now;
    return cachedEnabled;
  } catch {
    // If anything goes sideways, fail silently (no haptics, no crash).
    cachedEnabled = false;
    cachedAt = now;
    return false;
  }
}

/** Call this after user changes the toggle, so the app updates instantly. */
export function invalidateHapticsCache() {
  cachedEnabled = null;
  cachedAt = 0;
}

export async function hapticTick() {
  if (!(await getHapticsEnabled())) return;
  try {
    await Haptics.selectionAsync();
  } catch {}
}

export async function hapticSuccess() {
  if (!(await getHapticsEnabled())) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
}

export async function hapticError() {
  if (!(await getHapticsEnabled())) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {}
}
