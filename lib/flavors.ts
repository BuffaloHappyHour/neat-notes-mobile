// lib/flavors.ts
import { supabase } from "./supabase";

export type FlavorNodeV2 = {
  id: string;
  level: 1 | 2 | 3;
  label: string;
  slug: string;
  parent_id: string | null;
  is_active: boolean;
  sort_order: number | null;
  created_at: string;
};

export type TastingFlavorTagRowV2 = {
  tasting_id: string;
  user_id: string;
  flavor_node_id: string;
  level: 1 | 2 | 3;
  label: string;
  slug: string;
  created_at: string;
};

/** Fetch the active flavor taxonomy (v2) */
export async function fetchFlavorNodesV2() {
  const { data, error } = await supabase
    .from("flavor_nodes_v2")
    .select("id, level, label, slug, parent_id, is_active, sort_order, created_at")
    .eq("is_active", true)
    .order("level", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });

  if (error) throw error;
  return (data ?? []) as FlavorNodeV2[];
}

/**
 * Read selections for a tasting using the v2 effective view.
 * This returns the canonical label/slug/level for each selection.
 */
export async function fetchTastingFlavorTagsV2(tastingId: string) {
  const { data, error } = await supabase
    .from("tasting_flavor_tags_effective_v2")
    .select("tasting_id, user_id, flavor_node_id, level, label, slug, created_at")
    .eq("tasting_id", tastingId)
    .order("level", { ascending: true })
    .order("label", { ascending: true });

  if (error) throw error;
  return (data ?? []) as TastingFlavorTagRowV2[];
}

/**
 * Replace all v2 selections for a tasting.
 * Option A model: store only selected node ids (L1/L2/L3).
 */
export async function replaceTastingFlavorSelectionsV2(params: {
  tastingId: string;
  userId: string;
  flavorNodeIds: string[]; // selected node ids
}) {
  const { tastingId, userId, flavorNodeIds } = params;

  // Delete existing selections
  const { error: delErr } = await supabase
    .from("tasting_flavor_selections_v2")
    .delete()
    .eq("tasting_id", tastingId);

  if (delErr) throw delErr;

  if (!flavorNodeIds.length) return;

  const inserts = flavorNodeIds.map((flavor_node_id) => ({
    tasting_id: tastingId,
    user_id: userId,
    flavor_node_id,
  }));

  const { error: insErr } = await supabase
    .from("tasting_flavor_selections_v2")
    .insert(inserts);

  if (insErr) throw insErr;
}