import { supabase } from "./supabase";

export type LineupItem = {
  id: string;
  event_id: string;
  whiskey_id: string;
  pour_order: number | null;
  pairing_note: string | null;
  created_at: string;
  display_name: string;
  whiskey_type: string | null;
  proof: number | null;
  distillery: string | null;
};

export type LineupDraft = {
  whiskeyId: string;
  displayName: string;
  whiskeyType: string | null;
  proof: number | null;
  pairingNote: string;
};

export async function getEventLineup(eventId: string): Promise<LineupItem[]> {
  const { data, error } = await supabase
    .from("event_lineup")
    .select(
      "id, event_id, whiskey_id, pour_order, pairing_note, created_at, whiskeys(display_name, whiskey_type, proof, distillery)"
    )
    .eq("event_id", eventId)
    .order("pour_order", { ascending: true });

  if (error) throw new Error(error.message);

  return ((data ?? []) as any[]).map((row) => ({
    id: row.id,
    event_id: row.event_id,
    whiskey_id: row.whiskey_id,
    pour_order: row.pour_order,
    pairing_note: row.pairing_note,
    created_at: row.created_at,
    display_name: row.whiskeys?.display_name ?? "Unknown",
    whiskey_type: row.whiskeys?.whiskey_type ?? null,
    proof: row.whiskeys?.proof ?? null,
    distillery: row.whiskeys?.distillery ?? null,
  }));
}

export async function saveEventLineup(
  eventId: string,
  items: LineupDraft[]
): Promise<void> {
  if (items.length > 8) throw new Error("Lineup cannot exceed 8 whiskies.");

  // Only delete whiskey-based rows; barrel slots are managed separately.
  const { error: delErr } = await supabase
    .from("event_lineup")
    .delete()
    .eq("event_id", eventId)
    .is("barrel_id", null);
  if (delErr) throw new Error(delErr.message);

  if (items.length === 0) return;

  const rows = items.map((item, index) => ({
    event_id: eventId,
    whiskey_id: item.whiskeyId,
    pour_order: index + 1,
    pairing_note: item.pairingNote.trim() || null,
  }));

  const { error } = await supabase.from("event_lineup").insert(rows);
  if (error) throw new Error(error.message);
}

export async function deleteEventLineupItem(id: string): Promise<void> {
  const { error } = await supabase
    .from("event_lineup")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function revealEventLineup(eventId: string): Promise<void> {
  const { error } = await supabase
    .from("events")
    .update({ revealed_at: new Date().toISOString() })
    .eq("id", eventId);
  if (error) throw new Error(error.message);
}
