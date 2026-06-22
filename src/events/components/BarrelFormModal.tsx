import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
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

import {
  fetchWhiskeyTypes,
  insertDistilleryCandidate,
  searchDistilleries,
  type BarrelDraft,
  type DistilleryResult,
  type WhiskeyTypeRow,
} from "../../../lib/barrelApi";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (draft: BarrelDraft) => void | Promise<void>;
  submitLabel?: string;
  /** When set, distillery is pre-filled and locked; owner-barrel extra fields are shown. */
  fixedDistillery?: { id: string; name: string };
};

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text style={[type.labelCaps, { color: colors.textSecondary, fontSize: 10 }]}>
      {label}
      {required ? (
        <Text style={{ color: colors.danger }}> *</Text>
      ) : null}
    </Text>
  );
}

function RowDivider() {
  return <View style={{ height: 1, backgroundColor: colors.divider }} />;
}

const inputStyle = (base: object) => ({
  ...base,
  color: colors.textPrimary,
  backgroundColor: colors.surfaceSunken,
  borderWidth: 1,
  borderColor: colors.borderStrong,
  borderRadius: radii.md,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  fontSize: 15,
});

export function BarrelFormModal({ visible, onClose, onSubmit, submitLabel = "Add to Lineup", fixedDistillery }: Props) {
  // Distillery state
  const [distilleryQuery, setDistilleryQuery] = useState("");
  const [distilleryResults, setDistilleryResults] = useState<DistilleryResult[]>([]);
  const [selectedDistillery, setSelectedDistillery] = useState<DistilleryResult | null>(null);
  const [distillerySearching, setDistillerySearching] = useState(false);
  const [showNewDistilleryForm, setShowNewDistilleryForm] = useState(false);

  // New distillery form
  const [newName, setNewName] = useState("");
  const [newRegion, setNewRegion] = useState("Other");
  const [newSubRegion, setNewSubRegion] = useState("");
  const [newCategory, setNewCategory] = useState("Other");
  const [savingCandidate, setSavingCandidate] = useState(false);
  const [savedCandidateId, setSavedCandidateId] = useState<string | null>(null);

  // Barrel fields
  const [barrelNumber, setBarrelNumber] = useState("");
  const [whiskeyTypeId, setWhiskeyTypeId] = useState<string | null>(null);
  const [whiskeyTypeName, setWhiskeyTypeName] = useState<string | null>(null);
  const [proof, setProof] = useState("");
  const [ageMonths, setAgeMonths] = useState("");
  const [mashBill, setMashBill] = useState("");
  const [pairingNote, setPairingNote] = useState("");
  // Owner-barrel extras (only shown when fixedDistillery is set)
  const [fillDate, setFillDate] = useState("");
  const [targetAgeMonths, setTargetAgeMonths] = useState("");
  const [notes, setNotes] = useState("");

  // Whiskey type picker
  const [whiskeyTypes, setWhiskeyTypes] = useState<WhiskeyTypeRow[]>([]);
  const [typePickerOpen, setTypePickerOpen] = useState(false);

  // Form meta
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-fill distillery when fixedDistillery is provided
  useEffect(() => {
    if (!visible) return;
    if (fixedDistillery) {
      setSelectedDistillery({ id: fixedDistillery.id, name: fixedDistillery.name, region: null });
    }
  }, [visible, fixedDistillery]);

  // Load whiskey types once on open
  useEffect(() => {
    if (!visible) return;
    fetchWhiskeyTypes()
      .then(setWhiskeyTypes)
      .catch(() => {});
  }, [visible]);

  // Distillery autocomplete
  useEffect(() => {
    if (selectedDistillery || showNewDistilleryForm) {
      setDistilleryResults([]);
      return;
    }
    if (distilleryQuery.trim().length < 2) {
      setDistilleryResults([]);
      return;
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setDistillerySearching(true);
      try {
        const results = await searchDistilleries(distilleryQuery.trim());
        setDistilleryResults(results);
      } catch {
        // ignore
      } finally {
        setDistillerySearching(false);
      }
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [distilleryQuery, selectedDistillery, showNewDistilleryForm]);

  function resetForm() {
    setDistilleryQuery("");
    setDistilleryResults([]);
    setSelectedDistillery(fixedDistillery ? { id: fixedDistillery.id, name: fixedDistillery.name, region: null } : null);
    setShowNewDistilleryForm(false);
    setNewName("");
    setNewRegion("Other");
    setNewSubRegion("");
    setNewCategory("Other");
    setSavingCandidate(false);
    setSavedCandidateId(null);
    setBarrelNumber("");
    setWhiskeyTypeId(null);
    setWhiskeyTypeName(null);
    setProof("");
    setAgeMonths("");
    setMashBill("");
    setPairingNote("");
    setFillDate("");
    setTargetAgeMonths("");
    setNotes("");
    setError("");
    setSubmitting(false);
    setTypePickerOpen(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSaveNewDistillery() {
    if (!newName.trim()) {
      setError("Distillery name is required.");
      return;
    }
    setSavingCandidate(true);
    setError("");
    try {
      const id = await insertDistilleryCandidate({
        name_raw: newName.trim(),
        region: newRegion || "Other",
        sub_region: newSubRegion.trim() || null,
        category: newCategory || "Other",
      });
      setSavedCandidateId(id);
      setSelectedDistillery({ id: "__candidate__", name: newName.trim(), region: newRegion });
      setShowNewDistilleryForm(false);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save distillery.");
    } finally {
      setSavingCandidate(false);
    }
  }

  async function handleSubmit() {
    setError("");
    const hasDistillery = selectedDistillery !== null;
    if (!hasDistillery) {
      setError("Select or add a distillery.");
      return;
    }
    if (!barrelNumber.trim()) {
      setError("Barrel number is required.");
      return;
    }
    if (!whiskeyTypeId) {
      setError("Whiskey type is required.");
      return;
    }
    const proofNum = parseFloat(proof);
    if (!proof.trim() || isNaN(proofNum)) {
      setError("Proof is required.");
      return;
    }

    const isCandidate = selectedDistillery?.id === "__candidate__";
    const draft: BarrelDraft = {
      distilleryId: isCandidate ? null : (selectedDistillery?.id ?? null),
      distilleryCandidateId: isCandidate ? savedCandidateId : null,
      distilleryName: selectedDistillery?.name ?? "",
      barrelNumber: barrelNumber.trim(),
      whiskeyTypeId,
      whiskeyTypeName,
      proof: proofNum,
      ageMonths: ageMonths.trim() ? parseInt(ageMonths.trim(), 10) || null : null,
      mashBill: mashBill.trim() || null,
      pairingNote,
      fillDate: fillDate.trim() || null,
      targetAgeMonths: targetAgeMonths.trim() ? parseInt(targetAgeMonths.trim(), 10) || null : null,
      notes: notes.trim() || null,
    };

    setSubmitting(true);
    try {
      await onSubmit(draft);
      resetForm();
    } catch (e: any) {
      setError(e?.message ?? "Failed to add barrel.");
      setSubmitting(false);
    }
  }

  const canSubmit =
    !!selectedDistillery &&
    !!barrelNumber.trim() &&
    !!whiskeyTypeId &&
    !!proof.trim() &&
    !submitting;

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
          <Text style={[type.sectionHeader, { color: colors.textPrimary }]}>Add Barrel</Text>
          <Pressable onPress={handleSubmit} disabled={!canSubmit}>
            {submitting ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Text
                style={[
                  type.button,
                  { color: canSubmit ? colors.accent : colors.textMuted },
                ]}
              >
                {submitLabel}
              </Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Distillery ── */}
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
            <FieldLabel label="Distillery" required />
            {fixedDistillery ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.accentSoft,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: colors.accent,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                }}
              >
                <Text style={[type.body, { color: colors.textPrimary, fontSize: 15 }]}>
                  {fixedDistillery.name}
                </Text>
              </View>
            ) : selectedDistillery ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.accentSoft,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: colors.accent,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  gap: spacing.sm,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[type.body, { color: colors.textPrimary, fontSize: 15 }]}>
                    {selectedDistillery.name}
                  </Text>
                  {savedCandidateId ? (
                    <Text style={[type.caption, { color: colors.accent }]}>
                      New (pending admin review)
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={() => {
                    setSelectedDistillery(null);
                    setSavedCandidateId(null);
                    setShowNewDistilleryForm(false);
                    setDistilleryQuery("");
                  }}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Ionicons name="close-circle" size={20} color={colors.accent} />
                </Pressable>
              </View>
            ) : showNewDistilleryForm ? (
              <View style={{ gap: spacing.sm }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={[type.caption, { color: colors.textSecondary }]}>
                    New distillery
                  </Text>
                  <Pressable onPress={() => setShowNewDistilleryForm(false)}>
                    <Text style={[type.caption, { color: colors.accent }]}>← Search instead</Text>
                  </Pressable>
                </View>
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Distillery name"
                  placeholderTextColor={colors.textMuted}
                  style={inputStyle(type.body)}
                  autoFocus
                />
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      value={newRegion}
                      onChangeText={setNewRegion}
                      placeholder="Region (e.g. Kentucky)"
                      placeholderTextColor={colors.textMuted}
                      style={inputStyle(type.body)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      value={newSubRegion}
                      onChangeText={setNewSubRegion}
                      placeholder="Sub-region (optional)"
                      placeholderTextColor={colors.textMuted}
                      style={inputStyle(type.body)}
                    />
                  </View>
                </View>
                <TextInput
                  value={newCategory}
                  onChangeText={setNewCategory}
                  placeholder="Category (e.g. Bourbon)"
                  placeholderTextColor={colors.textMuted}
                  style={inputStyle(type.body)}
                />
                <Pressable
                  onPress={handleSaveNewDistillery}
                  disabled={savingCandidate || !newName.trim()}
                  style={({ pressed }) => ({
                    paddingVertical: spacing.sm,
                    borderRadius: radii.md,
                    backgroundColor: colors.accent,
                    alignItems: "center",
                    opacity: savingCandidate || !newName.trim() ? 0.5 : pressed ? 0.85 : 1,
                  })}
                >
                  {savingCandidate ? (
                    <ActivityIndicator size="small" color={colors.background} />
                  ) : (
                    <Text style={[type.button, { color: colors.background }]}>
                      Save Distillery
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <View>
                <TextInput
                  value={distilleryQuery}
                  onChangeText={setDistilleryQuery}
                  placeholder="Search distilleries…"
                  placeholderTextColor={colors.textMuted}
                  style={inputStyle(type.body)}
                />
                {distillerySearching ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.accent}
                    style={{ marginTop: spacing.xs }}
                  />
                ) : null}
                {distilleryResults.length > 0 ? (
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
                    {distilleryResults.map((d) => (
                      <Pressable
                        key={d.id}
                        onPress={() => {
                          setSelectedDistillery(d);
                          setDistilleryQuery("");
                          setDistilleryResults([]);
                        }}
                        style={({ pressed }) => ({
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.sm,
                          backgroundColor: pressed ? colors.surfaceSunken : "transparent",
                          borderBottomWidth: 1,
                          borderBottomColor: colors.divider,
                        })}
                      >
                        <Text style={[type.body, { color: colors.textPrimary, fontSize: 14 }]}>
                          {d.name}
                        </Text>
                        {d.region ? (
                          <Text style={[type.caption, { color: colors.textSecondary }]}>
                            {d.region}
                          </Text>
                        ) : null}
                      </Pressable>
                    ))}
                    <Pressable
                      onPress={() => {
                        setShowNewDistilleryForm(true);
                        setNewName(distilleryQuery.trim());
                        setDistilleryResults([]);
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
                      <Text style={[type.body, { color: colors.accent, fontSize: 14 }]}>
                        Add new distillery
                      </Text>
                    </Pressable>
                  </View>
                ) : distilleryQuery.trim().length >= 2 && !distillerySearching ? (
                  <Pressable
                    onPress={() => {
                      setShowNewDistilleryForm(true);
                      setNewName(distilleryQuery.trim());
                    }}
                    style={({ pressed }) => ({
                      marginTop: spacing.xs,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.sm,
                      opacity: pressed ? 0.75 : 1,
                    })}
                  >
                    <Ionicons name="add-circle-outline" size={16} color={colors.accent} />
                    <Text style={[type.body, { color: colors.accent, fontSize: 14 }]}>
                      Add "{distilleryQuery.trim()}" as new distillery
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          </View>

          {/* ── Barrel Details ── */}
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
            {/* Barrel Number */}
            <View style={{ gap: spacing.xs }}>
              <FieldLabel label="Barrel Number" required />
              <TextInput
                value={barrelNumber}
                onChangeText={setBarrelNumber}
                placeholder="e.g. 1234"
                placeholderTextColor={colors.textMuted}
                style={inputStyle(type.body)}
              />
            </View>

            <RowDivider />

            {/* Whiskey Type */}
            <View style={{ gap: spacing.xs }}>
              <FieldLabel label="Whiskey Type" required />
              <Pressable
                onPress={() => setTypePickerOpen((v) => !v)}
                style={({ pressed }) => ({
                  ...inputStyle({}),
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text
                  style={[
                    type.body,
                    {
                      color: whiskeyTypeName ? colors.textPrimary : colors.textMuted,
                      fontSize: 15,
                    },
                  ]}
                >
                  {whiskeyTypeName ?? "Select type…"}
                </Text>
                <Ionicons
                  name={typePickerOpen ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={colors.textMuted}
                />
              </Pressable>
              {typePickerOpen && whiskeyTypes.length > 0 ? (
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: colors.borderStrong,
                    overflow: "hidden",
                    maxHeight: 200,
                    ...shadows.card,
                  }}
                >
                  <ScrollView nestedScrollEnabled>
                    {whiskeyTypes.map((wt) => (
                      <Pressable
                        key={wt.id}
                        onPress={() => {
                          setWhiskeyTypeId(wt.id);
                          setWhiskeyTypeName(wt.name);
                          setTypePickerOpen(false);
                        }}
                        style={({ pressed }) => ({
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.sm,
                          backgroundColor:
                            wt.id === whiskeyTypeId
                              ? colors.accentSoft
                              : pressed
                              ? colors.surfaceSunken
                              : "transparent",
                          borderBottomWidth: 1,
                          borderBottomColor: colors.divider,
                        })}
                      >
                        <Text
                          style={[
                            type.body,
                            {
                              color:
                                wt.id === whiskeyTypeId ? colors.accent : colors.textPrimary,
                              fontSize: 14,
                            },
                          ]}
                        >
                          {wt.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}
            </View>

            <RowDivider />

            {/* Proof */}
            <View style={{ gap: spacing.xs }}>
              <FieldLabel label="Proof" required />
              <TextInput
                value={proof}
                onChangeText={setProof}
                placeholder="e.g. 110"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                style={inputStyle(type.body)}
              />
            </View>

            <RowDivider />

            {/* Age months */}
            <View style={{ gap: spacing.xs }}>
              <FieldLabel label="Age (months) — optional" />
              <TextInput
                value={ageMonths}
                onChangeText={setAgeMonths}
                placeholder="e.g. 96"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                style={inputStyle(type.body)}
              />
            </View>

            <RowDivider />

            {/* Mash bill */}
            <View style={{ gap: spacing.xs }}>
              <FieldLabel label="Mash Bill — optional" />
              <TextInput
                value={mashBill}
                onChangeText={setMashBill}
                placeholder="e.g. 75% corn, 13% rye, 12% malted barley"
                placeholderTextColor={colors.textMuted}
                style={inputStyle(type.body)}
              />
            </View>

            {fixedDistillery ? (
              <>
                <RowDivider />
                <View style={{ gap: spacing.xs }}>
                  <FieldLabel label="Fill Date — optional" />
                  <TextInput
                    value={fillDate}
                    onChangeText={setFillDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                    style={inputStyle(type.body)}
                  />
                </View>

                <RowDivider />

                <View style={{ gap: spacing.xs }}>
                  <FieldLabel label="Target Age (months) — optional" />
                  <TextInput
                    value={targetAgeMonths}
                    onChangeText={setTargetAgeMonths}
                    placeholder="e.g. 48"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    style={inputStyle(type.body)}
                  />
                </View>

                <RowDivider />

                <View style={{ gap: spacing.xs }}>
                  <FieldLabel label="Notes — optional" />
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Barrel notes…"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                    style={[inputStyle(type.body), { height: 72, textAlignVertical: "top" }]}
                  />
                </View>
              </>
            ) : null}
          </View>

          {error ? (
            <Text style={[type.caption, { color: colors.danger }]}>{error}</Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
