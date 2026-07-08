import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { radii } from "../../lib/radii";
import { spacing } from "../../lib/spacing";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";
import { type VenueResult } from "../../lib/venueSearch";
import {
  getEventLineup,
  saveEventLineup,
  revealEventLineup,
  type LineupDraft,
  type LineupItem,
} from "../../lib/eventLineup";
import {
  addBarrelToLineup,
  getBarrelLineup,
  getMyDistilleryAccount,
  removeBarrelLineupSlot,
  type BarrelDraft,
  type BarrelLineupItem,
} from "../../lib/barrelApi";
import { WhiskeySearchModal } from "../../src/logTab/components/WhiskeySearchModal";
import { BarrelFormModal } from "../../src/events/components/BarrelFormModal";
import { CustomWhiskeyModal } from "../../src/events/components/CustomWhiskeyModal";
import { DistilleryBarrelPickerModal } from "../../src/events/components/DistilleryBarrelPickerModal";
import {
  DateField,
  FieldLabel,
  IosDateTimePickerModal,
  SectionCard,
  useEventDateTimePicker,
  VenuePicker,
} from "../../src/events/components/EventFormFields";
import { EventQRModal } from "../../components/EventQRModal";
import { getAttendeeCount } from "../../lib/eventAttendees";

type EventDetail = {
  id: string;
  name: string;
  description: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_blind: boolean;
  is_active: boolean;
  has_lineup: boolean;
  has_pairing: boolean;
  has_direct_from_barrel: boolean;
  pairing_notes: string | null;
  revealed_at: string | null;
  join_code: string | null;
  status: string;
  venue_id: string | null;
  venue_name_free: string | null;
  venue_city: string | null;
  venue_state: string | null;
  venues: {
    display_name: string;
    venue_type: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
  } | null;
};

const DETAILS_MULTILINE_ACCESSORY_ID = "host-event-details-multiline-done";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function RowDivider() {
  return <View style={{ height: 1, backgroundColor: colors.divider }} />;
}

function TypeBadge({ label }: { label: string }) {
  return (
    <View
      style={{
        backgroundColor: colors.accentSoft,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
      }}
    >
      <Text style={[type.labelCaps, { fontSize: 9, color: colors.accent }]}>
        {label}
      </Text>
    </View>
  );
}

function LineupReadCard({ item, index }: { item: LineupItem; index: number }) {
  return (
    <View
      style={{
        backgroundColor: colors.surfaceSunken,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.borderStrong,
        padding: spacing.md,
        gap: 6,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.sm }}>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[type.labelCaps, { color: colors.accent, fontSize: 9 }]}>
            Pour {index + 1}
          </Text>
          <Text
            style={[type.sectionHeader, { color: colors.textPrimary, fontSize: 15, lineHeight: 20 }]}
            numberOfLines={2}
          >
            {item.display_name}
          </Text>
          <View style={{ flexDirection: "row", gap: spacing.xs, flexWrap: "wrap", alignItems: "center" }}>
            {item.whiskey_type ? <TypeBadge label={item.whiskey_type} /> : null}
            {item.proof != null ? (
              <Text style={[type.caption, { color: colors.textMuted }]}>{item.proof} proof</Text>
            ) : null}
          </View>
        </View>
      </View>
      {item.pairing_note ? (
        <Text style={[type.caption, { color: colors.textSecondary, fontStyle: "italic" }]}>
          Pairing: {item.pairing_note}
        </Text>
      ) : null}
    </View>
  );
}

function BarrelReadCard({
  item,
  index,
  onRemove,
}: {
  item: BarrelLineupItem;
  index: number;
  onRemove: () => void;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.surfaceSunken,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.borderStrong,
        padding: spacing.md,
        gap: 6,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.sm }}>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[type.labelCaps, { color: colors.accent, fontSize: 9 }]}>
            Pour {index + 1} · Direct from Barrel
          </Text>
          <Text
            style={[type.sectionHeader, { color: colors.textPrimary, fontSize: 15, lineHeight: 20 }]}
            numberOfLines={2}
          >
            {item.distilleryName} — Barrel #{item.barrelNumber}
          </Text>
          <View style={{ flexDirection: "row", gap: spacing.xs, flexWrap: "wrap", alignItems: "center" }}>
            {item.whiskeyTypeName ? <TypeBadge label={item.whiskeyTypeName} /> : null}
            {item.proof != null ? (
              <Text style={[type.caption, { color: colors.textMuted }]}>{item.proof} proof</Text>
            ) : null}
          </View>
        </View>
        <Pressable
          onPress={onRemove}
          style={({ pressed }) => ({ padding: 6, opacity: pressed ? 0.7 : 1 })}
        >
          <Ionicons name="close" size={16} color={colors.danger} />
        </Pressable>
      </View>
    </View>
  );
}

function LineupEditCard({
  item,
  index,
  total,
  showPairingNote,
  onRemove,
  onMoveUp,
  onMoveDown,
  onPairingNoteChange,
}: {
  item: LineupDraft;
  index: number;
  total: number;
  showPairingNote: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onPairingNoteChange: (note: string) => void;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.surfaceSunken,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.borderStrong,
        padding: spacing.md,
        gap: spacing.sm,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.sm }}>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[type.labelCaps, { color: colors.accent, fontSize: 9 }]}>
            Pour {index + 1}
          </Text>
          <Text
            style={[type.sectionHeader, { color: colors.textPrimary, fontSize: 15, lineHeight: 20 }]}
            numberOfLines={2}
          >
            {item.displayName}
          </Text>
          <View style={{ flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" }}>
            {item.whiskeyType ? <TypeBadge label={item.whiskeyType} /> : null}
            {item.proof != null ? (
              <Text style={[type.caption, { color: colors.textMuted }]}>{item.proof} proof</Text>
            ) : null}
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Pressable
            onPress={onMoveUp}
            disabled={index === 0}
            style={({ pressed }) => ({ padding: 6, opacity: index === 0 ? 0.3 : pressed ? 0.7 : 1 })}
          >
            <Ionicons name="chevron-up" size={16} color={colors.textMuted} />
          </Pressable>
          <Pressable
            onPress={onMoveDown}
            disabled={index === total - 1}
            style={({ pressed }) => ({ padding: 6, opacity: index === total - 1 ? 0.3 : pressed ? 0.7 : 1 })}
          >
            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
          </Pressable>
          <Pressable
            onPress={onRemove}
            style={({ pressed }) => ({ padding: 6, opacity: pressed ? 0.7 : 1 })}
          >
            <Ionicons name="close" size={16} color={colors.danger} />
          </Pressable>
        </View>
      </View>
      {showPairingNote ? (
        <TextInput
          value={item.pairingNote}
          onChangeText={onPairingNoteChange}
          placeholder={`Pour ${index + 1} pairing…`}
          placeholderTextColor={colors.textMuted}
          style={[
            type.body,
            {
              color: colors.textPrimary,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.divider,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              fontSize: 14,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

export default function HostEventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [lineup, setLineup] = useState<LineupItem[]>([]);
  const [barrelLineup, setBarrelLineup] = useState<BarrelLineupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [barrelFormOpen, setBarrelFormOpen] = useState(false);
  const [distilleryPickerOpen, setDistilleryPickerOpen] = useState(false);
  const [myDistilleryAccount, setMyDistilleryAccount] = useState<{
    distillery_id: string;
    distillery_name: string;
  } | null>(null);

  // Edit lineup modal state
  const [editVisible, setEditVisible] = useState(false);
  const [editItems, setEditItems] = useState<LineupDraft[]>([]);
  const [editHasPairing, setEditHasPairing] = useState(false);
  const [editSearchVisible, setEditSearchVisible] = useState(false);
  const [customWhiskeyVisible, setCustomWhiskeyVisible] = useState(false);
  const [customWhiskeyInitialName, setCustomWhiskeyInitialName] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Reveal state
  const [revealing, setRevealing] = useState(false);

  // End / delete state
  const [ending, setEnding] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // QR modal + attendee count
  const [qrVisible, setQrVisible] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState<number | null>(null);

  // Edit event details modal state
  const [detailsEditVisible, setDetailsEditVisible] = useState(false);
  const [detailsName, setDetailsName] = useState("");
  const [detailsDescription, setDetailsDescription] = useState("");
  const [detailsStartsAt, setDetailsStartsAt] = useState<Date | null>(null);
  const [detailsEndsAt, setDetailsEndsAt] = useState<Date | null>(null);
  const [detailsSelectedVenue, setDetailsSelectedVenue] = useState<VenueResult | null>(null);
  const [detailsVenueManual, setDetailsVenueManual] = useState(false);
  const [detailsVenueName, setDetailsVenueName] = useState("");
  const [detailsVenueCity, setDetailsVenueCity] = useState("");
  const [detailsVenueState, setDetailsVenueState] = useState("");
  const [detailsPairingNotes, setDetailsPairingNotes] = useState("");
  const [detailsSaving, setDetailsSaving] = useState(false);

  const detailsDateTimePicker = useEventDateTimePicker({
    startsAt: detailsStartsAt,
    endsAt: detailsEndsAt,
    onChangeStartsAt: setDetailsStartsAt,
    onChangeEndsAt: setDetailsEndsAt,
  });

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const { data, error: eventErr } = await supabase
        .from("events")
        .select(
          "id, name, description, starts_at, ends_at, is_blind, is_active, has_lineup, has_pairing, has_direct_from_barrel, pairing_notes, revealed_at, join_code, status, venue_id, venue_name_free, venue_city, venue_state, venues(display_name, venue_type, address, city, state)"
        )
        .eq("id", id)
        .maybeSingle();

      if (eventErr) throw eventErr;
      if (!data) { setError("Event not found."); return; }

      const ev = data as unknown as EventDetail;
      setEvent(ev);

      if (ev.has_lineup) {
        if (ev.has_direct_from_barrel) {
          const barrels = await getBarrelLineup(id);
          setBarrelLineup(barrels);
        } else {
          const items = await getEventLineup(id);
          setLineup(items);
        }
      }
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    getMyDistilleryAccount()
      .then((accounts) => setMyDistilleryAccount(accounts[0] ?? null))
      .catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      getAttendeeCount(id).then(setAttendeeCount).catch(() => {});
    }, [id])
  );

  function openEditLineup() {
    if (!event) return;
    setEditItems(
      lineup.map((item) => ({
        whiskeyId: item.whiskey_id,
        displayName: item.display_name,
        whiskeyType: item.whiskey_type,
        proof: item.proof,
        pairingNote: item.pairing_note ?? "",
      }))
    );
    setEditHasPairing(event.has_pairing);
    setEditError("");
    setEditVisible(true);
  }

  async function saveEditLineup() {
    if (!id) return;
    setEditSaving(true);
    setEditError("");
    try {
      await saveEventLineup(id, editItems);
      await supabase
        .from("events")
        .update({ has_lineup: true, has_pairing: editHasPairing })
        .eq("id", id);
      setEditVisible(false);
      load();
    } catch (e: any) {
      setEditError(String(e?.message ?? e));
    } finally {
      setEditSaving(false);
    }
  }

  function openEditDetails() {
    if (!event) return;
    setDetailsName(event.name);
    setDetailsDescription(event.description ?? "");
    setDetailsStartsAt(event.starts_at ? new Date(event.starts_at) : null);
    setDetailsEndsAt(event.ends_at ? new Date(event.ends_at) : null);

    if (event.venue_id && event.venues) {
      setDetailsSelectedVenue({
        id: event.venue_id,
        display_name: event.venues.display_name,
        venue_type: event.venues.venue_type,
        address: event.venues.address,
        city: event.venues.city,
        state: event.venues.state,
        country: null,
        website: null,
        phone: null,
        description: null,
        logo_url: null,
      });
      setDetailsVenueManual(false);
      setDetailsVenueName("");
      setDetailsVenueCity("");
      setDetailsVenueState("");
    } else if (event.venue_name_free) {
      setDetailsSelectedVenue(null);
      setDetailsVenueManual(true);
      setDetailsVenueName(event.venue_name_free);
      setDetailsVenueCity(event.venue_city ?? "");
      setDetailsVenueState(event.venue_state ?? "");
    } else {
      setDetailsSelectedVenue(null);
      setDetailsVenueManual(false);
      setDetailsVenueName("");
      setDetailsVenueCity("");
      setDetailsVenueState("");
    }

    setDetailsPairingNotes(event.pairing_notes ?? "");
    setDetailsEditVisible(true);
  }

  async function saveEventDetails() {
    if (!id) return;
    if (!detailsStartsAt) {
      Alert.alert("Error", "Start date is required.");
      return;
    }
    setDetailsSaving(true);
    try {
      const venuePayload = detailsSelectedVenue
        ? {
            p_venue_id: detailsSelectedVenue.id,
            p_venue_name_free: null,
            p_venue_city: null,
            p_venue_state: null,
          }
        : detailsVenueManual && detailsVenueName.trim()
        ? {
            p_venue_id: null,
            p_venue_name_free: detailsVenueName.trim(),
            p_venue_city: detailsVenueCity.trim() || null,
            p_venue_state: detailsVenueState.trim() || null,
          }
        : {
            p_venue_id: null,
            p_venue_name_free: null,
            p_venue_city: null,
            p_venue_state: null,
          };

      const { error: rpcErr } = await supabase.rpc("update_event", {
        p_event_id: id,
        p_name: detailsName.trim(),
        p_description: detailsDescription.trim() || null,
        p_starts_at: detailsStartsAt.toISOString(),
        p_ends_at: detailsEndsAt?.toISOString() ?? null,
        p_pairing_notes: detailsPairingNotes.trim() || null,
        ...venuePayload,
      });
      if (rpcErr) throw rpcErr;

      setDetailsEditVisible(false);
      load();
    } catch (e: any) {
      Alert.alert("Error", String(e?.message ?? e));
    } finally {
      setDetailsSaving(false);
    }
  }

  async function handleReveal() {
    if (!id) return;
    Alert.alert("Reveal Lineup?", "This will show all whiskey identities to attendees. This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reveal",
        onPress: async () => {
          setRevealing(true);
          try {
            await revealEventLineup(id);
            load();
          } catch (e: any) {
            Alert.alert("Error", String(e?.message ?? e));
          } finally {
            setRevealing(false);
          }
        },
      },
    ]);
  }

  async function handleEndEvent() {
    if (!id) return;
    Alert.alert(
      "End this event?",
      "Attendees will no longer be able to log tastings.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Event",
          onPress: async () => {
            setEnding(true);
            try {
              const { error: rpcErr } = await supabase.rpc("end_event", { p_event_id: id });
              if (rpcErr) throw rpcErr;
              setEvent((prev) => (prev ? { ...prev, status: "ended" } : prev));
            } catch (e: any) {
              Alert.alert("Error", String(e?.message ?? e));
            } finally {
              setEnding(false);
            }
          },
        },
      ]
    );
  }

  async function handleDeleteEvent() {
    if (!id) return;
    Alert.alert(
      "Delete this event?",
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              const { error: rpcErr } = await supabase.rpc("delete_event", { p_event_id: id });
              if (rpcErr) throw rpcErr;
              router.back();
            } catch (e: any) {
              const msg = String(e?.message ?? e);
              if (msg.toLowerCase().includes("tasting")) {
                Alert.alert("Cannot Delete", "This event has tasting data and cannot be deleted.");
              } else {
                Alert.alert("Error", msg);
              }
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  function handleEditSelect(whiskeyId: string, whiskeyName: string) {
    if (editItems.length >= 8) return;
    if (editItems.some((i) => i.whiskeyId === whiskeyId)) return;
    setEditItems((prev) => [
      ...prev,
      { whiskeyId, displayName: whiskeyName, whiskeyType: null, proof: null, pairingNote: "" },
    ]);
    setEditSearchVisible(false);
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", gap: spacing.sm }}>
        <ActivityIndicator color={colors.accent} />
        <Text style={[type.body, { color: colors.textSecondary }]}>Loading…</Text>
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.xl, gap: spacing.md }}>
        <Text style={[type.screenTitle, { color: colors.textPrimary }]}>Event</Text>
        <Text style={[type.body, { color: colors.danger }]}>{error || "Event not found."}</Text>
        <Pressable onPress={() => router.back()} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <Text style={[type.button, { color: colors.accent }]}>← Back</Text>
        </Pressable>
      </View>
    );
  }

  const isRevealed = !!event.revealed_at;
  const isEnded = !event.is_active || (event.ends_at != null && new Date(event.ends_at) < new Date());

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}
      >
        {/* Header */}
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm }}>
            <Text style={[type.screenTitle, { color: colors.textPrimary, flex: 1 }]}>{event.name}</Text>
            <Pressable
              onPress={openEditDetails}
              style={({ pressed }) => ({
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.borderStrong,
                backgroundColor: pressed ? colors.accentSoft : "transparent",
              })}
            >
              <Text style={[type.button, { color: colors.accent, fontSize: 13 }]}>Edit Details</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" }}>
            {event.is_blind ? (
              <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.accentFaint }}>
                <Text style={[type.labelCaps, { color: colors.accent, fontSize: 9 }]}>BLIND</Text>
              </View>
            ) : null}
            {event.join_code ? (
              <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1, borderColor: colors.divider }}>
                <Text style={[type.labelCaps, { color: colors.textMuted, fontSize: 9 }]}>CODE: {event.join_code}</Text>
              </View>
            ) : null}
            {isEnded ? (
              <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1, borderColor: "rgba(244,241,234,0.12)", backgroundColor: "rgba(244,241,234,0.06)" }}>
                <Text style={[type.labelCaps, { color: colors.textMuted, fontSize: 9 }]}>ENDED</Text>
              </View>
            ) : null}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <Text style={[type.caption, { color: colors.textSecondary }]}>{fmtDate(event.starts_at)}</Text>
            {attendeeCount !== null ? (
              <Text style={[type.caption, { color: colors.textMuted }]}>
                {attendeeCount} {attendeeCount === 1 ? "attendee" : "attendees"} joined
              </Text>
            ) : null}
          </View>
        </View>

        {/* Share Event */}
        {event.join_code ? (
          <Pressable
            onPress={() => setQrVisible(true)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.sm,
              paddingVertical: spacing.md,
              borderRadius: 999,
              backgroundColor: colors.accent,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Ionicons name="qr-code-outline" size={18} color={colors.background} />
            <Text style={[type.button, { color: colors.background }]}>Share Event</Text>
          </Pressable>
        ) : null}

        {/* Lineup section */}
        <SectionCard>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={[type.sectionHeader, { color: colors.textPrimary }]}>Lineup</Text>
            <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
              {event.is_blind && isRevealed ? (
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1, borderColor: colors.success + "55", backgroundColor: colors.success + "18" }}>
                  <Text style={[type.labelCaps, { color: colors.success, fontSize: 9 }]}>REVEALED</Text>
                </View>
              ) : null}
              {!isEnded && !event.has_direct_from_barrel ? (
                <Pressable
                  onPress={openEditLineup}
                  style={({ pressed }) => ({
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: colors.borderStrong,
                    backgroundColor: pressed ? colors.accentSoft : "transparent",
                  })}
                >
                  <Text style={[type.button, { color: colors.accent, fontSize: 13 }]}>Edit Lineup</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          {event.is_blind && !isRevealed && !isEnded ? (
            <>
              <RowDivider />
              <Pressable
                onPress={handleReveal}
                disabled={revealing}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: spacing.sm,
                  paddingVertical: spacing.sm,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: colors.accent,
                  backgroundColor: pressed ? colors.accentSoft : "transparent",
                  opacity: revealing ? 0.6 : 1,
                })}
              >
                {revealing ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <Ionicons name="eye-outline" size={16} color={colors.accent} />
                )}
                <Text style={[type.button, { color: colors.accent }]}>Reveal Lineup</Text>
              </Pressable>
            </>
          ) : null}

          {event.has_direct_from_barrel ? (
            <>
              {barrelLineup.length > 0 ? (
                <>
                  <RowDivider />
                  <View style={{ gap: spacing.sm }}>
                    {barrelLineup.map((b, index) => (
                      <BarrelReadCard
                        key={b.lineupId}
                        item={b}
                        index={index}
                        onRemove={async () => {
                          try {
                            await removeBarrelLineupSlot(b.lineupId);
                            setBarrelLineup((prev) => prev.filter((x) => x.lineupId !== b.lineupId));
                          } catch (e: any) {
                            Alert.alert("Error", e?.message ?? "Failed to remove barrel.");
                          }
                        }}
                      />
                    ))}
                  </View>
                </>
              ) : (
                <Text style={[type.caption, { color: colors.textSecondary }]}>
                  No barrels added yet. Tap Add Barrel to add one.
                </Text>
              )}
              {!isEnded && barrelLineup.length < 8 ? (
                <>
                  <RowDivider />
                  {myDistilleryAccount ? (
                    <View style={{ gap: spacing.xs }}>
                      <Pressable
                        onPress={() => setDistilleryPickerOpen(true)}
                        style={({ pressed }) => ({
                          flexDirection: "row",
                          alignItems: "center",
                          gap: spacing.sm,
                          paddingVertical: spacing.sm,
                          opacity: pressed ? 0.75 : 1,
                        })}
                      >
                        <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
                        <Text style={[type.body, { color: colors.accent, fontSize: 14 }]}>
                          Add Barrel ({barrelLineup.length}/8)
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setBarrelFormOpen(true)}
                        style={({ pressed }) => ({
                          flexDirection: "row",
                          alignItems: "center",
                          gap: spacing.sm,
                          paddingVertical: 4,
                          opacity: pressed ? 0.75 : 1,
                        })}
                      >
                        <Ionicons name="create-outline" size={14} color={colors.textMuted} />
                        <Text style={[type.caption, { color: colors.textMuted }]}>
                          Add custom barrel
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => setBarrelFormOpen(true)}
                      style={({ pressed }) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.sm,
                        paddingVertical: spacing.sm,
                        opacity: pressed ? 0.75 : 1,
                      })}
                    >
                      <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
                      <Text style={[type.body, { color: colors.accent, fontSize: 14 }]}>
                        Add Barrel ({barrelLineup.length}/8)
                      </Text>
                    </Pressable>
                  )}
                </>
              ) : null}
            </>
          ) : event.has_lineup && lineup.length > 0 ? (
            <>
              <RowDivider />
              <View style={{ gap: spacing.sm }}>
                {lineup.map((item, index) => (
                  <LineupReadCard key={item.id} item={item} index={index} />
                ))}
              </View>
            </>
          ) : event.has_lineup && lineup.length === 0 ? (
            <Text style={[type.caption, { color: colors.textSecondary }]}>
              No whiskies added yet. Tap Edit Lineup to add them.
            </Text>
          ) : (
            <Text style={[type.caption, { color: colors.textSecondary }]}>
              No lineup set. Tap Edit Lineup to add whiskies.
            </Text>
          )}
        </SectionCard>

        {/* Pairing notes (no-lineup case) */}
        {event.has_pairing && !event.has_lineup && event.pairing_notes ? (
          <SectionCard>
            <Text style={[type.sectionHeader, { color: colors.textPrimary }]}>Pairing</Text>
            <RowDivider />
            <Text style={[type.body, { color: colors.textSecondary, fontSize: 14 }]}>
              {event.pairing_notes}
            </Text>
          </SectionCard>
        ) : null}

        {/* Venue */}
        {(event.venues || event.venue_name_free) ? (
          <SectionCard>
            <Text style={[type.sectionHeader, { color: colors.textPrimary }]}>Venue</Text>
            <RowDivider />
            {event.venues ? (
              <View style={{ gap: spacing.xs }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <Text style={[type.body, { color: colors.textPrimary, flex: 1, fontSize: 15 }]}>
                    {event.venues.display_name}
                  </Text>
                  {event.venues.venue_type ? <TypeBadge label={event.venues.venue_type} /> : null}
                </View>
                {event.venues.address ? (
                  <Text style={[type.caption, { color: colors.textSecondary }]}>{event.venues.address}</Text>
                ) : null}
                {(event.venues.city || event.venues.state) ? (
                  <Text style={[type.caption, { color: colors.textSecondary }]}>
                    {[event.venues.city, event.venues.state].filter(Boolean).join(", ")}
                  </Text>
                ) : null}
              </View>
            ) : (
              <View style={{ gap: spacing.xs }}>
                <Text style={[type.body, { color: colors.textPrimary, fontSize: 15 }]}>
                  {event.venue_name_free}
                </Text>
                {(event.venue_city || event.venue_state) ? (
                  <Text style={[type.caption, { color: colors.textSecondary }]}>
                    {[event.venue_city, event.venue_state].filter(Boolean).join(", ")}
                  </Text>
                ) : null}
              </View>
            )}
          </SectionCard>
        ) : null}

        {/* View attendee page */}
        <Pressable
          onPress={() => router.push(`/event/${id}` as any)}
          style={({ pressed }) => ({
            paddingVertical: spacing.md,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.borderStrong,
            alignItems: "center",
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={[type.button, { color: colors.textSecondary }]}>View Attendee Page →</Text>
        </Pressable>

        {/* End Event */}
        {!isEnded ? (
          <Pressable
            onPress={handleEndEvent}
            disabled={ending}
            style={({ pressed }) => ({
              paddingVertical: spacing.md,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.accent,
              alignItems: "center",
              opacity: ending ? 0.6 : pressed ? 0.85 : 1,
            })}
          >
            {ending ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Text style={[type.button, { color: colors.accent }]}>End Event</Text>
            )}
          </Pressable>
        ) : null}

        {/* Delete Event */}
        <Pressable
          onPress={handleDeleteEvent}
          disabled={deleting}
          style={({ pressed }) => ({
            paddingVertical: spacing.md,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.danger,
            alignItems: "center",
            opacity: deleting ? 0.6 : pressed ? 0.85 : 1,
          })}
        >
          {deleting ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <Text style={[type.button, { color: colors.danger }]}>Delete Event</Text>
          )}
        </Pressable>
      </ScrollView>

      {/* QR Modal */}
      {event.join_code ? (
        <EventQRModal
          visible={qrVisible}
          joinCode={event.join_code}
          onClose={() => setQrVisible(false)}
        />
      ) : null}

      {/* Edit Lineup Modal */}
      <Modal visible={editVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditVisible(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: colors.background }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Modal header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              paddingTop: spacing.xl,
              borderBottomWidth: 1,
              borderBottomColor: colors.divider,
            }}
          >
            <Pressable onPress={() => setEditVisible(false)}>
              <Text style={[type.button, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Text style={[type.sectionHeader, { color: colors.textPrimary }]}>Edit Lineup</Text>
            <Pressable onPress={saveEditLineup} disabled={editSaving}>
              {editSaving ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Text style={[type.button, { color: colors.accent }]}>Save</Text>
              )}
            </Pressable>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
            keyboardShouldPersistTaps="handled"
          >
            {editItems.length > 0 ? (
              <View style={{ gap: spacing.sm }}>
                {editItems.map((item, index) => (
                  <LineupEditCard
                    key={item.whiskeyId}
                    item={item}
                    index={index}
                    total={editItems.length}
                    showPairingNote={editHasPairing}
                    onRemove={() => setEditItems((prev) => prev.filter((_, i) => i !== index))}
                    onMoveUp={() =>
                      setEditItems((prev) => {
                        const next = [...prev];
                        if (index > 0) [next[index], next[index - 1]] = [next[index - 1], next[index]];
                        return next;
                      })
                    }
                    onMoveDown={() =>
                      setEditItems((prev) => {
                        const next = [...prev];
                        if (index < next.length - 1) [next[index], next[index + 1]] = [next[index + 1], next[index]];
                        return next;
                      })
                    }
                    onPairingNoteChange={(note) =>
                      setEditItems((prev) =>
                        prev.map((it, i) => (i === index ? { ...it, pairingNote: note } : it))
                      )
                    }
                  />
                ))}
              </View>
            ) : null}

            {editItems.length < 8 ? (
              <Pressable
                onPress={() => setEditSearchVisible(true)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                  paddingVertical: spacing.sm,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
                <Text style={[type.body, { color: colors.accent, fontSize: 15 }]}>
                  Add Whiskey ({editItems.length}/8)
                </Text>
              </Pressable>
            ) : null}

            <View style={{ height: 1, backgroundColor: colors.divider }} />

            {/* Pairing toggle */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[type.body, { color: colors.textPrimary }]}>Pairing notes</Text>
                <Text style={[type.caption, { color: colors.textSecondary }]}>
                  Add pairing notes to each lineup card
                </Text>
              </View>
              <Pressable
                onPress={() => setEditHasPairing((v) => !v)}
                style={({ pressed }) => ({
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: editHasPairing ? colors.accent : colors.divider,
                  backgroundColor: editHasPairing ? colors.accentSoft : "transparent",
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text style={[type.button, { color: editHasPairing ? colors.accent : colors.textMuted, fontSize: 13 }]}>
                  {editHasPairing ? "On" : "Off"}
                </Text>
              </Pressable>
            </View>

            {editError ? (
              <Text style={[type.caption, { color: colors.danger }]}>{editError}</Text>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>

        <WhiskeySearchModal
          visible={editSearchVisible}
          onClose={() => setEditSearchVisible(false)}
          onSelect={handleEditSelect}
          onCustomEntry={(name) => {
            setEditSearchVisible(false);
            setCustomWhiskeyInitialName(name);
            setCustomWhiskeyVisible(true);
          }}
        />
      </Modal>

      {/* Edit Event Details Modal */}
      <Modal
        visible={detailsEditVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailsEditVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: colors.background }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Modal header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              paddingTop: spacing.xl,
              borderBottomWidth: 1,
              borderBottomColor: colors.divider,
            }}
          >
            <Pressable onPress={() => setDetailsEditVisible(false)}>
              <Text style={[type.button, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Text style={[type.sectionHeader, { color: colors.textPrimary }]}>Edit Event Details</Text>
            <Pressable onPress={saveEventDetails} disabled={detailsSaving}>
              {detailsSaving ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Text style={[type.button, { color: colors.accent }]}>Save</Text>
              )}
            </Pressable>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ gap: spacing.xs }}>
              <FieldLabel label="Event Name" />
              <TextInput
                value={detailsName}
                onChangeText={setDetailsName}
                placeholder="Event name"
                placeholderTextColor={colors.textMuted}
                style={[
                  type.body,
                  {
                    color: colors.textPrimary,
                    backgroundColor: colors.surfaceSunken,
                    borderWidth: 1,
                    borderColor: colors.borderStrong,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                  },
                ]}
              />
            </View>

            <View style={{ gap: spacing.xs }}>
              <FieldLabel label="Description (optional)" />
              <TextInput
                value={detailsDescription}
                onChangeText={setDetailsDescription}
                placeholder="Tell attendees what to expect..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                inputAccessoryViewID={
                  Platform.OS === "ios" ? DETAILS_MULTILINE_ACCESSORY_ID : undefined
                }
                style={[
                  type.body,
                  {
                    color: colors.textPrimary,
                    backgroundColor: colors.surfaceSunken,
                    borderWidth: 1,
                    borderColor: colors.borderStrong,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    minHeight: 96,
                  },
                ]}
              />
            </View>

            <View style={{ gap: spacing.xs }}>
              <DateField
                label="Start Date & Time"
                value={detailsStartsAt}
                placeholder="Select start date and time"
                onPress={() => detailsDateTimePicker.openPicker("start")}
              />
            </View>

            <View style={{ gap: spacing.xs }}>
              <DateField
                label="End Date & Time (optional)"
                value={detailsEndsAt}
                placeholder="Select end date and time"
                onPress={() => detailsDateTimePicker.openPicker("end")}
              />
            </View>

            <VenuePicker
              key={detailsEditVisible ? "details-venue-open" : "details-venue-closed"}
              selectedVenue={detailsSelectedVenue}
              onSelectVenue={setDetailsSelectedVenue}
              venueManual={detailsVenueManual}
              onVenueManualChange={setDetailsVenueManual}
              venueName={detailsVenueName}
              onVenueNameChange={setDetailsVenueName}
              venueCity={detailsVenueCity}
              onVenueCityChange={setDetailsVenueCity}
              venueState={detailsVenueState}
              onVenueStateChange={setDetailsVenueState}
            />

            <View style={{ gap: spacing.xs }}>
              <FieldLabel label="Pairing Notes (optional)" />
              <TextInput
                value={detailsPairingNotes}
                onChangeText={setDetailsPairingNotes}
                placeholder="e.g. Charcuterie board, dark chocolate, Fuente cigars…"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                inputAccessoryViewID={
                  Platform.OS === "ios" ? DETAILS_MULTILINE_ACCESSORY_ID : undefined
                }
                style={[
                  type.body,
                  {
                    color: colors.textPrimary,
                    backgroundColor: colors.surfaceSunken,
                    borderWidth: 1,
                    borderColor: colors.borderStrong,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    minHeight: 80,
                    fontSize: 14,
                  },
                ]}
              />
            </View>
          </ScrollView>

          {/* iOS keyboard "Done" toolbar for multiline fields */}
          {Platform.OS === "ios" ? (
            <InputAccessoryView nativeID={DETAILS_MULTILINE_ACCESSORY_ID}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  backgroundColor: colors.surface,
                  borderTopWidth: 1,
                  borderTopColor: colors.divider,
                }}
              >
                <Pressable
                  onPress={() => Keyboard.dismiss()}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Text style={[type.button, { color: colors.accent }]}>Done</Text>
                </Pressable>
              </View>
            </InputAccessoryView>
          ) : null}
        </KeyboardAvoidingView>

        <IosDateTimePickerModal
          visible={detailsDateTimePicker.activePicker !== null}
          value={detailsDateTimePicker.iosPickerValue}
          onChange={detailsDateTimePicker.setIosPickerValue}
          onCancel={detailsDateTimePicker.closePicker}
          onDone={detailsDateTimePicker.commitIosPicker}
        />
      </Modal>

      <CustomWhiskeyModal
        visible={customWhiskeyVisible}
        initialName={customWhiskeyInitialName}
        onClose={() => setCustomWhiskeyVisible(false)}
        onCreated={(whiskeyId, displayName) => {
          if (editItems.length < 8 && !editItems.some((i) => i.whiskeyId === whiskeyId)) {
            setEditItems((prev) => [
              ...prev,
              { whiskeyId, displayName, whiskeyType: null, proof: null, pairingNote: "" },
            ]);
          }
          setCustomWhiskeyVisible(false);
        }}
      />

      <BarrelFormModal
        visible={barrelFormOpen}
        onClose={() => setBarrelFormOpen(false)}
        onSubmit={async (draft: BarrelDraft) => {
          if (!id) return;
          const nextOrder = barrelLineup.length + 1;
          const item = await addBarrelToLineup(id, draft, nextOrder);
          setBarrelLineup((prev) => [...prev, item]);
          setBarrelFormOpen(false);
        }}
      />

      {myDistilleryAccount ? (
        <DistilleryBarrelPickerModal
          visible={distilleryPickerOpen}
          onClose={() => setDistilleryPickerOpen(false)}
          distilleryId={myDistilleryAccount.distillery_id}
          distilleryName={myDistilleryAccount.distillery_name}
          onSelect={async (draft: BarrelDraft) => {
            if (!id) return;
            const nextOrder = barrelLineup.length + 1;
            const item = await addBarrelToLineup(id, draft, nextOrder);
            setBarrelLineup((prev) => [...prev, item]);
            setDistilleryPickerOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
