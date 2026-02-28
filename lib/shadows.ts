// lib/shadows.ts
import { Platform } from "react-native";

type ShadowStyle = Record<string, any>;

function iosShadow(y: number, blur: number, opacity: number): ShadowStyle {
  return {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: y },
    shadowOpacity: opacity,
    shadowRadius: blur,
  };
}

function androidShadow(elevation: number): ShadowStyle {
  return { elevation };
}

/**
 * Shadows:
 * - e0..e3: increasing intensity
 * - inset: subtle border-like depth
 * - card: alias for the default card shadow (e2)
 */
export const shadows = {
  e0: Platform.select({
    ios: iosShadow(1, 2, 0.12),
    android: androidShadow(1),
    default: {},
  }) as ShadowStyle,

  e1: Platform.select({
    ios: iosShadow(2, 6, 0.14),
    android: androidShadow(2),
    default: {},
  }) as ShadowStyle,

  e2: Platform.select({
    ios: iosShadow(4, 10, 0.16),
    android: androidShadow(3),
    default: {},
  }) as ShadowStyle,

  e3: Platform.select({
    ios: iosShadow(8, 18, 0.18),
    android: androidShadow(5),
    default: {},
  }) as ShadowStyle,

  inset: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  } as ShadowStyle,

  // ✅ what your code expects
  card: Platform.select({
    ios: iosShadow(4, 10, 0.16),
    android: androidShadow(3),
    default: {},
  }) as ShadowStyle,
} as const;