// app/log/cloud-tasting.tsx
// ====== SECTION: Imports ======
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams, type Href } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";

import { Card } from "../../components/ui/Card";
import { RefineModal } from "../../src/log/components/refine/RefineModal";
import { BottleDetailsCard } from "../../src/log/components/tasting/BottleDetailsCard";
import { PersonalNotesSection } from "../../src/log/components/tasting/PersonalNotesSection";
import { QuickNotesSection } from "../../src/log/components/tasting/QuickNotesSection";
import RatingSection from "../../src/log/components/tasting/RatingSection";
import { NotesGrid } from "../../src/log/components/ui/NotesGrid";
import { Pill } from "../../src/log/components/ui/Pill";
import { type Reaction } from "../../src/log/components/ui/ReactionList";
import { SectionGroupHeader } from "../../src/log/components/ui/SectionGroupHeader";
import { useFlavorNodesEngine, type FlavorNode } from "../../src/log/hooks/useFlavorNodes";
import { usePostSaveMetadata } from "../../src/log/hooks/usePostSaveMetadata";
import { loadTastingById } from "../../src/log/services/tastingLoad.service";
import { saveCloudTasting } from "../../src/log/services/tastingSave.service";

import { radii } from "../../lib/radii";
import { spacing } from "../../lib/spacing";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

// ✅ UTIL + SERVICES (extracted)
import {
  asString,
  cleanText,
  isUuid,
  normalizeKey,
  safeText,
  uniqStringsKeepOrder
} from "../../src/log/utils/text";

// ✅ ANALYTICS
import { trackTastingStart } from "../../lib/analytics";

// ====== SECTION: Types ======

type CloudTastingRow = {
  id: string;
  whiskey_id?: string | null;
  whiskey_name: string | null;
  rating: number | null;
  nose_reaction: string | null;
  taste_reaction: string | null;
  source_type: string | null;
  bar_name: string | null;
  flavor_tags?: string[] | null;
  dislike_tags?: string[] | null;
  personal_notes?: string | null;
};

type WhiskeyRow = {
  distillery: string | null;
  whiskey_type: string | null;
  proof: number | null;
  age: number | null;
  category: string | null;
  region: string | null;
  sub_region: string | null;
};

type WhiskeyMeta = {
  distillery?: string | null;
  whiskey_type?: string | null;
  category?: string | null;
  region?: string | null;
  sub_region?: string | null;
  proof?: number | null;
  age?: number | null;
};

// ====== SECTION: Controlled Select (NO TYPING) ======

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
                    backgroundColor: active ? colors.highlight : pressed ? colors.highlight : "transparent",
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

// ====== SECTION: Screen ======
export default function CloudTastingScreen() {
  const params = useLocalSearchParams<{
    tastingId?: string | string[];
    whiskeyName?: string | string[];
    whiskeyId?: string | string[];
    lockName?: string | string[];
  }>();

  const tastingId = (asString(params.tastingId) ?? "").trim();
  const routeWhiskeyName = (asString(params.whiskeyName) ?? "").trim();
  const routeWhiskeyIdRaw = (asString(params.whiskeyId) ?? "").trim();

  const lockNameParam = (asString(params.lockName) ?? "0").trim();
  const lockName = lockNameParam === "1";

  const isExisting = !!tastingId;

  const postSaveMeta = usePostSaveMetadata();
  const [loading, setLoading] = useState(isExisting);
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(isExisting);
  const [sentimentById, setSentimentById] = useState<Record<string, "LIKE" | "NEUTRAL" | "DISLIKE">>({});

  const [name, setName] = useState(routeWhiskeyName || "");
  const [rating, setRating] = useState<number | null>(null);

  const [nose, setNose] = useState<Reaction>(null);
  const [taste, setTaste] = useState<Reaction>(null);

  const [personalNotes, setPersonalNotes] = useState("");

  const [whiskeyId, setWhiskeyId] = useState<string | null>(
    isUuid(routeWhiskeyIdRaw) ? routeWhiskeyIdRaw : null
  );

  const [whiskeyMeta, setWhiskeyMeta] = useState<WhiskeyMeta | null>(null);

  // ----- Post-save metadata modal state -----
  const [metaOpen, setMetaOpen] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaSaving, setMetaSaving] = useState(false);
  const [postSaveTargetWhiskeyId, setPostSaveTargetWhiskeyId] = useState<string | null>(null);
  const [pendingNavigateTo, setPendingNavigateTo] = useState<Href | null>(null);

  const [taxCategories, setTaxCategories] = useState<string[]>([]);
  const [taxRegions, setTaxRegions] = useState<string[]>([]);
  const [taxSubRegions, setTaxSubRegions] = useState<string[]>([]);

  // Form values (only for modal)
  const [fDistillery, setFDistillery] = useState("");
  const [fType, setFType] = useState<string | null>(null);
  const [fProof, setFProof] = useState("");
  const [fAge, setFAge] = useState("");
  const [fCategory, setFCategory] = useState<string | null>(null);
  const [fRegion, setFRegion] = useState<string | null>(null);
  const [fSubRegion, setFSubRegion] = useState<string | null>(null);

  const [metaMissingKeys, setMetaMissingKeys] = useState<string[]>([]);

  const FALLBACK_DISLIKE_TAGS = useMemo(
    () => [
      "Too Sweet",
      "Too Oaky",
      "Too Spicy",
      "Too Smoky",
      "Too Fruity",
      "Too Floral",
      "Too Nutty",
      "Too Grainy",
      "Too Herbal",
      "Too Peaty",
      "Too Hot (proof)",
    ],
    []
  );

  const [flavorTags, setFlavorTags] = useState<string[]>([]);
  const [dislikeTags, setDislikeTags] = useState<string[]>([]);
  const [noDislikes, setNoDislikes] = useState(true);

  const [sourceType, setSourceType] = useState<"purchased" | "bar">("purchased");
  const [barName, setBarName] = useState("");

  const [isSliding, setIsSliding] = useState(false);
  const startedRef = useRef(false);

  // ====== SECTION: Flavor Nodes Engine ======

  const engine = useFlavorNodesEngine({
    flavorTags,
    setFlavorTags,
    fallbackDislikeTags: FALLBACK_DISLIKE_TAGS,
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
    allNodes,

    byId,
    byParent,
    topLevelNodes,
    rootLabelById,
    ALL_TOP_LEVEL_LABELS,
    DISLIKE_TAGS,

    scopedRootIds,
    visibleNodes,

    selectedNodeIds,
    setSelectedNodeIds,
    toggleNodeId,

    applySort,
    isFinishLabel,
    normalizeKey: engineNormalizeKey,
    safeText: engineSafeText,
    getTopLevelLabelForNode,

    addableFamilies,
    addFamilyLabel: engineAddFamilyLabel,

    loadTastingFlavorNodes,
    replaceTastingFlavorNodes,
    replaceTastingFlavorNodesWithSentiment,
  } = engine;

  // ====== SECTION: Analytics start event ======

  useEffect(() => {
    if (startedRef.current) return;
    if (isExisting && loading) return;

    startedRef.current = true;
    trackTastingStart({
      screen: "cloud-tasting",
      whiskey_id: whiskeyId,
      existing: isExisting,
      source_type: sourceType,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExisting, loading]);

  // ====== SECTION: Derived UI helpers ======

  const barNameMissing = sourceType === "bar" && barName.trim().length < 2;

  const hasBottleDetails =
    !!whiskeyMeta?.category ||
    !!whiskeyMeta?.region ||
    !!whiskeyMeta?.sub_region ||
    !!whiskeyMeta?.whiskey_type ||
    (whiskeyMeta?.proof != null && Number.isFinite(Number(whiskeyMeta.proof))) ||
    (whiskeyMeta?.age != null && Number.isFinite(Number(whiskeyMeta.age))) ||
    !!whiskeyMeta?.distillery;

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
    const labels = refinePath.map((id) => safeText(byId.get(id)?.label)).filter(Boolean);
    return labels.length ? labels.join(" › ") : "All";
  }, [refinePath, byId]);

  function openRefine() {
    setRefineOpen(true);
  }

  function closeRefine() {
    setRefineOpen(false);
    setRefineSearch("");
    setRefinePath([]);
    setAddFamilyOpen(false);
  }

  // ====== SECTION: Dislikes ======

  function setNoDislikesActive() {
    setNoDislikes(true);
    setDislikeTags([]);
  }

  function toggleFlavor(tag: string) {
    const t = safeText(tag);
    if (!t) return;

    setFlavorTags((prev) => {
      const has = prev.includes(t);
      const next = has ? prev.filter((x) => x !== t) : [...prev, t];
      // never allow Finish/Dislikes as top-level tags
      return next.filter((x) => !isFinishLabel(x) && normalizeKey(x) !== "dislikes");
    });
  }

  function toggleDislike(tag: string) {
    const t = safeText(tag);
    if (!t) return;

    // selecting any dislike disables "no dislikes"
    setNoDislikes(false);

    setDislikeTags((prev) => {
      const has = prev.includes(t);
      const next = has ? prev.filter((x) => x !== t) : [...prev, t];
      return uniqStringsKeepOrder(next);
    });
  }

  // If user clears all dislikes manually, treat as "No dislikes"
  useEffect(() => {
    if (dislikeTags.length === 0) setNoDislikes(true);
  }, [dislikeTags.length]);

  // ====== SECTION: Load existing tasting ======

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!isExisting) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const loaded = await loadTastingById(tastingId);
        if (!loaded || !alive) return;

        setName(loaded.whiskeyName);
        setWhiskeyId(loaded.whiskeyId);
        setRating(loaded.rating);

        setNose(loaded.noseReaction as any);
        setTaste(loaded.tasteReaction as any);

        setFlavorTags(loaded.flavorTags);
        setDislikeTags(loaded.dislikeTags);
        setNoDislikes(loaded.dislikeTags.length === 0);

        setPersonalNotes(loaded.personalNotes);
        setSourceType(loaded.sourceType);
        setBarName(loaded.barName);

        const sel = await loadTastingFlavorNodes(tastingId);
        if (!alive) return;
        setSelectedNodeIds(sel);

        setLocked(true);
      } catch (e: any) {
        if (!alive) return;
        Alert.alert("Couldn’t load tasting", String(e?.message ?? e));
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    void run();
    return () => {
      alive = false;
    };
  }, [isExisting, tastingId, loadTastingFlavorNodes, setSelectedNodeIds]);

  // ====== SECTION: Data Fetching (whiskey meta) ======

  useEffect(() => {
    let alive = true;

    async function run() {
      const wid = whiskeyId && isUuid(whiskeyId) ? whiskeyId : null;
      if (!wid) {
        setWhiskeyMeta(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("whiskeys")
          .select("distillery, whiskey_type, proof, age, category, region, sub_region")
          .eq("id", wid)
          .maybeSingle();

        if (error) throw new Error(error.message);
        if (!alive) return;

        const row = (data as any) ?? null;
        const meta: WhiskeyMeta | null = row
          ? {
              distillery: cleanText(row.distillery),
              whiskey_type: cleanText(row.whiskey_type),
              category: cleanText(row.category),
              region: cleanText(row.region),
              sub_region: cleanText(row.sub_region),
              proof:
                row.proof == null || !Number.isFinite(Number(row.proof)) ? null : Number(row.proof),
              age: row.age == null || !Number.isFinite(Number(row.age)) ? null : Number(row.age),
            }
          : null;

        setWhiskeyMeta(meta);
      } catch {
        if (!alive) return;
        setWhiskeyMeta(null);
      }
    }

    void run();
    return () => {
      alive = false;
    };
  }, [whiskeyId]);

  // ====== SECTION: Refine rendering ======

function renderNodeRow(n: FlavorNode, allowMore: boolean) {
  const active = selectedNodeIds.includes(n.id);
  const children = byParent.get(n.id) ?? [];
  const hasChildren = children.length > 0;

  const fam = safeText(n.family);
  const lbl = safeText(n.label);
  const showFamily = fam && normalizeKey(fam) !== normalizeKey(lbl);

  const baseRowStyle = {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    borderWidth: active ? 2 : 1,
    borderColor: active ? colors.accent : colors.divider,
    backgroundColor: active ? colors.highlight : "transparent",
    opacity: locked ? 0.6 : 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: 10,
  };

  return (
    <View key={n.id} style={baseRowStyle}>
      {/* Left area: select toggle */}
      <Pressable
        disabled={locked}
        onPress={() => toggleNodeId(n.id)}
        style={({ pressed }) => ({
          flex: 1,
          opacity: locked ? 0.6 : pressed ? 0.92 : 1,
        })}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                type.body,
                { fontWeight: active ? "900" : "800", opacity: active ? 1 : 0.92 },
              ]}
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

      {/* Right area: More (sibling pressable, NOT nested) */}
      {allowMore && hasChildren ? (
        <Pressable
          disabled={locked}
          onPress={() => {
            setRefineSearch("");
            setRefinePath((p) => [...p, n.id]);
          }}
          style={({ pressed }) => ({
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.divider,
            backgroundColor: pressed ? colors.highlight : "transparent",
            opacity: locked ? 0.6 : 1,
          })}
        >
          <Text style={[type.microcopyItalic, { opacity: 0.85 }]}>More</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

  // ====== SECTION: Save/Upsert Logic ======

  function onEdit() {
    setLocked(false);
  }

  async function onSave() {
    if (saving) return;

    setSaving(true);
    try {
      const result = await saveCloudTasting({
        isExisting,
        tastingId,

        name,
        rating,
        nose,
        taste,
        personalNotes,

        whiskeyId,
        flavorTags,
        dislikeTags,
        noDislikes,
        selectedNodeIds,
        getTopLevelLabelForNode,
        isFinishLabel,
        sentimentById,
        sourceType,
        barName,

        lockName,

        replaceTastingFlavorNodes,
      });

      setLocked(true);

      // post-save gating
      if (result.whiskeyId) {
        const to = await postSaveMeta.maybeOpenPostSaveMetadata(
          result.whiskeyId,
          `/whiskey/${encodeURIComponent(result.whiskeyId)}`
        );
        if (to) router.replace(to);
      } else {
        router.replace("/profile");
      }
    } catch (e: any) {
      const msg = String(e?.message ?? e ?? "Save failed");
      const isOffline = !!e?.isOffline;

      if (isOffline) {
        Alert.alert(
          "Not saved",
          "You appear to be offline or your connection dropped. This tasting was not saved.\n\nReconnect and tap Retry.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Retry", onPress: () => onSave() },
          ]
        );
      } else {
        Alert.alert("Save failed", msg);
      }
    } finally {
      setSaving(false);
    }
  }

  // ====== SECTION: Render ======

  return (
    <>
      <Stack.Screen
        options={{
          title: isExisting ? "Tasting" : "New Tasting",
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
          headerRight: () => {
            const isLockedExisting = isExisting && locked;

            return (
              <Pressable
                onPress={isLockedExisting ? onEdit : onSave}
                disabled={saving}
                style={({ pressed }) => ({
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  opacity: saving ? 0.5 : pressed ? 0.8 : 1,
                })}
              >
                <Text style={[type.button, { color: colors.accent }]}>
                  {saving ? "Saving…" : isLockedExisting ? "Edit" : "Save"}
                </Text>
              </Pressable>
            );
          },
        }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: spacing.xl * 3 }}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!isSliding}
      >
        <View style={{ padding: spacing.xl, gap: spacing.lg }}>
          {loading ? (
            <View style={{ paddingVertical: spacing.xl, alignItems: "center" }}>
              <ActivityIndicator />
              <Text style={[type.body, { marginTop: spacing.sm, opacity: 0.7 }]}>Loading…</Text>
            </View>
          ) : null}
          {/* Whiskey Name (Hero) */}
          <View style={{ alignItems: "center", gap: spacing.sm }}>
            <TextInput
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (!lockName) setWhiskeyId(null);
              }}
              editable={!locked && !(!isExisting && lockName)}
              placeholder="Whiskey name"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
              multiline
              textAlign="center"
              style={{
                paddingVertical: 0,
                paddingHorizontal: 0,
                color: colors.textPrimary,
                fontSize: 34,
                lineHeight: 40,
                fontWeight: "900",
                fontFamily: type.screenTitle?.fontFamily ?? type.body.fontFamily,
                opacity: locked ? 0.92 : 1,
                width: "100%",
              }}
            />

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

{whiskeyId && whiskeyMeta && hasBottleDetails ? (
  <BottleDetailsCard
    detailsLabel="Bottle details"
    rows={[
      { label: "Distillery", value: whiskeyMeta?.distillery ? String(whiskeyMeta.distillery) : "" },
      { label: "Category", value: whiskeyMeta?.category ? String(whiskeyMeta.category) : "" },
      { label: "Region", value: whiskeyMeta?.region ? String(whiskeyMeta.region) : "" },
      { label: "Sub-Region", value: whiskeyMeta?.sub_region ? String(whiskeyMeta.sub_region) : "" },
      { label: "Style", value: whiskeyMeta?.whiskey_type ? String(whiskeyMeta.whiskey_type) : "" },
      {
        label: "Proof",
        value:
          whiskeyMeta?.proof != null && Number.isFinite(Number(whiskeyMeta.proof))
            ? `${Math.round(Number(whiskeyMeta.proof))} proof`
            : "",
      },
      {
        label: "Age",
        value:
          whiskeyMeta?.age != null && Number.isFinite(Number(whiskeyMeta.age))
            ? `${Math.round(Number(whiskeyMeta.age))} yr`
            : "",
      },
    ]}
    defaultOpen={false}
  />
) : null}

<View style={{ height: 1, backgroundColor: colors.divider, opacity: 0.9 }} />
          {/* Rating (extracted) */}
          <RatingSection
            locked={locked}
            rating={rating}
            setRating={setRating}
            onSlidingChange={(s: boolean) => setIsSliding(s)}
          />

          <QuickNotesSection
            locked={locked}
            nose={nose}
            setNose={setNose}
            taste={taste}
            setTaste={setTaste}
            allTopLevelLabels={ALL_TOP_LEVEL_LABELS}
            flavorTags={flavorTags}
            toggleFlavor={toggleFlavor}
            additionalNotesLine={additionalNotesLine}
            openRefine={openRefine}
            selectedNodeIds={selectedNodeIds}
            selectedCountText={selectedCountText}
            selectedNodeLabelsPreview={selectedNodeLabelsPreview}
            scopedRootIds={scopedRootIds}
          />
<View style={{ height: 1, backgroundColor: colors.divider, opacity: 0.9 }} />
          {/* Dislikes (always visible) */}
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={type.sectionHeader}>Anything you disliked?</Text>

              <Pill
                label="No dislikes"
                active={noDislikes || dislikeTags.length === 0}
                disabled={locked}
                onPress={() => setNoDislikesActive()}
              />
            </View>

            <Text style={[type.microcopyItalic, { marginTop: spacing.xs, opacity: 0.85 }]}>
              Optional. Even if you liked the pour overall, this helps us learn your preferences.
            </Text>

            <NotesGrid
              tags={DISLIKE_TAGS}
              selected={dislikeTags}
              onToggle={toggleDislike}
              disabled={locked}
            />
          </Card>

          <PersonalNotesSection
            locked={locked}
            personalNotes={personalNotes}
            setPersonalNotes={setPersonalNotes}
          />
<View style={{ height: 1, backgroundColor: colors.divider, opacity: 0.9 }} />
          {/* Source */}
          <Card>
            <Text style={type.sectionHeader}>Where did you have this bottle?</Text>

            <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.md }}>
              <Pressable
                disabled={locked}
                onPress={() => setSourceType("purchased")}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: spacing.lg,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: sourceType === "purchased" ? colors.accent : colors.divider,
                  backgroundColor: sourceType === "purchased" ? colors.highlight : colors.surface,
                  opacity: locked ? 0.6 : pressed ? 0.92 : 1,
                  alignItems: "center",
                  justifyContent: "center",
                })}
              >
                <Text style={[type.button, { color: colors.textPrimary, textAlign: "center" }]}>
                  Purchased Bottle
                </Text>
              </Pressable>

              <Pressable
                disabled={locked}
                onPress={() => setSourceType("bar")}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: spacing.lg,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: sourceType === "bar" ? colors.accent : colors.divider,
                  backgroundColor: sourceType === "bar" ? colors.highlight : colors.surface,
                  opacity: locked ? 0.6 : pressed ? 0.92 : 1,
                  alignItems: "center",
                  justifyContent: "center",
                })}
              >
                <Text style={[type.button, { color: colors.textPrimary, textAlign: "center" }]}>
                  Bar Pour
                </Text>
              </Pressable>
            </View>

            {sourceType === "bar" ? (
              <View style={{ marginTop: spacing.md, gap: 6 }}>
                <Text style={[type.body, { fontWeight: "900" }]}>Bar name (required)</Text>

                <TextInput
                  value={barName}
                  onChangeText={setBarName}
                  editable={!locked}
                  placeholder="Enter bar name…"
                  placeholderTextColor={colors.textSecondary}
                  style={{
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.md,
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: barNameMissing ? colors.accent : colors.divider,
                    backgroundColor: "transparent",
                    color: colors.textPrimary,
                    fontSize: 16,
                    fontFamily: type.body.fontFamily,
                    opacity: !locked ? 1 : 0.75,
                  }}
                />

                {barNameMissing ? (
                  <Text style={[type.microcopyItalic, { opacity: 0.85, color: colors.accent }]}>
                    Bar name is required for a Bar Pour.
                  </Text>
                ) : null}
              </View>
            ) : null}
          </Card>
        </View>
      </ScrollView>

      {/* Refine modal */}
      <RefineModal
        visible={refineOpen}
        locked={locked}
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
        normalizeKey={engineNormalizeKey}
        safeText={engineSafeText}
        getTopLevelLabelForNode={getTopLevelLabelForNode}
        byId={byId}
        selectedNodeIds={selectedNodeIds}
        setSelectedNodeIds={setSelectedNodeIds}
        sentimentById={sentimentById}
        setSentimentById={setSentimentById}
      />
    </>
  );
}

// ====== SECTION: Reaction helpers (bottom) ======
function reactionLabel(v: Reaction) {
  if (v === "ENJOYED") return "Enjoyed";
  if (v === "NEUTRAL") return "Neutral";
  if (v === "NOT_FOR_ME") return "Not for me";
  return "";
}