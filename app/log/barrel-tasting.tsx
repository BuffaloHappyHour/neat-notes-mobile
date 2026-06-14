// app/log/barrel-tasting.tsx
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { Card } from "../../components/ui/Card";
import { AppToast } from "../../src/components/ui/AppToast";
import { RefineModal } from "../../src/log/components/refine/RefineModal";
import FlavorNotesSection from "../../src/log/components/tasting/FlavorNotesSection";
import RatingSection from "../../src/log/components/tasting/RatingSection";
import TastingSignalsSection from "../../src/log/components/tasting/TastingSignalsSection";
import { Pill } from "../../src/log/components/ui/Pill";
import { SectionGroupHeader } from "../../src/log/components/ui/SectionGroupHeader";
import {
  useFlavorNodesEngine,
  type FlavorNode,
} from "../../src/log/hooks/useFlavorNodes";
import { asString } from "../../src/log/utils/text";
import {
  getBarrelDetail,
  saveBarrelTasting,
  type BarrelDetail,
} from "../../lib/barrelApi";
import { radii } from "../../lib/radii";
import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

export default function BarrelTastingScreen() {
  const params = useLocalSearchParams<{
    barrelId?: string | string[];
    eventId?: string | string[];
  }>();

  const barrelId = (asString(params.barrelId) ?? "").trim();
  const eventId = (asString(params.eventId) ?? "").trim() || null;

  const [barrel, setBarrel] = useState<BarrelDetail | null>(null);
  const [barrelLoading, setBarrelLoading] = useState(true);

  const [rating, setRating] = useState<number | null>(null);
  const [textureLevel, setTextureLevel] = useState<number | null>(null);
  const [proofIntensity, setProofIntensity] = useState<number | null>(null);
  const [flavorIntensity, setFlavorIntensity] = useState<number | null>(null);
  const [personalNotes, setPersonalNotes] = useState("");
  const [flavorTags, setFlavorTags] = useState<string[]>([]);
  const [sentimentById, setSentimentById] = useState<
    Record<string, "LIKE" | "NEUTRAL" | "DISLIKE">
  >({});

  const [saving, setSaving] = useState(false);
  const [flavorNotesMissing, setFlavorNotesMissing] = useState(false);
  const [isSliding, setIsSliding] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastTitle, setToastTitle] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  function showToast(title: string, message?: string) {
    setToastTitle(title);
    setToastMessage(message ?? "");
    setToastVisible(true);
  }

  // ── Flavor nodes engine ────────────────────────────────────────────────────

  const engine = useFlavorNodesEngine({
    flavorTags,
    setFlavorTags,
    initialSelectedNodeIds: [],
  });

  const {
    refineOpen,
    setRefineOpen,
    refineSearch,
    setRefineSearch,
    refinePath,
    setRefinePath,
    refineSort,
    setRefineSort,
    addFamilyOpen,
    setAddFamilyOpen,

    nodesLoading,
    nodesError,
    fetchFlavorNodes,

    byId,
    byParent,
    topLevelNodes,
    rootLabelById,
    ALL_TOP_LEVEL_LABELS,

    scopedRootIds,
    visibleNodes,

    selectedNodeIds,
    setSelectedNodeIds,
    toggleNodeId,

    applySort,
    isFinishLabel,
    normalizeKey,
    safeText,
    getTopLevelLabelForNode,

    addableFamilies,
    addFamilyLabel: engineAddFamilyLabel,

    replaceTastingFlavorNodes,
    replaceTastingFlavorNodesWithSentiment,
  } = engine;

  // ── Load barrel detail ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!barrelId) {
      setBarrelLoading(false);
      return;
    }
    let alive = true;
    setBarrelLoading(true);
    getBarrelDetail(barrelId)
      .then((d) => { if (alive) { setBarrel(d); setBarrelLoading(false); } })
      .catch(() => { if (alive) setBarrelLoading(false); });
    return () => { alive = false; };
  }, [barrelId]);

  useEffect(() => {
    if (flavorNotesMissing) setFlavorNotesMissing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flavorTags, selectedNodeIds]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const selectedCountText = useMemo(() => {
    const n = selectedNodeIds.length;
    if (n <= 0) return "No refined notes";
    if (n === 1) return "1 refined note";
    return `${n} refined notes`;
  }, [selectedNodeIds.length]);

  const selectedNodeLabelsPreview = useMemo(() => {
    const labels: string[] = [];
    for (const id of selectedNodeIds.slice(0, 3)) {
      const n = byId.get(id);
      const lbl = safeText(n?.label);
      if (lbl) labels.push(lbl);
    }
    const extra = selectedNodeIds.length - labels.length;
    const base = labels.join(", ");
    if (!base) return "";
    return extra > 0 ? `${base} +${extra}` : base;
  }, [selectedNodeIds, byId]);

  const additionalNotesLine = useMemo(() => {
    if (!selectedNodeIds.length) return "";
    return "These refined notes help us learn your palate with more detail.";
  }, [selectedNodeIds.length]);

  const refineBreadcrumb = useMemo(() => {
    if (!refinePath.length) return "All";
    const labels = refinePath
      .map((id) => safeText(byId.get(id)?.label))
      .filter(Boolean);
    return labels.length ? labels.join(" › ") : "All";
  }, [refinePath, byId]);

  function openRefine() { setRefineOpen(true); }

  function closeRefine() {
    setRefineOpen(false);
    setRefineSearch("");
    setRefinePath([]);
    setAddFamilyOpen(false);
  }

  function toggleFlavor(tag: string) {
    const t = safeText(tag);
    if (!t) return;
    setFlavorTags((prev) => {
      const has = prev.includes(t);
      const next = has ? prev.filter((x) => x !== t) : [...prev, t];
      return next.filter((x) => !isFinishLabel(x) && normalizeKey(x) !== "dislikes");
    });
  }

  // ── Render node row (same pattern as cloud-tasting) ───────────────────────

  function renderNodeRow(n: FlavorNode, allowMore: boolean) {
    const active = selectedNodeIds.includes(n.id);
    const children = byParent.get(n.id) ?? [];
    const hasChildren = children.length > 0;

    const fam = safeText(n.family);
    const lbl = safeText(n.label);
    const showFamily = fam && normalizeKey(fam) !== normalizeKey(lbl);

    return (
      <View
        key={n.id}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 12,
          borderRadius: radii.md,
          borderWidth: active ? 2 : 1,
          borderColor: active ? colors.accent : colors.divider,
          backgroundColor: active ? colors.highlight : "transparent",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <Pressable
          onPress={() => toggleNodeId(n.id)}
          style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.92 : 1 })}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text
                style={[type.body, { fontWeight: active ? "900" : "800", opacity: active ? 1 : 0.92 }]}
                numberOfLines={1}
              >
                {lbl}
              </Text>
              {showFamily ? (
                <Text style={[type.microcopyItalic, { opacity: 0.68 }]} numberOfLines={1}>
                  {fam}
                </Text>
              ) : null}
            </View>
            <Ionicons
              name={active ? "checkmark-circle" : "ellipse-outline"}
              size={20}
              color={active ? colors.accent : colors.textSecondary}
            />
          </View>
        </Pressable>

        {allowMore && hasChildren ? (
          <Pressable
            onPress={() => { setRefineSearch(""); setRefinePath((p) => [...p, n.id]); }}
            style={({ pressed }) => ({
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.divider,
              backgroundColor: pressed ? colors.highlight : "transparent",
            })}
          >
            <Text style={[type.microcopyItalic, { opacity: 0.85 }]}>More</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  async function onSave() {
    if (saving) return;

    if (flavorTags.length === 0 && selectedNodeIds.length === 0) {
      setFlavorNotesMissing(true);
      return;
    }

    setSaving(true);
    try {
      // Build sentiment map for selected nodes
      const finalSentimentById: Record<string, "LIKE" | "NEUTRAL" | "DISLIKE"> = {};
      for (const id of selectedNodeIds) {
        finalSentimentById[id] = sentimentById[id] ?? "NEUTRAL";
      }

      await saveBarrelTasting({
        barrelId,
        eventId,
        rating,
        textureLevel,
        proofIntensity,
        flavorIntensity,
        personalNotes,
        selectedNodeIds,
        sentimentById: finalSentimentById,
      });

      if (eventId) {
        router.replace(
          `/event/${encodeURIComponent(eventId)}?toastTitle=${encodeURIComponent("Tasting saved")}&toastMessage=${encodeURIComponent("Your barrel tasting has been saved.")}` as any
        );
      } else {
        showToast("Saved", "Your barrel tasting has been saved.");
      }
    } catch (e: any) {
      Alert.alert("Save failed", String(e?.message ?? e ?? "Save failed"));
    } finally {
      setSaving(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const barrelTitle = barrel
    ? `${barrel.distilleryName} #${barrel.barrelNumber}`
    : "Barrel Tasting";

  return (
    <>
      <Stack.Screen
        options={{
          title: "Barrel Tasting",
          headerStyle: { backgroundColor: colors.background as any },
          headerTintColor: colors.textPrimary as any,
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
            >
              <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={onSave}
              disabled={saving}
              style={({ pressed }) => ({
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                opacity: saving ? 0.5 : pressed ? 0.8 : 1,
              })}
            >
              <Text style={[type.button, { color: colors.accent }]}>
                {saving ? "Saving…" : "Save"}
              </Text>
            </Pressable>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
      >
        <ScrollView
          style={{ flex: 1, backgroundColor: "transparent" }}
          contentContainerStyle={{ paddingBottom: spacing.xl * 6 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          scrollEnabled={!isSliding}
        >
          <View
            style={{
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.lg,
              paddingBottom: spacing.xl * 2,
              gap: spacing.lg,
            }}
          >
            {barrelLoading ? (
              <View style={{ paddingVertical: spacing.xl, alignItems: "center" }}>
                <ActivityIndicator />
                <Text style={[type.body, { marginTop: spacing.sm, opacity: 0.7 }]}>
                  Loading…
                </Text>
              </View>
            ) : (
              <>
                {/* Barrel header */}
                <View style={{ alignItems: "center", gap: spacing.sm }}>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: 28,
                      lineHeight: 34,
                      fontWeight: "900",
                      fontFamily: type.screenTitle?.fontFamily ?? type.body.fontFamily,
                      textAlign: "center",
                    }}
                  >
                    {barrelTitle}
                  </Text>
                  <View
                    style={{
                      width: 120,
                      height: 4,
                      borderRadius: 999,
                      backgroundColor: colors.accent,
                      opacity: 0.9,
                    }}
                  />
                </View>

                {/* Barrel detail card */}
                {barrel ? (
                  <View
                    style={{
                      borderRadius: radii.lg,
                      borderWidth: 1,
                      borderColor: colors.glassBorder,
                      backgroundColor: colors.glassRaised,
                      padding: spacing.md,
                      gap: spacing.xs,
                    }}
                  >
                    <Text style={[type.labelCaps, { color: colors.accent, letterSpacing: 1.1, marginBottom: 4 }]}>
                      Direct from Barrel
                    </Text>
                    {[
                      { label: "Distillery", value: barrel.distilleryName },
                      { label: "Barrel #", value: barrel.barrelNumber },
                      barrel.whiskeyTypeName ? { label: "Type", value: barrel.whiskeyTypeName } : null,
                      barrel.proof != null ? { label: "Proof", value: `${barrel.proof}` } : null,
                      barrel.ageMonths != null
                        ? {
                            label: "Age",
                            value:
                              barrel.ageMonths >= 12
                                ? `${Math.floor(barrel.ageMonths / 12)} yr ${barrel.ageMonths % 12 > 0 ? `${barrel.ageMonths % 12} mo` : ""}`.trim()
                                : `${barrel.ageMonths} mo`,
                          }
                        : null,
                      barrel.mashBill ? { label: "Mash Bill", value: barrel.mashBill } : null,
                    ]
                      .filter((r): r is { label: string; value: string } => r !== null && !!r.value)
                      .map((row) => (
                        <View
                          key={row.label}
                          style={{ flexDirection: "row", gap: spacing.sm }}
                        >
                          <Text
                            style={[
                              type.microcopyItalic,
                              { color: colors.textSecondary, minWidth: 80 },
                            ]}
                          >
                            {row.label}
                          </Text>
                          <Text style={[type.body, { flex: 1, color: colors.textPrimary }]}>
                            {row.value}
                          </Text>
                        </View>
                      ))}
                  </View>
                ) : null}

                <RatingSection
                  locked={false}
                  rating={rating}
                  setRating={setRating}
                  onSlidingChange={(s: boolean) => setIsSliding(s)}
                />

                <TastingSignalsSection
                  locked={false}
                  textureLevel={textureLevel}
                  proofIntensity={proofIntensity}
                  flavorIntensity={flavorIntensity}
                  setTextureLevel={setTextureLevel}
                  setProofIntensity={setProofIntensity}
                  setFlavorIntensity={setFlavorIntensity}
                />

                <FlavorNotesSection
                  locked={false}
                  allTopLevelLabels={ALL_TOP_LEVEL_LABELS}
                  flavorTags={flavorTags}
                  toggleFlavor={toggleFlavor}
                  additionalNotesLine={additionalNotesLine}
                  openRefine={openRefine}
                  selectedNodeIds={selectedNodeIds}
                  selectedCountText={selectedCountText}
                  selectedNodeLabelsPreview={selectedNodeLabelsPreview}
                  highlight={flavorNotesMissing}
                  validationMessage={
                    flavorNotesMissing
                      ? "Add at least one flavor note to save your tasting"
                      : undefined
                  }
                />

                <Card tight>
                  <Text style={type.sectionHeader}>Personal notes</Text>
                  <Text
                    style={[type.microcopyItalic, { color: colors.textSecondary, marginTop: 2 }]}
                  >
                    Add any freeform tasting thoughts, reminders, or details you want to remember.
                  </Text>
                  <TextInput
                    value={personalNotes}
                    onChangeText={setPersonalNotes}
                    placeholder="Write your tasting notes here..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    textAlignVertical="top"
                    style={{
                      marginTop: spacing.md,
                      minHeight: 140,
                      paddingVertical: spacing.md,
                      paddingHorizontal: spacing.md,
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: colors.divider,
                      backgroundColor: "transparent",
                      color: colors.textPrimary,
                      fontSize: 16,
                      lineHeight: 22,
                      fontFamily: type.body.fontFamily,
                    }}
                  />
                </Card>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <RefineModal
        visible={refineOpen}
        locked={false}
        refineSearch={refineSearch}
        setRefineSearch={setRefineSearch}
        refinePath={refinePath}
        setRefinePath={(updater: any) => setRefinePath(updater)}
        refineSort={refineSort as any}
        setRefineSort={setRefineSort as any}
        addFamilyOpen={addFamilyOpen}
        setAddFamilyOpen={(updater: any) => setAddFamilyOpen(updater)}
        scopedRootIds={scopedRootIds}
        selectedCountText={selectedCountText}
        refineBreadcrumb={refineBreadcrumb}
        closeRefine={closeRefine}
        fetchFlavorNodes={() => fetchFlavorNodes()}
        addableFamilies={addableFamilies}
        addFamilyLabel={(lbl: string) => engineAddFamilyLabel(lbl)}
        Pill={Pill}
        SectionGroupHeader={SectionGroupHeader}
        renderNodeRow={renderNodeRow}
        nodesLoading={nodesLoading}
        nodesError={nodesError}
        visibleNodes={visibleNodes}
        rootLabelById={rootLabelById}
        byParent={byParent}
        applySort={applySort}
        isFinishLabel={isFinishLabel}
        topLevelNodes={topLevelNodes}
        normalizeKey={normalizeKey}
        safeText={safeText}
        getTopLevelLabelForNode={getTopLevelLabelForNode}
        byId={byId}
        selectedNodeIds={selectedNodeIds}
        setSelectedNodeIds={setSelectedNodeIds}
        sentimentById={sentimentById}
        setSentimentById={setSentimentById}
      />

      <AppToast
        visible={toastVisible}
        title={toastTitle}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
      />
    </>
  );
}
