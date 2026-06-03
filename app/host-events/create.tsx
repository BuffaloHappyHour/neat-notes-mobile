import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { useRoles } from "../../hooks/useRoles";
import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";
import { saveEventLineup, type LineupDraft } from "../../lib/eventLineup";
import { searchVenues, type VenueResult } from "../../lib/venueSearch";
import { WhiskeySearchModal } from "../../src/logTab/components/WhiskeySearchModal";

const EVENT_TYPES = [
  "Tasting Class",
  "Club Night",
  "Private Event",
  "Corporate",
  "Other",
];

function fmtDateTime(d: Date): string {
  return (
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.borderStrong,
        ...shadows.card,
        overflow: "hidden",
        padding: spacing.lg,
        gap: spacing.md,
      }}
    >
      {children}
    </View>
  );
}

function FieldLabel({ label }: { label: string }) {
  return (
    <Text style={[type.labelCaps, { color: colors.textSecondary }]}>
      {label}
    </Text>
  );
}

function RowDivider() {
  return <View style={{ height: 1, backgroundColor: colors.divider }} />;
}

function ToggleRow({
  label,
  subtitle,
  value,
  onChange,
}: {
  label: string;
  subtitle: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.body, { color: colors.textPrimary }]}>{label}</Text>
        <Text style={[type.caption, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.divider, true: colors.accent }}
        thumbColor={colors.textPrimary}
      />
    </View>
  );
}

function DateField({
  label,
  value,
  placeholder,
  onPress,
}: {
  label: string;
  value: Date | null;
  placeholder: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.surfaceSunken,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.borderStrong,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        gap: 4,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <FieldLabel label={label} />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={[
            type.body,
            { color: value ? colors.textPrimary : colors.textMuted },
          ]}
        >
          {value ? fmtDateTime(value) : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

function LineupCard({
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
            {item.whiskeyType ? (
              <View
                style={{
                  backgroundColor: colors.accentSoft,
                  borderRadius: radii.sm ?? radii.md,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                }}
              >
                <Text style={[type.labelCaps, { fontSize: 9, color: colors.accent }]}>
                  {item.whiskeyType}
                </Text>
              </View>
            ) : null}
            {item.proof != null ? (
              <Text style={[type.caption, { color: colors.textMuted }]}>{item.proof} proof</Text>
            ) : null}
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Pressable
            onPress={onMoveUp}
            disabled={index === 0}
            style={({ pressed }) => ({
              padding: 6,
              opacity: index === 0 ? 0.3 : pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="chevron-up" size={16} color={colors.textMuted} />
          </Pressable>
          <Pressable
            onPress={onMoveDown}
            disabled={index === total - 1}
            style={({ pressed }) => ({
              padding: 6,
              opacity: index === total - 1 ? 0.3 : pressed ? 0.7 : 1,
            })}
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

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function CreateEventScreen() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1
  const [name, setName] = useState("");
  const [checkinCode, setCheckinCode] = useState("");
  const [eventType, setEventType] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState<Date | null>(null);
  const [endsAt, setEndsAt] = useState<Date | null>(null);

  // Step 2
  const [description, setDescription] = useState("");
  const [isBlind, setIsBlind] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  // Step 3
  const [hasLineup, setHasLineup] = useState(false);
  const [lineupItems, setLineupItems] = useState<LineupDraft[]>([]);
  const [hasPairing, setHasPairing] = useState(false);
  const [pairingNotes, setPairingNotes] = useState("");
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Venue
  const [venueQuery, setVenueQuery] = useState("");
  const [venueResults, setVenueResults] = useState<VenueResult[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<VenueResult | null>(null);
  const [venueManual, setVenueManual] = useState(false);
  const [venueName, setVenueName] = useState("");
  const [venueCity, setVenueCity] = useState("");
  const [venueState, setVenueState] = useState("");

  // Form meta
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // iOS date picker
  const [activePicker, setActivePicker] = useState<"start" | "end" | null>(null);
  const [iosPickerValue, setIosPickerValue] = useState(new Date());

  // Tier cap
  const { isHostPro, isHostStarter } = useRoles();
  const tierCap = isHostPro ? 50 : isHostStarter ? 25 : 10;
  const tierLabel = isHostPro ? "Host Pro" : isHostStarter ? "Host Starter" : "Free";
  const showUpgradeCaption = !isHostPro;

  useEffect(() => {
    if (selectedVenue || venueManual || venueQuery.trim().length < 2) {
      setVenueResults([]);
      return;
    }
    const timer = setTimeout(() => {
      searchVenues(venueQuery.trim()).then(setVenueResults).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [venueQuery, selectedVenue, venueManual]);

  const step1Valid = name.trim().length > 0 && startsAt !== null;
  const endsBeforeStart =
    endsAt !== null && startsAt !== null && endsAt <= startsAt;

  // ── Lineup helpers ───────────────────────────────────────────────────────

  function handleLineupSelect(whiskeyId: string, whiskeyName: string) {
    if (lineupItems.length >= 8) return;
    if (lineupItems.some((i) => i.whiskeyId === whiskeyId)) return;
    setLineupItems((prev) => [
      ...prev,
      { whiskeyId, displayName: whiskeyName, whiskeyType: null, proof: null, pairingNote: "" },
    ]);
    setSearchModalOpen(false);
  }

  function handleLineupRemove(index: number) {
    setLineupItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleLineupMove(index: number, dir: "up" | "down") {
    setLineupItems((prev) => {
      const next = [...prev];
      const swap = dir === "up" ? index - 1 : index + 1;
      if (swap < 0 || swap >= next.length) return prev;
      [next[index], next[swap]] = [next[swap], next[index]];
      return next;
    });
  }

  function handlePairingNoteChange(index: number, note: string) {
    setLineupItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, pairingNote: note } : item))
    );
  }

  // ── Date picker helpers ──────────────────────────────────────────────────

  function openPicker(field: "start" | "end") {
    const base =
      field === "start"
        ? (startsAt ?? new Date())
        : (endsAt ?? startsAt ?? new Date());

    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: base,
        mode: "date",
        onChange: (_e, dateVal) => {
          if (!dateVal) return;
          DateTimePickerAndroid.open({
            value: dateVal,
            mode: "time",
            onChange: (_e2, timeVal) => {
              if (!timeVal) return;
              if (field === "start") setStartsAt(timeVal);
              else setEndsAt(timeVal);
            },
          });
        },
      });
    } else {
      setIosPickerValue(base);
      setActivePicker(field);
    }
  }

  function commitIosPicker() {
    if (activePicker === "start") setStartsAt(iosPickerValue);
    else if (activePicker === "end") setEndsAt(iosPickerValue);
    setActivePicker(null);
  }

  // ── Submit ───────────────────────────────────────────────────────────────

  async function handleCreate() {
    if (!name.trim() || !startsAt) {
      setError("Event name and start date are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const venuePayload = selectedVenue
        ? { venue_id: selectedVenue.id }
        : venueManual && venueName.trim()
        ? {
            venue_name_free: venueName.trim(),
            venue_city: venueCity.trim() || null,
            venue_state: venueState.trim() || null,
          }
        : {};

      const { data, error: insertErr } = await supabase
        .from("events")
        .insert({
          name: name.trim(),
          slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          checkin_code: checkinCode.trim().toUpperCase(),
          description: description.trim() || null,
          event_type: eventType,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt?.toISOString() ?? null,
          is_blind: isBlind,
          is_public: isPublic,
          max_attendees: tierCap,
          host_user_id: user?.id,
          is_active: true,
          has_lineup: hasLineup,
          has_pairing: hasPairing,
          pairing_notes: hasPairing && !hasLineup ? pairingNotes.trim() || null : null,
          ...venuePayload,
        })
        .select("id")
        .single();

      if (insertErr) throw insertErr;

      const { error: hostErr } = await supabase
        .from("event_hosts")
        .insert({ event_id: data.id, user_id: user?.id, role: "primary" });
      if (hostErr) throw hostErr;

      if (hasLineup && lineupItems.length > 0) {
        await saveEventLineup(data.id, lineupItems);
      }

      router.replace(`/host-events/${data.id}` as any);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  // ── Progress bar ─────────────────────────────────────────────────────────

  function ProgressBar() {
    const pct = step === 1 ? "33%" : step === 2 ? "66%" : "100%";
    return (
      <View style={{ gap: 6 }}>
        <Text style={[type.caption, { color: colors.textSecondary }]}>
          Step {step} of 3
        </Text>
        <View
          style={{
            height: 2,
            backgroundColor: colors.accentFaint,
            borderRadius: 999,
          }}
        >
          <View
            style={{
              height: 2,
              width: pct,
              backgroundColor: colors.accent,
              borderRadius: 999,
            }}
          />
        </View>
      </View>
    );
  }

  // ── Step 1 ────────────────────────────────────────────────────────────────

  function Step1() {
    return (
      <>
        <SectionCard>
          {/* Event Name */}
          <View style={{ gap: spacing.xs }}>
            <FieldLabel label="Event Name" />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Buffalo Bourbon Bash"
              placeholderTextColor={colors.textMuted}
              returnKeyType="next"
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

          {/* Check-In Code */}
          <View style={{ gap: spacing.xs }}>
            <FieldLabel label="Check-In Code" />
            <TextInput
              value={checkinCode}
              onChangeText={setCheckinCode}
              autoCapitalize="characters"
              placeholder="e.g. BOURBON24"
              placeholderTextColor={colors.textMuted}
              returnKeyType="next"
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
            <Text style={[type.caption, { color: colors.textSecondary }]}>
              Announce this at your event. Attendees enter it to tag their tastings to this event.
            </Text>
          </View>

          {/* Venue */}
          <View style={{ gap: spacing.xs }}>
            <FieldLabel label="Venue (optional)" />
            {selectedVenue ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: spacing.sm,
                  backgroundColor: colors.surfaceSunken,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: colors.accent,
                  padding: spacing.md,
                }}
              >
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[type.body, { color: colors.textPrimary, fontSize: 15 }]}>
                    {selectedVenue.display_name}
                  </Text>
                  {selectedVenue.venue_type ? (
                    <Text style={[type.labelCaps, { fontSize: 9, color: colors.accent }]}>
                      {selectedVenue.venue_type}
                    </Text>
                  ) : null}
                  {(selectedVenue.city || selectedVenue.state) ? (
                    <Text style={[type.caption, { color: colors.textSecondary }]}>
                      {[selectedVenue.city, selectedVenue.state].filter(Boolean).join(", ")}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={() => { setSelectedVenue(null); setVenueQuery(""); setVenueResults([]); }}
                  style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.7 : 1 })}
                >
                  <Ionicons name="close" size={18} color={colors.textMuted} />
                </Pressable>
              </View>
            ) : venueManual ? (
              <View style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={[type.caption, { color: colors.textSecondary }]}>Manual entry</Text>
                  <Pressable
                    onPress={() => { setVenueManual(false); setVenueName(""); setVenueCity(""); setVenueState(""); }}
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  >
                    <Text style={[type.caption, { color: colors.accent }]}>Search instead</Text>
                  </Pressable>
                </View>
                <TextInput
                  value={venueName}
                  onChangeText={setVenueName}
                  placeholder="Venue name"
                  placeholderTextColor={colors.textMuted}
                  style={[type.body, {
                    color: colors.textPrimary,
                    backgroundColor: colors.surfaceSunken,
                    borderWidth: 1,
                    borderColor: colors.borderStrong,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                  }]}
                />
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <TextInput
                    value={venueCity}
                    onChangeText={setVenueCity}
                    placeholder="City"
                    placeholderTextColor={colors.textMuted}
                    style={[type.body, {
                      flex: 1,
                      color: colors.textPrimary,
                      backgroundColor: colors.surfaceSunken,
                      borderWidth: 1,
                      borderColor: colors.borderStrong,
                      borderRadius: radii.md,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                    }]}
                  />
                  <TextInput
                    value={venueState}
                    onChangeText={setVenueState}
                    placeholder="State"
                    placeholderTextColor={colors.textMuted}
                    style={[type.body, {
                      width: 80,
                      color: colors.textPrimary,
                      backgroundColor: colors.surfaceSunken,
                      borderWidth: 1,
                      borderColor: colors.borderStrong,
                      borderRadius: radii.md,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                    }]}
                  />
                </View>
              </View>
            ) : (
              <View>
                <TextInput
                  value={venueQuery}
                  onChangeText={setVenueQuery}
                  placeholder="Search for a venue..."
                  placeholderTextColor={colors.textMuted}
                  style={[type.body, {
                    color: colors.textPrimary,
                    backgroundColor: colors.surfaceSunken,
                    borderWidth: 1,
                    borderColor: colors.borderStrong,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                  }]}
                />
                {venueQuery.trim().length >= 2 ? (
                  <View
                    style={{
                      marginTop: 2,
                      backgroundColor: colors.surface,
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: colors.borderStrong,
                      overflow: "hidden",
                      ...shadows.card,
                    }}
                  >
                    {venueResults.map((v, i) => (
                      <Pressable
                        key={v.id}
                        onPress={() => { setSelectedVenue(v); setVenueQuery(""); setVenueResults([]); }}
                        style={({ pressed }) => ({
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.sm,
                          backgroundColor: pressed ? colors.surfaceSunken : "transparent",
                          borderBottomWidth: 1,
                          borderBottomColor: colors.divider,
                        })}
                      >
                        <Text style={[type.body, { color: colors.textPrimary, fontSize: 14 }]}>
                          {v.display_name}
                        </Text>
                        {(v.city || v.state) ? (
                          <Text style={[type.caption, { color: colors.textSecondary }]}>
                            {[v.city, v.state].filter(Boolean).join(", ")}
                          </Text>
                        ) : null}
                      </Pressable>
                    ))}
                    <Pressable
                      onPress={() => {
                        setVenueManual(true);
                        setVenueName(venueQuery.trim());
                        setVenueQuery("");
                        setVenueResults([]);
                      }}
                      style={({ pressed }) => ({
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                        backgroundColor: pressed ? colors.surfaceSunken : "transparent",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.sm,
                      })}
                    >
                      <Ionicons name="add-circle-outline" size={16} color={colors.accent} />
                      <Text style={[type.body, { color: colors.accent, fontSize: 14 }]}>Add manually</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            )}
          </View>

          {/* Event Type */}
          <View style={{ gap: spacing.xs }}>
            <FieldLabel label="Event Type" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.xs }}
            >
              {EVENT_TYPES.map((t) => {
                const active = eventType === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => setEventType(active ? null : t)}
                    style={({ pressed }) => ({
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: active ? colors.accent : colors.divider,
                      backgroundColor: active
                        ? colors.accentSoft
                        : "transparent",
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <Text
                      style={[
                        type.button,
                        {
                          fontSize: 13,
                          color: active
                            ? colors.textPrimary
                            : colors.textMuted,
                        },
                      ]}
                    >
                      {t}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Start Date */}
          <View style={{ gap: spacing.xs }}>
            <DateField
              label="Start Date & Time"
              value={startsAt}
              placeholder="Select start date and time"
              onPress={() => openPicker("start")}
            />
          </View>

          {/* End Date */}
          <View style={{ gap: spacing.xs }}>
            <DateField
              label="End Date & Time (optional)"
              value={endsAt}
              placeholder="Select end date and time"
              onPress={() => openPicker("end")}
            />
            {endsBeforeStart ? (
              <Text style={[type.caption, { color: colors.danger }]}>
                End time must be after start time.
              </Text>
            ) : null}
          </View>
        </SectionCard>

        {error ? (
          <Text style={[type.caption, { color: colors.danger }]}>{error}</Text>
        ) : null}

        <Pressable
          onPress={() => {
            if (checkinCode.trim().length === 0) {
              setError("A check-in code is required.");
              return;
            }
            setError("");
            setStep(2);
          }}
          disabled={!step1Valid || endsBeforeStart}
          style={({ pressed }) => ({
            paddingVertical: spacing.md,
            borderRadius: 999,
            backgroundColor: colors.accent,
            alignItems: "center",
            opacity:
              !step1Valid || endsBeforeStart ? 0.45 : pressed ? 0.85 : 1,
          })}
        >
          <Text style={[type.button, { color: colors.background }]}>Next</Text>
        </Pressable>
      </>
    );
  }

  // ── Step 2 ────────────────────────────────────────────────────────────────

  function Step2() {
    const tierBadgeColor = isHostPro ? colors.success : isHostStarter ? colors.accent : colors.textMuted;

    return (
      <>
        <SectionCard>
          {/* Description */}
          <View style={{ gap: spacing.xs }}>
            <FieldLabel label="Description (optional)" />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Tell attendees what to expect..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
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

          <RowDivider />

          <ToggleRow
            label="Blind Tasting"
            subtitle="Whiskey identities hidden until reveal"
            value={isBlind}
            onChange={setIsBlind}
          />

          <RowDivider />

          <ToggleRow
            label="Public Event"
            subtitle="Visible in public event discovery"
            value={isPublic}
            onChange={setIsPublic}
          />

          <RowDivider />

          {/* Attendee Cap */}
          <View style={{ gap: 4 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: spacing.md,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.xs,
                  flex: 1,
                }}
              >
                <Text style={[type.body, { color: colors.textPrimary }]}>
                  Attendee cap
                </Text>
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: tierBadgeColor + "55",
                    backgroundColor: tierBadgeColor + "18",
                  }}
                >
                  <Text
                    style={[
                      type.labelCaps,
                      { color: tierBadgeColor, fontSize: 9 },
                    ]}
                  >
                    {tierLabel}
                  </Text>
                </View>
              </View>
              <Text style={[type.statNumber, { color: colors.textPrimary }]}>
                {tierCap}
              </Text>
            </View>
            {showUpgradeCaption ? (
              <Text style={[type.caption, { color: colors.textMuted }]}>
                Upgrade to increase your limit
              </Text>
            ) : null}
          </View>
        </SectionCard>

        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Pressable
            onPress={() => { setError(""); setStep(1); }}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: spacing.md,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.borderStrong,
              alignItems: "center",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={[type.button, { color: colors.textSecondary }]}>
              Back
            </Text>
          </Pressable>

          <Pressable
            onPress={() => { setError(""); setStep(3); }}
            style={({ pressed }) => ({
              flex: 2,
              paddingVertical: spacing.md,
              borderRadius: 999,
              backgroundColor: colors.accent,
              alignItems: "center",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={[type.button, { color: colors.background }]}>
              Next
            </Text>
          </Pressable>
        </View>
      </>
    );
  }

  // ── Step 3 ────────────────────────────────────────────────────────────────

  function Step3() {
    return (
      <>
        {/* Lineup */}
        <SectionCard>
          <ToggleRow
            label="Is there a lineup?"
            subtitle="Add the whiskies that will be poured at this event"
            value={hasLineup}
            onChange={(v) => {
              setHasLineup(v);
              if (!v) setLineupItems([]);
            }}
          />

          {hasLineup ? (
            <>
              {lineupItems.length > 0 ? (
                <>
                  <RowDivider />
                  <View style={{ gap: spacing.sm }}>
                    {lineupItems.map((item, index) => (
                      <LineupCard
                        key={item.whiskeyId}
                        item={item}
                        index={index}
                        total={lineupItems.length}
                        showPairingNote={hasPairing}
                        onRemove={() => handleLineupRemove(index)}
                        onMoveUp={() => handleLineupMove(index, "up")}
                        onMoveDown={() => handleLineupMove(index, "down")}
                        onPairingNoteChange={(note) => handlePairingNoteChange(index, note)}
                      />
                    ))}
                  </View>
                </>
              ) : null}

              {lineupItems.length < 8 ? (
                <>
                  <RowDivider />
                  <Pressable
                    onPress={() => setSearchModalOpen(true)}
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
                      Add Whiskey ({lineupItems.length}/8)
                    </Text>
                  </Pressable>
                </>
              ) : null}
            </>
          ) : null}
        </SectionCard>

        {/* Pairing */}
        <SectionCard>
          <ToggleRow
            label="Is there a pairing?"
            subtitle="Food, cigars, or other pairings for attendees"
            value={hasPairing}
            onChange={setHasPairing}
          />

          {hasPairing && !hasLineup ? (
            <>
              <RowDivider />
              <View style={{ gap: spacing.xs }}>
                <FieldLabel label="Pairing Notes" />
                <TextInput
                  value={pairingNotes}
                  onChangeText={setPairingNotes}
                  placeholder="e.g. Charcuterie board, dark chocolate, Fuente cigars…"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
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
            </>
          ) : null}

          {hasPairing && hasLineup ? (
            <Text style={[type.caption, { color: colors.textSecondary }]}>
              Pairing note fields appear on each lineup card above.
            </Text>
          ) : null}
        </SectionCard>

        {error ? (
          <Text style={[type.caption, { color: colors.danger }]}>{error}</Text>
        ) : null}

        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Pressable
            onPress={() => { setError(""); setStep(2); }}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: spacing.md,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.borderStrong,
              alignItems: "center",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={[type.button, { color: colors.textSecondary }]}>
              Back
            </Text>
          </Pressable>

          <Pressable
            onPress={handleCreate}
            disabled={saving}
            style={({ pressed }) => ({
              flex: 2,
              paddingVertical: spacing.md,
              borderRadius: 999,
              backgroundColor: colors.accent,
              alignItems: "center",
              opacity: saving ? 0.6 : pressed ? 0.85 : 1,
            })}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Text style={[type.button, { color: colors.background }]}>
                Create Event
              </Text>
            )}
          </Pressable>
        </View>
      </>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: 6 }}>
          <Text style={[type.screenTitle, { color: colors.textPrimary }]}>
            Create Event
          </Text>
          {ProgressBar()}
        </View>

        {step === 1 ? Step1() : step === 2 ? Step2() : Step3()}
      </ScrollView>

      {/* iOS date picker modal */}
      {Platform.OS === "ios" && activePicker !== null ? (
        <Modal transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: "flex-end" }}>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => setActivePicker(null)}
            />
            <View
              style={{
                backgroundColor: colors.surface,
                borderTopWidth: 1,
                borderTopColor: colors.divider,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.divider,
                }}
              >
                <Pressable onPress={() => setActivePicker(null)}>
                  <Text
                    style={[type.button, { color: colors.textSecondary }]}
                  >
                    Cancel
                  </Text>
                </Pressable>
                <Pressable onPress={commitIosPicker}>
                  <Text style={[type.button, { color: colors.accent }]}>
                    Done
                  </Text>
                </Pressable>
              </View>

              <DateTimePicker
                value={iosPickerValue}
                mode="datetime"
                display="spinner"
                textColor={colors.textPrimary}
                onChange={(_e, date) => {
                  if (date) setIosPickerValue(date);
                }}
              />
            </View>
          </View>
        </Modal>
      ) : null}

      {/* Whiskey search modal for lineup */}
      <WhiskeySearchModal
        visible={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelect={handleLineupSelect}
        onCustomEntry={(name) => {
          setSearchModalOpen(false);
          router.push(
            `/log/cloud-tasting?whiskeyName=${encodeURIComponent(name)}&lockName=0` as any
          );
        }}
      />
    </KeyboardAvoidingView>
  );
}
