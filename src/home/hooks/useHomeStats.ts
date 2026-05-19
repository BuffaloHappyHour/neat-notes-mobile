import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";

import { supabase } from "../../../lib/supabase";
import type { PalateClarityTierLabel } from "../../palate/palateClarity.service";

export type RecommendationItem = {
  whiskey_id: string;
  display_name: string;
  whiskey_type: string | null;
  proof: number | null;
  recommendationBasis: "whiskey_type" | "flavor";
};

// Shape the RPC returns — no recommendationBasis
type RpcRecommendation = Omit<RecommendationItem, "recommendationBasis">;

type HomeScreenData = {
  first_name: string | null;
  tasting_count: number;
  avg_rating: number | null;
  distillery_count: number;
  top_affinities: string[];
  recommendations: RpcRecommendation[];
};

function deriveTierLabel(
  clarityIndex: number | null,
  tastingCount: number | null
): PalateClarityTierLabel {
  const ci = clarityIndex ?? 0;
  const tc = tastingCount ?? 0;
  if (ci >= 80 && tc >= 60) return "Signature Palate";
  if (ci >= 65 && tc >= 40) return "Refining";
  if (ci >= 50) return "Defining";
  if (ci >= 30) return "Developing";
  return "Emerging";
}

// Builds the 2-slot recommendations list:
//   slot 0 — best whiskey_type match (most-logged type, or top community pick)
//   slot 1 — best flavor affinity match (first RPC rec not already in slot 0)
async function buildRecommendations(
  userId: string,
  flavorRecs: RpcRecommendation[]
): Promise<RecommendationItem[]> {
  const result: RecommendationItem[] = [];

  // ── Slot 0: whiskey_type ──────────────────────────────────────────────────
  // Single query gets both the type distribution and the set of already-logged IDs.
  const { data: userTastings } = await supabase
    .from("tastings")
    .select("whiskey_id, whiskeys(whiskey_type)")
    .eq("user_id", userId)
    .not("whiskey_id", "is", null);

  const typeCounts: Record<string, number> = {};
  const loggedIds: string[] = [];

  for (const row of userTastings ?? []) {
    const wid = row.whiskey_id as string;
    if (wid) loggedIds.push(wid);
    const wt = (row.whiskeys as unknown as { whiskey_type: string | null } | null)?.whiskey_type;
    if (wt) typeCounts[wt] = (typeCounts[wt] ?? 0) + 1;
  }

  const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  if (topType) {
    // User has a clear type preference — find an unlogged whiskey of that type.
    let typeQuery = supabase
      .from("whiskeys")
      .select("id, display_name, whiskey_type, proof")
      .not("is_active", "eq", false)
      .eq("whiskey_type", topType);
    if (loggedIds.length > 0) {
      typeQuery = typeQuery.not("id", "in", `(${loggedIds.join(",")})`);
    }
    const { data: typeRec } = await typeQuery.limit(1).maybeSingle();
    if (typeRec) {
      result.push({
        whiskey_id: typeRec.id,
        display_name: typeRec.display_name,
        whiskey_type: typeRec.whiskey_type,
        proof: typeRec.proof,
        recommendationBasis: "whiskey_type",
      });
    }
  } else {
    // No tastings yet — fall back to the most community-tasted active whiskey.
    const { data: topCommunity } = await supabase
      .from("whiskey_community_stats")
      .select("whiskey_id")
      .order("community_count", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (topCommunity?.whiskey_id) {
      const { data: popularWhiskey } = await supabase
        .from("whiskeys")
        .select("id, display_name, whiskey_type, proof")
        .eq("id", topCommunity.whiskey_id as string)
        .maybeSingle();
      if (popularWhiskey) {
        result.push({
          whiskey_id: popularWhiskey.id,
          display_name: popularWhiskey.display_name,
          whiskey_type: popularWhiskey.whiskey_type,
          proof: popularWhiskey.proof,
          recommendationBasis: "whiskey_type",
        });
      }
    }
  }

  // ── Slot 1: flavor affinity ───────────────────────────────────────────────
  // Use the first RPC flavor rec that isn't already occupying slot 0.
  const slot0Id = result[0]?.whiskey_id;
  const flavorRec = flavorRecs.find((r) => r.whiskey_id !== slot0Id) ?? null;
  if (flavorRec) {
    result.push({
      ...flavorRec,
      recommendationBasis: "flavor",
    });
  }

  return result;
}

export function useHomeStats() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [tastingCount, setTastingCount] = useState<number | null>(null);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [distilleryCount, setDistilleryCount] = useState<number | null>(null);
  const [tierLabel, setTierLabel] = useState<PalateClarityTierLabel | null>(null);
  const [clarityIndex, setClarityIndex] = useState<number | null>(null);
  const [topAffinities, setTopAffinities] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        setIsAuthed(false);
        setFirstName(null);
        setTastingCount(null);
        setAvgRating(null);
        setDistilleryCount(null);
        setTierLabel(null);
        setClarityIndex(null);
        setTopAffinities([]);
        setRecommendations([]);
        setIsPremium(false);
        return;
      }

      setIsAuthed(true);

      const [rpcResult, metricsResult, profileResult] = await Promise.all([
        supabase.rpc("get_home_screen_data", { p_user_id: user.id }),
        supabase
          .from("user_metrics_lifetime_v1")
          .select("palate_clarity_0_100")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("is_premium")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

      if (rpcResult.error || !rpcResult.data) {
        console.error("get_home_screen_data failed:", rpcResult.error);
        return;
      }

      const d = rpcResult.data as HomeScreenData;

      setFirstName(d.first_name ?? null);
      const tc = typeof d.tasting_count === "number" ? d.tasting_count : null;
      setTastingCount(tc);
      setAvgRating(typeof d.avg_rating === "number" ? d.avg_rating : null);
      setDistilleryCount(typeof d.distillery_count === "number" ? d.distillery_count : null);
      setTopAffinities(Array.isArray(d.top_affinities) ? d.top_affinities : []);

      const ci =
        typeof metricsResult.data?.palate_clarity_0_100 === "number"
          ? metricsResult.data.palate_clarity_0_100
          : null;
      setClarityIndex(ci);
      setTierLabel(deriveTierLabel(ci, tc));

      setIsPremium(profileResult.data?.is_premium === true);

      // Build the 2-slot recommendations after the parallel round-trip.
      const recs = await buildRecommendations(
        user.id,
        Array.isArray(d.recommendations) ? d.recommendations : []
      );
      setRecommendations(recs);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return () => {};
    }, [refresh])
  );

  return {
    isAuthed,
    firstName,
    tastingCount,
    avgRating,
    distilleryCount,
    tierLabel,
    clarityIndex,
    topAffinities,
    recommendations,
    isPremium,
    statsLoading,
    refresh,
  };
}
