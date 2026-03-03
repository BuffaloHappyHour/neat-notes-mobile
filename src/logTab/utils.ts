export function isUuid(v: string) {
  const s = String(v ?? "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s
  );
}

export function toQueryParam(v: string) {
  return encodeURIComponent(String(v ?? "").trim());
}

export function normalizeName(s: string) {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function slugify(s: string) {
  return normalizeName(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export function parseNumericOrNull(v: string) {
  const t = String(v ?? "").trim();
  if (!t) return null;

  const cleaned = t.replace(/[^0-9.]+/g, "");
  if (!cleaned) return null;

  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function formatWhen(v: string | null | undefined) {
  if (!v) return "";
  const t = Date.parse(String(v));
  if (!Number.isFinite(t)) return "";
  const d = new Date(t);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}