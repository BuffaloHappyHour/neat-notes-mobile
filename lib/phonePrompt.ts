import { supabase } from "./supabase";

// Gate for the post-signup "add your phone" prompt. Only true for accounts
// that have never resolved it (skipped or linked) and don't already have a
// phone on file — e.g. linked directly via Account Settings instead.
export async function shouldShowPhonePrompt(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("phone_prompt_seen_at, phone")
    .eq("id", userId)
    .maybeSingle();

  if (!data) return false;
  return !data.phone_prompt_seen_at && !data.phone;
}
