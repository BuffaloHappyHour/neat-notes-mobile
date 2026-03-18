// src/log/services/whiskeyCandidates.service.ts
import { supabase } from "../../../lib/supabase";
import { safeText } from "../utils/text";

function normalizeName(raw: string) {
  return raw.toLowerCase().trim().replace(/\s+/g, " ");
}

function canonicalSlug(raw: string) {
  return raw
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/\s+-\s+.*$/g, "")
    .replace(/\b(buffalo happy hour|review|wednesday whiskey review)\b/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type CreateWhiskeyCandidateInput = {
  nameRaw: string;
  whiskeyType?: string | null;
  distillery?: string | null;
  proof?: number | null;
  age?: number | null;
  category?: string | null;
  region?: string | null;
  subRegion?: string | null;
};

export async function maybeCreateWhiskeyCandidate(input: CreateWhiskeyCandidateInput) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;

  const userId = authData?.user?.id;
  if (!userId) throw new Error("No signed-in user found for candidate creation.");

  const raw = safeText(input.nameRaw);
  if (raw.length < 2) throw new Error("Candidate name is too short.");

  const slug = canonicalSlug(raw);
  if (!slug) throw new Error("Candidate slug could not be generated.");

  const payload = {
    created_by: userId,
    name_raw: raw,
    name_normalized: normalizeName(raw),
    canonical_slug: slug,
    whiskey_type: safeText(input.whiskeyType ?? "") || null,
    distillery: safeText(input.distillery ?? "") || null,
    proof: input.proof ?? null,
    age: input.age ?? null,
    category: safeText(input.category ?? "") || null,
    region: safeText(input.region ?? "") || null,
    sub_region: safeText(input.subRegion ?? "") || null,
    status: "pending",
  };

  const { data: existing, error: existingErr } = await supabase
    .from("whiskey_candidates")
    .select("id")
    .eq("created_by", userId)
    .eq("canonical_slug", slug)
    .is("promoted_whiskey_id", null)
    .is("rejected_at", null)
    .limit(1)
    .maybeSingle();

  if (existingErr) throw existingErr;

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("whiskey_candidates")
      .update({
        name_raw: payload.name_raw,
        name_normalized: payload.name_normalized,
        canonical_slug: payload.canonical_slug,
        whiskey_type: payload.whiskey_type,
        distillery: payload.distillery,
        proof: payload.proof,
        age: payload.age,
        category: payload.category,
        region: payload.region,
        sub_region: payload.sub_region,
        status: "pending",
      })
      .eq("id", existing.id);

    if (updateError) throw updateError;
    return existing.id;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("whiskey_candidates")
    .insert(payload)
    .select("id")
    .single();

  if (insertError) throw insertError;

  return inserted.id as string;
}