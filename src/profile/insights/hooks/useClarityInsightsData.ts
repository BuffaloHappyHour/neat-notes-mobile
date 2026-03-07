import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";

type MiniChartDatum = {
  label: string;
  value: number; // 0..1
  tastingId?: string;
};

type DriverDetail = {
  title: string;
  subtitle: string;
  stats: { label: string; value: string }[];
  progressLabel: string;
  progressValue: number;
  progressValueText: string;
  chipsTitle: string;
  chips: string[];
  miniChartTitle: string;
  miniChartData: MiniChartDatum[];
  footerLabel: string;
  footerValue: string;
};

type ClarityInsightsData = {
  loading: boolean;
  factors: {
    depth: { status: string; pct: number };
    diversity: { status: string; pct: number };
    consistency: { status: string; pct: number };
    confidence: { status: string; pct: number };
  };
  details: {
    depth: DriverDetail;
    diversity: DriverDetail;
    consistency: DriverDetail;
    confidence: DriverDetail;
    pathToDistinct: DriverDetail;
  };
};

type TastingRow = {
  id: string;
  whiskey_name: string | null;
  created_at: string | null;
  rating: number | null;
  nose_reaction: string | null;
  taste_reaction: string | null;
  source_type: string | null;
  flavor_tags: string[] | null;
  texture_level: number | null;
  proof_intensity: number | null;
  flavor_intensity: number | null;
};

type SelectionRow = {
  tasting_id: string;
  flavor_node_id: string;
  sentiment: string | null;
};

type FlavorNodeRow = {
  id: string;
  parent_id: string | null;
  level: number;
  label: string;
};

const EMPTY_DRIVER: DriverDetail = {
  title: "Unavailable",
  subtitle: "Log more tastings to generate this insight.",
  stats: [],
  progressLabel: "Progress",
  progressValue: 0,
  progressValueText: "0%",
  chipsTitle: "Signals",
  chips: [],
  miniChartTitle: "Recent pours",
  miniChartData: [],
  footerLabel: "Next step",
  footerValue: "Log more tastings with full structured inputs.",
};

export function useClarityInsightsData(): ClarityInsightsData {
  const [state, setState] = useState<ClarityInsightsData>({
    loading: true,
    factors: {
      depth: { status: "Building", pct: 0.12 },
      diversity: { status: "Building", pct: 0.12 },
      consistency: { status: "Building", pct: 0.12 },
      confidence: { status: "Building", pct: 0.12 },
    },
    details: {
      depth: EMPTY_DRIVER,
      diversity: EMPTY_DRIVER,
      consistency: EMPTY_DRIVER,
      confidence: EMPTY_DRIVER,
      pathToDistinct: EMPTY_DRIVER,
    },
  });

  useEffect(() => {
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user?.id) {
        setState((prev) => ({
          ...prev,
          loading: false,
        }));
        return;
      }

      const [{ data: tastings, error: tastingsErr }, { data: selections, error: selectionsErr }, { data: nodes, error: nodesErr }] =
        await Promise.all([
          supabase
            .from("tastings")
            .select(
              "id, whiskey_name, created_at, rating, nose_reaction, taste_reaction, source_type, flavor_tags, texture_level, proof_intensity, flavor_intensity"
            )
            .order("created_at", { ascending: false })
            .eq("user_id", user.id),
          supabase
            .from("tasting_flavor_selections_v2")
            .select("tasting_id, flavor_node_id, sentiment")
            .eq("user_id", user.id),
          supabase.from("flavor_nodes_v2").select("id,parent_id,level,label"),
        ]);

      if (tastingsErr || selectionsErr || nodesErr || !tastings || !selections || !nodes) {
        console.error("Failed to load clarity insights data", {
          tastingsErr,
          selectionsErr,
          nodesErr,
        });
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      const tastingRows = tastings as TastingRow[];
      const selectionRows = selections as SelectionRow[];
      const nodeRows = nodes as FlavorNodeRow[];

      if (!tastingRows.length) {
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      const byNodeId = new Map<string, FlavorNodeRow>();
      nodeRows.forEach((n) => byNodeId.set(n.id, n));

      const tastingById = new Map<string, TastingRow>();
      tastingRows.forEach((t) => tastingById.set(t.id, t));

      const selectionsByTasting = new Map<string, SelectionRow[]>();
      selectionRows.forEach((row) => {
        const arr = selectionsByTasting.get(row.tasting_id) ?? [];
        arr.push(row);
        selectionsByTasting.set(row.tasting_id, arr);
      });

      const recent = tastingRows.slice(0, 5);

      const refinedCounts = tastingRows.map((t) => {
        const rows = selectionsByTasting.get(t.id) ?? [];
        return {
          tastingId: t.id,
          whiskeyName: shortenWhiskeyName(t.whiskey_name ?? "Unknown"),
          refinedCount: rows.length,
          l1Families: uniqueTopFamilies(rows, byNodeId),
          rating: numericOrNull(t.rating),
          structuredCount: countStructuredSignals(t),
          reactionAligned: isReactionAligned(t),
          categoryLabel: sourceTypeLabel(t.source_type),
        };
      });

      const totalTastings = tastingRows.length;
      const tastingsWithRefined = refinedCounts.filter((x) => x.refinedCount > 0).length;
      const avgRefined = average(refinedCounts.map((x) => x.refinedCount));
      const tastingsWithFivePlus = refinedCounts.filter((x) => x.refinedCount >= 5).length;

      const allFamilies = refinedCounts.flatMap((x) => x.l1Families);
      const familyCounts = countStrings(allFamilies);
      const topFamilies = topKeys(familyCounts, 3);

      const distinctCategoryCount = uniqueCount(refinedCounts.map((x) => x.categoryLabel).filter(Boolean));
      const distinctFamilyCount = Object.keys(familyCounts).length;

      const ratingAlignedCount = refinedCounts.filter((x) => x.reactionAligned).length;
      const recentActive = tastingRows.filter((t) => daysAgo(t.created_at) <= 30).length;
      const avgStructured = average(refinedCounts.map((x) => x.structuredCount));

      const depthPct = clamp01(
        (tastingsWithRefined / totalTastings) * 0.45 +
          clamp01(avgRefined / 5) * 0.35 +
          (tastingsWithFivePlus / totalTastings) * 0.2
      );

      const diversityPct = clamp01(
        clamp01(distinctCategoryCount / 6) * 0.4 +
          clamp01(distinctFamilyCount / 10) * 0.4 +
          clamp01(uniqueCount(tastingRows.map((t) => t.source_type ?? "")) / 2) * 0.2
      );

      const consistencyPct = clamp01(
        (ratingAlignedCount / totalTastings) * 0.55 +
          clamp01(avgStructured / 5) * 0.2 +
          clamp01(recentCountWithRepeatedPatterns(refinedCounts) / 5) * 0.25
      );

      const confidencePct = clamp01(
        clamp01(totalTastings / 40) * 0.5 +
          clamp01(recentActive / 10) * 0.25 +
          clamp01(avgStructured / 5) * 0.25
      );

      const factors = {
        depth: { status: statusLabel(depthPct), pct: depthPct },
        diversity: { status: statusLabel(diversityPct), pct: diversityPct },
        consistency: { status: statusLabel(consistencyPct), pct: consistencyPct },
        confidence: { status: statusLabel(confidencePct), pct: confidencePct },
      };

      const details = {
        depth: {
          title: "Depth",
          subtitle:
            "Depth grows when you refine beyond broad tags and describe pours with richer, more specific flavor language.",
          stats: [
            { label: "Refined-note tastings", value: `${tastingsWithRefined} of ${totalTastings}` },
            { label: "Avg. refined notes per tasting", value: avgRefined.toFixed(1) },
            { label: "Tastings with 5+ flavor notes", value: `${tastingsWithFivePlus}` },
          ],
          progressLabel: "Refined-note coverage",
          progressValue: tastingsWithRefined / totalTastings,
          progressValueText: `${Math.round((tastingsWithRefined / totalTastings) * 100)}%`,
          chipsTitle: "Most-used refined families",
          chips: topFamilies.length ? topFamilies : ["Building..."],
          miniChartTitle: "Refined-note depth across recent pours",
          miniChartData: recent.map((t) => {
            const rc = refinedCounts.find((x) => x.tastingId === t.id);
            return {
              label: shortenWhiskeyName(t.whiskey_name ?? "Unknown"),
              value: clamp01((rc?.refinedCount ?? 0) / 5),
              tastingId: t.id,
            };
          }),
          footerLabel: "What’s making depth strong",
          footerValue:
            tastingsWithRefined >= totalTastings * 0.65
              ? "You refine beyond broad flavor tags in most recent tastings."
              : "Use refined notes more often to make your palate language feel more specific.",
        },
        diversity: {
          title: "Diversity",
          subtitle:
            "Diversity improves when your logs span more styles, source types, and flavor families instead of clustering tightly.",
          stats: [
            { label: "Distinct source patterns", value: `${uniqueCount(tastingRows.map((t) => t.source_type ?? ""))}` },
            { label: "Distinct flavor families used", value: `${distinctFamilyCount}` },
            { label: "Distinct tasting categories", value: `${distinctCategoryCount}` },
          ],
          progressLabel: "Flavor-family spread",
          progressValue: clamp01(distinctFamilyCount / 10),
          progressValueText: statusLabel(diversityPct),
          chipsTitle: "Most explored families",
          chips: topFamilies.length ? topFamilies : ["Building..."],
          miniChartTitle: "Flavor-family spread across recent pours",
          miniChartData: recent.map((t) => {
            const rc = refinedCounts.find((x) => x.tastingId === t.id);
            return {
              label: shortenWhiskeyName(t.whiskey_name ?? "Unknown"),
              value: clamp01((rc?.l1Families.length ?? 0) / 4),
              tastingId: t.id,
            };
          }),
          footerLabel: "What’s limiting diversity",
          footerValue:
            distinctFamilyCount < 6
              ? "Your logs still cluster into a smaller set of familiar flavor families."
              : "Your flavor spread is broadening across multiple tasting styles.",
        },
        consistency: {
          title: "Consistency",
          subtitle:
            "Consistency strengthens when your reactions, ratings, and note patterns align across similar pours.",
          stats: [
            { label: "Reaction-aligned tastings", value: `${ratingAlignedCount} of ${totalTastings}` },
            { label: "Avg. structured signals per tasting", value: avgStructured.toFixed(1) },
            { label: "Repeated family patterns", value: `${recentCountWithRepeatedPatterns(refinedCounts)}` },
          ],
          progressLabel: "Reaction + rating alignment",
          progressValue: ratingAlignedCount / totalTastings,
          progressValueText: `${Math.round((ratingAlignedCount / totalTastings) * 100)}%`,
          chipsTitle: "Most repeated patterns",
          chips: topFamilies.slice(0, 3).length ? topFamilies.slice(0, 3) : ["Building..."],
          miniChartTitle: "Structured consistency across recent pours",
          miniChartData: recent.map((t) => {
            const rc = refinedCounts.find((x) => x.tastingId === t.id);
            return {
              label: shortenWhiskeyName(t.whiskey_name ?? "Unknown"),
              value: clamp01((rc?.structuredCount ?? 0) / 5),
              tastingId: t.id,
            };
          }),
          footerLabel: "Strongest repeated signal",
          footerValue:
            topFamilies[0]
              ? `${topFamilies[0]} shows up repeatedly in your recent flavor language.`
              : "Repeated tasting patterns will emerge as you log more pours.",
        },
        confidence: {
          title: "Confidence",
          subtitle:
            "Confidence grows as your tasting history gets larger, more recent, and more consistently structured.",
          stats: [
            { label: "Total tastings logged", value: `${totalTastings}` },
            { label: "Recent tastings in last 30 days", value: `${recentActive}` },
            { label: "Avg. structured signals used", value: avgStructured.toFixed(1) },
          ],
          progressLabel: "Confidence foundation",
          progressValue: confidencePct,
          progressValueText: statusLabel(confidencePct),
          chipsTitle: "Strongest confidence signals",
          chips: ["Rating", "Quick Reactions", "Flavor Notes", "Signals"].slice(
            0,
            Math.max(2, Math.round(avgStructured))
          ),
          miniChartTitle: "Recent activity by pour",
          miniChartData: recent.map((t) => ({
            label: shortenWhiskeyName(t.whiskey_name ?? "Unknown"),
            value: clamp01(countStructuredSignals(t) / 5),
            tastingId: t.id,
          })),
          footerLabel: "What improves confidence fastest",
          footerValue:
            totalTastings < 25
              ? "More tastings with full structured inputs will raise confidence fastest."
              : "Continue logging consistently to strengthen confidence further.",
        },
        pathToDistinct: {
          title: "Path to Distinct",
          subtitle:
            "The next tier comes from combining stronger note depth, broader variety, and more repeatable tasting structure.",
          stats: [
            { label: "Need more category variety", value: missingTarget(distinctCategoryCount, 6) },
            { label: "Need more refined-note depth", value: missingTarget(tastingsWithFivePlus, 8) },
            { label: "Need stronger consistency", value: missingTarget(Math.round(consistencyPct * 10), 7) },
          ],
          progressLabel: "Progress toward Distinct",
          progressValue: clamp01((depthPct + diversityPct + consistencyPct + confidencePct) / 4),
          progressValueText: `${Math.round(
            ((depthPct + diversityPct + consistencyPct + confidencePct) / 4) * 100
          )}%`,
          chipsTitle: "Best next moves",
          chips: ["Try 2 new styles", "Use refined notes", "Log full signals"],
          miniChartTitle: "Tier-up drivers",
          miniChartData: [
            { label: "Depth", value: depthPct },
            { label: "Diversity", value: diversityPct },
            { label: "Consistency", value: consistencyPct },
            { label: "Confidence", value: confidencePct },
          ],
          footerLabel: "Fastest way to improve",
          footerValue:
            "Log 5 varied pours with refined notes and full structured signals to push toward Distinct.",
        },
      };

      setState({
        loading: false,
        factors,
        details,
      });
    }

    load();
  }, []);

  return state;
}

function shortenWhiskeyName(name: string) {
  const cleaned = name.replace(/\b(year|years|scotch|whisky|whiskey)\b/gi, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).join(" ");
}

function numericOrNull(value: number | null | undefined) {
  return value == null || !Number.isFinite(Number(value)) ? null : Number(value);
}

function countStructuredSignals(t: TastingRow) {
  let count = 0;
  if (numericOrNull(t.rating) != null) count += 1;
  if (t.nose_reaction) count += 1;
  if (t.taste_reaction) count += 1;
  if ((t.flavor_tags ?? []).length > 0) count += 1;
  if (numericOrNull(t.texture_level) != null) count += 1;
  if (numericOrNull(t.proof_intensity) != null) count += 1;
  if (numericOrNull(t.flavor_intensity) != null) count += 1;
  return count;
}

function isReactionAligned(t: TastingRow) {
  const rating = numericOrNull(t.rating);
  if (rating == null) return false;

  const positive = t.nose_reaction === "Enjoyed" || t.taste_reaction === "Enjoyed";
  const negative = t.nose_reaction === "Not for me" || t.taste_reaction === "Not for me";

  if (positive && rating >= 70) return true;
  if (negative && rating <= 55) return true;
  if (!positive && !negative && rating >= 56 && rating <= 75) return true;

  return false;
}

function sourceTypeLabel(sourceType: string | null) {
  if (sourceType === "bar") return "Bar Pour";
  if (sourceType === "purchased") return "Purchased Bottle";
  return "Other";
}

function uniqueTopFamilies(rows: SelectionRow[], byNodeId: Map<string, FlavorNodeRow>) {
  const set = new Set<string>();

  for (const row of rows) {
    const label = findL1Label(row.flavor_node_id, byNodeId);
    if (label) set.add(label);
  }

  return [...set];
}

function findL1Label(nodeId: string, byNodeId: Map<string, FlavorNodeRow>) {
  let cur = byNodeId.get(nodeId);
  let guard = 0;

  while (cur && guard++ < 10) {
    if (cur.level === 1) return cur.label;
    if (!cur.parent_id) return null;
    cur = byNodeId.get(cur.parent_id);
  }

  return null;
}

function average(nums: number[]) {
  if (!nums.length) return 0;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

function countStrings(items: string[]) {
  const out: Record<string, number> = {};
  items.forEach((item) => {
    out[item] = (out[item] ?? 0) + 1;
  });
  return out;
}

function topKeys(map: Record<string, number>, take: number) {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, take)
    .map(([key]) => key);
}

function uniqueCount(items: string[]) {
  return new Set(items.filter(Boolean)).size;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function daysAgo(dateStr: string | null) {
  if (!dateStr) return 9999;
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

function recentCountWithRepeatedPatterns(
  rows: {
    l1Families: string[];
  }[]
) {
  return rows.filter((r) => r.l1Families.length >= 2).length;
}

function statusLabel(pct: number) {
  if (pct >= 0.7) return "Strong";
  if (pct >= 0.45) return "Medium";
  return "Building";
}

function missingTarget(current: number, target: number) {
  if (current >= target) return "Complete";
  return `${target - current} more`;
}