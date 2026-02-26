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

/**
 * Non-blocking helper. If the user logs a whiskey that isn't in the catalog,
 * we create a "candidate" for later review.
 */
export async function maybeCreateWhiskeyCandidate(nameRaw: string) {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) return;

    const raw = safeText(nameRaw);
    if (raw.length < 2) return;

    const slug = canonicalSlug(raw);
    if (!slug) return;

    const { data: existing, error: existingErr } = await supabase
      .from("whiskey_candidates")
      .select("id")
      .eq("created_by", userId)
      .eq("canonical_slug", slug)
      .limit(1);

    if (existingErr) return;
    if (existing && existing.length > 0) return;

    await supabase.from("whiskey_candidates").insert({
      created_by: userId,
      name_raw: raw,
      name_normalized: normalizeName(raw),
      canonical_slug: slug,
      status: "pending",
    });
  } catch {
    // Never block the main save flow
  }
}