// src/discover/utils/discover.utils.ts

export function isUuidLike(id: string) {
  return typeof id === "string" && id.length === 36 && id.includes("-");
}

export function parseMaybeNumber(v: string) {
  const t = String(v ?? "").trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function applyFilters<T extends { whiskeyType: string | null; proof: number | null }>(
  rows: T[],
  opts: { selectedType: string | null; minProof: number | null; maxProof: number | null }
) {
  const { selectedType, minProof, maxProof } = opts;

  let out = [...rows];

  if (selectedType) out = out.filter((r) => r.whiskeyType === selectedType);

  if (minProof != null || maxProof != null) {
    out = out.filter((r) => {
      const p = r.proof;
      if (p == null || !Number.isFinite(Number(p))) return false;
      const pv = Number(p);
      if (minProof != null && pv < minProof) return false;
      if (maxProof != null && pv > maxProof) return false;
      return true;
    });
  }

  return out;
}

export function buildFilterBadge(opts: {
  selectedType: string | null;
  minProof: number | null;
  maxProof: number | null;
}) {
  const parts: string[] = [];
  if (opts.selectedType) parts.push(opts.selectedType);

  if (opts.minProof != null || opts.maxProof != null) {
    const a = opts.minProof != null ? `${Math.round(opts.minProof)}` : "—";
    const b = opts.maxProof != null ? `${Math.round(opts.maxProof)}` : "—";
    parts.push(`Proof ${a}-${b}`);
  }

  return parts.join(" • ");
}