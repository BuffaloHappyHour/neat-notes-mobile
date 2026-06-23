import { supabase } from "./supabase";

export async function createCustomWhiskey(params: {
  displayName: string;
  distillery?: string | null;
  proof?: number | null;
  whiskeyTypeId?: string | null;
}): Promise<string> {
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error("Not signed in.");

  const canonical = params.displayName.trim().toLowerCase().replace(/\s+/g, "-");

  const { data: existing } = await supabase
    .from("whiskeys")
    .select("id")
    .eq("whiskey_canonical", canonical)
    .maybeSingle();

  if (existing?.id) return existing.id as string;

  const { data, error } = await supabase.rpc("create_custom_whiskey", {
    p_display_name: params.displayName,
    p_whiskey_canonical: canonical,
    p_user_id: user.id,
    p_distillery: params.distillery ?? null,
    p_proof: params.proof ?? null,
    p_whiskey_type_id: params.whiskeyTypeId ?? null,
  });

  if (error) {
    // Race-condition duplicate: another insert beat us; try lookup once more.
    const { data: fallback } = await supabase
      .from("whiskeys")
      .select("id")
      .eq("whiskey_canonical", canonical)
      .maybeSingle();
    if (fallback?.id) return fallback.id as string;
    throw new Error("A whiskey with that name already exists. Try searching for it instead.");
  }

  return data as string;
}
