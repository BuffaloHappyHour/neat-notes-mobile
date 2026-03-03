// src/log/components/metadata/MetadataModal.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { Card } from "../../../../components/ui/Card";
import { radii } from "../../../../lib/radii";
import { spacing } from "../../../../lib/spacing";
import { colors } from "../../../../lib/theme";
import { type } from "../../../../lib/typography";
import { isMissingLike } from "../../utils/text";

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
    <View style={{ gap: spacing.xs }}>
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
            keyboardShouldPersistTaps="handled"
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

  /** NEW: true when the whiskey was created via “Custom” */
  isCustom?: boolean;

  metaMissingKeys: string[];

  // form values (Custom-required)
  fName: string;
  setFName: (v: string) => void;

  fDistillery: string;
  setFDistillery: (v: string) => void;

  // ✅ canonical whiskey type (id + options)
  fTypeId: string | null;
  setFTypeId: (v: string | null) => void;
  whiskeyTypeOptions: { id: string; name: string }[];
  selectedWhiskeyTypeName: string | null;

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
    isCustom,

    metaMissingKeys,

    fName,
    setFName,

    fDistillery,
    setFDistillery,

    fTypeId,
    setFTypeId,
    whiskeyTypeOptions,
    selectedWhiskeyTypeName,

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

  const [touched, setTouched] = useState<{ name?: boolean; type?: boolean; proof?: boolean }>({});

  const typeNameOptions = useMemo(() => {
    const opts = Array.isArray(whiskeyTypeOptions) ? whiskeyTypeOptions : [];
    return opts.map((x) => x.name).filter(Boolean);
  }, [whiskeyTypeOptions]);

  function onTypeNameChange(name: string) {
    const hit = (whiskeyTypeOptions || []).find((x) => x.name === name);
    setFTypeId(hit?.id ?? null);
    setTouched((p) => ({ ...p, type: true }));
  }

  const requireName = !!isCustom;
  const requireType = !!isCustom;
  const requireProof = !!isCustom;

  const showName = requireName;
  const showType = requireType || metaMissingKeys.includes("whiskey_type");
  const showProof = requireProof || metaMissingKeys.includes("proof");

  const showDistillery = metaMissingKeys.includes("distillery");
  const showAge = metaMissingKeys.includes("age");

  const nameOk = !requireName || !!fName?.trim();
  const typeOk = !requireType || !!fTypeId;
  const proofNum = Number(String(fProof ?? "").trim());
  const proofOk = !requireProof || (!!String(fProof ?? "").trim() && Number.isFinite(proofNum) && proofNum > 0);

  const canSave = !saving && nameOk && typeOk && proofOk;

  const headerTitle = isCustom ? "Add this whiskey to the catalog" : "Help improve this whiskey?";
  const headerSub = isCustom
    ? "Custom pours help us grow the database. Name, Whiskey Type, and Proof are required."
    : "Quick confirmations help keep the catalog accurate. Only missing fields are shown.";

  const showRequiredHint = isCustom && (!nameOk || !typeOk || !proofOk);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onSkip}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{ padding: spacing.xl, paddingBottom: spacing.lg, gap: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={[type.sectionHeader, { marginBottom: 0 }]}>{headerTitle}</Text>

            {/* If you want Skip hidden for Custom, change this to: {!isCustom ? ( ... ) : null} */}
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

          <Text style={[type.microcopyItalic, { opacity: 0.8 }]}>{headerSub}</Text>

          {showRequiredHint ? (
            <Text style={[type.microcopyItalic, { opacity: 0.85 }]}>
              Required:{" "}
              <Text style={{ color: colors.accent, fontWeight: "900" }}>
                Name, Type, Proof
              </Text>
            </Text>
          ) : null}

          <View style={{ height: 1, backgroundColor: colors.divider, opacity: 0.9 }} />
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: spacing.xl * 2,
            gap: spacing.lg,
          }}
        >
          {loading ? (
            <Card>
              <View style={{ alignItems: "center", paddingVertical: spacing.lg, gap: 10 }}>
                <ActivityIndicator />
                <Text style={[type.microcopyItalic, { opacity: 0.75 }]}>Loading options…</Text>
              </View>
            </Card>
          ) : null}

          {/* ✅ Custom Required: Name */}
          {showName ? (
            <Card>
              <View style={{ gap: spacing.xs }}>
                <Text style={[type.body, { fontWeight: "900" }]}>
                  Whiskey name <Text style={{ color: colors.accent }}>*</Text>
                </Text>
                <TextInput
                  value={fName}
                  onChangeText={(t) => {
                    setFName(t);
                    setTouched((p) => ({ ...p, name: true }));
                  }}
                  onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                  placeholder="Enter whiskey name…"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: spacing.md,
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: !nameOk && touched.name ? "rgba(190, 150, 99, 0.65)" : colors.divider,
                    backgroundColor: "transparent",
                    color: colors.textPrimary,
                    fontSize: 16,
                    fontFamily: type.body.fontFamily,
                  }}
                />
                {!nameOk && touched.name ? (
                  <Text style={[type.microcopyItalic, { opacity: 0.8 }]}>
                    Name is required for custom pours.
                  </Text>
                ) : null}
              </View>
            </Card>
          ) : null}

          {/* Optional missing: Distillery */}
          {showDistillery ? (
            <Card>
              <View style={{ gap: spacing.xs }}>
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
            </Card>
          ) : null}

          {/* ✅ Required (Custom) or Missing: Type */}
          {showType ? (
            <Card>
              <ControlledSelect
                label={
                  isCustom ? "Whiskey Type *" : "Whiskey Type"
                }
                value={selectedWhiskeyTypeName}
                placeholder="Select type…"
                options={typeNameOptions}
                disabled={false}
                onChange={onTypeNameChange}
              />

              {!typeOk && (touched.type || isCustom) ? (
                <Text style={[type.microcopyItalic, { opacity: 0.75, marginTop: spacing.sm }]}>
                  Type is required. Pick the closest style.
                </Text>
              ) : null}
            </Card>
          ) : null}

          {/* ✅ Required (Custom) or Missing: Proof */}
          {showProof ? (
            <Card>
              <View style={{ gap: spacing.xs }}>
                <Text style={[type.body, { fontWeight: "900" }]}>
                  Proof {isCustom ? <Text style={{ color: colors.accent }}>*</Text> : null}
                </Text>
                <TextInput
                  value={fProof}
                  onChangeText={(t) => {
                    const cleaned = t.replace(/[^0-9.]/g, "");
                    const parts = cleaned.split(".");
                    const next = parts.length <= 2 ? cleaned : `${parts[0]}.${parts.slice(1).join("")}`;
                    setFProof(next);
                    setTouched((p) => ({ ...p, proof: true }));
                  }}
                  onBlur={() => setTouched((p) => ({ ...p, proof: true }))}
                  placeholder="e.g., 90 or 100.5"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="decimal-pad"
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: spacing.md,
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: !proofOk && touched.proof ? "rgba(190, 150, 99, 0.65)" : colors.divider,
                    backgroundColor: "transparent",
                    color: colors.textPrimary,
                    fontSize: 16,
                    fontFamily: type.body.fontFamily,
                  }}
                />
                {!proofOk && (touched.proof || isCustom) ? (
                  <Text style={[type.microcopyItalic, { opacity: 0.8 }]}>
                    Proof is required for custom pours.
                  </Text>
                ) : null}
              </View>
            </Card>
          ) : null}

          {/* Optional missing: Age */}
          {showAge ? (
            <Card>
              <View style={{ gap: spacing.xs }}>
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
            </Card>
          ) : null}

          {showCategoryBlock ? (
            <Card>
              <ControlledSelect
                label="Category"
                value={fCategory}
                placeholder="Select category…"
                options={categoryOptions}
                disabled={!canEditCategory}
                onChange={onCategoryChange}
              />
            </Card>
          ) : null}

          {showRegionBlock ? (
            <Card>
              <ControlledSelect
                label="Region"
                value={fRegion}
                placeholder={fCategory ? "Select region…" : "Select category first…"}
                options={regionOptions}
                disabled={!canEditRegion || isMissingLike(fCategory)}
                onChange={onRegionChange}
              />
            </Card>
          ) : null}

          {showSubRegionBlock ? (
            <Card>
              <ControlledSelect
                label="Sub-Region"
                value={fSubRegion}
                placeholder={fRegion ? "Select sub-region…" : "Select region first…"}
                options={subRegionOptions}
                disabled={!canEditSubRegion || isMissingLike(fCategory) || isMissingLike(fRegion)}
                onChange={(v) => setFSubRegion(v)}
              />
            </Card>
          ) : null}

          <View style={{ height: spacing.sm }} />
        </ScrollView>

        {/* Bottom actions */}
        <View
          style={{
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.md,
            paddingBottom: spacing.lg + 24,
            borderTopWidth: 1,
            borderTopColor: colors.divider,
            backgroundColor: colors.background,
          }}
        >
          <Pressable
            onPress={() => {
              // For Custom: force “touched” so errors show if they try to save empty
              if (isCustom) setTouched({ name: true, type: true, proof: true });
              if (canSave) onSave();
            }}
            disabled={!canSave}
            style={({ pressed }) => ({
              borderRadius: radii.md,
              paddingVertical: spacing.lg,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.accent,
              opacity: !canSave ? 0.35 : saving ? 0.6 : pressed ? 0.92 : 1,
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
              opacity: isCustom ? 0.9 : 1,
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