// src/log/components/metadata/MetadataModal.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

import { radii } from "../../../../lib/radii";
import { spacing } from "../../../../lib/spacing";
import { colors } from "../../../../lib/theme";
import { type } from "../../../../lib/typography";
import { isMissingLike } from "../../utils/text";

const WHISKEY_TYPE_OPTIONS = [
  "Bourbon",
  "Rye",
  "Tennessee Whiskey",
  "American Single Malt",
  "Wheat Whiskey",
  "Corn Whiskey",
  "Blended American",
  "Other American",
  "Single Malt",
  "Blended Malt",
  "Blended Scotch",
  "Single Grain",
  "Blended Grain",
  "Single Pot Still",
  "Blended Irish",
  "Irish Single Malt",
  "Irish Single Grain",
  "Canadian Whisky",
  "Rye (Canadian)",
  "Canadian Single Malt",
  "Blended",
  "Grain",
  "Other",
];

function ControlledSelect({
  label,
  value,
  placeholder,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string | null;
  placeholder: string;
  options: string[];
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const safeOptions = Array.isArray(options) ? options : [];
  const canOpen = !disabled && safeOptions.length > 0;

  return (
    <View style={{ gap: 6 }}>
      <Text style={[type.body, { fontWeight: "900" }]}>{label}</Text>

      <Pressable
        disabled={!canOpen}
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => ({
          paddingVertical: 12,
          paddingHorizontal: spacing.md,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: colors.divider,
          backgroundColor: pressed ? colors.highlight : "transparent",
          opacity: canOpen ? 1 : 0.55,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        })}
      >
        <Text style={[type.body, { opacity: value ? 0.95 : 0.6 }]} numberOfLines={1}>
          {value ? value : placeholder}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textSecondary}
        />
      </Pressable>

      {open ? (
        <View
          style={{
            marginTop: 6,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.divider,
            overflow: "hidden",
          }}
        >
          <ScrollView
            style={{ maxHeight: 260 }}
            contentContainerStyle={{ paddingVertical: 4 }}
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
            {safeOptions.map((opt) => {
              const active = opt === value;
              return (
                <Pressable
                  key={opt}
                  onPress={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  style={({ pressed }) => ({
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.divider,
                    backgroundColor: active
                      ? colors.highlight
                      : pressed
                      ? colors.highlight
                      : "transparent",
                  })}
                >
                  <Text style={[type.body, { fontWeight: active ? "900" : "800" }]}>{opt}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {!disabled && safeOptions.length === 0 ? (
        <Text style={[type.microcopyItalic, { opacity: 0.7 }]}>No options available.</Text>
      ) : null}
    </View>
  );
}

export function MetadataModal(props: {
  visible: boolean;
  loading: boolean;
  saving: boolean;

  metaMissingKeys: string[];

  // form values
  fDistillery: string;
  setFDistillery: (v: string) => void;

  fType: string | null;
  setFType: (v: string | null) => void;

  fProof: string;
  setFProof: (v: string) => void;

  fAge: string;
  setFAge: (v: string) => void;

  fCategory: string | null;
  setFCategory: (v: string | null) => void;

  fRegion: string | null;
  setFRegion: (v: string | null) => void;

  fSubRegion: string | null;
  setFSubRegion: (v: string | null) => void;

  // options + gating
  categoryOptions: string[];
  regionOptions: string[];
  subRegionOptions: string[];

  canEditCategory: boolean;
  canEditRegion: boolean;
  canEditSubRegion: boolean;

  showCategoryBlock: boolean;
  showRegionBlock: boolean;
  showSubRegionBlock: boolean;

  // handlers
  onSkip: () => void;
  onSave: () => void;
  onCategoryChange: (v: string) => void;
  onRegionChange: (v: string) => void;
}) {
  const {
    visible,
    loading,
    saving,
    metaMissingKeys,

    fDistillery,
    setFDistillery,
    fType,
    setFType,
    fProof,
    setFProof,
    fAge,
    setFAge,
    fCategory,
    fRegion,
    fSubRegion,

    categoryOptions,
    regionOptions,
    subRegionOptions,

    canEditCategory,
    canEditRegion,
    canEditSubRegion,

    showCategoryBlock,
    showRegionBlock,
    showSubRegionBlock,

    onSkip,
    onSave,
    onCategoryChange,
    onRegionChange,
    setFSubRegion,
  } = props;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onSkip}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            paddingTop: spacing.xl + 10,
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.divider,
            backgroundColor: colors.background,
            gap: 6,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Text style={[type.sectionHeader, { marginBottom: 0 }]}>
              Help improve this whiskey?
            </Text>

            <Pressable
              onPress={onSkip}
              style={({ pressed }) => ({
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.divider,
                backgroundColor: pressed ? colors.highlight : "transparent",
              })}
            >
              <Text style={[type.button, { color: colors.textPrimary }]}>Skip</Text>
            </Pressable>
          </View>

          <Text style={[type.microcopyItalic, { opacity: 0.8 }]}>
            Quick confirmations help keep the catalog accurate. Only missing fields are shown.
          </Text>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          contentContainerStyle={{
            padding: spacing.lg,
            paddingBottom: spacing.xl * 2,
            gap: spacing.lg,
          }}
        >
          {loading ? (
            <View style={{ alignItems: "center", paddingVertical: spacing.lg, gap: 10 }}>
              <ActivityIndicator />
              <Text style={[type.microcopyItalic, { opacity: 0.75 }]}>Loading options…</Text>
            </View>
          ) : null}

          {metaMissingKeys.includes("distillery") ? (
            <View style={{ gap: 6 }}>
              <Text style={[type.body, { fontWeight: "900" }]}>Distillery / Brand</Text>
              <TextInput
                value={fDistillery}
                onChangeText={setFDistillery}
                placeholder="Enter distillery…"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: spacing.md,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: colors.divider,
                  backgroundColor: "transparent",
                  color: colors.textPrimary,
                  fontSize: 16,
                  fontFamily: type.body.fontFamily,
                }}
              />
            </View>
          ) : null}

          {metaMissingKeys.includes("whiskey_type") ? (
            <ControlledSelect
              label="Whiskey Type"
              value={fType}
              placeholder="Select type…"
              options={WHISKEY_TYPE_OPTIONS}
              onChange={(v) => setFType(v)}
            />
          ) : null}

          {metaMissingKeys.includes("proof") ? (
            <View style={{ gap: 6 }}>
              <Text style={[type.body, { fontWeight: "900" }]}>Proof</Text>
              <TextInput
                value={fProof}
                onChangeText={(t) => {
                  const cleaned = t.replace(/[^0-9.]/g, "");
                  const parts = cleaned.split(".");
                  const next = parts.length <= 2 ? cleaned : `${parts[0]}.${parts.slice(1).join("")}`;
                  setFProof(next);
                }}
                placeholder="e.g., 90 or 100.5"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: spacing.md,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: colors.divider,
                  backgroundColor: "transparent",
                  color: colors.textPrimary,
                  fontSize: 16,
                  fontFamily: type.body.fontFamily,
                }}
              />
            </View>
          ) : null}

          {metaMissingKeys.includes("age") ? (
            <View style={{ gap: 6 }}>
              <Text style={[type.body, { fontWeight: "900" }]}>Age</Text>
              <TextInput
                value={fAge}
                onChangeText={(t) => {
                  const cleaned = t.replace(/[^0-9.]/g, "");
                  const parts = cleaned.split(".");
                  const next = parts.length <= 2 ? cleaned : `${parts[0]}.${parts.slice(1).join("")}`;
                  setFAge(next);
                }}
                placeholder="e.g., 8"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: spacing.md,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: colors.divider,
                  backgroundColor: "transparent",
                  color: colors.textPrimary,
                  fontSize: 16,
                  fontFamily: type.body.fontFamily,
                }}
              />
            </View>
          ) : null}

          {showCategoryBlock ? (
            <ControlledSelect
              label="Category"
              value={fCategory}
              placeholder="Select category…"
              options={categoryOptions}
              disabled={!canEditCategory}
              onChange={(v) => onCategoryChange(v)}
            />
          ) : null}

          {showRegionBlock ? (
            <ControlledSelect
              label="Region"
              value={fRegion}
              placeholder={fCategory ? "Select region…" : "Select category first…"}
              options={regionOptions}
              disabled={!canEditRegion || isMissingLike(fCategory)}
              onChange={(v) => onRegionChange(v)}
            />
          ) : null}

          {showSubRegionBlock ? (
            <ControlledSelect
              label="Sub-Region"
              value={fSubRegion}
              placeholder={fRegion ? "Select sub-region…" : "Select region first…"}
              options={subRegionOptions}
              disabled={!canEditSubRegion || isMissingLike(fCategory) || isMissingLike(fRegion)}
              onChange={(v) => setFSubRegion(v)}
            />
          ) : null}
        </ScrollView>

        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: spacing.lg + 24,
            borderTopWidth: 1,
            borderTopColor: colors.divider,
            backgroundColor: colors.background,
          }}
        >
          <Pressable
            onPress={onSave}
            disabled={saving}
            style={({ pressed }) => ({
              borderRadius: radii.md,
              paddingVertical: spacing.lg,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.accent,
              opacity: saving ? 0.6 : pressed ? 0.92 : 1,
            })}
          >
            <Text style={[type.button, { color: colors.background, textAlign: "center" }]}>
              {saving ? "Saving…" : "Save details"}
            </Text>
          </Pressable>

          <Pressable
            onPress={onSkip}
            style={({ pressed }) => ({
              marginTop: 10,
              borderRadius: radii.md,
              paddingVertical: 14,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.divider,
              backgroundColor: pressed ? colors.highlight : "transparent",
            })}
          >
            <Text style={[type.button, { color: colors.textPrimary, textAlign: "center" }]}>
              Skip
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}