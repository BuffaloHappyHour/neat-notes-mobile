import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { radii } from "../../../lib/radii";
import { shadows } from "../../../lib/shadows";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";
import { fetchWhiskeyTypes, type WhiskeyTypeRow } from "../../../lib/barrelApi";
import { createCustomWhiskey } from "../../../lib/createCustomWhiskey";

type Props = {
  visible: boolean;
  initialName: string;
  onClose: () => void;
  onCreated: (whiskeyId: string, displayName: string) => void;
};

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text style={[type.labelCaps, { color: colors.textSecondary, fontSize: 10 }]}>
      {label}
      {required ? <Text style={{ color: colors.danger }}> REQUIRED</Text> : null}
    </Text>
  );
}

const inputStyle = {
  color: colors.textPrimary,
  backgroundColor: colors.surfaceSunken,
  borderWidth: 1,
  borderColor: colors.borderStrong,
  borderRadius: radii.md,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  fontSize: 15,
} as const;

export function CustomWhiskeyModal({ visible, initialName, onClose, onCreated }: Props) {
  const [name, setName] = useState(initialName);
  const [distillery, setDistillery] = useState("");
  const [proof, setProof] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [selectedTypeName, setSelectedTypeName] = useState<string | null>(null);
  const [whiskeyTypes, setWhiskeyTypes] = useState<WhiskeyTypeRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;
    setName(initialName);
    setDistillery("");
    setProof("");
    setSelectedTypeId(null);
    setSelectedTypeName(null);
    setError("");
    setSaving(false);
  }, [visible, initialName]);

  useEffect(() => {
    if (!visible) return;
    fetchWhiskeyTypes().then(setWhiskeyTypes).catch(() => {});
  }, [visible]);

  function handleClose() {
    onClose();
  }

  async function handleSave() {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }

    let proofNum: number | null = null;
    if (proof.trim()) {
      proofNum = parseFloat(proof.trim());
      if (isNaN(proofNum) || proofNum < 0 || proofNum > 200) {
        setError("Proof must be a number between 0 and 200.");
        return;
      }
    }

    setError("");
    setSaving(true);
    try {
      const whiskeyId = await createCustomWhiskey({
        displayName: trimmedName,
        distillery: distillery.trim() || null,
        proof: proofNum,
        whiskeyTypeId: selectedTypeId,
      });
      onCreated(whiskeyId, trimmedName);
    } catch (e: any) {
      setError(e?.message ?? "Failed to create whiskey.");
    } finally {
      setSaving(false);
    }
  }

  const proofNum = parseFloat(proof.trim());
  const proofValid = proof.trim().length > 0 && !isNaN(proofNum) && proofNum >= 0 && proofNum <= 200;
  const canSave =
    name.trim().length >= 2 &&
    distillery.trim().length >= 1 &&
    proofValid &&
    selectedTypeId !== null &&
    !saving;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
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
          <Pressable onPress={handleClose}>
            <Text style={[type.button, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
          <Text style={[type.sectionHeader, { color: colors.textPrimary }]}>Add Custom Whiskey</Text>
          <Pressable onPress={handleSave} disabled={!canSave}>
            {saving ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Text style={[type.button, { color: canSave ? colors.accent : colors.textMuted }]}>
                Add
              </Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name + Distillery + Proof */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.borderStrong,
              ...shadows.card,
              padding: spacing.lg,
              gap: spacing.md,
            }}
          >
            <View style={{ gap: spacing.xs }}>
              <FieldLabel label="Whiskey Name" required />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Buffalo Trace"
                placeholderTextColor={colors.textMuted}
                autoFocus
                returnKeyType="next"
                style={inputStyle}
              />
            </View>

            <View style={{ height: 1, backgroundColor: colors.divider }} />

            <View style={{ gap: spacing.xs }}>
              <FieldLabel label="Distillery" required />
              <TextInput
                value={distillery}
                onChangeText={setDistillery}
                placeholder="e.g. Buffalo Trace Distillery"
                placeholderTextColor={colors.textMuted}
                returnKeyType="next"
                style={inputStyle}
              />
            </View>

            <View style={{ height: 1, backgroundColor: colors.divider }} />

            <View style={{ gap: spacing.xs }}>
              <FieldLabel label="Proof" required />
              <TextInput
                value={proof}
                onChangeText={setProof}
                placeholder="e.g. 90"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                style={inputStyle}
              />
            </View>
          </View>

          {/* Whiskey Type chip grid */}
          {whiskeyTypes.length > 0 ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: colors.borderStrong,
                ...shadows.card,
                padding: spacing.lg,
                gap: spacing.md,
              }}
            >
              <FieldLabel label="Whiskey Type" required />
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
                {whiskeyTypes.map((wt) => {
                  const active = selectedTypeId === wt.id;
                  return (
                    <Pressable
                      key={wt.id}
                      onPress={() => {
                        if (active) {
                          setSelectedTypeId(null);
                          setSelectedTypeName(null);
                        } else {
                          setSelectedTypeId(wt.id);
                          setSelectedTypeName(wt.name);
                        }
                      }}
                      style={({ pressed }) => ({
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: active ? colors.accent : colors.divider,
                        backgroundColor: active ? colors.accentSoft : "transparent",
                        opacity: pressed ? 0.85 : 1,
                      })}
                    >
                      <Text
                        style={[
                          type.button,
                          { fontSize: 13, color: active ? colors.textPrimary : colors.textMuted },
                        ]}
                      >
                        {wt.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {selectedTypeName ? (
                <Text style={[type.caption, { color: colors.accent }]}>
                  Selected: {selectedTypeName}
                </Text>
              ) : null}
            </View>
          ) : null}

          {error ? (
            <Text style={[type.caption, { color: colors.danger }]}>{error}</Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
