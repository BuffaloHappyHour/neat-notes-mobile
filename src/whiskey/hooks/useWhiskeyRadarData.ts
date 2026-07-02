import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { RADAR_ORDER } from "../../profile/insights/constants/radarOrder";

type Axis = {
  key: string;
  label: string;
  value: number;
  mean: number;
  count: number;
};

type RadarRow = {
  slug: string;
  label: string;
  mention_pct: number;
  mention_count: number;
  tasting_count: number;
  tier: "fallback" | "blended" | "community";
};

export function useWhiskeyRadarData(whiskeyId: string, tastingCount: number) {
  const [axes, setAxes] = useState<Axis[]>([]);
  const [tier, setTier] = useState<"fallback" | "blended" | "community" | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!whiskeyId) {
      setAxes([]);
      setTier(null);
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);

    (async () => {
      try {
        const { data, error } = await supabase
          .from("whiskey_flavor_radar")
          .select("slug, label, mention_pct, mention_count, tasting_count, tier")
          .eq("whiskey_id", whiskeyId);

        if (!alive) return;
        if (error) throw error;

        const rows = ((data as any) ?? []) as RadarRow[];

        const radarMap: Record<string, number> = {};
        for (const row of rows) {
          radarMap[row.slug] = Number(row.mention_pct ?? 0) / 100;
        }

        const { data: nodes } = await supabase
          .from("flavor_nodes_v2")
          .select("slug, label")
          .eq("level", 1)
          .eq("is_active", true);

        const labelMap: Record<string, string> = {};
        (nodes ?? []).forEach((n: any) => {
          labelMap[n.slug] = n.label;
        });

        const maxValue = Math.max(0.0001, ...Object.values(radarMap));

        const nextAxes: Axis[] = RADAR_ORDER.map((slug) => {
          const raw = radarMap[slug] ?? 0;
          return {
            key: slug,
            label: labelMap[slug] ?? slug,
            value: raw > 0 ? raw / maxValue : 0.12,
            mean: raw,
            count: raw > 0 ? 1 : 0,
          };
        });

        if (alive) {
          setAxes(nextAxes);
          setTier(rows[0]?.tier ?? null);
        }
      } catch (e) {
        console.warn("useWhiskeyRadarData error:", e);
        if (alive) {
          setAxes([]);
          setTier(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [whiskeyId, tastingCount]);

  return { axes, tier, loading };
}
