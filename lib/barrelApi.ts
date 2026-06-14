import { supabase } from "./supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DistilleryResult = {
  id: string;
  name: string;
  region: string | null;
};

export type DistilleryCandidateInsert = {
  name_raw: string;
  region: string;
  sub_region: string | null;
  category: string;
};

export type WhiskeyTypeRow = {
  id: string;
  name: string;
};

export type BarrelDraft = {
  distilleryId: string | null;
  distilleryCandidateId: string | null;
  distilleryName: string;
  barrelNumber: string;
  whiskeyTypeId: string | null;
  whiskeyTypeName: string | null;
  proof: number | null;
  ageMonths: number | null;
  mashBill: string | null;
  pairingNote: string;
  /** Set when the barrel already exists in distillery_barrels; skips the barrel insert. */
  existingBarrelId?: string | null;
};

export type DistilleryBarrelPickerItem = {
  id: string;
  barrelNumber: string;
  whiskeyTypeId: string | null;
  whiskeyType: string | null;
  proof: number | null;
  ageMonths: number | null;
  mashBill: string | null;
};

export type BarrelLineupItem = {
  lineupId: string;
  barrelId: string;
  pourOrder: number | null;
  pairingNote: string | null;
  barrelNumber: string;
  whiskeyTypeName: string | null;
  proof: number | null;
  ageMonths: number | null;
  mashBill: string | null;
  distilleryName: string;
  distilleryId: string | null;
  distilleryCandidateId: string | null;
};

// ─── Distillery search ────────────────────────────────────────────────────────

export async function searchDistilleries(q: string): Promise<DistilleryResult[]> {
  const { data, error } = await supabase
    .from("distilleries")
    .select("id, name, region")
    .ilike("name", `%${q.trim()}%`)
    .order("name")
    .limit(20);

  if (error) throw new Error(error.message);
  return (data ?? []) as DistilleryResult[];
}

// ─── Distillery candidate insert ──────────────────────────────────────────────

export async function insertDistilleryCandidate(
  input: DistilleryCandidateInsert
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("distillery_candidates")
    .insert({
      name_raw: input.name_raw,
      region: input.region,
      sub_region: input.sub_region ?? null,
      category: input.category,
      created_by: user?.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

// ─── Whiskey types ────────────────────────────────────────────────────────────

export async function fetchWhiskeyTypes(): Promise<WhiskeyTypeRow[]> {
  const { data, error } = await supabase
    .from("whiskey_types")
    .select("id, name")
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []) as WhiskeyTypeRow[];
}

// ─── Add a barrel to an existing event (used from the edit screen) ────────────

export async function addBarrelToLineup(
  eventId: string,
  draft: BarrelDraft,
  pourOrder: number
): Promise<BarrelLineupItem> {
  let barrelId: string;

  if (draft.existingBarrelId) {
    barrelId = draft.existingBarrelId;
  } else {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: barrel, error: barrelErr } = await supabase
      .from("distillery_barrels")
      .insert({
        event_id: eventId,
        distillery_id: draft.distilleryId,
        distillery_candidate_id: draft.distilleryCandidateId,
        barrel_number: draft.barrelNumber,
        whiskey_type_id: draft.whiskeyTypeId,
        proof: draft.proof,
        age_months: draft.ageMonths,
        mash_bill: draft.mashBill || null,
        is_event_private: true,
        created_by_user_id: user?.id,
      })
      .select("id")
      .single();

    if (barrelErr) throw new Error(barrelErr.message);
    barrelId = barrel.id as string;
  }

  const { data: lineupRow, error: lineupErr } = await supabase
    .from("event_lineup")
    .insert({
      event_id: eventId,
      barrel_id: barrelId,
      whiskey_id: null,
      pour_order: pourOrder,
      pairing_note: draft.pairingNote.trim() || null,
    })
    .select("id")
    .single();

  if (lineupErr) throw new Error(lineupErr.message);

  return {
    lineupId: lineupRow.id as string,
    barrelId,
    pourOrder,
    pairingNote: draft.pairingNote.trim() || null,
    barrelNumber: draft.barrelNumber,
    whiskeyTypeName: draft.whiskeyTypeName,
    proof: draft.proof,
    ageMonths: draft.ageMonths,
    mashBill: draft.mashBill,
    distilleryName: draft.distilleryName,
    distilleryId: draft.distilleryId,
    distilleryCandidateId: draft.distilleryCandidateId,
  };
}

// ─── Insert all staged barrel drafts (used after event creation) ──────────────

export async function saveBarrelLineup(
  eventId: string,
  drafts: BarrelDraft[]
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  for (let i = 0; i < drafts.length; i++) {
    const draft = drafts[i];

    let barrelId: string;

    if (draft.existingBarrelId) {
      barrelId = draft.existingBarrelId;
    } else {
      const { data: barrel, error: barrelErr } = await supabase
        .from("distillery_barrels")
        .insert({
          event_id: eventId,
          distillery_id: draft.distilleryId,
          distillery_candidate_id: draft.distilleryCandidateId,
          barrel_number: draft.barrelNumber,
          whiskey_type_id: draft.whiskeyTypeId,
          proof: draft.proof,
          age_months: draft.ageMonths,
          mash_bill: draft.mashBill || null,
          is_event_private: true,
          created_by_user_id: user?.id,
        })
        .select("id")
        .single();

      if (barrelErr) throw new Error(barrelErr.message);
      barrelId = barrel.id as string;
    }

    const { error: lineupErr } = await supabase.from("event_lineup").insert({
      event_id: eventId,
      barrel_id: barrelId,
      whiskey_id: null,
      pour_order: i + 1,
      pairing_note: draft.pairingNote.trim() || null,
    });

    if (lineupErr) throw new Error(lineupErr.message);
  }
}

// ─── Fetch barrel lineup for an event ────────────────────────────────────────

export async function getBarrelLineup(eventId: string): Promise<BarrelLineupItem[]> {
  const { data, error } = await supabase
    .from("event_lineup")
    .select(
      `id, pour_order, pairing_note, barrel_id,
       distillery_barrels(
         id, barrel_number, proof, age_months, mash_bill,
         distillery_id, distillery_candidate_id,
         whiskey_types(name),
         distilleries(name),
         distillery_candidates(name_raw)
       )`
    )
    .eq("event_id", eventId)
    .not("barrel_id", "is", null)
    .order("pour_order", { ascending: true });

  if (error) throw new Error(error.message);

  return ((data ?? []) as any[]).map((row) => {
    const b = row.distillery_barrels;
    const distilleryName: string =
      b?.distilleries?.name ?? b?.distillery_candidates?.name_raw ?? "Unknown Distillery";
    return {
      lineupId: row.id as string,
      barrelId: row.barrel_id as string,
      pourOrder: row.pour_order as number | null,
      pairingNote: row.pairing_note as string | null,
      barrelNumber: (b?.barrel_number as string) ?? "",
      whiskeyTypeName: (b?.whiskey_types?.name as string) ?? null,
      proof: b?.proof as number | null,
      ageMonths: b?.age_months as number | null,
      mashBill: b?.mash_bill as string | null,
      distilleryName,
      distilleryId: b?.distillery_id as string | null,
      distilleryCandidateId: b?.distillery_candidate_id as string | null,
    };
  });
}

// ─── Remove a barrel lineup slot (keeps the barrel record) ───────────────────

export async function removeBarrelLineupSlot(lineupId: string): Promise<void> {
  const { error } = await supabase
    .from("event_lineup")
    .delete()
    .eq("id", lineupId);
  if (error) throw new Error(error.message);
}

// ─── Load a single barrel's details for tasting ──────────────────────────────

export type BarrelDetail = {
  barrelId: string;
  barrelNumber: string;
  distilleryName: string;
  whiskeyTypeName: string | null;
  proof: number | null;
  ageMonths: number | null;
  mashBill: string | null;
};

export async function getBarrelDetail(barrelId: string): Promise<BarrelDetail> {
  const { data, error } = await supabase
    .from("distillery_barrels")
    .select(
      `id, barrel_number, proof, age_months, mash_bill,
       whiskey_types(name),
       distilleries(name),
       distillery_candidates(name_raw)`
    )
    .eq("id", barrelId)
    .single();

  if (error) throw new Error(error.message);

  const row = data as any;
  const distilleryName: string =
    row?.distilleries?.name ?? row?.distillery_candidates?.name_raw ?? "Unknown Distillery";

  return {
    barrelId: row.id as string,
    barrelNumber: row.barrel_number as string,
    distilleryName,
    whiskeyTypeName: row?.whiskey_types?.name ?? null,
    proof: row.proof ?? null,
    ageMonths: row.age_months ?? null,
    mashBill: row.mash_bill ?? null,
  };
}

// ─── Save barrel tasting ──────────────────────────────────────────────────────

export async function saveBarrelTasting(input: {
  barrelId: string;
  eventId: string | null;
  rating: number | null;
  textureLevel: number | null;
  proofIntensity: number | null;
  flavorIntensity: number | null;
  personalNotes: string;
  selectedNodeIds: string[];
  sentimentById: Record<string, "LIKE" | "NEUTRAL" | "DISLIKE">;
}): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: tasting, error: tastingErr } = await supabase
    .from("barrel_tastings")
    .upsert(
      {
        barrel_id: input.barrelId,
        user_id: user.id,
        event_id: input.eventId,
        rating: input.rating,
        texture_level: input.textureLevel,
        proof_intensity: input.proofIntensity,
        flavor_intensity: input.flavorIntensity,
        personal_notes: input.personalNotes.trim() || null,
      },
      { onConflict: "barrel_id,user_id" }
    )
    .select("id")
    .single();

  if (tastingErr) throw new Error(tastingErr.message);

  const tastingId = tasting.id as string;

  // Replace flavor selections
  await supabase
    .from("barrel_tasting_flavor_selections")
    .delete()
    .eq("barrel_tasting_id", tastingId)
    .eq("user_id", user.id);

  if (input.selectedNodeIds.length > 0) {
    const rows = input.selectedNodeIds.map((nodeId) => ({
      barrel_tasting_id: tastingId,
      user_id: user.id,
      flavor_node_id: nodeId,
      sentiment: input.sentimentById[nodeId] ?? "NEUTRAL",
      intensity: null,
    }));

    const { error: selErr } = await supabase
      .from("barrel_tasting_flavor_selections")
      .insert(rows);

    if (selErr) throw new Error(selErr.message);
  }

  return tastingId;
}

// ─── Admin: distillery candidate functions ────────────────────────────────────

export type DistilleryCandidateRow = {
  id: string;
  created_by: string | null;
  name_raw: string;
  region: string;
  sub_region: string | null;
  category: string;
  status: string;
  promoted_distillery_id: string | null;
  reviewer_note: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchPendingDistilleryCandidates(): Promise<DistilleryCandidateRow[]> {
  const { data, error } = await supabase
    .from("distillery_candidates")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as DistilleryCandidateRow[];
}

export async function adminPromoteDistilleryCandidate(candidateId: string): Promise<string> {
  const { data, error } = await supabase.rpc("admin_promote_distillery_candidate", {
    p_candidate_id: candidateId,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function adminRejectDistilleryCandidate(
  candidateId: string,
  reviewerNote: string
): Promise<void> {
  const { error } = await supabase.rpc("admin_reject_distillery_candidate", {
    p_candidate_id: candidateId,
    p_reviewer_note: reviewerNote,
  });
  if (error) throw new Error(error.message);
}

// ─── Distillery account ───────────────────────────────────────────────────────

export async function getMyDistilleryAccount(): Promise<
  { distillery_id: string; distillery_name: string }[]
> {
  const { data, error } = await supabase.rpc("get_my_distillery_account");
  if (error) throw new Error(error.message);
  return (data ?? []) as { distillery_id: string; distillery_name: string }[];
}

export async function getDistilleryBarrelsForEvent(
  distilleryId: string
): Promise<DistilleryBarrelPickerItem[]> {
  const { data, error } = await supabase.rpc(
    "get_distillery_barrels_for_event",
    { p_distillery_id: distilleryId }
  );
  if (error) throw new Error(error.message);
  return ((data ?? []) as any[]).map((row) => ({
    id: row.id as string,
    barrelNumber: row.barrel_number as string,
    whiskeyTypeId: row.whiskey_type_id as string | null,
    whiskeyType: row.whiskey_type as string | null,
    proof: row.proof as number | null,
    ageMonths: row.age_months as number | null,
    mashBill: row.mash_bill as string | null,
  }));
}
