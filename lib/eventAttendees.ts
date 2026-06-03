import { supabase } from "./supabase";

export async function getAttendeeCount(eventId: string): Promise<number> {
  const { count, error } = await supabase
    .from("event_attendees")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}
