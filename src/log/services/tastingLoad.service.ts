// src/log/services/tastingLoad.service.ts

import { supabase } from "../../../lib/supabase";
import { isUuid, safeText } from "../utils/text";

export type LoadedTasting = {
  id: string;
  whiskeyName: string;
  whiskeyId: string | null;
  rating: number | null;
  noseReaction: string | null;
  tasteReaction: string | null;
  flavorTags: string[];
  dislikeTags: string[];
  personalNotes: string;
  sourceType: "purchased" | "bar";
  barName: string;
};

export async function loadTastingById(tastingId: string): Promise<LoadedTasting | null> {
  if (!isUuid(tastingId)) return null;

  const { data, error } = await supabase
    .from("tastings")
    .select(`
      id,
      whiskey_name,
      whiskey_id,
      rating,
      nose_reaction,
      taste_reaction,
      flavor_tags,
      dislike_tags,
      personal_notes,
      source_type,
      bar_name
    `)
    .eq("id", tastingId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;

  return {
    id: safeText(data.id),
    whiskeyName: safeText(data.whiskey_name),
    whiskeyId: isUuid(data.whiskey_id) ? data.whiskey_id : null,
    rating:
      data.rating == null || !Number.isFinite(Number(data.rating))
        ? null
        : Number(data.rating),
    noseReaction: safeText(data.nose_reaction) || null,
    tasteReaction: safeText(data.taste_reaction) || null,
    flavorTags: Array.isArray(data.flavor_tags) ? data.flavor_tags : [],
    dislikeTags: Array.isArray(data.dislike_tags) ? data.dislike_tags : [],
    personalNotes: safeText(data.personal_notes),
    sourceType:
      data.source_type === "bar" ? "bar" : "purchased",
    barName: safeText(data.bar_name),
  };
}