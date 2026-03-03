import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { RADAR_ORDER } from "../constants/radarOrder";

type Axis = {
  key: string; // L1 slug
  label: string; // L1 label
  value: number; // 0..1 (normalized for radar)
  mean: number; // raw mean sentiment score (e.g., -0.5..1)
  count: number; // distinct tastings that touched this L1
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

type SelectionRow = {
  tasting_id: string;
  user_id: string;
  flavor_node_id: string;
  sentiment: string | null; // LIKE | NEUTRAL | DISLIKE (or null)
  intensity: number | null;
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

      // 1) Load node tree (map L2/L3 -> L1)
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

      const byId = new Map<string, FlavorNodeRow>();
      for (const n of nodes as FlavorNodeRow[]) byId.set(n.id, n);

      const l1Nodes = (nodes as FlavorNodeRow[])
        .filter((n) => n.level === 1 && (n.is_active ?? true))
        .sort((a, b) => a.label.localeCompare(b.label));

      // 2) Load selections for this user
      const { data: sel, error: selErr } = await supabase
        .from("tasting_flavor_selections_v2")
        .select("tasting_id,user_id,flavor_node_id,sentiment,intensity")
        .eq("user_id", user.id);

      if (selErr || !sel) {
        console.error("Failed to load tasting_flavor_selections_v2", selErr);
        setData({
          axes: [],
          topTraits: [],
          avoidedTraits: [],
          sentence: "Couldn’t load your flavor selections.",
        });
        setLoading(false);
        return;
      }

      const rows = sel as SelectionRow[];
      if (rows.length === 0) {
        setData({
          axes: l1Nodes.map((n) => ({
            key: n.slug,
            label: capitalize(n.label),
            value: 0.15,
            mean: 0,
            count: 0,
          })),
          topTraits: ["Log a few tastings to reveal traits"],
          avoidedTraits: [],
          sentence: "Log a few tastings to generate your taste profile.",
        });
        setLoading(false);
        return;
      }

      /**
       * SENTIMENT + FREQUENCY RADAR
       *
       * Affinity:
       * - LIKE    => +1.0
       * - NEUTRAL => +0.5
       * - DISLIKE => -0.5
       *
       * Per L1:
       * - compute per-tasting avg sentiment for that L1
       * - then mean across tastings
       *
       * Then combine:
       * value = normalizedAffinity * sqrt(prevalence)
       */
      const tastingIds = new Set<string>();
      // Map: l1Id -> Map(tastingId -> { sum, n })
      const l1TastingAgg = new Map<string, Map<string, { sum: number; n: number }>>();

      for (const r of rows) {
        if (!r.tasting_id || !r.flavor_node_id) continue;

        tastingIds.add(r.tasting_id);

        const l1 = findL1Ancestor(r.flavor_node_id, byId);
        if (!l1) continue;

        const w = sentimentWeight(r.sentiment);

        if (!l1TastingAgg.has(l1.id)) l1TastingAgg.set(l1.id, new Map());
        const perTasting = l1TastingAgg.get(l1.id)!;

        if (!perTasting.has(r.tasting_id)) perTasting.set(r.tasting_id, { sum: 0, n: 0 });
        const bucket = perTasting.get(r.tasting_id)!;

        bucket.sum += w;
        bucket.n += 1;
      }

      const totalTastings = Math.max(1, tastingIds.size);

      // Build raw means per axis
      const rawAxes = l1Nodes.map((n) => {
        const perTasting = l1TastingAgg.get(n.id);

        if (!perTasting) {
          return {
            key: n.slug,
            label: capitalize(n.label),
            mean: 0,
            count: 0,
          };
        }

        let sumMeans = 0;
        let countTastings = 0;

        for (const [, agg] of perTasting) {
          if (agg.n <= 0) continue;
          sumMeans += agg.sum / agg.n;
          countTastings += 1;
        }

        const mean = countTastings > 0 ? sumMeans / countTastings : 0;

        return {
          key: n.slug,
          label: capitalize(n.label),
          mean,
          count: countTastings,
        };
      });

      // Normalize affinity to 0..1
      const means = rawAxes.map((a) => a.mean);
      const minMean = Math.min(...means);
      const maxMean = Math.max(...means);
      const span = Math.max(0.0001, maxMean - minMean);

      const affinityScaled = (mean: number) => clamp01((mean - minMean) / span);
      const prevalence = (count: number) => clamp01(count / totalTastings);
      const prevalenceBoost = (p: number) => Math.sqrt(p);

      let axes: Axis[] = rawAxes.map((a) => {
        if (a.count === 0) return { ...a, value: 0.12 };

        const a0 = affinityScaled(a.mean);
        const p0 = prevalence(a.count);
        const v = clamp01(a0 * prevalenceBoost(p0));

        return { ...a, value: v };
      });

      // ✅ Canonical radar ordering (controls 12 o’clock + rotation)
      axes = [...axes].sort((a, b) => orderIndex(a.key) - orderIndex(b.key));

      // Traits based on raw mean affinity (not normalized), but keep them meaningful (count > 0)
      const sortedByAffinity = [...axes].sort((a, b) => b.mean - a.mean);
      const top = sortedByAffinity.filter((x) => x.count > 0).slice(0, 5);
      const bottom = [...sortedByAffinity].reverse().filter((x) => x.count > 0).slice(0, 3);

      const topTraits = top.length ? top.map((x) => x.label) : ["Still learning your palate"];
      const avoidedTraits = bottom.map((x) => x.label);

      const lead = top[0]?.label;
      const second = top[1]?.label;
      const low = bottom[0]?.label;

      const sentence =
        lead && second && low
          ? `You lean ${lead.toLowerCase()} and ${second.toLowerCase()}, with lower affinity for ${low.toLowerCase()}.`
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

function sentimentWeight(v: string | null | undefined) {
  const s = (v ?? "").toUpperCase();
  if (s === "LIKE") return 1.0;
  if (s === "DISLIKE") return -0.5;
  return 0.5;
}

function findL1Ancestor(startId: string, byId: Map<string, FlavorNodeRow>) {
  let cur = byId.get(startId);
  let guard = 0;

  while (cur && guard++ < 10) {
    if (cur.level === 1) return cur;
    if (!cur.parent_id) return null;
    cur = byId.get(cur.parent_id);
  }

  return null;
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}