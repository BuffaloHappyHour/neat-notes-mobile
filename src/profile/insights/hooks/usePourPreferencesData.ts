import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";

export type PerceptionBucket = {
  level: number;
  count: number;
  avgRating: number;
};

export type ProofBucket = {
  label: string;
  minProof: number;
  maxProof: number;
  count: number;
  avgRating: number;
};

export type ProofPointInsight = {
  type: "sweet_spot" | "proof_agnostic" | "contradicts_perception" | "insufficient_data";
  sweetSpotLabel: string | null;
  insightLine: string;
  confidence: "building" | "moderate" | "high";
  population: number;
};

export type PourPreferencesData = {
  loading: boolean;
  texture: PerceptionBucket[];
  proof: PerceptionBucket[];
  flavor: PerceptionBucket[];
  proofPoint: ProofPointInsight;
  sweetSpots: {
    texture: number | null;
    proof: number | null;
    flavor: number | null;
  };
  gaps: {
    texture: string | null;
    proof: string | null;
    flavor: string | null;
  };
};

/* ---------- Label maps ---------- */

const TEXTURE_LABELS: Record<number, string> = {
  1: "thin",
  2: "light",
  3: "medium",
  4: "full",
  5: "creamy",
};

const PROOF_LABELS: Record<number, string> = {
  1: "soft",
  2: "mild",
  3: "balanced",
  4: "bold",
  5: "intense",
};

const FLAVOR_LABELS: Record<number, string> = {
  1: "delicate",
  2: "gentle",
  3: "balanced",
  4: "rich",
  5: "explosive",
};

const PROOF_RANGES = [
  { label: "Under 85", minProof: 0, maxProof: 85 },
  { label: "85-95", minProof: 85, maxProof: 95 },
  { label: "95-105", minProof: 95, maxProof: 105 },
  { label: "105-115", minProof: 105, maxProof: 115 },
  { label: "115+", minProof: 115, maxProof: Infinity },
];

/* ---------- Helpers ---------- */

function emptyProofPoint(): ProofPointInsight {
  return {
    type: "insufficient_data",
    sweetSpotLabel: null,
    insightLine:
      "Log more tastings with proof data to unlock your Proof Point. We need at least 10 pours with known proof to find your sweet spot.",
    confidence: "building",
    population: 0,
  };
}

function emptyState(): PourPreferencesData {
  return {
    loading: true,
    texture: [],
    proof: [],
    flavor: [],
    proofPoint: emptyProofPoint(),
    sweetSpots: { texture: null, proof: null, flavor: null },
    gaps: { texture: null, proof: null, flavor: null },
  };
}

function computePerceptionBuckets(
  rows: Array<{ level: number | null; rating: number | null }>
): PerceptionBucket[] {
  const map = new Map<number, { sum: number; count: number }>();
  for (const row of rows) {
    if (row.level == null || row.rating == null) continue;
    const lvl = Math.round(row.level);
    if (lvl < 1 || lvl > 5) continue;
    const acc = map.get(lvl) ?? { sum: 0, count: 0 };
    map.set(lvl, { sum: acc.sum + row.rating, count: acc.count + 1 });
  }
  return Array.from(map.entries())
    .map(([level, { sum, count }]) => ({ level, count, avgRating: sum / count }))
    .sort((a, b) => a.level - b.level);
}

function findSweetSpot(buckets: PerceptionBucket[]): number | null {
  const qualifying = buckets.filter((b) => b.count >= 2);
  if (!qualifying.length) return null;
  return qualifying.reduce((best, b) => (b.avgRating > best.avgRating ? b : best)).level;
}

function weightedAvgLevel(buckets: PerceptionBucket[]): number {
  const totalCount = buckets.reduce((s, b) => s + b.count, 0);
  if (!totalCount) return 0;
  return buckets.reduce((s, b) => s + b.level * b.count, 0) / totalCount;
}

function computeGap(
  buckets: PerceptionBucket[],
  dimensionName: string,
  sweetSpotSuffix: string,
  dimensionTerm: string,
  labelMap: Record<number, string>
): string | null {
  const qualifying = buckets.filter((b) => b.count >= 2);
  if (qualifying.length < 2) return null;

  const sweetSpot = qualifying.reduce((best, b) => (b.avgRating > best.avgRating ? b : best));
  const mostFrequent = buckets.reduce((best, b) => (b.count > best.count ? b : best));

  if (Math.abs(sweetSpot.level - mostFrequent.level) >= 1) {
    const mostFreqLabel = labelMap[mostFrequent.level] ?? `level ${mostFrequent.level}`;
    const sweetSpotLabel = labelMap[sweetSpot.level] ?? `level ${sweetSpot.level}`;
    const rawDiff = sweetSpot.avgRating - mostFrequent.avgRating;
    const diffStr = rawDiff > 0.5 ? `${rawDiff.toFixed(1)} points` : "noticeably";
    return `You reach for ${mostFreqLabel} pours most often, but your ratings say you love ${sweetSpotLabel}${sweetSpotSuffix} — ${diffStr} higher on average.`;
  }

  return `Your ratings are consistent across ${dimensionName} levels — you appreciate good whiskey regardless of ${dimensionTerm}.`;
}

type ProofAccum = {
  label: string;
  minProof: number;
  maxProof: number;
  ratingSum: number;
  proofSum: number;
  count: number;
};

type ValidProofRow = {
  proof_intensity: number | null;
  rating: number;
  proof: number;
};

function computeProofPoint(
  rows: ValidProofRow[],
  avgProofIntensity: number
): ProofPointInsight {
  const population = rows.length;
  const confidence: "building" | "moderate" | "high" =
    population >= 25 ? "high" : population >= 10 ? "moderate" : "building";

  if (population < 10) {
    return { ...emptyProofPoint(), confidence, population };
  }

  const accums: ProofAccum[] = PROOF_RANGES.map((r) => ({
    ...r,
    ratingSum: 0,
    proofSum: 0,
    count: 0,
  }));

  for (const row of rows) {
    const bucket = accums.find((b) => row.proof >= b.minProof && row.proof < b.maxProof);
    if (bucket) {
      bucket.ratingSum += row.rating;
      bucket.proofSum += row.proof;
      bucket.count += 1;
    }
  }

  const qualifying = accums.filter((b) => b.count >= 2);

  if (qualifying.length < 2) {
    return {
      type: "proof_agnostic",
      sweetSpotLabel: null,
      insightLine:
        "Your ratings hold steady across proof levels — you're a proof-agnostic drinker. What moves the needle for you is style and flavor, not ABV.",
      confidence,
      population,
    };
  }

  const best = qualifying.reduce((a, b) => (a.ratingSum / a.count > b.ratingSum / b.count ? a : b));
  const worst = qualifying.reduce((a, b) => (a.ratingSum / a.count < b.ratingSum / b.count ? a : b));

  const bestAvg = best.ratingSum / best.count;
  const worstAvg = worst.ratingSum / worst.count;
  const spread = bestAvg - worstAvg;

  if (spread >= 8) {
    const others = qualifying.filter((b) => b !== best);
    const othersCount = others.reduce((s, b) => s + b.count, 0);
    const othersRatingSum = others.reduce((s, b) => s + b.ratingSum, 0);
    const othersAvg = othersCount > 0 ? othersRatingSum / othersCount : worstAvg;
    const x = (bestAvg - othersAvg).toFixed(1);

    return {
      type: "sweet_spot",
      sweetSpotLabel: `${best.label} proof`,
      insightLine: `Your ratings peak in the ${best.label} range — whiskeys here score ${x} points higher than the rest of your pours on average. That's your Proof Point.`,
      confidence,
      population,
    };
  }

  // contradicts_perception overrides proof_agnostic
  const isBestHighProof = best.minProof >= 105;
  if (avgProofIntensity >= 3.5 && isBestHighProof) {
    const avgProof = Math.round(best.proofSum / best.count);
    return {
      type: "contradicts_perception",
      sweetSpotLabel: `${best.label} proof`,
      insightLine: `You often describe high-proof whiskeys as hot or intense — but your ratings tell a different story. Your top-rated pours average ${avgProof} proof. Your palate is more adventurous than you think.`,
      confidence,
      population,
    };
  }

  return {
    type: "proof_agnostic",
    sweetSpotLabel: null,
    insightLine:
      "Your ratings hold steady across proof levels — you're a proof-agnostic drinker. What moves the needle for you is style and flavor, not ABV.",
    confidence,
    population,
  };
}

/* ---------- Hook ---------- */

export function usePourPreferencesData(): PourPreferencesData {
  const [state, setState] = useState<PourPreferencesData>(emptyState());

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user?.id) {
        if (active) setState({ ...emptyState(), loading: false });
        return;
      }

      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

      const [perceptionResult, proofRowResult] = await Promise.all([
        supabase
          .from("tastings")
          .select("texture_level, proof_intensity, flavor_intensity, rating")
          .eq("user_id", user.id)
          .not("rating", "is", null)
          .gte("created_at", since),
        supabase
          .from("tastings")
          .select("proof_intensity, rating, whiskeys(proof)")
          .eq("user_id", user.id)
          .not("proof_intensity", "is", null)
          .not("rating", "is", null),
      ]);

      if (!active) return;

      type PerceptionRow = {
        texture_level: number | null;
        proof_intensity: number | null;
        flavor_intensity: number | null;
        rating: number | null;
      };

      const perceptionRows = (perceptionResult.data ?? []) as PerceptionRow[];

      const textureBuckets = computePerceptionBuckets(
        perceptionRows.map((r) => ({ level: r.texture_level, rating: r.rating }))
      );
      const proofBuckets = computePerceptionBuckets(
        perceptionRows.map((r) => ({ level: r.proof_intensity, rating: r.rating }))
      );
      const flavorBuckets = computePerceptionBuckets(
        perceptionRows.map((r) => ({ level: r.flavor_intensity, rating: r.rating }))
      );

      type ProofJoinRow = {
        proof_intensity: number | null;
        rating: number | null;
        whiskeys: { proof: number | null } | null;
      };

      const proofJoinRows = (proofRowResult.data ?? []) as ProofJoinRow[];

      const validProofRows: ValidProofRow[] = proofJoinRows
        .filter((r) => {
          const w = Array.isArray(r.whiskeys) ? r.whiskeys[0] : r.whiskeys;
          return w?.proof != null && r.rating != null;
        })
        .map((r) => {
          const w = Array.isArray(r.whiskeys) ? r.whiskeys[0] : r.whiskeys;
          return {
            proof_intensity: r.proof_intensity,
            rating: r.rating!,
            proof: w!.proof!,
          };
        });

      const avgProofIntensity = weightedAvgLevel(proofBuckets);
      const proofPoint = computeProofPoint(validProofRows, avgProofIntensity);

      if (!active) return;

      setState({
        loading: false,
        texture: textureBuckets,
        proof: proofBuckets,
        flavor: flavorBuckets,
        proofPoint,
        sweetSpots: {
          texture: findSweetSpot(textureBuckets),
          proof: findSweetSpot(proofBuckets),
          flavor: findSweetSpot(flavorBuckets),
        },
        gaps: {
          texture: computeGap(textureBuckets, "texture", " texture", "body", TEXTURE_LABELS),
          proof: computeGap(proofBuckets, "proof intensity", "", "proof", PROOF_LABELS),
          flavor: computeGap(flavorBuckets, "flavor intensity", " intensity", "intensity", FLAVOR_LABELS),
        },
      });
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return state;
}
