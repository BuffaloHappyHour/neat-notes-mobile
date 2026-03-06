// src/log/services/tastingSave.service.ts
import { trackTastingSaved, trackTastingSaveFailed } from "../../../lib/analytics";
import { hapticError, hapticSuccess } from "../../../lib/haptics";
import { supabase } from "../../../lib/supabase";

import { clamp100, isUuid, normalizeKey, safeText, uniqStringsKeepOrder } from "../utils/text";

import {
  deletePublicMirrorBySourceTastingId,
  getMyShareSetting,
  upsertPublicMirror,
} from "./publicMirror.service";
import { maybeCreateWhiskeyCandidate } from "./whiskeyCandidates.service";

export type Reaction = "ENJOYED" | "NEUTRAL" | "NOT_FOR_ME" | null;

// ✅ sentiment for refined notes (stored on tasting_flavor_selections_v2.sentiment)
export type ReviewSentiment = "LIKE" | "NEUTRAL" | "DISLIKE";

function reactionLabel(v: Reaction) {
  if (v === "ENJOYED") return "Enjoyed";
  if (v === "NEUTRAL") return "Neutral";
  if (v === "NOT_FOR_ME") return "Not for me";
  return "";
}

function normalizeSentiment(v: any): ReviewSentiment {
  const s = String(v ?? "").trim().toUpperCase();
  if (s === "LIKE" || s === "DISLIKE" || s === "NEUTRAL") return s as ReviewSentiment;
  return "NEUTRAL";
}

export async function saveCloudTasting(params: {
  // identity / mode
  isExisting: boolean;
  tastingId: string;

  // form values
  name: string;
  rating: number | null;
  textureLevel: number | null;
  proofIntensity: number | null;
  flavorIntensity: number | null;
  nose: Reaction;
  taste: Reaction;
  personalNotes: string;

  // whiskey + tags
  whiskeyId: string | null;
  flavorTags: string[];
  selectedNodeIds: string[];
  getTopLevelLabelForNode: (nodeId: string) => string | null | undefined;
  isFinishLabel: (label: string) => boolean;

  // refined-note sentiment map (optional)
  sentimentById?: Record<string, ReviewSentiment>;

  // source
  sourceType: "purchased" | "bar";
  barName: string;

  // misc
  lockName: boolean;

  // refined nodes writer (legacy)
  replaceTastingFlavorNodes: (tastingId: string, selectedNodeIds: string[]) => Promise<void>;

  // refined nodes writer (new): writes sentiment column too
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

  const topFromRefine = uniqStringsKeepOrder(
    selectedNodeIds
      .map((id) => getTopLevelLabelForNode(id))
      .filter(Boolean) as string[]
  );

  const mergedFlavorTags = uniqStringsKeepOrder([...flavorTags, ...topFromRefine]).filter(
    (t) => !isFinishLabel(t) && normalizeKey(t) !== "dislikes"
  );

  // ✅ dislikes removed entirely from writes
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
    personal_notes: personalOrNull,
  };

  // Normalize sentiments defensively
  const safeSentimentById: Record<string, ReviewSentiment> = {};
  if (sentimentById && typeof sentimentById === "object") {
    for (const [k, v] of Object.entries(sentimentById)) {
      safeSentimentById[String(k)] = normalizeSentiment(v);
    }
  }

  // Helper: write refined selections (with sentiment if available)
  const writeRefinedSelections = async (tid: string) => {
    if (replaceTastingFlavorNodesWithSentiment) {
      await replaceTastingFlavorNodesWithSentiment(tid, selectedNodeIds, safeSentimentById);
      return;
    }
    await replaceTastingFlavorNodes(tid, selectedNodeIds);
  };

  // ✅ Helper: mirror safely (NEVER fail the save because of mirror rules)
  const syncPublicMirrorSafely = async (sourceTastingId: string, shareOk: boolean) => {
    // If user turned sharing off: ensure mirror row is removed
    if (!shareOk) {
      await deletePublicMirrorBySourceTastingId(sourceTastingId);
      return;
    }

    // public_tastings requires whiskey_id (NOT NULL).
    // If we don't have a whiskeyId, skip mirror + delete any previous mirror row.
    if (!safeWhiskeyId) {
      await deletePublicMirrorBySourceTastingId(sourceTastingId);
      return;
    }

    await upsertPublicMirror({
      sourceTastingId,
      whiskeyId: safeWhiskeyId,
      rating: Number(rating),
      textureLevel: textureLevel,
      proofIntensity: proofIntensity,
      flavorIntensity: flavorIntensity,
      flavorTags: mergedFlavorTags.length ? mergedFlavorTags : null,
      // dislikes removed from mirror payload
      dislikeTags: null,
      personalNotes: personalOrNull,
      selectedNodeIds,
    });
  };

  // We track offline errors cleanly
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
      const { error } = await supabase.from("tastings").update(payload).eq("id", tastingId);
      if (error) throw new Error(error.message);

      await writeRefinedSelections(tastingId);

      // ✅ mirror should never be able to break saving
      await syncPublicMirrorSafely(tastingId, shareOk);

      await hapticSuccess();

      trackTastingSaved({
        screen: "cloud-tasting",
        whiskey_id: safeWhiskeyId,
        existing: true,
        rating: Number(rating),
        has_notes: !!personalOrNull,
        notes_len: personalOrNull ? personalOrNull.length : 0,
        has_flavor_tags: mergedFlavorTags.length > 0,
        // dislikes removed
        source_type: sourceType,
      });

      return {
        tastingId,
        whiskeyId: safeWhiskeyId,
        created: false,
      };
    }

    // new tasting
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

    // ✅ mirror should never be able to break saving
    await syncPublicMirrorSafely(newId, shareOk);

    if (!lockName) {
      await maybeCreateWhiskeyCandidate(safeName);
    }

    trackTastingSaved({
      screen: "cloud-tasting",
      whiskey_id: safeWhiskeyId,
      existing: false,
      rating: Number(rating),
      has_notes: !!personalOrNull,
      notes_len: personalOrNull ? personalOrNull.length : 0,
      has_flavor_tags: mergedFlavorTags.length > 0,
      // dislikes removed
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