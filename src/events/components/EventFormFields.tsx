import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { radii } from "../../../lib/radii";
import { shadows } from "../../../lib/shadows";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";
import { searchVenues, type VenueResult } from "../../../lib/venueSearch";

// ─── Basic field primitives ────────────────────────────────────────────────

export function SectionCard({ children }: { children: React.ReactNode }) {
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

export function FieldLabel({ label }: { label: string }) {
  return (
    <Text style={[type.labelCaps, { color: colors.textSecondary }]}>
      {label}
    </Text>
  );
}

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

export function DateField({
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

// ─── Date/time picker flow (iOS spinner modal + Android native pickers) ───

export type DateTimeField = "start" | "end";

export function useEventDateTimePicker(opts: {
  startsAt: Date | null;
  endsAt: Date | null;
  onChangeStartsAt: (d: Date) => void;
  onChangeEndsAt: (d: Date) => void;
}) {
  const [activePicker, setActivePicker] = useState<DateTimeField | null>(null);
  const [iosPickerValue, setIosPickerValue] = useState(new Date());

  function openPicker(field: DateTimeField) {
    const base =
      field === "start"
        ? (opts.startsAt ?? new Date())
        : (opts.endsAt ?? opts.startsAt ?? new Date());

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
              if (field === "start") opts.onChangeStartsAt(timeVal);
              else opts.onChangeEndsAt(timeVal);
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
    if (activePicker === "start") opts.onChangeStartsAt(iosPickerValue);
    else if (activePicker === "end") opts.onChangeEndsAt(iosPickerValue);
    setActivePicker(null);
  }

  function closePicker() {
    setActivePicker(null);
  }

  return {
    activePicker,
    iosPickerValue,
    setIosPickerValue,
    openPicker,
    commitIosPicker,
    closePicker,
  };
}

export function IosDateTimePickerModal({
  visible,
  value,
  onChange,
  onCancel,
  onDone,
}: {
  visible: boolean;
  value: Date;
  onChange: (d: Date) => void;
  onCancel: () => void;
  onDone: () => void;
}) {
  if (Platform.OS !== "ios" || !visible) return null;

  return (
    <Modal transparent animationType="slide">
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable style={{ flex: 1 }} onPress={onCancel} />
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
            <Pressable onPress={onCancel}>
              <Text style={[type.button, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable onPress={onDone}>
              <Text style={[type.button, { color: colors.accent }]}>Done</Text>
            </Pressable>
          </View>

          <DateTimePicker
            value={value}
            mode="datetime"
            display="spinner"
            textColor={colors.textPrimary}
            onChange={(_e, date) => {
              if (date) onChange(date);
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

// ─── Venue picker (search existing venues or enter one manually) ──────────

export function VenuePicker({
  selectedVenue,
  onSelectVenue,
  venueManual,
  onVenueManualChange,
  venueName,
  onVenueNameChange,
  venueCity,
  onVenueCityChange,
  venueState,
  onVenueStateChange,
}: {
  selectedVenue: VenueResult | null;
  onSelectVenue: (v: VenueResult | null) => void;
  venueManual: boolean;
  onVenueManualChange: (v: boolean) => void;
  venueName: string;
  onVenueNameChange: (v: string) => void;
  venueCity: string;
  onVenueCityChange: (v: string) => void;
  venueState: string;
  onVenueStateChange: (v: string) => void;
}) {
  const [venueQuery, setVenueQuery] = useState("");
  const [venueResults, setVenueResults] = useState<VenueResult[]>([]);

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

  return (
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
            onPress={() => { onSelectVenue(null); setVenueQuery(""); setVenueResults([]); }}
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
              onPress={() => { onVenueManualChange(false); onVenueNameChange(""); onVenueCityChange(""); onVenueStateChange(""); }}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text style={[type.caption, { color: colors.accent }]}>Search instead</Text>
            </Pressable>
          </View>
          <TextInput
            value={venueName}
            onChangeText={onVenueNameChange}
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
              onChangeText={onVenueCityChange}
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
              onChangeText={onVenueStateChange}
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
              {venueResults.map((v) => (
                <Pressable
                  key={v.id}
                  onPress={() => { onSelectVenue(v); setVenueQuery(""); setVenueResults([]); }}
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
                  onVenueManualChange(true);
                  onVenueNameChange(venueQuery.trim());
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
  );
}
