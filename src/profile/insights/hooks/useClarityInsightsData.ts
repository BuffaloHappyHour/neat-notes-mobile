import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";

type MiniChartDatum = {
  label: string;
  value: number;
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
  metrics: UserMetrics90dRow | null;
  summary: {
    clarityIndex: number;
    tastingCount: number;
    tierLabel: string;
    confidenceLabel: string;
  };
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

type UserMetrics90dRow = {
  user_id: string;
  period_start: string;
  period_end: string;
  tasting_count: number;
  palate_clarity_0_100: number;
  depth_0_100: number;
  diversity_0_100: number;
  consistency_0_100: number;
  confidence_0_100: number;
  radar_l1_pct: Record<string, number> | null;
  top_traits_l1: string[] | null;
  avoided_traits_l1: string[] | null;
  radar_prev_l1_pct: Record<string, number> | null;
biggest_riser_l1: string | null;
biggest_riser_delta: number | null;
biggest_drop_l1: string | null;
biggest_drop_delta: number | null;
most_stable_l1: string | null;
most_stable_delta: number | null;
texture_pref: number | null;
proof_pref: number | null;
flavor_pref: number | null;
preference_signal_count: number | null;
top_category: string | null;
};

function makeDriverDetail(
  title: string,
  subtitle: string,
  stats: { label: string; value: string }[],
  progressLabel: string,
  progressValue: number,
  progressValueText: string,
  chipsTitle: string,
  chips: string[],
  miniChartTitle: string,
  miniChartData: MiniChartDatum[],
  footerLabel: string,
  footerValue: string
): DriverDetail {
  return {
    title,
    subtitle,
    stats,
    progressLabel,
    progressValue,
    progressValueText,
    chipsTitle,
    chips,
    miniChartTitle,
    miniChartData,
    footerLabel,
    footerValue,
  };
}

function initialState(): ClarityInsightsData {
  const blank = makeDriverDetail(
    "Loading",
    "Building your recent clarity view.",
    [],
    "Progress",
    0,
    "0%",
    "Signals",
    [],
    "Recent signals",
    [],
    "Next step",
    "Log more tastings with structured inputs."
  );

  return {
    loading: true,
    metrics: null,
    summary: {
      clarityIndex: 0,
      tastingCount: 0,
      tierLabel: "Emerging",
      confidenceLabel: "Building",
    },
    factors: {
      depth: { status: "Building", pct: 0 },
      diversity: { status: "Building", pct: 0 },
      consistency: { status: "Building", pct: 0 },
      confidence: { status: "Building", pct: 0 },
    },
    details: {
      depth: blank,
      diversity: blank,
      consistency: blank,
      confidence: blank,
      pathToDistinct: blank,
    },
  };
}

export function useClarityInsightsData(): ClarityInsightsData {
  const [state, setState] = useState<ClarityInsightsData>(initialState());

  useEffect(() => {
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user?.id) {
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      const { data, error } = await supabase
        .from("user_metrics_90d_v3")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        console.error("Failed to load clarity metrics", error);
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      const metrics = data as UserMetrics90dRow;
      console.log("90d metrics:", metrics);

      const depthPct = clamp01((metrics.depth_0_100 ?? 0) / 100);
      const diversityPct = clamp01((metrics.diversity_0_100 ?? 0) / 100);
      const consistencyPct = clamp01((metrics.consistency_0_100 ?? 0) / 100);
      const confidencePct = clamp01((metrics.confidence_0_100 ?? 0) / 100);
      const clarityPct = clamp01((metrics.palate_clarity_0_100 ?? 0) / 100);

      const topTraits = (metrics.top_traits_l1 ?? []).map(prettyTrait);
      const avoidedTraits = (metrics.avoided_traits_l1 ?? []).map(prettyTrait);

      const radarEntries = Object.entries(metrics.radar_l1_pct ?? {}).sort(
        (a, b) => b[1] - a[1]
      );

      const topRadarData: MiniChartDatum[] = radarEntries.slice(0, 5).map(([label, value]) => ({
        label: prettyTrait(label),
        value: clamp01(value),
      }));

      setState({
        loading: false,
        metrics,
        summary: {
          clarityIndex: metrics.palate_clarity_0_100 ?? 0,
          tastingCount: metrics.tasting_count ?? 0,
          tierLabel: toTierLabel(metrics.palate_clarity_0_100 ?? 0),
          confidenceLabel: statusLabel(confidencePct),
        },
        factors: {
          depth: { status: statusLabel(depthPct), pct: depthPct },
          diversity: { status: statusLabel(diversityPct), pct: diversityPct },
          consistency: { status: statusLabel(consistencyPct), pct: consistencyPct },
          confidence: { status: statusLabel(confidencePct), pct: confidencePct },
        },
        details: {
          depth: makeDriverDetail(
            "Depth",
            "Depth reflects how specific and refined your recent flavor selections have been.",
            [
              { label: "Depth score", value: `${metrics.depth_0_100}/100` },
              { label: "90-day tastings", value: `${metrics.tasting_count}` },
              { label: "Window", value: "Last 90 days" },
            ],
            "Recent depth",
            depthPct,
            `${metrics.depth_0_100}%`,
            "Top recent traits",
            topTraits.length ? topTraits : ["Building..."],
            "Recent flavor radar leaders",
            topRadarData,
            "What this means",
            depthPct >= 0.7
              ? "Your recent logs show highly specific flavor language."
              : "Your recent logs show some specificity, with room to sharpen flavor detail."
          ),
          diversity: makeDriverDetail(
            "Diversity",
            "Diversity reflects how broad your recent flavor and whiskey-style exploration has been.",
            [
              { label: "Diversity score", value: `${metrics.diversity_0_100}/100` },
              { label: "Top traits", value: `${topTraits.length}` },
              { label: "Avoided traits", value: `${avoidedTraits.length}` },
            ],
            "Recent diversity",
            diversityPct,
            `${metrics.diversity_0_100}%`,
            "Most present traits",
            topTraits.length ? topTraits : ["Building..."],
            "Trait spread",
            topRadarData,
            "What this means",
            diversityPct >= 0.7
              ? "Your recent palate covers a wide range of flavor territory."
              : "Your recent logs are still clustering into narrower flavor territory."
          ),
          consistency: makeDriverDetail(
            "Consistency",
            "Consistency reflects how repeatable your recent likes and dislikes have been across flavor families.",
            [
              { label: "Consistency score", value: `${metrics.consistency_0_100}/100` },
              { label: "Top repeated traits", value: `${topTraits.slice(0, 3).length}` },
              { label: "Avoided traits", value: `${avoidedTraits.length}` },
            ],
            "Recent consistency",
            consistencyPct,
            `${metrics.consistency_0_100}%`,
            "Repeated signals",
            topTraits.slice(0, 3).length ? topTraits.slice(0, 3) : ["Building..."],
            "Consistency-related trait presence",
            topRadarData,
            "What this means",
            consistencyPct >= 0.7
              ? "Your recent preferences are highly repeatable."
              : "Your recent preferences are still shifting, which lowers consistency for now."
          ),
          confidence: makeDriverDetail(
            "Confidence",
            "Confidence reflects how much structured recent signal the model has to work with.",
            [
              { label: "Confidence score", value: `${metrics.confidence_0_100}/100` },
              { label: "90-day tastings", value: `${metrics.tasting_count}` },
              { label: "Window", value: "Last 90 days" },
            ],
            "Signal confidence",
            confidencePct,
            `${metrics.confidence_0_100}%`,
            "Signals informing confidence",
            ["90-day window", "Trait selections", "Structured logging"],
            "Most informative recent traits",
            topRadarData,
            "What this means",
            confidencePct >= 0.7
              ? "Your recent tasting history gives the model strong confidence."
              : "The model has a usable recent signal, but more structured activity would strengthen confidence."
          ),
          pathToDistinct: makeDriverDetail(
            "Path to Distinct",
            "This shows how your recent palate signal is building across the four core drivers.",
           [
  {
    label: "Biggest rise",
    value: metrics.biggest_riser_l1
      ? prettyTrait(metrics.biggest_riser_l1)
      : "—",
  },
  {
    label: "Biggest drop",
    value: metrics.biggest_drop_l1
      ? prettyTrait(metrics.biggest_drop_l1)
      : "—",
  },
  {
    label: "Most stable",
    value: metrics.most_stable_l1
      ? prettyTrait(metrics.most_stable_l1)
      : "—",
  },
],
            "Overall recent clarity",
            clarityPct,
            `${metrics.palate_clarity_0_100}%`,
            "Best next moves",
            bestNextMoves(metrics),
            "Driver balance",
            [
              { label: "Depth", value: depthPct },
              { label: "Diversity", value: diversityPct },
              { label: "Consistency", value: consistencyPct },
              { label: "Confidence", value: confidencePct },
            ],
            "Current read",
            buildCurrentRead(metrics)
          ),
        },
      });
    }

    load();
  }, []);

  return state;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function statusLabel(pct: number) {
  if (pct >= 0.7) return "Strong";
  if (pct >= 0.45) return "Medium";
  return "Building";
}

function toTierLabel(score: number) {
  if (score >= 80) return "Signature";
  if (score >= 65) return "Refining";
  if (score >= 50) return "Defining";
  if (score >= 30) return "Developing";
  return "Emerging";
}

function prettyTrait(value: string) {
  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function bestNextMoves(metrics: UserMetrics90dRow) {
  const moves: string[] = [];

  if ((metrics.consistency_0_100 ?? 0) < 45) moves.push("Log consistently");
  if ((metrics.confidence_0_100 ?? 0) < 45) moves.push("Use structured notes");
  if ((metrics.depth_0_100 ?? 0) < 60) moves.push("Get more specific");
  if ((metrics.diversity_0_100 ?? 0) < 60) moves.push("Explore new styles");

  return moves.length ? moves.slice(0, 3) : ["Keep logging", "Stay consistent", "Trust the signal"];
}

function buildCurrentRead(metrics: UserMetrics90dRow) {
  const parts: string[] = [];

  if ((metrics.diversity_0_100 ?? 0) >= 70) parts.push("broad");
  if ((metrics.depth_0_100 ?? 0) >= 55) parts.push("expressive");
  if ((metrics.consistency_0_100 ?? 0) < 45) parts.push("still forming");
  if ((metrics.confidence_0_100 ?? 0) < 50) parts.push("gaining confidence");

  if (!parts.length) {
    return "Your recent palate signal is building steadily.";
  }

  return `Your recent palate is ${parts.join(", ")}.`;
}