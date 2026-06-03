import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { RADAR_ORDER } from "../constants/radarOrder";

type Axis = {
  key: string;
  label: string;
  value: number;
  mean: number;
  count: number;
};

type InsightsData = {
  axes: Axis[];
  topTraits: string[];
  avoidedTraits: string[];
  sentence: string;
};

type FlavorNodeRow = {
  id: string;
  parent_id: string | null;
  level: number;
  label: string;
  slug: string;
  is_active?: boolean;
};

type MetricsRow = {
  radar_l1_affinity: Record<string, number> | null;
  top_traits_l1: string[] | null;
  avoided_traits_l1: string[] | null;
};

export function useInsightsData() {
  const [data, setData] = useState<InsightsData>({
    axes: [],
    topTraits: [],
    avoidedTraits: [],
    sentence: "Building your taste profile…",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user?.id) {
        setData({
          axes: [],
          topTraits: [],
          avoidedTraits: [],
          sentence: "Sign in to generate your taste profile.",
        });
        setLoading(false);
        return;
      }

      const { data: nodes, error: nodesErr } = await supabase
        .from("flavor_nodes_v2")
        .select("id,parent_id,level,label,slug,is_active");

      if (nodesErr || !nodes) {
        console.error("Failed to load flavor_nodes_v2", nodesErr);
        setData({
          axes: [],
          topTraits: [],
          avoidedTraits: [],
          sentence: "Couldn’t load flavor nodes.",
        });
        setLoading(false);
        return;
      }

      const l1Nodes = (nodes as FlavorNodeRow[])
        .filter((n) => n.level === 1 && (n.is_active ?? true))
        .sort((a, b) => a.label.localeCompare(b.label));

      const { data: metricsRow, error: metricsErr } = await supabase
        .from("user_metrics_90d_v4")
        .select("radar_l1_affinity, top_traits_l1, avoided_traits_l1")
        .eq("user_id", user.id)
        .single();

      if (metricsErr || !metricsRow) {
        console.error("Failed to load user_metrics_90d_v4", metricsErr);
        setData({
          axes: [],
          topTraits: [],
          avoidedTraits: [],
          sentence: "Couldn’t load your taste profile.",
        });
        setLoading(false);
        return;
      }

      const metrics = metricsRow as MetricsRow;
      const radar = metrics.radar_l1_affinity ?? {};
      const maxRadarValue = Math.max(
  0.0001,
  ...Object.values(radar).map((v) => Number(v) || 0)
);

      let axes: Axis[] = l1Nodes.map((n) => {
        const raw = Number(radar[n.slug] ?? 0);

        return {
          key: n.slug,
          label: capitalize(n.label),
         value: raw > 0 ? raw / maxRadarValue : 0.12,
          mean: raw,
          count: raw > 0 ? 1 : 0,
        };
      });

      axes = [...axes].sort((a, b) => orderIndex(a.key) - orderIndex(b.key));

      const topTraits = (metrics.top_traits_l1 ?? []).map((t) =>
        capitalize(t.replace(/-/g, " "))
      );

      const avoidedTraits = (metrics.avoided_traits_l1 ?? []).map((t) =>
        capitalize(t.replace(/-/g, " "))
      );

      const lead = topTraits[0];
      const second = topTraits[1];
      const low = avoidedTraits[0];

      const sentence =
        lead && second && low
          ? `You lean ${lead.toLowerCase()} and ${second.toLowerCase()}, with less preference for ${low.toLowerCase()}.`
          : "Log a few more tastings to generate your taste profile.";

      setData({ axes, topTraits, avoidedTraits, sentence });
      setLoading(false);
    }

    load();
  }, []);

  return { ...data, loading };
}

function orderIndex(slug: string) {
  const i = RADAR_ORDER.indexOf(slug);
  return i === -1 ? 999 : i;
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}