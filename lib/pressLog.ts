// lib/pressLog.ts
import { logClientEvent } from "./clientLog";

type Detail = Record<string, any>;

function safeNow() {
  return Date.now();
}

/**
 * Wrap an existing onPress so we can log + then run the handler.
 * - No UI layers added
 * - Fire-and-forget logging (does not block navigation)
 */
export function withLoggedPress<T extends any[]>(
  event: string,
  screen: string,
  detail: Detail,
  fn: (...args: T) => void | Promise<void>
) {
  return (...args: T) => {
    // fire-and-forget
    void logClientEvent(event, {
      screen,
      detail: { ts: safeNow(), ...detail },
    });

    return fn(...args);
  };
}

/**
 * Convenience: consistent naming for presses
 */
export function logPressWrap<T extends any[]>(
  screen: string,
  action: string,
  fn: (...args: T) => void | Promise<void>,
  extraDetail?: Detail
) {
  return withLoggedPress("press", screen, { action, ...extraDetail }, fn);
}