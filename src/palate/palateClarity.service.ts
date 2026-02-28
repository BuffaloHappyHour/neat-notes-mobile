// src/palate/services/palateClarity.service.ts

export type TrendDirection = "up" | "down" | "flat";
export type ConfidenceLevel = "low" | "medium" | "high";

export type PalateClarityTierIndex = 1 | 2 | 3 | 4 | 5;
export type PalateClarityTierLabel =
  | "Emerging"
  | "Developing"
  | "Defining"
  | "Refining"
  | "Signature Palate";

export type PalateClarityTasting = {
  rating: number | null;
  created_at: string | Date | null;

  // used for diversity + stability
  category?: string | null;

  // used for refinement signal
  hasRefinedNotes?: boolean | null;

  // used for proof affinity data sufficiency (not required for clarity v1, but useful)
  proof?: number | null;
};

export type PalateClarityResult = {
  // Base = signal strength from history (0..95)
  baseClarity: number;

  // Freshness = recency/velocity factor (0.5..1.0)
  freshness: number;

  // Final clarity = base * freshness (0..95)
  clarityIndex: number;

  // explainability for UI + debugging
  drivers: {
    volumeScore: number; // 0..100
    diversityScore: number; // 0..100
    stabilityScore: number; // 0..100
    refinementScore: number; // 0..100
  };

  // helpful for UI copy / gating
  meta: {
    totalTastings: number;
    tastingsLast90d: number;
    refinedTastingsAllTime: number;
    refinedTastingsLast90d: number;
    distinctCategoriesQualifyingAllTime: number; // categories with >= 5 tastings
    daysSinceLastTasting: number | null;
    confidenceLevel: ConfidenceLevel;

    // ✅ NEW: premium-friendly identity tiers (not gamified)
    tierIndex: PalateClarityTierIndex;
    tierLabel: PalateClarityTierLabel;
  };
};

type ClarityConfig = {
  // blend weights for the four drivers (must sum to 1.0)
  weights: {
    volume: number; // default 0.30
    diversity: number; // default 0.20
    stability: number; // default 0.30
    refinement: number; // default 0.20
  };

  // volume curve: max tastings to consider for saturation
  volumeCap: number; // default 200

  // diversity: expected number of meaningful categories (for normalization)
  diversityTargetCategories: number; // default 6

  // qualifying threshold for category counts
  minTastingsToQualifyCategory: number; // default 5

  // stability: how many "rank changes" reduce stability
  stabilityPenaltyPerChange: number; // default 20

  // base clarity hard max (leave headroom)
  baseClarityMax: number; // default 95

  // maturity scaling (prevents early overconfidence)
  maturity: {
    // below this, stability cannot score "perfect"
    minTotalForFullStability: number; // default 40
    // below this, refinement cannot score "perfect"
    minTotalForFullRefinement: number; // default 30
    // hard cap for stability when total < minTotalForFullStability
    stabilityCapAtLowSample: number; // default 70
    // hard cap for refinement when total < minTotalForFullRefinement
    refinementCapAtLowSample: number; // default 85
  };

  // confidence gating
  confidence: {
    // minimum tastings to ever be "high"
    minTotalForHigh: number; // default 40
    // minimum tastings to ever be "medium"
    minTotalForMedium: number; // default 10
    // clarity thresholds (after freshness)
    highClarityThreshold: number; // default 75
    mediumClarityThreshold: number; // default 45
  };

  // tiers (identity stage)
  tiers: {
    // minimum tastings for Signature Palate eligibility
    minTotalForSignature: number; // default 60
    // minimum tastings for Refined Palate eligibility
    minTotalForRefined: number; // default 40
  };

  // freshness
  freshness: {
    graceDays: number; // default 14
    halfLifeDays: number; // default 60
    recentWindowDays: number; // default 90
    recentTargetTastings: number; // default 20 (for volume freshness)
    blendRecency: number; // default 0.7
    blendRecentVolume: number; // default 0.3
    floor: number; // default 0.5
  };
};

const DEFAULT_CONFIG: ClarityConfig = {
  weights: { volume: 0.3, diversity: 0.2, stability: 0.3, refinement: 0.2 },
  volumeCap: 200,
  diversityTargetCategories: 6,
  minTastingsToQualifyCategory: 5,
  stabilityPenaltyPerChange: 20,
  baseClarityMax: 95,
  maturity: {
    minTotalForFullStability: 40,
    minTotalForFullRefinement: 30,
    stabilityCapAtLowSample: 70,
    refinementCapAtLowSample: 85,
  },
  confidence: {
    minTotalForHigh: 40,
    minTotalForMedium: 10,
    highClarityThreshold: 75,
    mediumClarityThreshold: 45,
  },
  tiers: {
    minTotalForSignature: 60,
    minTotalForRefined: 40,
  },
  freshness: {
    graceDays: 14,
    halfLifeDays: 60,
    recentWindowDays: 90,
    recentTargetTastings: 20,
    blendRecency: 0.7,
    blendRecentVolume: 0.3,
    floor: 0.5,
  },
};

/**
 * Compute Palate Clarity v1.
 *
 * Design intent:
 * - Base clarity measures signal strength (volume/diversity/stability/refinement).
 * - Freshness reduces clarity if user hasn't logged recently (palate may drift).
 * - Final clarity = base * freshness.
 *
 * No UI dependencies. Safe, explainable output.
 */
export function computePalateClarity(
  tastings: PalateClarityTasting[],
  now: Date = new Date(),
  config: Partial<ClarityConfig> = {}
): PalateClarityResult {
  const cfg: ClarityConfig = deepMerge(DEFAULT_CONFIG, config);

  const clean = normalizeTastings(tastings);

  const totalTastings = clean.length;

  const recentCutoff = addDays(now, -cfg.freshness.recentWindowDays);
  const recent = clean.filter((t) => t.createdAt >= recentCutoff);
  const tastingsLast90d = recent.length;

  const refinedAllTime = clean.filter((t) => t.hasRefinedNotes).length;
  const refinedLast90d = recent.filter((t) => t.hasRefinedNotes).length;

  const daysSinceLastTasting =
    totalTastings === 0
      ? null
      : Math.max(
          0,
          Math.floor(
            (startOfDay(now).getTime() - startOfDay(maxDate(clean.map((t) => t.createdAt))).getTime()) /
              MS_PER_DAY
          )
        );

  // --- Category counts for diversity/stability ---
  const catCountsAll = countBy(clean, (t) => t.category ?? "unknown");
  const catCountsRecent = countBy(recent, (t) => t.category ?? "unknown");

  const qualifyingCatsAll = Object.entries(catCountsAll).filter(
    ([cat, n]) => cat !== "unknown" && n >= cfg.minTastingsToQualifyCategory
  ).length;

  // --- Driver Scores (0..100) ---
  const vScore = computeVolumeScore(totalTastings, cfg.volumeCap);
  const dScore = computeDiversityScore(qualifyingCatsAll, cfg.diversityTargetCategories);

  // raw driver scores
  const sRaw = computeStabilityScore(catCountsAll, catCountsRecent, cfg);
  const rRaw = computeRefinementScore(refinedAllTime, totalTastings);

  // maturity scaling (prevents early 100s)
  const sScore = applyStabilityMaturity(sRaw, totalTastings, cfg);
  const rScore = applyRefinementMaturity(rRaw, totalTastings, cfg);

  // --- Base clarity (0..baseClarityMax) ---
  const baseRaw =
    cfg.weights.volume * vScore +
    cfg.weights.diversity * dScore +
    cfg.weights.stability * sScore +
    cfg.weights.refinement * rScore;

  const baseClarity = clamp(baseRaw, 0, cfg.baseClarityMax);

  // --- Freshness (0.5..1.0 by default) ---
  const freshness = computeFreshness(daysSinceLastTasting, tastingsLast90d, cfg);

  const clarityIndex = clamp(baseClarity * freshness, 0, cfg.baseClarityMax);

  const confidenceLevel = toConfidenceLevel(clarityIndex, totalTastings, cfg);

  // ✅ NEW: tier mapping from clarityIndex + sample thresholds
  const { tierIndex, tierLabel } = toTier(clarityIndex, totalTastings, cfg);

  return {
    baseClarity: round1(baseClarity),
    freshness: round2(freshness),
    clarityIndex: round1(clarityIndex),
    drivers: {
      volumeScore: round1(vScore),
      diversityScore: round1(dScore),
      stabilityScore: round1(sScore),
      refinementScore: round1(rScore),
    },
    meta: {
      totalTastings,
      tastingsLast90d,
      refinedTastingsAllTime: refinedAllTime,
      refinedTastingsLast90d: refinedLast90d,
      distinctCategoriesQualifyingAllTime: qualifyingCatsAll,
      daysSinceLastTasting,
      confidenceLevel,
      tierIndex,
      tierLabel,
    },
  };
}

/* ---------------------------- Driver computations ---------------------------- */

function computeVolumeScore(total: number, cap: number) {
  if (total <= 0) return 0;
  const capped = Math.min(total, cap);
  // log curve to saturate
  const score = (Math.log10(capped + 1) / Math.log10(cap + 1)) * 100;
  return clamp(score, 0, 100);
}

function computeDiversityScore(qualifyingCats: number, target: number) {
  if (target <= 0) return 0;
  return clamp((qualifyingCats / target) * 100, 0, 100);
}

/**
 * Stability v1:
 * Compare category rank order between all-time and recent (90d).
 * Count how many categories move (by position).
 * Penalize changes.
 *
 * Note: this score is further maturity-scaled so it doesn't hit 100 early.
 */
function computeStabilityScore(
  allCounts: Record<string, number>,
  recentCounts: Record<string, number>,
  cfg: ClarityConfig
) {
  const allRank = rankCategories(allCounts, cfg.minTastingsToQualifyCategory);
  const recentRank = rankCategories(recentCounts, cfg.minTastingsToQualifyCategory);

  if (allRank.length === 0) return 0;
  if (recentRank.length === 0) return 35; // no recent signal = low/ok-ish stability but not strong

  const posAll = new Map<string, number>();
  allRank.forEach((k, i) => posAll.set(k, i));

  const posRecent = new Map<string, number>();
  recentRank.forEach((k, i) => posRecent.set(k, i));

  const shared = allRank.filter((k) => posRecent.has(k));
  if (shared.length === 0) return 35;

  let changes = 0;
  for (const k of shared) {
    const a = posAll.get(k)!;
    const r = posRecent.get(k)!;
    if (Math.abs(a - r) >= 1) changes += 1;
  }

  const score = 100 - changes * cfg.stabilityPenaltyPerChange;
  return clamp(score, 0, 100);
}

function computeRefinementScore(refinedCount: number, total: number) {
  if (total <= 0) return 0;
  return clamp((refinedCount / total) * 100, 0, 100);
}

/* ---------------------------- Maturity scaling ----------------------------- */

function maturityFactor(total: number, fullAt: number) {
  // 0..1 ramp; hits 1 at fullAt
  if (fullAt <= 0) return 1;
  return clamp(total / fullAt, 0, 1);
}

function applyStabilityMaturity(raw: number, total: number, cfg: ClarityConfig) {
  const f = maturityFactor(total, cfg.maturity.minTotalForFullStability);

  const capped =
    total < cfg.maturity.minTotalForFullStability ? Math.min(raw, cfg.maturity.stabilityCapAtLowSample) : raw;

  const conservativeMid = 45;
  const blended = conservativeMid * (1 - f) + capped * f;

  return clamp(blended, 0, 100);
}

function applyRefinementMaturity(raw: number, total: number, cfg: ClarityConfig) {
  const f = maturityFactor(total, cfg.maturity.minTotalForFullRefinement);

  const capped =
    total < cfg.maturity.minTotalForFullRefinement ? Math.min(raw, cfg.maturity.refinementCapAtLowSample) : raw;

  const conservativeMid = 50;
  const blended = conservativeMid * (1 - f) + capped * f;

  return clamp(blended, 0, 100);
}

/* ------------------------------- Freshness --------------------------------- */

function computeFreshness(daysSinceLast: number | null, last90Count: number, cfg: ClarityConfig) {
  const f = cfg.freshness;

  if (daysSinceLast == null) return 1;

  // A) recency decay
  let recency = 1;
  if (daysSinceLast > f.graceDays) {
    recency = Math.pow(0.5, (daysSinceLast - f.graceDays) / f.halfLifeDays);
  }

  // B) recent volume (keeps "alive" if user is logging)
  const volume = clamp(0.6 + 0.4 * (last90Count / f.recentTargetTastings), 0.6, 1);

  const blended = f.blendRecency * recency + f.blendRecentVolume * volume;

  return clamp(blended, f.floor, 1);
}

/* ---------------------------- Confidence logic ----------------------------- */

function toConfidenceLevel(clarityIndex: number, totalTastings: number, cfg: ClarityConfig): ConfidenceLevel {
  if (totalTastings < cfg.confidence.minTotalForMedium) return "low";

  if (totalTastings >= cfg.confidence.minTotalForHigh && clarityIndex >= cfg.confidence.highClarityThreshold) {
    return "high";
  }

  if (clarityIndex >= cfg.confidence.mediumClarityThreshold) return "medium";

  return "low";
}

/* ------------------------------- Tier logic -------------------------------- */

function toTier(
  clarityIndex: number,
  totalTastings: number,
  cfg: ClarityConfig
): { tierIndex: PalateClarityTierIndex; tierLabel: PalateClarityTierLabel } {
  // Base tier from score
  let idx: PalateClarityTierIndex;

  if (clarityIndex >= 80) idx = 5;
  else if (clarityIndex >= 65) idx = 4;
  else if (clarityIndex >= 50) idx = 3;
  else if (clarityIndex >= 30) idx = 2;
  else idx = 1;

  // Eligibility gating (prevents early "Signature" / "Refined")
  if (idx === 5 && totalTastings < cfg.tiers.minTotalForSignature) idx = 4;
  if (idx === 4 && totalTastings < cfg.tiers.minTotalForRefined) idx = 3;

  const label: PalateClarityTierLabel =
    idx === 5
      ? "Signature Palate"
      : idx === 4
      ? "Refining"
      : idx === 3
      ? "Defining"
      : idx === 2
      ? "Developing"
      : "Emerging";

  return { tierIndex: idx, tierLabel: label };
}

function rankCategories(counts: Record<string, number>, min: number) {
  return Object.entries(counts)
    .filter(([k, v]) => k !== "unknown" && v >= min)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);
}

/* ------------------------------- Normalization ------------------------------ */

type NormalizedTasting = {
  rating: number;
  createdAt: Date;
  category: string | null;
  hasRefinedNotes: boolean;
  proof: number | null;
};

function normalizeTastings(tastings: PalateClarityTasting[]): NormalizedTasting[] {
  const out: NormalizedTasting[] = [];

  for (const t of tastings ?? []) {
    const rating = safeNumber(t.rating);
    const createdAt = safeDate(t.created_at);
    if (rating == null || createdAt == null) continue;

    out.push({
      rating,
      createdAt,
      category: (t.category ?? null)?.toString().trim() || null,
      hasRefinedNotes: Boolean(t.hasRefinedNotes),
      proof: safeNumber(t.proof),
    });
  }

  out.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  return out;
}

/* --------------------------------- Helpers -------------------------------- */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function safeNumber(v: any): number | null {
  if (v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n;
}

function safeDate(v: any): Date | null {
  if (v == null) return null;
  const d = v instanceof Date ? v : new Date(String(v));
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function addDays(d: Date, days: number) {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

function startOfDay(d: Date) {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function maxDate(dates: Date[]) {
  let max = dates[0];
  for (const d of dates) {
    if (d.getTime() > max.getTime()) max = d;
  }
  return max;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function countBy<T>(arr: T[], keyFn: (v: T) => string) {
  const out: Record<string, number> = {};
  for (const item of arr) {
    const k = keyFn(item) || "unknown";
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

/**
 * Tiny deep merge for config overrides (no external deps).
 */
function deepMerge<T extends Record<string, any>>(base: T, override: any): T {
  if (!override) return base;
  const out: any = Array.isArray(base) ? [...base] : { ...base };

  for (const k of Object.keys(override)) {
    const bv = (base as any)[k];
    const ov = override[k];

    if (
      bv &&
      ov &&
      typeof bv === "object" &&
      typeof ov === "object" &&
      !Array.isArray(bv) &&
      !Array.isArray(ov)
    ) {
      out[k] = deepMerge(bv, ov);
    } else {
      out[k] = ov;
    }
  }
  return out;
}