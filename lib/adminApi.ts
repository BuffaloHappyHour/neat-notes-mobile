import { supabase } from "./supabase";

export type CandidateRow = {
  id: string;
  created_by: string | null;
  name_raw: string | null;
  name_normalized: string | null;
  canonical_slug: string | null;
  whiskey_type: string | null;
  distillery: string | null;
  proof: number | null;
  age: number | null;
  category: string | null;
  region: string | null;
  sub_region: string | null;

  status: string | null;
  merged_into_whiskey_id: string | null;

  created_at: string;
  promoted_at: string | null;
  promoted_whiskey_id: string | null;

  rejected_at: string | null;
  reviewer_note: string | null;
  approved: boolean;
};

export async function isAdmin(): Promise<boolean> {
  const userRes = await supabase.auth.getUser();
  const uid = userRes.data.user?.id ?? null;

  if (!uid) return false;

  const { data, error } = await supabase.rpc("is_admin", { uid });

  // If rpc fails, treat as non-admin
  if (error) return false;
  return Boolean(data);
}

export type CandidateFilter = "needs_review" | "approved" | "promoted" | "rejected" | "all";

/**
 * Pipeline rules (as Derek requested):
 * - "Approved" and "Promoted" are effectively the same thing: if it's in whiskeys, it's approved.
 * - Inbox ("needs_review") shows only actionable rows: not promoted AND not rejected.
 */
export async function fetchCandidates(params: { q?: string; filter?: CandidateFilter }) {
  const { q, filter = "needs_review" } = params;

  let query = supabase
    .from("whiskey_candidates")
    .select("*")
    .order("created_at", { ascending: false });

  if (filter === "needs_review") {
    // Actionable only: not rejected + not promoted
    query = query.is("rejected_at", null).is("promoted_whiskey_id", null);
  } else if (filter === "approved" || filter === "promoted") {
    // Approved == Promoted
    query = query.not("promoted_whiskey_id", "is", null);
  } else if (filter === "rejected") {
    query = query.not("rejected_at", "is", null);
  } else {
    // "all" -> no additional constraints
  }

  if (q && q.trim().length > 0) {
    const s = q.trim();
    query = query.or(`name_raw.ilike.%${s}%,canonical_slug.ilike.%${s}%,distillery.ilike.%${s}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as CandidateRow[];
}

export async function fetchCandidate(id: string) {
  const { data, error } = await supabase.from("whiskey_candidates").select("*").eq("id", id).single();

  if (error) throw error;
  return data as CandidateRow;
}

export async function adminUpdateCandidate(input: {
  id: string;
  name_raw: string;
  canonical_slug: string;
  whiskey_type: string;
  distillery: string;
  proof: number | null;
  age: number | null;
  category: string | null;
  region: string | null;
  sub_region: string | null;
  reviewer_note: string;
  merged_into_whiskey_id: string | null;
}) {
  const { error } = await supabase.rpc("admin_update_candidate", {
    p_id: input.id,
    p_name_raw: input.name_raw,
    p_canonical_slug: input.canonical_slug,
    p_whiskey_type: input.whiskey_type,
    p_distillery: input.distillery,
    p_proof: input.proof,
    p_age: input.age,
    p_category: input.category,
    p_region: input.region,
    p_sub_region: input.sub_region,
    p_reviewer_note: input.reviewer_note,
    p_merged_into_whiskey_id: input.merged_into_whiskey_id,
  });

  if (error) throw error;
}

export async function adminRejectCandidate(id: string, note: string) {
  const { error } = await supabase.rpc("admin_reject_candidate", {
    p_id: id,
    p_note: note,
  });
  if (error) throw error;
}

export async function adminApproveAndPromoteCandidate(id: string) {
  const { data, error } = await supabase.rpc("admin_approve_and_promote_candidate", {
    p_id: id,
  });
  if (error) throw error;
  return data as string; // whiskey_id
}