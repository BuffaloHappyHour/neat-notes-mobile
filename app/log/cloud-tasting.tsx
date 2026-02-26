// app/log/cloud-tasting.tsx
// ====== SECTION: Imports ======
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams, type Href } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { Card } from "../../components/ui/Card";
import { RefineModal } from "../../src/log/components/refine/RefineModal";
import { PersonalNotesSection } from "../../src/log/components/tasting/PersonalNotesSection";
import { QuickNotesSection } from "../../src/log/components/tasting/QuickNotesSection";
import RatingSection from "../../src/log/components/tasting/RatingSection";
import { NotesGrid } from "../../src/log/components/ui/NotesGrid";
import { type Reaction } from "../../src/log/components/ui/ReactionList";
import { useFlavorNodesEngine, type FlavorNode } from "../../src/log/hooks/useFlavorNodes";

import { radii } from "../../lib/radii";
import { spacing } from "../../lib/spacing";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

// ✅ UTIL + SERVICES (extracted)
import {
  asString,
  clamp100,
  cleanText,
  isMissingLike,
  isNullOrOther,
  isUuid,
  normalizeKey,
  nullIfOther,
  parseNumericOrNull,
  safeText,
  uniqStringsKeepOrder,
  uniqUuidsKeepOrder
} from "../../src/log/utils/text";

import { maybeCreateWhiskeyCandidate } from "../../src/log/services/whiskeyCandidates.service";

// ✅ HAPTICS (intentional only; respects settings)
import { hapticError, hapticSuccess } from "../../lib/haptics";

// ✅ ANALYTICS
import {
  trackTastingSaved,
  trackTastingSaveFailed,
  trackTastingStart,
} from "../../lib/analytics";

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

// ====== SECTION: Constants ======

// Allowed whiskey types (matches your whiskeys_type_check)
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

// ====== SECTION: UI bits ======

function Pill({
  label,
  active,
  onPress,
  disabled,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 7,
        paddingHorizontal: 10,
        borderRadius: 999,
        borderWidth: active ? 2 : 1,
        borderColor: active ? colors.accent : colors.divider,
        backgroundColor: active ? colors.highlight : "transparent",
        opacity: disabled ? 0.5 : pressed ? 0.92 : 1,
      })}
    >
      <Text
        style={[
          type.microcopyItalic,
          { opacity: 0.9, fontWeight: active ? "900" : "800" },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SectionGroupHeader({
  title,
  onBrowse,
  disabled,
}: {
  title: string;
  onBrowse: () => void;
  disabled?: boolean;
}) {
  return (
    <View style={{ gap: 10 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
          <Ionicons name="chevron-forward" size={18} color={colors.accent} />
          <Text style={[type.body, { fontWeight: "900", opacity: 0.9 }]} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <Pressable
          disabled={disabled}
          onPress={onBrowse}
          style={({ pressed }) => ({
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.divider,
            backgroundColor: pressed ? colors.highlight : "transparent",
            opacity: disabled ? 0.6 : 1,
          })}
        >
          <Text style={[type.microcopyItalic, { opacity: 0.85 }]}>Browse</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 26,
            height: 2,
            borderRadius: 999,
            backgroundColor: colors.accent,
            opacity: 0.95,
          }}
        />
        <View
          style={{
            flex: 1,
            height: 2,
            borderRadius: 999,
            backgroundColor: colors.divider,
            opacity: 0.8,
          }}
        />
      </View>
    </View>
  );
}

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

// ====== SECTION: Community share helpers (PUBLIC TABLES) ======

async function getMyShareSetting(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user?.id) return false;

  // Default opt-in = true if null/missing
  const { data: pData, error } = await supabase
    .from("profiles")
    .select("share_anonymously")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return true;
  const v = (pData as any)?.share_anonymously;
  return typeof v === "boolean" ? v : true;
}

async function deletePublicMirrorBySourceTastingId(sourceTastingId: string) {
  if (!isUuid(sourceTastingId)) return;

  const { data: existing, error: exErr } = await supabase
    .from("public_tastings")
    .select("id")
    .eq("source_tasting_id", sourceTastingId)
    .maybeSingle();

  if (exErr) throw new Error(exErr.message);

  const publicId = safeText((existing as any)?.id);
  if (!isUuid(publicId)) return;

  const { error: delKids } = await supabase
    .from("public_tasting_flavor_nodes")
    .delete()
    .eq("public_tasting_id", publicId);

  if (delKids) throw new Error(delKids.message);

  const { error: delParent } = await supabase.from("public_tastings").delete().eq("id", publicId);

  if (delParent) throw new Error(delParent.message);
}

async function upsertPublicMirror(params: {
  sourceTastingId: string;
  whiskeyId: string | null;
  rating: number;
  flavorTags: string[] | null;
  dislikeTags: string[] | null;
  personalNotes: string | null;
  selectedNodeIds: string[];
}) {
  const { sourceTastingId, whiskeyId, rating, flavorTags, dislikeTags, personalNotes, selectedNodeIds } =
    params;

  if (!isUuid(sourceTastingId)) return;

  const { data: tData, error: tErr } = await supabase
    .from("tastings")
    .select("id, created_at")
    .eq("id", sourceTastingId)
    .maybeSingle();

  if (tErr) throw new Error(tErr.message);

  const createdAt = safeText((tData as any)?.created_at) || new Date().toISOString();

  const { data: existing, error: exErr } = await supabase
    .from("public_tastings")
    .select("id")
    .eq("source_tasting_id", sourceTastingId)
    .maybeSingle();

  if (exErr) throw new Error(exErr.message);

  let publicTastingId = safeText((existing as any)?.id);

  if (isUuid(publicTastingId)) {
    const { error: upErr } = await supabase
      .from("public_tastings")
      .update({
        whiskey_id: whiskeyId,
        rating: Number(rating),
        flavor_tags: flavorTags,
        dislike_tags: dislikeTags,
        personal_notes: personalNotes,
      })
      .eq("id", publicTastingId);

    if (upErr) throw new Error(upErr.message);
  } else {
    const { data: ins, error: insErr } = await supabase
      .from("public_tastings")
      .insert({
        source_tasting_id: sourceTastingId,
        whiskey_id: whiskeyId,
        rating: Number(rating),
        flavor_tags: flavorTags,
        dislike_tags: dislikeTags,
        personal_notes: personalNotes,
        created_at: createdAt,
      })
      .select("id")
      .maybeSingle();

    if (insErr) throw new Error(insErr.message);

    publicTastingId = safeText((ins as any)?.id);
    if (!isUuid(publicTastingId)) throw new Error("Public mirror saved, but missing public tasting id.");
  }

  const { error: delErr } = await supabase
    .from("public_tasting_flavor_nodes")
    .delete()
    .eq("public_tasting_id", publicTastingId);

  if (delErr) throw new Error(delErr.message);

  const clean = uniqUuidsKeepOrder(selectedNodeIds);
  if (!clean.length) return;

  const inserts = clean.map((nodeId) => ({
    public_tasting_id: publicTastingId,
    node_id: nodeId,
    sentiment: "positive",
  }));

  const { error: insKidsErr } = await supabase.from("public_tasting_flavor_nodes").insert(inserts);
  if (insKidsErr) throw new Error(insKidsErr.message);
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

  const [loading, setLoading] = useState(isExisting);
  const [saving, setSaving] = useState(false);
  const [locked, setLocked] = useState(isExisting);

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

  // ====== SECTION: Data Fetching (existing tasting) ======

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!isExisting) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("tastings")
          .select(
            "id, whiskey_id, whiskey_name, rating, nose_reaction, taste_reaction, source_type, bar_name, flavor_tags, dislike_tags, personal_notes"
          )
          .eq("id", tastingId)
          .maybeSingle();

        if (error) throw new Error(error.message);

        const row = (data as any) as CloudTastingRow | null;
        if (!row) throw new Error("Tasting not found.");

        if (!alive) return;

        setName(safeText(row.whiskey_name ?? routeWhiskeyName));
        setWhiskeyId(isUuid(safeText(row.whiskey_id)) ? safeText(row.whiskey_id) : null);

        setRating(row.rating == null ? null : clamp100(Number(row.rating)));

        // Map stored strings back to Reaction
        const nr = safeText(row.nose_reaction).toLowerCase();
        const tr = safeText(row.taste_reaction).toLowerCase();
        setNose(
          nr === "enjoyed"
            ? "ENJOYED"
            : nr === "neutral"
            ? "NEUTRAL"
            : nr === "not for me"
            ? "NOT_FOR_ME"
            : null
        );
        setTaste(
          tr === "enjoyed"
            ? "ENJOYED"
            : tr === "neutral"
            ? "NEUTRAL"
            : tr === "not for me"
            ? "NOT_FOR_ME"
            : null
        );

        setSourceType(row.source_type === "bar" ? "bar" : "purchased");
        setBarName(safeText(row.bar_name ?? ""));

        setFlavorTags(
          Array.isArray(row.flavor_tags) ? row.flavor_tags.map(safeText).filter(Boolean) : []
        );
        const dislikesArr = Array.isArray(row.dislike_tags)
          ? row.dislike_tags.map(safeText).filter(Boolean)
          : [];
        setDislikeTags(dislikesArr);
        setNoDislikes(dislikesArr.length === 0);

        setPersonalNotes(safeText(row.personal_notes ?? ""));

        // load selected refined nodes from join table
        const sel = await loadTastingFlavorNodes(tastingId);
        if (!alive) return;
        setSelectedNodeIds(uniqUuidsKeepOrder(sel));

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    return (
      <Pressable
        key={n.id}
        disabled={locked}
        onPress={() => toggleNodeId(n.id)}
        style={({ pressed }) => ({
          paddingVertical: 12,
          paddingHorizontal: 12,
          borderRadius: radii.md,
          borderWidth: active ? 2 : 1,
          borderColor: active ? colors.accent : colors.divider,
          backgroundColor: active ? colors.highlight : "transparent",
          opacity: locked ? 0.6 : pressed ? 0.92 : 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        })}
      >
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

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
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

          <Ionicons
            name={active ? "checkmark-circle" : "ellipse-outline"}
            size={20}
            color={active ? colors.accent : colors.textSecondary}
          />
        </View>
      </Pressable>
    );
  }

  // ====== SECTION: Taxonomy + Post-save metadata modal ======

  async function fetchTaxonomyForModal(category: string | null, region: string | null) {
    setMetaLoading(true);
    try {
      const { data: cData, error: cErr } = await supabase
        .from("whiskey_categories")
        .select("category")
        .order("category", { ascending: true });

      if (cErr) throw new Error(cErr.message);

      const cats = (Array.isArray(cData) ? cData : [])
        .map((r: any) => safeText(r.category))
        .filter(Boolean);

      setTaxCategories(cats);

      if (category) {
        const { data: rData, error: rErr } = await supabase
          .from("whiskey_regions")
          .select("region")
          .eq("category", category)
          .order("region", { ascending: true });

        if (rErr) throw new Error(rErr.message);

        const regs = (Array.isArray(rData) ? rData : [])
          .map((r: any) => safeText(r.region))
          .filter(Boolean);
        setTaxRegions(regs);

        if (region) {
          const { data: sData, error: sErr } = await supabase
            .from("whiskey_sub_regions")
            .select("sub_region")
            .eq("category", category)
            .eq("region", region)
            .order("sub_region", { ascending: true });

          if (sErr) throw new Error(sErr.message);

          const subs = (Array.isArray(sData) ? sData : [])
            .map((r: any) => safeText(r.sub_region))
            .filter(Boolean);
          setTaxSubRegions(subs);
        } else {
          setTaxSubRegions([]);
        }
      } else {
        setTaxRegions([]);
        setTaxSubRegions([]);
      }
    } catch {
      setTaxCategories([]);
      setTaxRegions([]);
      setTaxSubRegions([]);
    } finally {
      setMetaLoading(false);
    }
  }

  function computeMissingKeysFromWhiskeyRow(w: WhiskeyRow | null) {
    const missing: string[] = [];
    if (!w) return missing;

    if (!safeText(w.distillery)) missing.push("distillery");
    if (isNullOrOther(w.whiskey_type)) missing.push("whiskey_type");
    if (w.proof == null) missing.push("proof");
    if (w.age == null) missing.push("age");

    // treat null/empty OR "Other" as missing for ALL taxonomy fields
    if (isNullOrOther(w.category)) missing.push("category");
    if (isNullOrOther(w.region)) missing.push("region");
    if (isNullOrOther(w.sub_region)) missing.push("sub_region");

    return missing;
  }

  async function maybeOpenPostSaveMetadata(whiskeyIdToCheck: string, navigateTo: Href) {
    if (!isUuid(whiskeyIdToCheck)) {
      setPendingNavigateTo(navigateTo);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("whiskeys")
        .select("distillery, whiskey_type, proof, age, category, region, sub_region")
        .eq("id", whiskeyIdToCheck)
        .maybeSingle();

      if (error) throw new Error(error.message);

      const row = (data as any) ?? null;
      const w: WhiskeyRow | null = row
        ? {
            distillery: cleanText(row.distillery),
            whiskey_type: cleanText(row.whiskey_type),
            proof:
              row.proof == null || !Number.isFinite(Number(row.proof)) ? null : Number(row.proof),
            age: row.age == null || !Number.isFinite(Number(row.age)) ? null : Number(row.age),
            category: cleanText(row.category),
            region: cleanText(row.region),
            sub_region: cleanText(row.sub_region),
          }
        : null;

      const missing = computeMissingKeysFromWhiskeyRow(w);

      if (!missing.length) {
        setPendingNavigateTo(navigateTo);
        return;
      }

      setMetaMissingKeys(missing);
      setPostSaveTargetWhiskeyId(whiskeyIdToCheck);
      setPendingNavigateTo(navigateTo);

      setFDistillery(safeText(w?.distillery ?? ""));
      setFType(w?.whiskey_type ?? null);
      setFProof(w?.proof == null ? "" : String(w?.proof));
      setFAge(w?.age == null ? "" : String(w?.age));
      setFCategory(w?.category ?? null);
      setFRegion(w?.region ?? null);
      setFSubRegion(w?.sub_region ?? null);

      await fetchTaxonomyForModal(w?.category ?? null, w?.region ?? null);

      setMetaOpen(true);
    } catch {
      setPendingNavigateTo(navigateTo);
    }
  }

  function finishPostSaveFlow() {
    const to = pendingNavigateTo;
    setMetaOpen(false);
    setPostSaveTargetWhiskeyId(null);
    setPendingNavigateTo(null);
    if (to) router.replace(to);
  }

  async function saveMetadataFromModal() {
    if (metaSaving) return;
    if (!postSaveTargetWhiskeyId || !isUuid(postSaveTargetWhiskeyId)) {
      finishPostSaveFlow();
      return;
    }

    const dist = cleanText(fDistillery);
    const proof = parseNumericOrNull(fProof);
    const age = parseNumericOrNull(fAge);

    // don't write "Other" into constrained taxonomy columns
    const cat = nullIfOther(fCategory);
    const reg = nullIfOther(fRegion);
    const sub = nullIfOther(fSubRegion);

    setMetaSaving(true);
    try {
      const { error } = await supabase.rpc("user_fill_whiskey_missing_fields", {
        p_whiskey_id: postSaveTargetWhiskeyId,
        p_distillery: dist,
        p_whiskey_type: nullIfOther(fType as any),
        p_proof: proof,
        p_age: age,
        p_category: cat,
        p_region: reg,
        p_sub_region: sub,
      });

      if (error) throw new Error(error.message);

      await hapticSuccess();
      finishPostSaveFlow();
    } catch (e: any) {
      await hapticError();
      Alert.alert("Couldn’t save details", String(e?.message ?? e));
    } finally {
      setMetaSaving(false);
    }
  }

  // ====== SECTION: Save/Upsert Logic ======

  async function onSave() {
    if (saving) return;

    const safeName = name.trim();
    if (safeName.length < 2) {
      Alert.alert("Whiskey name", "Please enter a whiskey name.");
      return;
    }

    if (rating == null) {
      Alert.alert("Rating", "Please set a rating.");
      return;
    }

    if (sourceType === "bar" && barName.trim().length < 2) {
      Alert.alert("Bar name", "Please enter the bar name for a Bar Pour.");
      return;
    }

    setSaving(true);
    try {
      const safeWhiskeyId = whiskeyId && isUuid(whiskeyId) ? whiskeyId : null;

      const cleanedPersonal = personalNotes.trim();
      const personalOrNull = cleanedPersonal.length ? cleanedPersonal : null;

      const topFromRefine = uniqStringsKeepOrder(
        selectedNodeIds
          .map((id) => getTopLevelLabelForNode(id))
          .filter(Boolean) as string[]
      );

      const mergedFlavorTags = uniqStringsKeepOrder([...flavorTags, ...topFromRefine]).filter(
        (t) => !isFinishLabel(t) && normalizeKey(t) !== "dislikes"
      );

      const payload: any = {
        whiskey_name: safeName,
        whiskey_id: safeWhiskeyId,
        rating: Number(rating),
        nose_reaction: reactionLabel(nose) || null,
        taste_reaction: reactionLabel(taste) || null,
        flavor_tags: mergedFlavorTags.length ? mergedFlavorTags : null,
        dislike_tags: noDislikes ? null : dislikeTags.length ? dislikeTags : null,
        source_type: sourceType,
        bar_name: sourceType === "bar" ? barName.trim() : null,
        personal_notes: personalOrNull,
      };

      const shareOk = await getMyShareSetting();

      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (isExisting) {
        const { error } = await supabase.from("tastings").update(payload).eq("id", tastingId);
        if (error) throw new Error(error.message);

        await replaceTastingFlavorNodes(tastingId, selectedNodeIds);

        if (shareOk) {
          await upsertPublicMirror({
            sourceTastingId: tastingId,
            whiskeyId: safeWhiskeyId,
            rating: Number(rating),
            flavorTags: mergedFlavorTags.length ? mergedFlavorTags : null,
            dislikeTags: noDislikes ? null : dislikeTags.length ? dislikeTags : null,
            personalNotes: personalOrNull,
            selectedNodeIds,
          });
        } else {
          await deletePublicMirrorBySourceTastingId(tastingId);
        }

        setLocked(true);
        await hapticSuccess();

        trackTastingSaved({
          screen: "cloud-tasting",
          whiskey_id: safeWhiskeyId,
          existing: true,
          rating: Number(rating),
          has_notes: !!personalOrNull,
          notes_len: personalOrNull ? personalOrNull.length : 0,
          has_flavor_tags: mergedFlavorTags.length > 0,
          has_dislike_tags: !noDislikes && dislikeTags.length > 0,
          source_type: sourceType,
        });

        if (safeWhiskeyId) {
          await maybeOpenPostSaveMetadata(
            safeWhiskeyId,
            `/whiskey/${encodeURIComponent(safeWhiskeyId)}`
          );
        } else {
          router.replace("/profile");
        }
      } else {
        if (!user) throw new Error("Not signed in");

        const { data: inserted, error } = await supabase
          .from("tastings")
          .insert({ user_id: user.id, ...payload })
          .select("id")
          .maybeSingle();

        if (error) throw new Error(error.message);

        const newId = safeText((inserted as any)?.id);
        if (!isUuid(newId)) throw new Error("Saved, but missing tasting id.");

        await replaceTastingFlavorNodes(newId, selectedNodeIds);

        if (shareOk) {
          await upsertPublicMirror({
            sourceTastingId: newId,
            whiskeyId: safeWhiskeyId,
            rating: Number(rating),
            flavorTags: mergedFlavorTags.length ? mergedFlavorTags : null,
            dislikeTags: noDislikes ? null : dislikeTags.length ? dislikeTags : null,
            personalNotes: personalOrNull,
            selectedNodeIds,
          });
        } else {
          await deletePublicMirrorBySourceTastingId(newId);
        }

        if (!lockName) await maybeCreateWhiskeyCandidate(safeName);

        trackTastingSaved({
          screen: "cloud-tasting",
          whiskey_id: safeWhiskeyId,
          existing: false,
          rating: Number(rating),
          has_notes: !!personalOrNull,
          notes_len: personalOrNull ? personalOrNull.length : 0,
          has_flavor_tags: mergedFlavorTags.length > 0,
          has_dislike_tags: !noDislikes && dislikeTags.length > 0,
          source_type: sourceType,
        });

        await hapticSuccess();

        if (safeWhiskeyId) {
          await maybeOpenPostSaveMetadata(
            safeWhiskeyId,
            `/whiskey/${encodeURIComponent(safeWhiskeyId)}`
          );
        } else {
          router.replace("/profile");
        }
      }
    } catch (e: any) {
      await hapticError();

      const msg = String(e?.message ?? e ?? "");
      const lower = msg.toLowerCase();

      const isOffline =
        lower.includes("network request failed") ||
        lower.includes("failed to fetch") ||
        (lower.includes("fetch") && lower.includes("error")) ||
        lower.includes("offline") ||
        lower.includes("timeout") ||
        lower.includes("timed out") ||
        lower.includes("unexpected end of input");

      trackTastingSaveFailed({
        screen: "cloud-tasting",
        whiskey_id: whiskeyId && isUuid(whiskeyId) ? whiskeyId : null,
        existing: isExisting,
        message: msg,
        is_offline: isOffline,
      });

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

  // ====== SECTION: Taxonomy modal gating ======

  function withOtherOption(list: string[]) {
    const cleaned = uniqStringsKeepOrder(list.map((x) => safeText(x)).filter(Boolean));
    if (!cleaned.some((x) => x.toLowerCase() === "other")) cleaned.push("Other");
    return cleaned;
  }

  const categoryOptions = withOtherOption(taxCategories);
  const regionOptions = withOtherOption(fCategory ? taxRegions : []);
  const subRegionOptions = withOtherOption(fCategory && fRegion ? taxSubRegions : []);

  const canEditCategory = isMissingLike(fCategory) || taxCategories.length === 0;

  const canEditRegion =
    !isMissingLike(fCategory) && (isMissingLike(fRegion) || taxRegions.length === 0);

  const canEditSubRegion =
    !isMissingLike(fCategory) &&
    !isMissingLike(fRegion) &&
    (isMissingLike(fSubRegion) || taxSubRegions.length === 0);

  const showCategoryBlock = metaMissingKeys.includes("category") || isMissingLike(fCategory);

  const showRegionBlock =
    (metaMissingKeys.includes("region") || isMissingLike(fRegion)) && !isMissingLike(fCategory);

  const showSubRegionBlock =
    (metaMissingKeys.includes("sub_region") || isMissingLike(fSubRegion)) &&
    !isMissingLike(fCategory) &&
    !isMissingLike(fRegion);

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
          headerRight: () => (
            <Pressable
              onPress={onSave}
              disabled={saving || (isExisting && locked)}
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

          {/* Whiskey */}
          <Card>
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
              numberOfLines={2}
              textAlignVertical="top"
              style={{
                marginTop: 0,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.md,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.divider,
                backgroundColor: "transparent",
                color: colors.textPrimary,
                fontSize: 20,
                lineHeight: 24,
                fontWeight: "900",
                fontFamily: type.screenTitle?.fontFamily ?? type.body.fontFamily,
                opacity: !locked && !(!isExisting && lockName) ? 1 : 0.75,
                minHeight: 56,
              }}
            />

            {whiskeyId && whiskeyMeta && hasBottleDetails ? (
              <View
                style={{
                  marginTop: spacing.sm,
                  gap: 6,
                  paddingTop: spacing.sm,
                  borderTopWidth: 1,
                  borderTopColor: colors.divider,
                }}
              >
                <Text style={[type.body, { opacity: 0.75, fontSize: 12 }]}>Bottle details</Text>

                {whiskeyMeta?.distillery ? (
                  <Text style={[type.body, { opacity: 0.8 }]}>
                    Distillery:{" "}
                    <Text style={{ fontWeight: "900" }}>{String(whiskeyMeta.distillery)}</Text>
                  </Text>
                ) : null}

                {whiskeyMeta?.category ? (
                  <Text style={[type.body, { opacity: 0.8 }]}>
                    Category:{" "}
                    <Text style={{ fontWeight: "900" }}>{String(whiskeyMeta.category)}</Text>
                  </Text>
                ) : null}

                {whiskeyMeta?.region ? (
                  <Text style={[type.body, { opacity: 0.8 }]}>
                    Region: <Text style={{ fontWeight: "900" }}>{String(whiskeyMeta.region)}</Text>
                  </Text>
                ) : null}

                {whiskeyMeta?.sub_region ? (
                  <Text style={[type.body, { opacity: 0.8 }]}>
                    Sub-Region:{" "}
                    <Text style={{ fontWeight: "900" }}>{String(whiskeyMeta.sub_region)}</Text>
                  </Text>
                ) : null}

                {whiskeyMeta?.whiskey_type ? (
                  <Text style={[type.body, { opacity: 0.8 }]}>
                    Style:{" "}
                    <Text style={{ fontWeight: "900" }}>{String(whiskeyMeta.whiskey_type)}</Text>
                  </Text>
                ) : null}

                {whiskeyMeta?.proof != null ? (
                  <Text style={[type.body, { opacity: 0.8 }]}>
                    Proof:{" "}
                    <Text style={{ fontWeight: "900" }}>
                      {Math.round(Number(whiskeyMeta.proof))} proof
                    </Text>
                  </Text>
                ) : null}

                {whiskeyMeta?.age != null ? (
                  <Text style={[type.body, { opacity: 0.8 }]}>
                    Age:{" "}
                    <Text style={{ fontWeight: "900" }}>
                      {Math.round(Number(whiskeyMeta.age))} yr
                    </Text>
                  </Text>
                ) : null}
              </View>
            ) : null}
          </Card>

          {/* Rating (extracted) */}
          <RatingSection
            locked={locked}
            rating={rating}
            setRating={setRating}
            onSlidingChange={(s:boolean) => setIsSliding(s)}
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

      {/* Post-save metadata modal */}
      <Modal
        visible={metaOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => finishPostSaveFlow()}
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
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <Text style={[type.sectionHeader, { marginBottom: 0 }]}>Help improve this whiskey?</Text>
              <Pressable
                onPress={() => finishPostSaveFlow()}
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
            {metaLoading ? (
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
                onChange={async (v) => {
                  setFCategory(v);
                  setFRegion(null);
                  setFSubRegion(null);
                  await fetchTaxonomyForModal(v, null);
                }}
              />
            ) : null}

            {showRegionBlock ? (
              <ControlledSelect
                label="Region"
                value={fRegion}
                placeholder={fCategory ? "Select region…" : "Select category first…"}
                options={regionOptions}
                disabled={!canEditRegion || !fCategory}
                onChange={async (v) => {
                  setFRegion(v);
                  setFSubRegion(null);
                  await fetchTaxonomyForModal(fCategory, v);
                }}
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
              onPress={saveMetadataFromModal}
              disabled={metaSaving}
              style={({ pressed }) => ({
                borderRadius: radii.md,
                paddingVertical: spacing.lg,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.accent,
                opacity: metaSaving ? 0.6 : pressed ? 0.92 : 1,
              })}
            >
              <Text style={[type.button, { color: colors.background, textAlign: "center" }]}>
                {metaSaving ? "Saving…" : "Save details"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => finishPostSaveFlow()}
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
              <Text style={[type.button, { color: colors.textPrimary, textAlign: "center" }]}>Skip</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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