// src/log/services/publicMirror.service.ts
import { supabase } from "../../../lib/supabase";
import { isUuid, safeText, uniqUuidsKeepOrder } from "../utils/text";

type ReviewSentiment = "LIKE" | "NEUTRAL" | "DISLIKE";

/**
 * DB enum (based on your table screenshot):
 * public.public_tasting_flavor_nodes.sentiment :: flavor_sentiment
 * values appear to be: positive | neutral | negative
 */
function mapSentimentToPublicEnum(
  v: ReviewSentiment | null | undefined
): "positive" | "negative" {
  if (v === "DISLIKE") return "negative";
  // LIKE + NEUTRAL map to positive because enum has no neutral
  return "positive";
}

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
  textureLevel: number | null;
  proofIntensity: number | null;
  flavorIntensity: number | null;
  flavorTags: string[] | null;
  dislikeTags: string[] | null;
  personalNotes: string | null;

  // v2 refined nodes
  selectedNodeIds: string[];

  /**
   * Optional: pass your new refine-review sentiment map.
   * If omitted, we store "neutral" for each selected node in the public mirror.
   */
  sentimentById?: Record<string, ReviewSentiment>;
}) {
  const {
    sourceTastingId,
    whiskeyId,
    rating,
    textureLevel,
    proofIntensity,
    flavorIntensity,
    flavorTags,
    dislikeTags,
    personalNotes,
    selectedNodeIds,
    sentimentById,
  } = params;

  if (!isUuid(sourceTastingId)) return;

  // Get created_at from the source tasting (so public mirror matches it)
  const { data: tData, error: tErr } = await supabase
    .from("tastings")
    .select("id, created_at")
    .eq("id", sourceTastingId)
    .maybeSingle();

  if (tErr) throw new Error(tErr.message);

  const createdAt = safeText((tData as any)?.created_at) || new Date().toISOString();

  // Find existing public mirror row
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
        texture_level: textureLevel,
        proof_intensity: proofIntensity,
        flavor_intensity: flavorIntensity,
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
        texture_level: textureLevel,
        proof_intensity: proofIntensity,
        flavor_intensity: flavorIntensity,
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

  // Replace children
  const { error: delErr } = await supabase
    .from("public_tasting_flavor_nodes")
    .delete()
    .eq("public_tasting_id", publicTastingId);

  if (delErr) throw new Error(delErr.message);

  const clean = uniqUuidsKeepOrder(selectedNodeIds);
  if (!clean.length) return;

  // ✅ verify node ids exist in flavor_nodes_v2
  const { data: existingNodes, error: nodeErr } = await supabase
    .from("flavor_nodes_v2")
    .select("id")
    .in("id", clean);

  if (nodeErr) throw new Error(nodeErr.message);

  const existingSet = new Set((existingNodes ?? []).map((r: any) => safeText(r.id)));
  const valid = clean.filter((id) => existingSet.has(id));
  const validFinal = valid.filter((id) => isUuid(id));
  if (!validFinal.length) return;

  const inserts = validFinal.map((nodeId) => {
    const s = sentimentById?.[nodeId] ?? "NEUTRAL";
    return {
      public_tasting_id: publicTastingId,
      node_id: nodeId,
      sentiment: mapSentimentToPublicEnum(s),
    };
  });

  const { error: insKidsErr } = await supabase.from("public_tasting_flavor_nodes").insert(inserts);

  if (insKidsErr) {
    const msg = String(insKidsErr.message ?? "");
    throw new Error(
      msg.includes("violates foreign key constraint")
        ? `${msg}\n\nFix: update public_tasting_flavor_nodes.node_id FK to reference flavor_nodes_v2(id).`
        : msg
    );
  }
}