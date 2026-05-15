import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
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

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function CreateEventScreen() {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1
  const [name, setName] = useState("");
  const [eventType, setEventType] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState<Date | null>(null);
  const [endsAt, setEndsAt] = useState<Date | null>(null);

  // Step 2
  const [description, setDescription] = useState("");
  const [isBlind, setIsBlind] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  // Form meta
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // iOS date picker
  const [activePicker, setActivePicker] = useState<"start" | "end" | null>(
    null
  );
  const [iosPickerValue, setIosPickerValue] = useState(new Date());

  // Tier cap
  const { roles } = useRoles();
  const tierCap = roles.includes("host_pro")
    ? 50
    : roles.includes("host_starter")
    ? 25
    : 10;
  const tierLabel = roles.includes("host_pro")
    ? "Host Pro"
    : roles.includes("host_starter")
    ? "Host Starter"
    : "Free";
  const showUpgradeCaption = !roles.includes("host_pro");

  const step1Valid = name.trim().length > 0 && startsAt !== null;
  const endsBeforeStart =
    endsAt !== null && startsAt !== null && endsAt <= startsAt;

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

      const { data, error: insertErr } = await supabase
        .from("events")
        .insert({
          name: name.trim(),
          slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          description: description.trim() || null,
          event_type: eventType,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt?.toISOString() ?? null,
          is_blind: isBlind,
          is_public: isPublic,
          max_attendees: tierCap,
          host_user_id: user?.id,
          is_active: true,
        })
        .select("id")
        .single();

      if (insertErr) throw insertErr;
      router.replace(`/host-events/${data.id}` as any);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  // ── Progress bar ─────────────────────────────────────────────────────────

  function ProgressBar() {
    return (
      <View style={{ gap: 6 }}>
        <Text style={[type.caption, { color: colors.textSecondary }]}>
          Step {step} of 2
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
              width: step === 1 ? "50%" : "100%",
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

        <Pressable
          onPress={() => setStep(2)}
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
    const tierBadgeColor = roles.includes("host_pro")
      ? colors.success
      : roles.includes("host_starter")
      ? colors.accent
      : colors.textMuted;

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

        {error ? (
          <Text style={[type.caption, { color: colors.danger }]}>{error}</Text>
        ) : null}

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
          <ProgressBar />
        </View>

        {step === 1 ? <Step1 /> : <Step2 />}
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
    </KeyboardAvoidingView>
  );
}
