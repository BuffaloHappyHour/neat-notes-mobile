// lib/analytics.ts
import { supabase } from "./supabase";

type Json =
  | string
  | number
  | boolean
  | null
  | { [k: string]: Json }
  | Json[];

const DEBUG_ANALYTICS = true;

async function insertEvent(input: {
  event_name: string;
  user_id?: string | null;
  screen?: string | null;
  whiskey_id?: string | null;
  item_id?: string | null;
  properties?: Record<string, Json>;
}) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;

    const payload = {
      event_name: input.event_name,
      user_id: user?.id ?? null,
      screen: input.screen ?? null,
      whiskey_id: input.whiskey_id ?? null,
      item_id: input.item_id ?? null,
      properties: input.properties ?? {},
    };

    const { error } = await supabase
      .from("analytics_events")
      .insert(payload);

    if (error) {
      console.warn("[analytics] insert failed:", error.message);
      return;
    }

    if (DEBUG_ANALYTICS) {
      console.log("[analytics] inserted:", input.event_name);
    }
  } catch (e: any) {
    console.warn("[analytics] exception:", String(e?.message ?? e));
  }
}

/* ---------------- Tasting Events ---------------- */

export function trackTastingStart(input: {
  screen: string;
  whiskey_id: string | null;
  existing: boolean;
  source_type: string;
}) {
  return insertEvent({
    event_name: "tasting_start",
    screen: input.screen,
    whiskey_id: input.whiskey_id,
    properties: {
      existing: input.existing,
      source_type: input.source_type,
    },
  });
}

export function trackTastingSaved(input: {
  screen: string;
  whiskey_id: string | null;
  existing: boolean;
  rating: number;
  has_notes: boolean;
  notes_len: number;
  has_flavor_tags: boolean;
  source_type: string;
}) {
  return insertEvent({
    event_name: input.existing
      ? "tasting_edit_saved"
      : "tasting_saved",
    screen: input.screen,
    whiskey_id: input.whiskey_id,
    properties: {
      rating: input.rating,
      has_notes: input.has_notes,
      notes_len: input.notes_len,
      has_flavor_tags: input.has_flavor_tags,
      source_type: input.source_type,
    },
  });
}

export function trackTastingSaveFailed(input: {
  screen: string;
  whiskey_id: string | null;
  existing: boolean;
  message: string;
  is_offline: boolean;
}) {
  return insertEvent({
    event_name: "tasting_save_failed",
    screen: input.screen,
    whiskey_id: input.whiskey_id,
    properties: {
      existing: input.existing,
      message: String(input.message ?? "").slice(0, 140),
      is_offline: input.is_offline,
    },
  });
}