// src/log/services/publicMirror.service.ts
import { supabase } from "../../../lib/supabase";
import { isUuid, safeText, uniqUuidsKeepOrder } from "../utils/text";

export async function getMyShareSetting(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user?.id) return false;

  // Default opt-in = true if null/missing
  const { data: pData, error } = await supabase
    .from("profiles")
    .select("share_anonymously")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return true;
  const v = (pData as any)?.share_anonymously;
  return typeof v === "boolean" ? v : true;
}

export async function deletePublicMirrorBySourceTastingId(sourceTastingId: string) {
  if (!isUuid(sourceTastingId)) return;

  const { data: existing, error: exErr } = await supabase
    .from("public_tastings")
    .select("id")
    .eq("source_tasting_id", sourceTastingId)
    .maybeSingle();

  if (exErr) throw new Error(exErr.message);

  const publicId = safeText((existing as any)?.id);
  if (!isUuid(publicId)) return;

  const { error: delKids } = await supabase
    .from("public_tasting_flavor_nodes")
    .delete()
    .eq("public_tasting_id", publicId);

  if (delKids) throw new Error(delKids.message);

  const { error: delParent } = await supabase.from("public_tastings").delete().eq("id", publicId);

  if (delParent) throw new Error(delParent.message);
}

export async function upsertPublicMirror(params: {
  sourceTastingId: string;
  whiskeyId: string | null;
  rating: number;
  flavorTags: string[] | null;
  dislikeTags: string[] | null;
  personalNotes: string | null;
  selectedNodeIds: string[];
}) {
  const { sourceTastingId, whiskeyId, rating, flavorTags, dislikeTags, personalNotes, selectedNodeIds } =
    params;

  if (!isUuid(sourceTastingId)) return;

  const { data: tData, error: tErr } = await supabase
    .from("tastings")
    .select("id, created_at")
    .eq("id", sourceTastingId)
    .maybeSingle();

  if (tErr) throw new Error(tErr.message);

  const createdAt = safeText((tData as any)?.created_at) || new Date().toISOString();

  const { data: existing, error: exErr } = await supabase
    .from("public_tastings")
    .select("id")
    .eq("source_tasting_id", sourceTastingId)
    .maybeSingle();

  if (exErr) throw new Error(exErr.message);

  let publicTastingId = safeText((existing as any)?.id);

  if (isUuid(publicTastingId)) {
    const { error: upErr } = await supabase
      .from("public_tastings")
      .update({
        whiskey_id: whiskeyId,
        rating: Number(rating),
        flavor_tags: flavorTags,
        dislike_tags: dislikeTags,
        personal_notes: personalNotes,
      })
      .eq("id", publicTastingId);

    if (upErr) throw new Error(upErr.message);
  } else {
    const { data: ins, error: insErr } = await supabase
      .from("public_tastings")
      .insert({
        source_tasting_id: sourceTastingId,
        whiskey_id: whiskeyId,
        rating: Number(rating),
        flavor_tags: flavorTags,
        dislike_tags: dislikeTags,
        personal_notes: personalNotes,
        created_at: createdAt,
      })
      .select("id")
      .maybeSingle();

    if (insErr) throw new Error(insErr.message);

    publicTastingId = safeText((ins as any)?.id);
    if (!isUuid(publicTastingId)) {
      throw new Error("Public mirror saved, but missing public tasting id.");
    }
  }

  const { error: delErr } = await supabase
    .from("public_tasting_flavor_nodes")
    .delete()
    .eq("public_tasting_id", publicTastingId);

  if (delErr) throw new Error(delErr.message);

  const clean = uniqUuidsKeepOrder(selectedNodeIds);
  if (!clean.length) return;

  const inserts = clean.map((nodeId) => ({
    public_tasting_id: publicTastingId,
    node_id: nodeId,
    sentiment: "positive",
  }));

  const { error: insKidsErr } = await supabase.from("public_tasting_flavor_nodes").insert(inserts);
  if (insKidsErr) throw new Error(insKidsErr.message);
}