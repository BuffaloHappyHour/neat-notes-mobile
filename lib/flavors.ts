// lib/flavors.ts
import type { SupabaseClient } from "@supabase/supabase-js";

export type FlavorFamily = {
  id: string;
  label: string;
  slug: string | null;
  sort_order: number;
};

export async function fetchFlavorFamilies(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("flavor_nodes")
    .select("id,label,slug,sort_order")
    .eq("level", 1)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as FlavorFamily[];
}

export async function fetchTastingFlavorFamilies(params: {
  supabase: SupabaseClient;
  tastingId: string;
}) {
  const { supabase, tastingId } = params;

  const { data, error } = await supabase
    .from("tasting_flavor_tags")
    .select("level1_id")
    .eq("tasting_id", tastingId);

  if (error) throw error;
  return (data ?? []).map((r: any) => r.level1_id as string);
}

export async function saveFlavorFamilyTags(params: {
  supabase: SupabaseClient;
  tastingId: string;
  userId: string;
  level1Ids: string[]; // max 3
}) {
  const { supabase, tastingId, userId } = params;
  const trimmed = level1Ids.slice(0, 3);

  // Delete existing tags for this tasting (edit-safe)
  const { error: delErr } = await supabase
    .from("tasting_flavor_tags")
    .delete()
    .eq("tasting_id", tastingId)
    .eq("user_id", userId);

  if (delErr) throw delErr;

  // Insert new tags
  if (trimmed.length === 0) return;

  const rows = trimmed.map((level1_id) => ({
    tasting_id: tastingId,
    user_id: userId,
    level1_id,
    level2_id: null,
    level3_id: null,
  }));

  const { error: insErr } = await supabase
    .from("tasting_flavor_tags")
    .insert(rows);

  if (insErr) throw insErr;
}
