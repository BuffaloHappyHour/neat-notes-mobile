// lib/canonicalize.ts

/**
 * Canonical rules for display/search.
 *
 * Remove:
 * 1) Buffalo Happy Hour
 * 2) Review terms: Review, Whiskey Review, Wednesday Whiskey Review, WWR, WR (and variants)
 * 3) Anything in parenthesis ( ... )
 * 4) Anything after ANY dash separator ( -, – , — ) even if spacing is weird
 * 5) Common show/title prefixes before ":" (keep what's after it)
 */

function normalizeSpaces(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function stripParentheses(s: string) {
  // Remove (...) groups repeatedly
  let out = s;
  for (let i = 0; i < 10; i++) {
    const next = out.replace(/\([^)]*\)/g, " ");
    if (next === out) break;
    out = next;
  }
  return out;
}

function stripAfterAnyDash(s: string) {
  // If there is ANY dash char (-, – , —), we take everything before the first dash.
  // This satisfies: "Anything after a ' - '", and also catches weird spacing + other dash chars.
  const idxHyphen = s.indexOf("-");
  const idxEn = s.indexOf("–");
  const idxEm = s.indexOf("—");

  const idxs = [idxHyphen, idxEn, idxEm].filter((n) => n >= 0);
  if (idxs.length === 0) return s;

  const idx = Math.min(...idxs);
  return s.slice(0, idx).trim();
}

export function canonicalizeWhiskeyName(input: string): string {
  let s = String(input ?? "").trim();
  if (!s) return "";

  // Remove separators seen in titles
  s = s.replace(/[|•]+/g, " ");

  // Remove parentheses content
  s = stripParentheses(s);

  // Remove BHH branding anywhere
  s = s.replace(/\bbuffalo\s+happy\s+hour\b/gi, " ");

  // Remove review tokens anywhere
  s = s.replace(/\bwwr\b/gi, " ");
  s = s.replace(/\bwr\b/gi, " ");
  s = s.replace(/\bwednesday\s+whiskey\s+review\b/gi, " ");
  s = s.replace(/\bwhiskey\s+review\b/gi, " ");
  s = s.replace(/\breview\b/gi, " ");

  // If there’s a colon early (typical "Show: Bottle Name"), keep what's after it
  const colonIdx = s.indexOf(":");
  if (colonIdx >= 0 && colonIdx <= 60) {
    s = s.slice(colonIdx + 1);
  }

  // Remove anything after ANY dash (super strict per your requirement)
  s = stripAfterAnyDash(s);

  // Clean stray punctuation
  s = s.replace(/[“”‘’"'`]/g, "");
  s = s.replace(/[.,!]+/g, " ");

  return normalizeSpaces(s);
}

export function slugify(input: string): string {
  return (input ?? "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

