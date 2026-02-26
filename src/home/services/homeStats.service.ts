// src/home/services/homeStats.service.ts
import { supabase } from "../../../lib/supabase";

export async function fetchHomeStats() {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;

  if (!user) {
    return {
      isAuthed: false,
      firstName: null as string | null,
      tastingCount: null as number | null,
    };
  }

  const userId = user.id;

  // 1) Fetch first_name (personalization)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", userId)
    .maybeSingle();

  const firstName =
    !profileError && profile?.first_name ? String(profile.first_name) : null;

  // 2) Fetch tasting count
  const { count, error: countError } = await supabase
    .from("tastings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const tastingCount =
    countError ? null : typeof count === "number" ? count : 0;

  return {
    isAuthed: true,
    firstName,
    tastingCount,
  };
}