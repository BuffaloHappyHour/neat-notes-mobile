// lib/hapticsPress.ts
import * as Haptics from "expo-haptics";
import { supabase } from "./supabase";

/**
 * Neat Notes Haptics
 * - Respects profiles.haptics_enabled (default ON)
 * - Caches enabled state to avoid repeated DB hits
 * - Provides "intentional" haptic primitives + wrapper helpers for onPress
 */

let cachedEnabled: boolean | null = null;
let cachePromise: Promise<boolean> | null = null;

export function invalidateHapticsCache() {
  cachedEnabled = null;
  cachePromise = null;
}

async function readEnabledFromProfile(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user?.id) return true;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("haptics_enabled")
      .eq("id", user.id)
      .maybeSingle();

    if (error) return true;

    if (typeof (profile as any)?.haptics_enabled === "boolean") {
      return (profile as any).haptics_enabled;
    }

    return true;
  } catch {
    return true;
  }
}

async function hapticsEnabled(): Promise<boolean> {
  if (cachedEnabled !== null) return cachedEnabled;

  if (!cachePromise) {
    cachePromise = (async () => {
      const enabled = await readEnabledFromProfile();
      cachedEnabled = enabled;
      return enabled;
    })();
  }

  return cachePromise;
}

async function safeImpact(style: Haptics.ImpactFeedbackStyle) {
  try {
    const ok = await hapticsEnabled();
    if (!ok) return;
    await Haptics.impactAsync(style);
  } catch {}
}

async function safeNotify(type: Haptics.NotificationFeedbackType) {
  try {
    const ok = await hapticsEnabled();
    if (!ok) return;
    await Haptics.notificationAsync(type);
  } catch {}
}

/** ---------- Public haptic primitives ---------- */

export async function hapticTick() {
  await safeImpact(Haptics.ImpactFeedbackStyle.Light);
}

export async function hapticSuccess() {
  await safeNotify(Haptics.NotificationFeedbackType.Success);
}

export async function hapticError() {
  await safeNotify(Haptics.NotificationFeedbackType.Error);
}

export async function hapticDanger() {
  await safeImpact(Haptics.ImpactFeedbackStyle.Medium);
}

/** ---------- Wrapper options ---------- */

type HapticKind = "tick" | "success" | "error" | "danger";

type WrapOptions = {
  /**
   * If false, wrapper will run the handler but skip the haptic.
   * Prefer this over branching at call sites.
   */
  enabled?: boolean;

  /**
   * Legacy support:
   * Some call sites pass { success: false } to mean "skip haptics".
   * If provided and false, we treat as enabled=false.
   */
  success?: boolean;

  /**
   * Override the haptic used by the wrapper.
   * Example: withTick(fn, { haptic: "success" })
   */
  haptic?: HapticKind;
};

async function runHaptic(kind: HapticKind) {
  if (kind === "success") return hapticSuccess();
  if (kind === "error") return hapticError();
  if (kind === "danger") return hapticDanger();
  return hapticTick();
}

function shouldRunHaptic(opts?: WrapOptions) {
  // If legacy { success: false } is present, skip.
  if (opts && typeof opts.success === "boolean" && opts.success === false) return false;
  return opts?.enabled ?? true;
}

function wrap<T extends any[]>(
  fn: (...args: T) => void | Promise<void>,
  defaultKind: HapticKind,
  opts?: WrapOptions
) {
  return async (...args: T) => {
    const run = shouldRunHaptic(opts);
    const kind = opts?.haptic ?? defaultKind;

    if (run) {
      await runHaptic(kind);
    }

    return fn(...args);
  };
}

/** ---------- Wrapper helpers (accept optional 2nd arg) ---------- */

export function withTick<T extends any[]>(fn: (...args: T) => void | Promise<void>, opts?: WrapOptions) {
  return wrap(fn, "tick", opts);
}

export function withSuccess<T extends any[]>(fn: (...args: T) => void | Promise<void>, opts?: WrapOptions) {
  return wrap(fn, "success", opts);
}

export function withError<T extends any[]>(fn: (...args: T) => void | Promise<void>, opts?: WrapOptions) {
  return wrap(fn, "error", opts);
}

export function withDanger<T extends any[]>(fn: (...args: T) => void | Promise<void>, opts?: WrapOptions) {
  return wrap(fn, "danger", opts);
}

/** ---------- Backwards-compatible aliases ---------- */

export const withTickError = withError;
export const withTickSuccess = withSuccess;
export const withTickDanger = withDanger;