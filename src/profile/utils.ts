import { colors } from "../../lib/theme";

export function safeLabel(v: any) {
  const s = String(v ?? "").trim();
  return s || "Unknown";
}

export function formatPct(p: number) {
  const v = Math.round(p * 100);
  return `${v}%%`;
}

export function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export function rgba(hex: string, a: number) {
  const h = String(hex ?? "").trim();
  const m = /#?([0-9a-f]{6})$/i.exec(h);
  if (!m) return h;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const alpha = clamp01(a);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const MIX_DEFAULT_ALPHAS = [0.92, 0.78, 0.64, 0.52, 0.42, 0.34, 0.26];
