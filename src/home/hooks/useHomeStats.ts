import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";

import { supabase } from "../../../lib/supabase";
import type { PalateClarityTierLabel } from "../../palate/palateClarity.service";

export type RecommendationItem = {
  whiskey_id: string;
  display_name: string;
  whiskey_type: string | null;
  proof: number | null;
};

type HomeScreenData = {
  first_name: string | null;
  tasting_count: number;
  avg_rating: number | null;
  distillery_count: number;
  top_affinities: string[];
  recommendations: RecommendationItem[];
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
      setRecommendations(Array.isArray(d.recommendations) ? d.recommendations : []);

      const ci =
        typeof metricsResult.data?.palate_clarity_0_100 === "number"
          ? metricsResult.data.palate_clarity_0_100
          : null;
      setClarityIndex(ci);
      setTierLabel(deriveTierLabel(ci, tc));

      setIsPremium(profileResult.data?.is_premium === true);
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
