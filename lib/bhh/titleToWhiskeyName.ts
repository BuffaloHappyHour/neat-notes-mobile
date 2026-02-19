// lib/bhh/titleToWhiskeyName.ts

function cleanCommonSuffixes(t: string) {
  let s = (t ?? "").trim();

  // drop channel suffixes
  s = s.replace(/\s*[-–—]\s*Buffalo Happy Hour\s*$/i, "");
  s = s.replace(/\s*[-–—]\s*BHH\s*$/i, "");

  // remove bracketed fluff at end
  s = s.replace(/\[[^\]]+\]\s*$/g, "").trim();
  s = s.replace(/\([^)]+\)\s*$/g, "").trim();

  // normalize separators
  s = s.split("|")[0].trim();
  s = s.split("•")[0].trim();
  s = s.split("~")[0].trim();

  // remove trailing punctuation
  s = s.replace(/[!?]+$/g, "").trim();

  // remove common suffix words
  s = s.replace(/\s*\b(full\s+review|review|tasting|first\s+impression|impressions)\b\s*$/i, "").trim();

  return s;
}

function looksLikeContentTitle(s: string) {
  const t = (s ?? "").trim();
  if (!t) return true;
  if (t.length > 55) return true;
  if (t.includes("?")) return true;
  if (/^(is|are|can|should|why|how|what)\b/i.test(t)) return true;
  if (/\b(top|best|worst|vs|versus|blind|flight|ranking|ranked|list|episode|live|podcast)\b/i.test(t))
    return true;
  return false;
}

/**
 * Best-effort extraction: returns a likely bottle name, or null if uncertain.
 * Safe for use during ingestion to keep whiskeyName clean.
 */
export function deriveWhiskeyNameFromTitle(titleRaw: string): string | null {
  if (!titleRaw) return null;
  let t = cleanCommonSuffixes(titleRaw);

  // Common prefixes
  t = t.replace(/^wednesday\s+whiskey\s+review\s*:\s*/i, "");
  t = t.replace(/^whiskey\s+review\s*:\s*/i, "");
  t = t.replace(/^review\s*:\s*/i, "");
  t = t.replace(/^bottle\s+review\s*:\s*/i, "");

  // Question: "Is X the ...?"
  const q1 = t.match(/^is\s+(.+?)\s+the\s+/i);
  if (q1?.[1]) {
    const c = cleanCommonSuffixes(q1[1]);
    return c.length >= 4 && c.length <= 70 ? c : null;
  }

  // Question: "Is X ...?"
  const q2 = t.match(/^is\s+(.+?)\?/i);
  if (q2?.[1]) {
    const c = cleanCommonSuffixes(q2[1]);
    return c.length >= 4 && c.length <= 70 ? c : null;
  }

  // "X Review"
  const r1 = t.match(/^(.+?)\s+(whiskey|whisky)?\s*review$/i);
  if (r1?.[1]) {
    const c = cleanCommonSuffixes(r1[1]);
    return c.length >= 4 && c.length <= 70 ? c : null;
  }

  // "X vs Y" -> return left side
  const vs = t.match(/^(.+?)\s+(vs|versus)\s+(.+)$/i);
  if (vs?.[1]) {
    const c = cleanCommonSuffixes(vs[1]);
    return c.length >= 4 && c.length <= 70 ? c : null;
  }

  // Colon: "Series: Bottle Name"
  if (t.includes(":")) {
    const after = cleanCommonSuffixes(t.split(":").slice(1).join(":"));
    if (after.length >= 4 && after.length <= 70) return after;
  }

  // Dash: take left side
  if (t.includes(" - ")) {
    const left = cleanCommonSuffixes(t.split(" - ")[0]);
    if (left.length >= 4 && left.length <= 70) return left;
  }

  // Final fallback: accept only if it doesn’t look like content-title
  const final = cleanCommonSuffixes(t);
  if (!looksLikeContentTitle(final) && final.length >= 4 && final.length <= 70) return final;

  return null;
}
