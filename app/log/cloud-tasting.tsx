// app/log/cloud-tasting.tsx
// ====== SECTION: Imports ======
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
import { MetadataModal } from "../../src/log/components/metadata/MetadataModal";
import { RefineModal } from "../../src/log/components/refine/RefineModal";
import { BottleDetailsCard } from "../../src/log/components/tasting/BottleDetailsCard";
import FlavorNotesSection from "../../src/log/components/tasting/FlavorNotesSection";
import { QuickNotesSection } from "../../src/log/components/tasting/QuickNotesSection";
import RatingSection from "../../src/log/components/tasting/RatingSection";
import TastingSignalsSection from "../../src/log/components/tasting/TastingSignalsSection";
import TastingSourceCard from "../../src/log/components/tasting/TastingSourceCard";
import { Pill } from "../../src/log/components/ui/Pill";
import { type Reaction } from "../../src/log/components/ui/ReactionList";
import { SectionGroupHeader } from "../../src/log/components/ui/SectionGroupHeader";
import {
  useFlavorNodesEngine,
  type FlavorNode,
} from "../../src/log/hooks/useFlavorNodes";
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

function GlassCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.glassSurface ?? colors.surface,
          borderRadius: radii.xxl ?? radii.xl,
          borderWidth: 1,
          borderColor:
            colors.glassBorder ?? colors.borderSubtle ?? colors.divider,
          overflow: "hidden",
          padding: spacing.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

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
        <Text
          style={[type.body, { opacity: value ? 0.95 : 0.6 }]}
          numberOfLines={1}
        >
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
                  <Text
                    style={[type.body, { fontWeight: active ? "900" : "800" }]}
                  >
                    {opt}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {!disabled && safeOptions.length === 0 ? (
        <Text style={[type.microcopyItalic, { opacity: 0.7 }]}>
          No options available.
        </Text>
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
  const [sentimentById, setSentimentById] = useState<
    Record<string, "LIKE" | "NEUTRAL" | "DISLIKE">
  >({});

  const [name, setName] = useState(routeWhiskeyName || "");
  const [rating, setRating] = useState<number | null>(null);

  const [textureLevel, setTextureLevel] = useState<number | null>(null);
  const [proofIntensity, setProofIntensity] = useState<number | null>(null);
  const [flavorIntensity, setFlavorIntensity] = useState<number | null>(null);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastTitle, setToastTitle] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  function showToast(title: string, message?: string) {
    setToastTitle(title);
    setToastMessage(message ?? "");
    setToastVisible(true);
  }

  const [nose, setNose] = useState<Reaction>(null);
  const [taste, setTaste] = useState<Reaction>(null);

  const [personalNotes, setPersonalNotes] = useState("");

  const [whiskeyId, setWhiskeyId] = useState<string | null>(
    isUuid(routeWhiskeyIdRaw) ? routeWhiskeyIdRaw : null
  );

  const [whiskeyMeta, setWhiskeyMeta] = useState<WhiskeyMeta | null>(null);

  const [flavorTags, setFlavorTags] = useState<string[]>([]);

  const [sourceType, setSourceType] = useState<"purchased" | "bar">(
    "purchased"
  );
  const [barName, setBarName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [sourceCity, setSourceCity] = useState("");
  const [sourceState, setSourceState] = useState("");
  const [pricePerOz, setPricePerOz] = useState("");
  const [pricePerBottle, setPricePerBottle] = useState("");
  const [bottleSizeMl, setBottleSizeMl] = useState("750");
  const [pourSizeOz, setPourSizeOz] = useState("2");

  const [isSliding, setIsSliding] = useState(false);
  const startedRef = useRef(false);

  // ====== SECTION: Flavor Nodes Engine ======

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
    rootIdByLabel,
    rootLabelById,
    ALL_TOP_LEVEL_LABELS,

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
    loadTastingFlavorSentiments,
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
    (whiskeyMeta?.proof != null &&
      Number.isFinite(Number(whiskeyMeta.proof))) ||
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
    const labels = refinePath
      .map((id) => safeText(byId.get(id)?.label))
      .filter(Boolean);
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

  function toggleFlavor(tag: string) {
    const t = safeText(tag);
    if (!t) return;

    setFlavorTags((prev) => {
      const has = prev.includes(t);
      const next = has ? prev.filter((x) => x !== t) : [...prev, t];
      return next.filter(
        (x) => !isFinishLabel(x) && normalizeKey(x) !== "dislikes"
      );
    });
  }

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
        setTextureLevel(loaded.textureLevel);
        setProofIntensity(loaded.proofIntensity);
        setFlavorIntensity(loaded.flavorIntensity);

        setNose(loaded.noseReaction as any);
        setTaste(loaded.tasteReaction as any);

        setFlavorTags(loaded.flavorTags);

        setPersonalNotes(loaded.personalNotes);
        setSourceType(loaded.sourceType);
        setBarName(loaded.barName);
        setSourceCity("");
        setSourceState("");
        setPricePerOz("");
        setPricePerBottle("");

        setLocked(true);
        setLoading(false);

        const [sel, savedSentiments] = await Promise.all([
          loadTastingFlavorNodes(tastingId),
          loadTastingFlavorSentiments(tastingId),
        ]);
        if (!alive) return;
        setSelectedNodeIds(sel);
        setSentimentById(savedSentiments);
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
  }, [isExisting, tastingId]);

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
          .select(
            "distillery, whiskey_type, proof, age, category, region, sub_region"
          )
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
                row.proof == null || !Number.isFinite(Number(row.proof))
                  ? null
                  : Number(row.proof),
              age:
                row.age == null || !Number.isFinite(Number(row.age))
                  ? null
                  : Number(row.age),
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
        <Pressable
          disabled={locked}
          onPress={() => toggleNodeId(n.id)}
          style={({ pressed }) => ({
            flex: 1,
            opacity: locked ? 0.6 : pressed ? 0.92 : 1,
          })}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  type.body,
                  {
                    fontWeight: active ? "900" : "800",
                    opacity: active ? 1 : 0.92,
                  },
                ]}
                numberOfLines={1}
              >
                {lbl}
              </Text>

              {showFamily ? (
                <Text
                  style={[type.microcopyItalic, { opacity: 0.68 }]}
                  numberOfLines={1}
                >
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
            <Text style={[type.microcopyItalic, { opacity: 0.85 }]}>
              More
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  // ====== SECTION: Save/Upsert Logic ======
  function fallbackSentimentFromTaste(): "LIKE" | "NEUTRAL" | "DISLIKE" {
    if (taste === "ENJOYED") return "LIKE";
    if (taste === "NOT_FOR_ME") return "DISLIKE";
    return "NEUTRAL";
  }

  const analyticsNodeIds = useMemo(() => {
    if (selectedNodeIds.length > 0) {
      return Array.from(new Set(selectedNodeIds.filter((id) => isUuid(id))));
    }

    return Array.from(
      new Set(
        flavorTags
          .map((tag) => rootIdByLabel.get(normalizeKey(tag)))
          .filter((id): id is string => !!id && isUuid(id))
      )
    );
  }, [selectedNodeIds, flavorTags, rootIdByLabel]);

  const analyticsSentimentById = useMemo(() => {
    const fallback = fallbackSentimentFromTaste();
    const out: Record<string, "LIKE" | "NEUTRAL" | "DISLIKE"> = {};

    for (const id of analyticsNodeIds) {
      out[id] = sentimentById[id] ?? fallback;
    }

    return out;
  }, [analyticsNodeIds, sentimentById, taste]);

  async function onSave() {
    if (saving) return;

    setSaving(true);
    try {
      const result = await saveCloudTasting({
        isExisting,
        tastingId,

        name,
        rating,
        textureLevel,
        proofIntensity,
        flavorIntensity,
        nose,
        taste,
        personalNotes,

        whiskeyId,
        flavorTags,
        selectedNodeIds: analyticsNodeIds,
        getTopLevelLabelForNode,
        isFinishLabel,
        sentimentById: analyticsSentimentById,

        sourceType,
        barName,
        storeName,

        sourceCity,
        sourceState,
        pricePerOz,
        pricePerBottle,
        bottleSizeMl,
        pourSizeOz,

        lockName,

        replaceTastingFlavorNodes,
        replaceTastingFlavorNodesWithSentiment,
      });

      setLocked(true);

      if (isExisting) {
        showToast("Saved", "Your tasting has been saved.");
        return;
      }

      if (result.whiskeyId) {
        const to = await postSaveMeta.maybeOpenPostSaveMetadata(
          result.whiskeyId,
          `/whiskey/${encodeURIComponent(result.whiskeyId)}`
        );

        if (to) {
          const toastUrl =
            `${to}${String(to).includes("?") ? "&" : "?"}` +
            `toastTitle=${encodeURIComponent("Saved")}&` +
            `toastMessage=${encodeURIComponent("Your tasting has been saved.")}`;

          router.replace(toastUrl as any);
          return;
        }
      } else {
        const to = await postSaveMeta.maybeOpenPostSaveMetadata("CUSTOM", "/log", {
          isCustom: true,
          name: name,
          proof: "",
          whiskeyTypeId: null,
          distillery: "",
        });

        if (to) {
          const toastUrl =
            `${to}${String(to).includes("?") ? "&" : "?"}` +
            `toastTitle=${encodeURIComponent("Saved")}&` +
            `toastMessage=${encodeURIComponent("Your tasting has been saved.")}`;

          router.replace(toastUrl as any);
          return;
        }
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
  function onEdit() {
    setLocked(false);
  }

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
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              }}
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color={colors.textPrimary}
              />
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
            {loading ? (
              <View style={{ paddingVertical: spacing.xl, alignItems: "center" }}>
                <ActivityIndicator />
                <Text style={[type.body, { marginTop: spacing.sm, opacity: 0.7 }]}>
                  Loading…
                </Text>
              </View>
            ) : null}

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
                  fontFamily:
                    type.screenTitle?.fontFamily ?? type.body.fontFamily,
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
                  {
                    label: "Distillery",
                    value: whiskeyMeta?.distillery
                      ? String(whiskeyMeta.distillery)
                      : "",
                  },
                  {
                    label: "Category",
                    value: whiskeyMeta?.category
                      ? String(whiskeyMeta.category)
                      : "",
                  },
                  {
                    label: "Region",
                    value: whiskeyMeta?.region ? String(whiskeyMeta.region) : "",
                  },
                  {
                    label: "Sub-Region",
                    value: whiskeyMeta?.sub_region
                      ? String(whiskeyMeta.sub_region)
                      : "",
                  },
                  {
                    label: "Style",
                    value: whiskeyMeta?.whiskey_type
                      ? String(whiskeyMeta.whiskey_type)
                      : "",
                  },
                  {
                    label: "Proof",
                    value:
                      whiskeyMeta?.proof != null &&
                      Number.isFinite(Number(whiskeyMeta.proof))
                        ? `${Math.round(Number(whiskeyMeta.proof))} proof`
                        : "",
                  },
                  {
                    label: "Age",
                    value:
                      whiskeyMeta?.age != null &&
                      Number.isFinite(Number(whiskeyMeta.age))
                        ? `${Math.round(Number(whiskeyMeta.age))} yr`
                        : "",
                  },
                ]}
                defaultOpen={false}
              />
            ) : null}

            <View style={{ marginVertical: spacing.sm }}>
              <View
                style={{
                  height: 2,
                  marginTop: 4,
                  borderRadius: 999,
                  overflow: "hidden",
                  opacity: 0.95,
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: "25%",
                    backgroundColor: colors.divider,
                    opacity: 0.65,
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    left: "25%",
                    top: 0,
                    bottom: 0,
                    width: "50%",
                    backgroundColor: colors.accent,
                    opacity: 0.12,
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: "25%",
                    backgroundColor: colors.divider,
                    opacity: 0.65,
                  }}
                />
              </View>
            </View>

            <RatingSection
              locked={locked}
              rating={rating}
              setRating={setRating}
              onSlidingChange={(s: boolean) => setIsSliding(s)}
            />

            <View style={{ marginVertical: spacing.sm }}>
              <View
                style={{
                  height: 2,
                  marginTop: 4,
                  borderRadius: 999,
                  overflow: "hidden",
                  opacity: 0.95,
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: "25%",
                    backgroundColor: colors.divider,
                    opacity: 0.65,
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    left: "25%",
                    top: 0,
                    bottom: 0,
                    width: "50%",
                    backgroundColor: colors.accent,
                    opacity: 0.12,
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: "25%",
                    backgroundColor: colors.divider,
                    opacity: 0.65,
                  }}
                />
              </View>
            </View>

            <QuickNotesSection
              locked={locked}
              nose={nose}
              setNose={setNose}
              taste={taste}
              setTaste={setTaste}
            />

            <TastingSignalsSection
              locked={locked}
              textureLevel={textureLevel}
              proofIntensity={proofIntensity}
              flavorIntensity={flavorIntensity}
              setTextureLevel={setTextureLevel}
              setProofIntensity={setProofIntensity}
              setFlavorIntensity={setFlavorIntensity}
            />

            <FlavorNotesSection
              locked={locked}
              allTopLevelLabels={ALL_TOP_LEVEL_LABELS}
              flavorTags={flavorTags}
              toggleFlavor={toggleFlavor}
              additionalNotesLine={additionalNotesLine}
              openRefine={openRefine}
              selectedNodeIds={selectedNodeIds}
              selectedCountText={selectedCountText}
              selectedNodeLabelsPreview={selectedNodeLabelsPreview}
            />

            <Card tight>
              <Text style={type.sectionHeader}>Personal notes</Text>
              <Text
                style={[
                  type.microcopyItalic,
                  { color: colors.textSecondary, marginTop: 2 },
                ]}
              >
                Add any freeform tasting thoughts, reminders, or details you want
                to remember.
              </Text>

              <TextInput
                value={personalNotes}
                onChangeText={setPersonalNotes}
                editable={!locked}
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
                  opacity: !locked ? 1 : 0.75,
                }}
              />
            </Card>

            <TastingSourceCard
              locked={locked}
              sourceType={sourceType}
              onChangeSourceType={setSourceType}
              barName={barName}
              onChangeBarName={setBarName}
              barNameMissing={barNameMissing}
              city={sourceCity}
              onChangeCity={setSourceCity}
              state={sourceState}
              onChangeState={setSourceState}
              pricePerOz={pricePerOz}
              onChangePricePerOz={setPricePerOz}
              pricePerBottle={pricePerBottle}
              onChangePricePerBottle={setPricePerBottle}
              storeName={storeName}
              onChangeStoreName={setStoreName}
              bottleSizeMl={bottleSizeMl}
              onChangeBottleSizeMl={setBottleSizeMl}
              pourSizeOz={pourSizeOz}
              onChangePourSizeOz={setPourSizeOz}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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

      <MetadataModal
        visible={postSaveMeta.metaOpen}
        loading={postSaveMeta.metaLoading}
        saving={postSaveMeta.metaSaving}
        isCustom={postSaveMeta.metaIsCustom}
        metaMissingKeys={postSaveMeta.metaMissingKeys}
        onSkip={() => {
          const to = postSaveMeta.finishPostSaveFlow();
          if (to) {
            const toastUrl =
              `${to}${String(to).includes("?") ? "&" : "?"}` +
              `toastTitle=${encodeURIComponent("Saved")}&` +
              `toastMessage=${encodeURIComponent(
                "Your tasting has been saved."
              )}`;

            router.replace(toastUrl as any);
          }
        }}
        onSave={async () => {
          const to = await postSaveMeta.saveMetadataFromModal();
          if (to) {
            const toastUrl =
              `${to}${String(to).includes("?") ? "&" : "?"}` +
              `toastTitle=${encodeURIComponent("Saved")}&` +
              `toastMessage=${encodeURIComponent(
                "Your tasting has been saved."
              )}`;

            router.replace(toastUrl as any);
            return;
          }

          const fallback = postSaveMeta.finishPostSaveFlow();
          if (fallback) {
            const toastUrl =
              `${fallback}${String(fallback).includes("?") ? "&" : "?"}` +
              `toastTitle=${encodeURIComponent("Saved")}&` +
              `toastMessage=${encodeURIComponent(
                "Your tasting has been saved."
              )}`;

            router.replace(toastUrl as any);
          }
        }}
        fName={postSaveMeta.fName}
        setFName={postSaveMeta.setFName}
        fDistillery={postSaveMeta.fDistillery}
        setFDistillery={postSaveMeta.setFDistillery}
        fTypeId={postSaveMeta.fTypeId}
        setFTypeId={postSaveMeta.setFTypeId}
        whiskeyTypeOptions={postSaveMeta.whiskeyTypeOptions}
        selectedWhiskeyTypeName={postSaveMeta.selectedWhiskeyTypeName}
        fProof={postSaveMeta.fProof}
        setFProof={postSaveMeta.setFProof}
        fAge={postSaveMeta.fAge}
        setFAge={postSaveMeta.setFAge}
        fCategory={postSaveMeta.fCategory}
        setFCategory={postSaveMeta.setFCategory}
        fRegion={postSaveMeta.fRegion}
        setFRegion={postSaveMeta.setFRegion}
        fSubRegion={postSaveMeta.fSubRegion}
        setFSubRegion={postSaveMeta.setFSubRegion}
        categoryOptions={postSaveMeta.categoryOptions}
        regionOptions={postSaveMeta.regionOptions}
        subRegionOptions={postSaveMeta.subRegionOptions}
        canEditCategory={postSaveMeta.canEditCategory}
        canEditRegion={postSaveMeta.canEditRegion}
        canEditSubRegion={postSaveMeta.canEditSubRegion}
        showCategoryBlock={postSaveMeta.showCategoryBlock}
        showRegionBlock={postSaveMeta.showRegionBlock}
        showSubRegionBlock={postSaveMeta.showSubRegionBlock}
        onCategoryChange={postSaveMeta.onCategoryChange}
        onRegionChange={postSaveMeta.onRegionChange}
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

// ====== SECTION: Reaction helpers (bottom) ======
function reactionLabel(v: Reaction) {
  if (v === "ENJOYED") return "Enjoyed";
  if (v === "NEUTRAL") return "Neutral";
  if (v === "NOT_FOR_ME") return "Not for me";
  return "";
}