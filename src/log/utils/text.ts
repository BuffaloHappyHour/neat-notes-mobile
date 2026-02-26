// src/log/utils/text.ts

export function safeText(v: any) {
  return String(v ?? "").trim();
}

export function cleanText(v: any): string | null {
  const s = safeText(v);
  return s ? s : null;
}

export function normalizeKey(s: string) {
  return safeText(s).toLowerCase().replace(/\s+/g, " ");
}

export function clamp100(n: number) {
  return Math.max(0, Math.min(100, n));
}

export function isUuid(v: string) {
  const s = String(v ?? "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s
  );
}

export function asString(v: string | string[] | undefined) {
  if (Array.isArray(v)) return v[0];
  return v;
}

export function uniqStringsKeepOrder(list: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of list) {
    const k = String(s ?? "").trim();
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

export function uniqUuidsKeepOrder(list: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of list) {
    const k = safeText(s);
    if (!k) continue;
    if (!isUuid(k)) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

export function nullIfOther(v: string | null | undefined) {
  const s = safeText(v);
  if (!s) return null;
  if (s.toLowerCase() === "other") return null;
  return s;
}

export function isOtherLike(v: any) {
  return safeText(v).toLowerCase() === "other";
}

export function isMissingLike(v: any) {
  // For prompting + edit gating ONLY:
  // treat null/empty OR "Other" as missing.
  const s = safeText(v);
  return !s || isOtherLike(s);
}

export function isNullOrOther(v: any) {
  const s = safeText(v);
  if (!s) return true;
  return s.toLowerCase() === "other";
}

export function parseNumericOrNull(s: string) {
  const t = safeText(s);
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return n;
}