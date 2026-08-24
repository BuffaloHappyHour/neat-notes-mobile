import { supabase } from "./supabase";

export async function getActiveVenueId(): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("venue_checkins")
    .select("venue_id")
    .eq("user_id", userId)
    .is("checked_out_at", null)
    .order("checked_in_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return (data as any).venue_id ?? null;
}
