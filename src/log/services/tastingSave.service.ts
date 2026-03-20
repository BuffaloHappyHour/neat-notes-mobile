import { trackTastingSaved, trackTastingSaveFailed } from "../../../lib/analytics";
import { hapticError, hapticSuccess } from "../../../lib/haptics";
import { supabase } from "../../../lib/supabase";

import {
  clamp100,
  isUuid,
  normalizeKey,
  safeText,
  uniqStringsKeepOrder,
} from "../utils/text";

import {
  deletePublicMirrorBySourceTastingId,
  getMyShareSetting,
  upsertPublicMirror,
} from "./publicMirror.service";

export type Reaction = "ENJOYED" | "NEUTRAL" | "NOT_FOR_ME" | null;
export type ReviewSentiment = "LIKE" | "NEUTRAL" | "DISLIKE";

function reactionLabel(v: Reaction) {
  if (v === "ENJOYED") return "Enjoyed";
  if (v === "NEUTRAL") return "Neutral";
  if (v === "NOT_FOR_ME") return "Not for me";
  return "";
}

function normalizeSentiment(v: any): ReviewSentiment {
  const s = String(v ?? "").trim().toUpperCase();
  if (s === "LIKE" || s === "DISLIKE" || s === "NEUTRAL") {
    return s as ReviewSentiment;
  }
  return "NEUTRAL";
}

export async function saveCloudTasting(params: {
  isExisting: boolean;
  tastingId: string;

  name: string;
  rating: number | null;
  textureLevel: number | null;
  proofIntensity: number | null;
  flavorIntensity: number | null;
  nose: Reaction;
  taste: Reaction;
  personalNotes: string;

  whiskeyId: string | null;
  flavorTags: string[];
  selectedNodeIds: string[];
  getTopLevelLabelForNode: (nodeId: string) => string | null | undefined;
  isFinishLabel: (label: string) => boolean;

  sentimentById?: Record<string, ReviewSentiment>;

  sourceType: "purchased" | "bar";
  barName: string;
  storeName: string;
  sourceCity: string;
  sourceState: string;
  pricePerOz: string;
  pricePerBottle: string;
  pourSizeOz: string;
  bottleSizeMl: string;

  lockName: boolean;

  replaceTastingFlavorNodes: (
    tastingId: string,
    selectedNodeIds: string[]
  ) => Promise<void>;

  replaceTastingFlavorNodesWithSentiment?: (
    tastingId: string,
    selectedNodeIds: string[],
    sentimentById: Record<string, ReviewSentiment>
  ) => Promise<void>;
}) {
  const {
    isExisting,
    tastingId,

    name,
    rating,
    textureLevel,
    proofIntensity,
    flavorIntensity,
    nose,
    taste,
    personalNotes,

    whiskeyId,
    flavorTags,
    selectedNodeIds,
    getTopLevelLabelForNode,
    isFinishLabel,

    sentimentById,

    sourceType,
    barName,
    storeName,
    sourceCity,
    sourceState,
    pricePerOz,
    pricePerBottle,
    pourSizeOz,
    bottleSizeMl,

    lockName,

    replaceTastingFlavorNodes,
    replaceTastingFlavorNodesWithSentiment,
  } = params;

  const safeName = String(name ?? "").trim();
  if (safeName.length < 2) {
    throw new Error("Please enter a whiskey name.");
  }

  if (rating == null) {
    throw new Error("Please set a rating.");
  }

  if (sourceType === "bar" && String(barName ?? "").trim().length < 2) {
    throw new Error("Please enter the bar name for a Bar Pour.");
  }

  const safeWhiskeyId = whiskeyId && isUuid(whiskeyId) ? whiskeyId : null;

  const cleanedPersonal = String(personalNotes ?? "").trim();
  const personalOrNull = cleanedPersonal.length ? cleanedPersonal : null;

  const safeCity = String(sourceCity ?? "").trim();
  const safeState = String(sourceState ?? "").trim();
  const safePricePerOz = String(pricePerOz ?? "").trim();
  const safePricePerBottle = String(pricePerBottle ?? "").trim();
  const safePourSizeOz = String(pourSizeOz ?? "").trim();
  const safeBottleSizeMl = String(bottleSizeMl ?? "").trim();

  const sourceDetails: string[] = [];

  if (sourceType === "bar") {
    const safeBarName = String(barName ?? "").trim();
    if (safeBarName) sourceDetails.push(`Venue: ${safeBarName}`);
    if (safeCity) sourceDetails.push(`City: ${safeCity}`);
    if (safeState) sourceDetails.push(`State/Region: ${safeState}`);
    if (safePricePerOz) sourceDetails.push(`Price/oz: $${safePricePerOz}`);
    if (safePourSizeOz) sourceDetails.push(`Pour size: ${safePourSizeOz} oz`);
  } else {
    const safeStoreName = String(storeName ?? "").trim();
    if (safeStoreName) sourceDetails.push(`Store: ${safeStoreName}`);
    if (safeCity) sourceDetails.push(`City: ${safeCity}`);
    if (safeState) sourceDetails.push(`State/Region: ${safeState}`);
    if (safePricePerBottle) {
      sourceDetails.push(`Price/bottle: $${safePricePerBottle}`);
    }
    if (safeBottleSizeMl) {
      sourceDetails.push(`Bottle size: ${safeBottleSizeMl} ml`);
    }
  }

  const sourceDetailsBlock = sourceDetails.length
    ? sourceDetails.join(" • ")
    : null;

  const notesWithSourceContext = [personalOrNull, sourceDetailsBlock]
    .filter(Boolean)
    .join("\n\n");
  const finalPersonalNotes = notesWithSourceContext.length
    ? notesWithSourceContext
    : null;

  const topFromRefine = uniqStringsKeepOrder(
    selectedNodeIds
      .map((id) => getTopLevelLabelForNode(id))
      .filter(Boolean) as string[]
  );

  const mergedFlavorTags = uniqStringsKeepOrder([
    ...flavorTags,
    ...topFromRefine,
  ]).filter((t) => !isFinishLabel(t) && normalizeKey(t) !== "dislikes");

  let venueId: string | null = null;

  const sourceName =
    sourceType === "bar" ? barName?.trim() : storeName?.trim();

  if (sourceName) {
    const { data, error } = await supabase.rpc("get_or_create_venue", {
      p_name: sourceName,
      p_city: sourceCity || null,
      p_region: sourceState || null,
      p_country: "USA",
    });

    if (!error && data) {
      venueId = data;
    }
  }
  const { data: sessionData } = await supabase.auth.getSession();
  const recordedBy = sessionData.session?.user?.id ?? null;

  if (
    venueId &&
    safeWhiskeyId &&
    ((sourceType === "bar" && (Number(safePricePerOz || 0) > 0 || Number(safePourSizeOz || 0) > 0)) ||
      (sourceType === "purchased" &&
        (Number(safePricePerBottle || 0) > 0 || Number(safeBottleSizeMl || 0) > 0)))
  ) {
    await supabase.rpc("upsert_venue_whiskey_offering", {
      p_venue_id: venueId,
      p_whiskey_id: safeWhiskeyId,
      p_offering_type: sourceType === "bar" ? "pour" : "bottle",
      p_price:
        sourceType === "bar"
          ? Number(safePricePerOz || 0) || null
          : Number(safePricePerBottle || 0) || null,
      p_currency: "USD",
      p_pour_size_oz:
        sourceType === "bar"
          ? Number(safePourSizeOz || "1")
          : null,
      p_bottle_size_ml:
        sourceType === "purchased"
          ? Number(safeBottleSizeMl || "750")
          : null,
      p_notes: null,
      p_recorded_by: recordedBy,
    });
  }
  const payload: any = {
    whiskey_name: safeName,
    whiskey_id: safeWhiskeyId,
    rating: clamp100(Number(rating)),
    texture_level: textureLevel,
    proof_intensity: proofIntensity,
    flavor_intensity: flavorIntensity,
    nose_reaction: reactionLabel(nose) || null,
    taste_reaction: reactionLabel(taste) || null,
    flavor_tags: mergedFlavorTags.length ? mergedFlavorTags : null,

    source_type: sourceType,
    bar_name: sourceType === "bar" ? String(barName ?? "").trim() : null,
    personal_notes: finalPersonalNotes,
    venue_id: venueId,

    source_name_snapshot:
      sourceType === "bar"
        ? String(barName ?? "").trim()
        : String(storeName ?? "").trim(),

    source_city: safeCity || null,
    source_region: safeState || null,
    source_country: "USA",

    source_price:
      sourceType === "bar"
        ? Number(safePricePerOz || 0) || null
        : Number(safePricePerBottle || 0) || null,

   source_pour_size_oz:
  sourceType === "bar"
    ? Number(safePourSizeOz || 1) // default 1oz
    : null,

source_bottle_size_ml:
  sourceType === "purchased"
    ? Number(safeBottleSizeMl || 750) // default 750ml
    : null,
  };

  const safeSentimentById: Record<string, ReviewSentiment> = {};
  if (sentimentById && typeof sentimentById === "object") {
    for (const [k, v] of Object.entries(sentimentById)) {
      safeSentimentById[String(k)] = normalizeSentiment(v);
    }
  }

  const writeRefinedSelections = async (tid: string) => {
    if (replaceTastingFlavorNodesWithSentiment) {
      await replaceTastingFlavorNodesWithSentiment(
        tid,
        selectedNodeIds,
        safeSentimentById
      );
      return;
    }
    await replaceTastingFlavorNodes(tid, selectedNodeIds);
  };

  const syncPublicMirrorSafely = async (
    sourceTastingId: string,
    shareOk: boolean
  ) => {
    if (!shareOk) {
      await deletePublicMirrorBySourceTastingId(sourceTastingId);
      return;
    }

    if (!safeWhiskeyId) {
      await deletePublicMirrorBySourceTastingId(sourceTastingId);
      return;
    }

    await upsertPublicMirror({
      sourceTastingId,
      whiskeyId: safeWhiskeyId,
      rating: Number(rating),
      textureLevel,
      proofIntensity,
      flavorIntensity,
      flavorTags: mergedFlavorTags.length ? mergedFlavorTags : null,
      dislikeTags: null,
      personalNotes: finalPersonalNotes,
      selectedNodeIds,
    });
  };

  const trackFail = async (message: string) => {
    const lower = String(message ?? "").toLowerCase();
    const isOffline =
      lower.includes("network request failed") ||
      lower.includes("failed to fetch") ||
      (lower.includes("fetch") && lower.includes("error")) ||
      lower.includes("offline") ||
      lower.includes("timeout") ||
      lower.includes("timed out") ||
      lower.includes("unexpected end of input");

    trackTastingSaveFailed({
      screen: "cloud-tasting",
      whiskey_id: safeWhiskeyId,
      existing: isExisting,
      message: String(message ?? ""),
      is_offline: isOffline,
    });

    return { isOffline };
  };

  try {
    const shareOk = await getMyShareSetting();

    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;

    if (isExisting) {
      const { error } = await supabase
        .from("tastings")
        .update(payload)
        .eq("id", tastingId);

      if (error) throw new Error(error.message);

      await writeRefinedSelections(tastingId);
      await syncPublicMirrorSafely(tastingId, shareOk);
      await hapticSuccess();

      trackTastingSaved({
        screen: "cloud-tasting",
        whiskey_id: safeWhiskeyId,
        existing: true,
        rating: Number(rating),
        has_notes: !!finalPersonalNotes,
        notes_len: finalPersonalNotes ? finalPersonalNotes.length : 0,
        has_flavor_tags: mergedFlavorTags.length > 0,
        source_type: sourceType,
      });

      return {
        tastingId,
        whiskeyId: safeWhiskeyId,
        created: false,
      };
    }

    if (!user) throw new Error("Not signed in");

    const { data: inserted, error } = await supabase
      .from("tastings")
      .insert({ user_id: user.id, ...payload })
      .select("id")
      .maybeSingle();

    if (error) throw new Error(error.message);

    const newId = safeText((inserted as any)?.id);
    if (!isUuid(newId)) throw new Error("Saved, but missing tasting id.");

    await writeRefinedSelections(newId);
    await syncPublicMirrorSafely(newId, shareOk);

    trackTastingSaved({
      screen: "cloud-tasting",
      whiskey_id: safeWhiskeyId,
      existing: false,
      rating: Number(rating),
      has_notes: !!finalPersonalNotes,
      notes_len: finalPersonalNotes ? finalPersonalNotes.length : 0,
      has_flavor_tags: mergedFlavorTags.length > 0,
      source_type: sourceType,
    });

    await hapticSuccess();

    return {
      tastingId: newId,
      whiskeyId: safeWhiskeyId,
      created: true,
    };
  } catch (e: any) {
    await hapticError();

    const msg = String(e?.message ?? e ?? "");
    const { isOffline } = await trackFail(msg);

    const err: any = new Error(msg);
    err.isOffline = isOffline;
    throw err;
  }
}