// lib/cloudTastings.ts
import { supabase } from "./supabase";

export type CreateCloudTastingInput = {
  whiskey_id: string | null;
  whiskey_name: string;
  rating: number;
  notes: string;

  // Optional, unstructured “free text” notes
  // (does NOT feed the intelligence layer; just for the user)
  personal_notes?: string | null;
};

/**
 * Creates a tasting row and returns { id } so we can attach flavor tags.
 */
export async function createCloudTasting(input: CreateCloudTastingInput) {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;

  const user = userRes.user;
  if (!user) throw new Error("Not signed in");

  const payload: Record<string, any> = {
    user_id: user.id,
    whiskey_id: input.whiskey_id,
    whiskey_name: input.whiskey_name,
    rating: input.rating,
    notes: input.notes,
  };

  // Only include the column if provided (prevents issues if column is missing)
  if (typeof input.personal_notes !== "undefined") {
    const v = input.personal_notes;
    payload.personal_notes = v && v.trim().length ? v.trim() : null;
  }

  const { data, error } = await supabase
    .from("tastings")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw error;
  return data; // { id: string }
}
