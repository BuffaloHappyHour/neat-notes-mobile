// app/whiskey/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";
import { AppToast } from "../../src/components/ui/AppToast";
import { RadarChart } from "../../src/profile/insights/components/RadarChart";
import { useInsightsData } from "../../src/profile/insights/hooks/useInsightsData";
import { useWhiskeyRadarData } from "../../src/whiskey/hooks/useWhiskeyRadarData";


import {
  hapticError,
  hapticTick,
  withSuccess,
  withTick,
} from "../../lib/hapticsPress";

/* ---------- CACHE ---------- */

type PalateMatchResult = {
  is_premium?: boolean;
  score?: number;
  tier?: string;
  confidence_label?: string;
  explanation?: string | null;
  top_matches?: string[];
  top_conflicts?: string[];
  shared_node_count?: number;
  error?: string;
};

// Simple in-memory cache so opening the same whiskey feels instant.
type WhiskeyProfileCacheEntry = {
  whiskeyId: string;
  headerNameRaw: string;
  details: {
    distillery: string | null;
    category: string | null;
    region: string | null;
    subRegion: string | null;
    style: string | null;
    proofLabel: string | null;
    ageLabel: string | null;
    mashBill: string | null;
  };
  bhh: { score: number | null; youtubeUrl: string | null };
  community: { total: number; avg: number | null };
  recent: TastingSupabaseRow[];
  photos: WhiskeyPhoto[];
  whiskeyStatus: string | null;
  flavorCallouts: { label: string; mention_count: number; level: number }[];
  palateMatch: PalateMatchResult | null;
  cachedAt: number;
};

// module-level cache (persists while app is running)
const whiskeyProfileCache = new Map<string, WhiskeyProfileCacheEntry>();

/* ---------- HELPERS ---------- */

function asString(v: string | string[] | undefined) {
  if (Array.isArray(v)) return v[0];
  return v;
}

function isUuidLike(id: string) {
  return typeof id === "string" && id.length === 36 && id.includes("-");
}

function formatCreatedAt(v: string | number | null | undefined) {
  if (v == null) return "";
  const d = typeof v === "number" ? new Date(v) : new Date(String(v));
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function toDisplayTitleCase(input: string) {
  const s = String(input ?? "").trim();
  if (!s) return "";

  const words = s.split(/\s+/g);

  return words
    .map((w) => {
      if (!w) return w;

      if (/^\d+([a-zA-Z]{0,3})$/.test(w)) return w;
      if (/^[A-Z0-9]+$/.test(w) && w.length <= 4) return w;

      const parts = w.split(/([-/'()])/g);
      return parts
        .map((p) => {
          if (!p) return p;
          if (p === "-" || p === "/" || p === "'" || p === "(" || p === ")")
            return p;

          if (/^\d+([a-zA-Z]{0,3})$/.test(p)) return p;
          if (/^[A-Z0-9]+$/.test(p) && p.length <= 4) return p;

          const lower = p.toLowerCase();
          return lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join("");
    })
    .join(" ");
}

function formatProof(v: any): string | null {
  if (v == null) return null;

  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;
    if (/proof/i.test(s) || /%/.test(s)) return s;
    const n = Number(s);
    if (Number.isFinite(n)) return formatProof(n);
    return s;
  }

  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;

  if (n >= 50) return `${Math.round(n)} proof`;
  if (n > 0 && n < 50) return `${Math.round(n * 2)} proof`;

  return null;
}

function formatAge(v: any): string | null {
  if (v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `${Math.round(n)} year`;
}

function cleanText(v: any): string | null {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

/* ---------- PALATE MATCH HELPERS ---------- */

function tierLabel(tier?: string): string {
  switch (tier) {
    case "match":    return "Match";
    case "maybe":    return "Maybe";
    case "no_match": return "No Match";
    default:         return "";
  }
}

function tierBgColor(tier?: string): string {
  switch (tier) {
    case "match":    return colors.accentFaint;
    case "maybe":    return (colors as any).surfaceRaised ?? colors.surface;
    case "no_match": return "transparent";
    default:         return "transparent";
  }
}

function tierBorderColor(tier?: string): string {
  switch (tier) {
    case "match":    return colors.accent;
    case "maybe":    return colors.divider;
    case "no_match": return (colors as any).borderSubtle ?? colors.divider;
    default:         return colors.divider;
  }
}

function tierTextColor(tier?: string): string {
  switch (tier) {
    case "match":    return colors.accent;
    default:         return colors.textSecondary;
  }
}

function confidenceLabel(label?: string): string {
  switch (label) {
    case "high":     return "High";
    case "moderate": return "Moderate";
    case "low":      return "Low";
    default:         return "";
  }
}

/* ---------- THEME TOKENS ---------- */

// Use your new “glass” tokens if present, but make cards more opaque/clean.
const surface =
  (colors as any).glassRaised ?? (colors as any).surfaceRaised ?? colors.surface;
const sunken = (colors as any).glassSunken ?? colors.highlight;

const border = (colors as any).glassBorder ?? colors.divider;
const divider = (colors as any).glassDivider ?? colors.divider;

/* ---------- UI ATOMS ---------- */

function SectionDivider() {
  return <View style={{ height: 1, backgroundColor: divider, opacity: 0.65 }} />;
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: spacing.lg,
        paddingVertical: 7, // tighter
      }}
    >
      <Text style={[type.caption, { opacity: 0.7 }]}>{label}</Text>
      <Text
        style={[type.body, { fontWeight: "900", opacity: 0.96 }]}
        numberOfLines={1}
      >
        {value ?? "—"}
      </Text>
    </View>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 14,
        borderRadius: radii.md,
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: colors.accent,
        borderWidth: 1,
        borderColor: border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text style={[type.button, { color: colors.background }]}>{label}</Text>
    </Pressable>
  );
}

function FlatCard({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flex: 1, // 👈 important for equal height
        backgroundColor: surface,
        borderRadius: (radii as any).xl ?? radii.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: border,
        ...shadows.card,
        gap: spacing.md,
      }}
    >
      {children}
    </View>
  );
}

function SummaryCard({
  title,
  bigValue,
  bigLabel,
  rightBadge,
  footnote,
  onFootnotePress,
}: {
  title: string;
  bigValue: string;
  bigLabel: string;
  rightBadge?: string | null;
  footnote?: string | null;
  onFootnotePress?: (() => void) | undefined;
}) {
  return (
    <FlatCard>
      <View
        style={{
          flex: 1,
          gap: 10,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Header */}
        <View style={{ width: "100%", gap: 8, alignItems: "center" }}>
          <Text
            style={[type.sectionHeader, { fontSize: 16, textAlign: "center" }]}
            numberOfLines={1}
          >
            {title}
          </Text>

          {rightBadge ? (
            <View
              style={{
                paddingVertical: 5,
                paddingHorizontal: 10,
                borderRadius: 999,
                backgroundColor: sunken,
                borderWidth: 1,
                borderColor: border,
                maxWidth: "100%",
              }}
            >
              <Text
                style={[type.caption, { fontWeight: "800", opacity: 0.9 }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {rightBadge}
              </Text>
            </View>
          ) : null}

          {/* Short centered divider */}
          <View
            style={{
              width: 70,
              height: 1,
              backgroundColor: divider,
              opacity: 0.55,
            }}
          />
        </View>

        {/* Main stat */}
        <View style={{ alignItems: "center", gap: 6 }}>
          <Text style={[type.caption, { opacity: 0.72, textAlign: "center" }]}>
            {bigLabel}
          </Text>

          <Text
            style={[
              type.screenTitle,
              { fontSize: 40, lineHeight: 44, textAlign: "center" },
            ]}
          >
            {bigValue}
          </Text>
        </View>

        {/* Footnote pill (same size across both cards) */}
        {footnote ? (
          <Pressable
            onPress={onFootnotePress}
            disabled={!onFootnotePress}
            hitSlop={10}
            style={({ pressed }) => ({
              width: "100%",
              alignSelf: "center",
              opacity: onFootnotePress ? (pressed ? 0.7 : 0.95) : 0.85,
              paddingVertical: 10,
              paddingHorizontal: 10,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: border,
              backgroundColor: onFootnotePress ? sunken : "transparent",
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <Text
              style={[
                type.caption,
                { fontWeight: "700", textAlign: "center", opacity: 0.95 },
              ]}
              numberOfLines={1}
            >
              {footnote}
            </Text>
          </Pressable>
        ) : (
          <View style={{ height: 40 }} />
        )}
      </View>
    </FlatCard>
  );
}

/* ---------- TYPES ---------- */

type WhiskeySupabaseRow = {
  id: string;
  display_name: string | null;
  distillery: string | null;
  whiskey_type: string | null;

  category: string | null;
  region: string | null;
  sub_region: string | null;

  proof: number | null;
  age: number | null;
  mash_bill: string | null;
  whiskey_canonical: string | null;
  status: string | null;
  source: string | null;
};

type WhiskeyPhoto = {
  id: string;
  storage_path: string;
  caption: string | null;
  upvotes: number;
  downvotes: number;
  is_featured: boolean;
  user_id: string;
};

type BhhReviewSupabaseRow = {
  whiskey_id?: string | null;
  whiskey_name: string | null;
  rating_100?: number | null;
  youtube_url?: string | null;
  published_at?: string | null;
};

type TastingSupabaseRow = {
  id: string;
  user_id?: string | null;
  whiskey_id?: string | null;
  rating?: number | null;
  created_at?: string | null;
};

/* ---------- SCREEN ---------- */

export default function WhiskeyDetailScreen() {
  const params = useLocalSearchParams<{
  id?: string | string[];
  name?: string | string[];
  toastTitle?: string | string[];
  toastMessage?: string | string[];
  newEntry?: string | string[];
}>();

  const routeId = (asString(params.id) ?? "").trim();
  const typedName = (asString(params.name) ?? "").trim();

  const routeToastTitle = (asString(params.toastTitle) ?? "").trim();
  const routeToastMessage = (asString(params.toastMessage) ?? "").trim();
  const newEntry = (asString(params.newEntry) ?? "") === "true";

  const [loading, setLoading] = useState(true);
  const [statusError, setStatusError] = useState<string>("");

  const [whiskeyId, setWhiskeyId] = useState<string>("");

  const [headerNameRaw, setHeaderNameRaw] = useState<string>("");
  const headerName = useMemo(() => {
    const fallback =
      headerNameRaw ||
      typedName ||
      (isUuidLike(routeId) ? "" : routeId.replace(/-/g, " ")) ||
      "Whiskey";
    return toDisplayTitleCase(fallback);
  }, [headerNameRaw, typedName, routeId]);

  const [toastVisible, setToastVisible] = useState(false);
const [toastTitle, setToastTitle] = useState("");
const [toastMessage, setToastMessage] = useState("");

function showToast(title: string, message?: string) {
  setToastTitle(title);
  setToastMessage(message ?? "");
  setToastVisible(true);
}
useEffect(() => {
  if (!routeToastTitle) return;
  showToast(routeToastTitle, routeToastMessage);
}, [routeToastTitle, routeToastMessage]);

  const [details, setDetails] = useState<{
    distillery: string | null;
    category: string | null;
    region: string | null;
    subRegion: string | null;
    style: string | null;
    proofLabel: string | null;
    ageLabel: string | null;
    mashBill: string | null;
  }>({
    distillery: null,
    category: null,
    region: null,
    subRegion: null,
    style: null,
    proofLabel: null,
    ageLabel: null,
    mashBill: null,
  });

  const [bhh, setBhh] = useState<{ score: number | null; youtubeUrl: string | null }>({
    score: null,
    youtubeUrl: null,
  });

  const [community, setCommunity] = useState<{ total: number; avg: number | null }>({
    total: 0,
    avg: null,
  });

  const [recent, setRecent] = useState<TastingSupabaseRow[]>([]);
  const [photos, setPhotos] = useState<WhiskeyPhoto[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [palateMatch, setPalateMatch] = useState<PalateMatchResult | null>(null);
  const [whiskeyStatus, setWhiskeyStatus] = useState<string | null>(null);
  const [whiskeySource, setWhiskeySource] = useState<string | null>(null);
  const [flavorCallouts, setFlavorCallouts] = useState<{ label: string; mention_count: number; level: number }[]>([]);
  const [bottleDetailsOpen, setBottleDetailsOpen] = useState(false);
  const [welcomeSheetOpen, setWelcomeSheetOpen] = useState(false);
  const [improveOpen, setImproveOpen] = useState(false);
  const [improveProof, setImproveProof] = useState("");
  const [improveDistillery, setImproveDistillery] = useState("");
  const [improveAge, setImproveAge] = useState("");
  const [improveSaving, setImproveSaving] = useState(false);
  const [improvePhotoUploading, setImprovePhotoUploading] = useState(false);
  const [improveTypeId, setImproveTypeId] = useState<string | null>(null);
  const [improveTypeName, setImproveTypeName] = useState<string | null>(null);
  const [improveCategory, setImproveCategory] = useState<string | null>(null);
  const [improveRegion, setImproveRegion] = useState<string | null>(null);
  const [improveSubRegion, setImproveSubRegion] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editDistillery, setEditDistillery] = useState("");
  const [editProof, setEditProof] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editMashBill, setEditMashBill] = useState("");
  const [editTypeId, setEditTypeId] = useState<string | null>(null);
  const [editTypeName, setEditTypeName] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState<string | null>(null);
  const [editRegion, setEditRegion] = useState<string | null>(null);
  const [editSubRegion, setEditSubRegion] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editDropdownOpen, setEditDropdownOpen] = useState<string | null>(null);
  const [taxLoading, setTaxLoading] = useState(false);
  const [taxWhiskeyTypes, setTaxWhiskeyTypes] = useState<{ id: string; name: string }[]>([]);
  const [taxCategories, setTaxCategories] = useState<string[]>([]);
  const [taxRegions, setTaxRegions] = useState<string[]>([]);
  const [taxSubRegions, setTaxSubRegions] = useState<string[]>([]);
  const [taxDropdownOpen, setTaxDropdownOpen] = useState<string | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editNameError, setEditNameError] = useState("");
  const [editTypeError, setEditTypeError] = useState("");
  const [editProofError, setEditProofError] = useState("");
  const autoOpenedRef = useRef(false);
  const navigation = useNavigation();

  const { axes: whiskeyAxes, tier: whiskeyRadarTier } = useWhiskeyRadarData(whiskeyId, community.total);
  const { axes: personalAxes } = useInsightsData();

  // dev strict-mode + navigation remount guard (once per routeId)
  const fetchedOnceRef = useRef<Set<string>>(new Set());

  const logThisWhiskey = async () => {
    await hapticTick();
    router.push(
      `/log/cloud-tasting?whiskeyName=${encodeURIComponent(
        headerName
      )}&whiskeyId=${encodeURIComponent(whiskeyId || routeId)}&lockName=1`
    );
  };

  const editTasting = async (tastingId: string) => {
    await hapticTick();
    router.push(`/log/cloud-tasting?tastingId=${encodeURIComponent(tastingId)}`);
  };

  const openYouTube = async () => {
    if (!bhh.youtubeUrl) return;
    await hapticTick();
    try {
      await Linking.openURL(bhh.youtubeUrl);
    } catch {
      await hapticError();
    }
  };

  const incrementPhotoVote = async (id: string, direction: "up" | "down") => {
    const { error } = await supabase.rpc("increment_photo_vote", {
      photo_id: id,
      direction,
    });
    if (error) {
      await hapticError();
      return;
    }
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              upvotes: direction === "up" ? p.upvotes + 1 : p.upvotes,
              downvotes: direction === "down" ? p.downvotes + 1 : p.downvotes,
            }
          : p
      )
    );
  };

  const submitImprovement = async () => {
    if (improveSaving) return;
    setImproveSaving(true);
    try {
      const proof = improveProof.trim() ? Number(improveProof.trim()) : null;
      const age = improveAge.trim() ? Number(improveAge.trim()) : null;
      const distillery = improveDistillery.trim() || null;

      if (proof !== null && !Number.isFinite(proof)) {
        Alert.alert("Invalid proof", "Please enter a valid number.");
        return;
      }

      const { error } = await supabase.rpc("user_fill_whiskey_missing_fields", {
        p_whiskey_id: whiskeyId,
        p_distillery: distillery,
        p_whiskey_type_id: improveTypeId,
        p_whiskey_type: improveTypeName,
        p_proof: proof,
        p_age: age,
        p_category: improveCategory,
        p_region: improveRegion,
        p_sub_region: improveSubRegion,
      });

      if (error) throw new Error(error.message);

      // Invalidate cache so next load shows updated data
      whiskeyProfileCache.delete(routeId);

      setImproveProof("");
      setImproveDistillery("");
      setImproveAge("");
      setImproveTypeId(null);
      setImproveTypeName(null);
      setImproveCategory(null);
      setImproveRegion(null);
      setImproveSubRegion(null);
      setImproveOpen(false);
      showToast("Thanks!", "Your contribution helps improve the catalog.");
      await hapticTick();
    } catch (e: any) {
      Alert.alert("Submission failed", e?.message ?? "Please try again.");
      await hapticError();
    } finally {
      setImproveSaving(false);
    }
  };

  const uploadPhoto = async () => {
    if (improvePhotoUploading) return;
    try {
      Alert.alert(
        "Add a photo",
        "Take a new photo or choose from your library.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Camera",
            onPress: async () => {
              const permission = await ImagePicker.requestCameraPermissionsAsync();
              if (!permission.granted) {
                Alert.alert("Permission required", "Please allow camera access.");
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [3, 4],
                quality: 0.8,
              });
              if (!result.canceled && result.assets?.[0]) {
                await processAndUploadPhoto(result.assets[0]);
              }
            },
          },
          {
            text: "Photo Library",
            onPress: async () => {
              const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!permission.granted) {
                Alert.alert("Permission required", "Please allow photo library access.");
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [3, 4],
                quality: 0.8,
              });
              if (!result.canceled && result.assets?.[0]) {
                await processAndUploadPhoto(result.assets[0]);
              }
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert("Upload failed", e?.message ?? "Please try again.");
      await hapticError();
    }
  };

  const processAndUploadPhoto = async (asset: ImagePicker.ImagePickerAsset) => {
    setImprovePhotoUploading(true);
    try {
      const ext = asset.uri.split(".").pop() ?? "jpg";
      const fileName = `${whiskeyId}/${Date.now()}.${ext}`;

      const { data: authData } = await supabase.auth.getSession();
      const userId = authData.session?.user?.id;
      if (!userId) throw new Error("Not signed in.");

      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from("whiskey-photos")
        .upload(fileName, blob, { contentType: `image/${ext}`, upsert: false });

      if (uploadError) throw new Error(uploadError.message);

      const { error: insertError } = await supabase
        .from("whiskey_photos")
        .insert({
          whiskey_id: whiskeyId,
          storage_path: fileName,
          user_id: userId,
          upvotes: 0,
          downvotes: 0,
          is_featured: false,
        });

      if (insertError) throw new Error(insertError.message);

      whiskeyProfileCache.delete(routeId);
      showToast("Photo uploaded!", "Thanks for contributing.");
      await hapticTick();
    } catch (e: any) {
      Alert.alert("Upload failed", e?.message ?? "Please try again.");
      await hapticError();
    } finally {
      setImprovePhotoUploading(false);
    }
  };

  const loadTaxonomy = async (category: string | null, region: string | null) => {
    setTaxLoading(true);
    try {
      const [typesRes, catsRes] = await Promise.all([
        supabase.from("whiskey_types").select("id, name").order("name"),
        supabase.from("whiskey_categories").select("category").order("category"),
      ]);
      setTaxWhiskeyTypes((typesRes.data ?? []).map((r: any) => ({ id: r.id, name: r.name })));
      setTaxCategories((catsRes.data ?? []).map((r: any) => r.category).filter(Boolean));

      if (category) {
        const regRes = await supabase
          .from("whiskey_regions")
          .select("region")
          .eq("category", category)
          .order("region");
        setTaxRegions((regRes.data ?? []).map((r: any) => r.region).filter(Boolean));

        if (region) {
          const subRes = await supabase
            .from("whiskey_sub_regions")
            .select("sub_region")
            .eq("category", category)
            .eq("region", region)
            .order("sub_region");
          setTaxSubRegions((subRes.data ?? []).map((r: any) => r.sub_region).filter(Boolean));
        } else {
          setTaxSubRegions([]);
        }
      } else {
        setTaxRegions([]);
        setTaxSubRegions([]);
      }
    } catch {
      // silent fail — taxonomy is optional
    } finally {
      setTaxLoading(false);
    }
  };

  const openEditMode = async () => {
    setEditDisplayName(headerNameRaw);
    setEditNameError("");
    setEditTypeError("");
    setEditProofError("");
    setEditDistillery(details.distillery ?? "");
    setEditProof(details.proofLabel ? String(details.proofLabel).replace(/[^0-9.]/g, "") : "");
    setEditAge(details.ageLabel ? String(details.ageLabel).replace(/[^0-9.]/g, "") : "");
    setEditMashBill(details.mashBill ?? "");
    setEditTypeName(details.style ?? null);
    setEditTypeId(null);
    setEditCategory(details.category ?? null);
    setEditRegion(details.region || null);
    setEditSubRegion(details.subRegion || null);
    setEditMode(true);
    setBottleDetailsOpen(true);
    setEditDropdownOpen(null);
    if (taxWhiskeyTypes.length === 0) {
      await loadTaxonomy(details.category ?? null, details.region ?? null);
    }
  };

  const cancelEditMode = () => {
    if (newEntry) {
      Alert.alert(
        "Are you sure?",
        "This will delete your custom whiskey entry.",
        [
          { text: "Keep Editing", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              await supabase.from("whiskeys").delete().eq("id", whiskeyId);
              router.replace("/(tabs)/log" as any);
            },
          },
        ]
      );
      return;
    }
    setEditMode(false);
    setEditDropdownOpen(null);
    setEditNameError("");
    setEditTypeError("");
    setEditProofError("");
  };

  const submitEdits = async () => {
    if (editSaving) return;
    setEditSaving(true);
    try {
      const { data: authData } = await supabase.auth.getSession();
      const userId = authData.session?.user?.id;
      if (!userId) throw new Error("Not signed in.");

      const suggestions: { field_name: string; current_value: string | null; suggested_value: string }[] = [];

      const proofNum = editProof.trim() ? Number(editProof.trim()) : null;
      const ageNum = editAge.trim() ? Number(editAge.trim()) : null;

      if (editDistillery.trim() && editDistillery.trim() !== (details.distillery ?? "")) {
        suggestions.push({ field_name: "distillery", current_value: details.distillery, suggested_value: editDistillery.trim() });
      }
      if (proofNum !== null && String(proofNum) !== String(details.proofLabel?.replace(/[^0-9.]/g, "") ?? "")) {
        suggestions.push({ field_name: "proof", current_value: details.proofLabel, suggested_value: String(proofNum) });
      }
      if (ageNum !== null && String(ageNum) !== String(details.ageLabel?.replace(/[^0-9.]/g, "") ?? "")) {
        suggestions.push({ field_name: "age", current_value: details.ageLabel, suggested_value: String(ageNum) });
      }
      if (editMashBill.trim() && editMashBill.trim() !== (details.mashBill ?? "")) {
        suggestions.push({ field_name: "mash_bill", current_value: details.mashBill, suggested_value: editMashBill.trim() });
      }
      if (editTypeName && editTypeName !== details.style) {
        suggestions.push({ field_name: "whiskey_type", current_value: details.style, suggested_value: editTypeName });
      }
      if (editCategory && editCategory !== details.category) {
        suggestions.push({ field_name: "category", current_value: details.category, suggested_value: editCategory });
      }
      if (editRegion && editRegion !== details.region) {
        suggestions.push({ field_name: "region", current_value: details.region, suggested_value: editRegion });
      }
      if (editSubRegion && editSubRegion !== details.subRegion) {
        suggestions.push({ field_name: "sub_region", current_value: details.subRegion, suggested_value: editSubRegion });
      }

      if (suggestions.length === 0) {
        setEditMode(false);
        return;
      }

      const rows = suggestions.map(s => ({
        whiskey_id: whiskeyId,
        user_id: userId,
        field_name: s.field_name,
        current_value: s.current_value ?? null,
        suggested_value: s.suggested_value,
        status: "pending",
      }));

      const { error: insertErr } = await supabase
        .from("whiskey_edit_suggestions")
        .insert(rows);

      if (insertErr) throw new Error(insertErr.message);

      // Flag whiskey as pending review
      await supabase
        .from("whiskeys")
        .update({ status: "pending" })
        .eq("id", whiskeyId);

      whiskeyProfileCache.delete(routeId);
      setEditMode(false);
      showToast("Thanks!", `${suggestions.length} edit${suggestions.length > 1 ? "s" : ""} submitted for review.`);
      await hapticTick();
    } catch (e: any) {
      Alert.alert("Submission failed", e?.message ?? "Please try again.");
      await hapticError();
    } finally {
      setEditSaving(false);
    }
  };

  const submitNewEntryDetails = async () => {
    let hasError = false;
    if (!editDisplayName.trim()) { setEditNameError("Required"); hasError = true; }
    if (!editTypeId) { setEditTypeError("Required"); hasError = true; }
    if (!editProof.trim()) { setEditProofError("Required"); hasError = true; }
    if (hasError) return;

    if (editSaving) return;
    setEditSaving(true);
    try {
      const { data: authData } = await supabase.auth.getSession();
      const userId = authData.session?.user?.id;
      if (!userId) throw new Error("Not signed in.");

      const origProof = details.proofLabel ? parseFloat(details.proofLabel.replace(/[^0-9.]/g, "")) : null;
      const origAge = details.ageLabel ? parseFloat(details.ageLabel.replace(/[^0-9.]/g, "")) : null;
      const newProof = editProof.trim() ? Number(editProof.trim()) : null;
      const newAge = editAge.trim() ? Number(editAge.trim()) : null;

      const suggestedFields: Record<string, any> = {};
      if (editDisplayName.trim() !== (headerNameRaw ?? "")) suggestedFields.display_name = editDisplayName.trim();
      if (editTypeId) suggestedFields.whiskey_type_id = editTypeId;
      if (editTypeName) suggestedFields.whiskey_type = editTypeName;
      if (newProof !== null && newProof !== origProof) suggestedFields.proof = newProof;
      if (newAge !== null && newAge !== origAge) suggestedFields.age = newAge;
      if (editDistillery.trim() && editDistillery.trim() !== (details.distillery ?? "")) suggestedFields.distillery = editDistillery.trim();
      if (editMashBill.trim() && editMashBill.trim() !== (details.mashBill ?? "")) suggestedFields.mash_bill = editMashBill.trim();
      if (editCategory && editCategory !== details.category) suggestedFields.category = editCategory;
      if (editRegion && editRegion !== details.region) suggestedFields.region = editRegion;
      if (editSubRegion && editSubRegion !== details.subRegion) suggestedFields.sub_region = editSubRegion;

      const nameRaw = editDisplayName.trim();
      const nameNormalized = nameRaw.toLowerCase().trim();
      const canonicalSlug = nameNormalized.replace(/\s+/g, "-");

      const { data: existing, error: lookupErr } = await supabase
        .from("whiskey_candidates")
        .select("id")
        .eq("name_normalized", nameNormalized)
        .eq("status", "pending")
        .maybeSingle();

      if (lookupErr) throw new Error(lookupErr.message);

      if (existing !== null) {
        const { error: candidateErr } = await supabase
          .from("whiskey_candidates")
          .update({
            created_by: userId,
            name_raw: nameRaw,
            name_normalized: nameNormalized,
            canonical_slug: canonicalSlug,
            suggested_fields: suggestedFields,
            whiskey_type: editTypeName ?? null,
            distillery: editDistillery.trim() || null,
            proof: editProof.trim() ? Number(editProof.trim()) : null,
            age: editAge.trim() ? Number(editAge.trim()) : null,
            category: editCategory ?? null,
            region: editRegion ?? null,
            sub_region: editSubRegion ?? null,
          })
          .eq("id", existing.id);

        if (candidateErr) throw new Error(candidateErr.message);
      } else {
        const { error: candidateErr } = await supabase
          .from("whiskey_candidates")
          .insert({
            whiskey_id: whiskeyId,
            created_by: userId,
            name_raw: nameRaw,
            name_normalized: nameNormalized,
            canonical_slug: canonicalSlug,
            status: "pending",
            approved: false,
            suggested_fields: suggestedFields,
          });

        if (candidateErr) throw new Error(candidateErr.message);
      }

      await supabase.from("whiskeys").update({ status: "unverified" }).eq("id", whiskeyId);
      setWhiskeyStatus("unverified");

      whiskeyProfileCache.delete(routeId);
      setEditMode(false);
      showToast("Submitted!", "Your details are pending review.");
      await hapticTick();
    } catch (e: any) {
      Alert.alert("Submission failed", e?.message ?? "Please try again.");
      await hapticError();
    } finally {
      setEditSaving(false);
    }
  };

  const metaLine = useMemo(() => {
    const parts: string[] = [];
    if (details.style) parts.push(details.style);
    if (details.region) parts.push(details.region);
    return parts.join(" • ");
  }, [details.region, details.style]);

  useEffect(() => {
    let alive = true;

    // 1) Hydrate instantly from cache if we have it
    const cached = routeId ? whiskeyProfileCache.get(routeId) : null;
    if (cached) {
      setWhiskeyId(cached.whiskeyId);
      setHeaderNameRaw(cached.headerNameRaw);
      setDetails(cached.details);
      setBhh(cached.bhh);
      setCommunity(cached.community);
      setRecent(cached.recent);
      setPhotos(cached.photos ?? []);
      setWhiskeyStatus(cached.whiskeyStatus ?? null);
      setFlavorCallouts(cached.flavorCallouts ?? []);
      setPalateMatch(cached.palateMatch ?? null);
      setStatusError("");
      setLoading(false);
    }

    // 2) Prevent duplicate fetches in dev StrictMode (and quick back/forth)
    if (routeId && fetchedOnceRef.current.has(routeId) && cached) {
      return () => {
        alive = false;
      };
    }
    if (routeId) fetchedOnceRef.current.add(routeId);

    (async () => {
      // If we don't have cache, show loader; if we do, keep UI stable while refreshing quietly.
      if (!cached) setLoading(true);
      setStatusError("");

      try {
        if (!routeId) throw new Error("Missing whiskey id.");

        let w: WhiskeySupabaseRow | null = null;

        const whiskeySelect =
          "id, display_name, distillery, whiskey_type, category, region, sub_region, proof, age, mash_bill, whiskey_canonical, status, source";

        if (isUuidLike(routeId)) {
          const { data, error } = await supabase
            .from("whiskeys")
            .select(whiskeySelect)
            .eq("id", routeId)
            .maybeSingle();
          if (error) throw new Error(error.message);
          w = (data as any) as WhiskeySupabaseRow | null;
        } else {
          const { data, error } = await supabase
            .from("whiskeys")
            .select(whiskeySelect)
            .eq("whiskey_canonical", routeId)
            .maybeSingle();
          if (error) throw new Error(error.message);
          w = (data as any) as WhiskeySupabaseRow | null;
        }

        if (!alive) return;
        if (!w?.id) throw new Error("Whiskey not found in whiskeys table.");

        const nextWhiskeyId = String(w.id);

        const nameFromWhiskeys = w.display_name ? String(w.display_name).trim() : "";
        const nextHeaderNameRaw = nameFromWhiskeys;

        const nextDetails = {
          distillery: cleanText(w.distillery),
          category: cleanText(w.category),
          region: cleanText(w.region),
          subRegion: cleanText(w.sub_region),
          style: cleanText(w.whiskey_type),
          proofLabel: formatProof(w.proof),
          ageLabel: formatAge(w.age),
          mashBill: cleanText(w.mash_bill),
        };

        const nextWhiskeyStatus = cleanText(w.status);
        const nextWhiskeySource = cleanText(w.source);

        setWhiskeyId(nextWhiskeyId);
        setHeaderNameRaw(nextHeaderNameRaw);
        setDetails(nextDetails);
        setWhiskeyStatus(nextWhiskeyStatus);
        setWhiskeySource(nextWhiskeySource);

        const { data: bhhRows, error: bhhErr } = await supabase
          .from("bhh_reviews")
          .select("whiskey_id, whiskey_name, rating_100, youtube_url, published_at")
          .eq("whiskey_id", w.id)
          .limit(1000);

        if (!alive) return;
        if (bhhErr) throw new Error(bhhErr.message);

        const rows = (((bhhRows as any) ?? []) as BhhReviewSupabaseRow[]) ?? [];

        const bestByScore = [...rows].sort(
          (a, b) => Number(b.rating_100 ?? 0) - Number(a.rating_100 ?? 0)
        )[0];

        const bestByDate = [...rows].sort((a, b) => {
          const ad = a.published_at ? Date.parse(a.published_at) : 0;
          const bd = b.published_at ? Date.parse(b.published_at) : 0;
          return bd - ad;
        })[0];

        const chosen = bestByScore ?? bestByDate ?? null;

        const nextBhh = {
          score:
            chosen?.rating_100 != null && Number.isFinite(Number(chosen.rating_100))
              ? Math.round(Number(chosen.rating_100))
              : null,
          youtubeUrl: chosen?.youtube_url ? String(chosen.youtube_url) : null,
        };

        setBhh(nextBhh);

        const { data: cs, error: csErr } = await supabase
          .from("whiskey_community_stats")
          .select("community_avg, community_count")
          .eq("whiskey_id", w.id)
          .maybeSingle();

        if (csErr) throw new Error(csErr.message);

        const total =
          cs?.community_count == null || !Number.isFinite(Number(cs.community_count))
            ? 0
            : Number(cs.community_count);

        const avg =
          cs?.community_avg == null || !Number.isFinite(Number(cs.community_avg))
            ? null
            : Math.round(Number(cs.community_avg) * 10) / 10;

        const nextCommunity = { total, avg };
        setCommunity(nextCommunity);

        let nextRecent: TastingSupabaseRow[] = [];
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;

        if (user?.id) {
          const { data: recentRows, error: recentErr } = await supabase
            .from("tastings")
            .select("id, user_id, whiskey_id, rating, created_at")
            .eq("user_id", user.id)
            .eq("whiskey_id", w.id)
            .order("created_at", { ascending: false })
            .limit(10);

          if (recentErr) throw new Error(recentErr.message);
          nextRecent = (((recentRows as any) as TastingSupabaseRow[]) ?? []) as TastingSupabaseRow[];
          setRecent(nextRecent);

          const { data: profileRow } = await supabase
            .from("profiles")
            .select("is_premium")
            .eq("id", user.id)
            .maybeSingle();
          if (alive) setIsPremium((profileRow as any)?.is_premium === true);
        } else {
          setRecent([]);
        }

        const { data: photoRows, error: photosErr } = await supabase
          .from("whiskey_photos")
          .select("id, storage_path, caption, upvotes, downvotes, is_featured, user_id")
          .eq("whiskey_id", nextWhiskeyId)
          .order("is_featured", { ascending: false })
          .order("upvotes", { ascending: false })
          .limit(20);

        if (!alive) return;
        if (photosErr) throw new Error(photosErr.message);
        const nextPhotos = ((photoRows as any) ?? []) as WhiskeyPhoto[];
        setPhotos(nextPhotos);

        const { data: calloutRows, error: calloutErr } = await supabase
          .from("whiskey_flavor_callouts")
          .select("label, mention_count, level")
          .eq("whiskey_id", w.id)
          .order("mention_count", { ascending: false })
          .limit(3);

        if (!alive) return;
        if (calloutErr) throw new Error(calloutErr.message);
        const nextFlavorCallouts = ((calloutRows as any) ?? []) as { label: string; mention_count: number; level: number }[];
        setFlavorCallouts(nextFlavorCallouts);

        let nextPalateMatch: PalateMatchResult | null = null;
        if (user?.id) {
          const { data: matchData } = await supabase.rpc(
            "get_palate_match_for_display",
            { p_whiskey_id: w.id }
          );
          if (!alive) return;
          nextPalateMatch = (matchData as any) ?? null;
          setPalateMatch(nextPalateMatch);
        }

        // Cache computed snapshot (so next open is instant)
        whiskeyProfileCache.set(routeId, {
          whiskeyId: nextWhiskeyId,
          headerNameRaw: nextHeaderNameRaw,
          details: nextDetails,
          bhh: nextBhh,
          community: nextCommunity,
          recent: nextRecent,
          photos: nextPhotos,
          whiskeyStatus: nextWhiskeyStatus,
          flavorCallouts: nextFlavorCallouts,
          palateMatch: nextPalateMatch,
          cachedAt: Date.now(),
        });
      } catch (e: any) {
        console.log("Whiskey profile load failed:", e?.message ?? e);
        if (alive) setStatusError(String(e?.message ?? e));
        await hapticError();
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [routeId]);

  useEffect(() => {
    if (improveOpen && taxWhiskeyTypes.length === 0) {
      void loadTaxonomy(improveCategory, improveRegion);
    }
  }, [improveOpen]);

  useEffect(() => {
    if (!newEntry) return;
    if (loading) return;
    if (!whiskeyId) return;
    if (autoOpenedRef.current) return;
    autoOpenedRef.current = true;
    setWelcomeSheetOpen(true);
    void openEditMode();
  }, [newEntry, loading, whiskeyId]);

  // Block navigation away while newEntry edit is incomplete
  useEffect(() => {
    if (!newEntry || !editMode) return;

    const unsubscribe = navigation.addListener("beforeRemove" as any, (e: any) => {
      e.preventDefault();
      Alert.alert(
        "Are you sure?",
        "This will delete your custom whiskey entry.",
        [
          { text: "Keep Editing", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              await supabase.from("whiskeys").delete().eq("id", whiskeyId);
              navigation.removeListener("beforeRemove" as any, () => {});
              router.replace("/(tabs)/log" as any);
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [newEntry, editMode, whiskeyId, navigation]);

  useEffect(() => {
    if (!newEntry || !editMode) return;

    const onHardwareBack = () => {
      Alert.alert(
        "Are you sure?",
        "This will delete your custom whiskey entry.",
        [
          { text: "Keep Editing", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              await supabase.from("whiskeys").delete().eq("id", whiskeyId);
              router.replace("/(tabs)/log" as any);
            },
          },
        ]
      );
      return true; // consumed — do not bubble to default back behavior
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", onHardwareBack);
    return () => subscription.remove();
  }, [newEntry, editMode, whiskeyId]);

  function TaxDropdown({
    label,
    value,
    options,
    disabled,
    dropdownKey,
    onSelect,
  }: {
    label: string;
    value: string | null;
    options: string[];
    disabled?: boolean;
    dropdownKey: string;
    onSelect: (v: string) => void;
  }) {
    const isOpen = taxDropdownOpen === dropdownKey;
    const canOpen = !disabled && options.length > 0;
    return (
      <View style={{ gap: spacing.xs }}>
        <Text style={[type.caption, { opacity: 0.7 }]}>{label}</Text>
        <Pressable
          disabled={!canOpen}
          onPress={() => setTaxDropdownOpen(isOpen ? null : dropdownKey)}
          style={({ pressed }) => ({
            paddingVertical: 10,
            paddingHorizontal: spacing.md,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.divider,
            backgroundColor: pressed ? colors.surfaceSunken : "transparent",
            opacity: canOpen ? 1 : 0.45,
            flexDirection: "row" as const,
            alignItems: "center" as const,
            justifyContent: "space-between" as const,
          })}
        >
          <Text style={[type.body, { color: value ? colors.textPrimary : colors.textMuted, fontSize: 15 }]} numberOfLines={1}>
            {value ?? (disabled ? "Select above first…" : `Select ${label.toLowerCase()}…`)}
          </Text>
          <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />
        </Pressable>
        {isOpen && (
          <View style={{
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.divider,
            overflow: "hidden",
            maxHeight: 220,
          }}>
            <ScrollView
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {options.map(opt => (
                <Pressable
                  key={opt}
                  onPress={() => {
                    onSelect(opt);
                    setTaxDropdownOpen(null);
                  }}
                  style={({ pressed }) => ({
                    paddingVertical: 11,
                    paddingHorizontal: spacing.md,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.divider,
                    backgroundColor: opt === value ? colors.accentFaint : pressed ? colors.surfaceSunken : "transparent",
                  })}
                >
                  <Text style={[type.body, { fontSize: 15, color: colors.textPrimary, fontWeight: opt === value ? "900" : "400" }]}>
                    {opt}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  }

  function EditDropdown({
    label,
    value,
    options,
    disabled,
    dropdownKey,
    onSelect,
  }: {
    label: string;
    value: string | null;
    options: string[];
    disabled?: boolean;
    dropdownKey: string;
    onSelect: (v: string) => void;
  }) {
    const isOpen = editDropdownOpen === dropdownKey;
    const canOpen = !disabled && options.length > 0;
    return (
      <View style={{ flex: 1 }}>
        <Pressable
          disabled={!canOpen}
          onPress={() => setEditDropdownOpen(isOpen ? null : dropdownKey)}
          style={({ pressed }) => ({
            paddingVertical: 6,
            paddingHorizontal: spacing.sm,
            borderRadius: radii.sm,
            borderWidth: 1,
            borderColor: colors.accent,
            backgroundColor: pressed ? colors.accentFaint : "transparent",
            opacity: canOpen ? 1 : 0.45,
            flexDirection: "row" as const,
            alignItems: "center" as const,
            justifyContent: "space-between" as const,
          })}
        >
          <Text style={[type.body, { color: value ? colors.textPrimary : colors.textMuted, fontSize: 14 }]} numberOfLines={1}>
            {value ?? (disabled ? "Select above first…" : `Select…`)}
          </Text>
          <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={14} color={colors.accent} />
        </Pressable>
        {isOpen && (
          <View style={{
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.divider,
            overflow: "hidden",
            maxHeight: 200,
            marginTop: 4,
            zIndex: 999,
          }}>
            <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {options.map(opt => (
                <Pressable
                  key={opt}
                  onPress={() => { onSelect(opt); setEditDropdownOpen(null); }}
                  style={({ pressed }) => ({
                    paddingVertical: 10,
                    paddingHorizontal: spacing.md,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.divider,
                    backgroundColor: opt === value ? colors.accentFaint : pressed ? colors.surfaceSunken : "transparent",
                  })}
                >
                  <Text style={[type.body, { fontSize: 14, color: colors.textPrimary, fontWeight: opt === value ? "900" : "400" }]}>
                    {opt}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  }

  return (
  <>
    <ScrollView style={{ flex: 1, backgroundColor: "transparent" }}>
      <Stack.Screen options={{ title: "Whiskey Profile", gestureEnabled: !(newEntry && editMode) }} />

      <View
        style={{
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
          paddingBottom: spacing.xl,
          gap: spacing.md,
        }}
      >
        {loading ? (
          <View style={{ paddingVertical: spacing.lg }}>
            <ActivityIndicator />
            <Text style={[type.body, { marginTop: spacing.sm, opacity: 0.7 }]}>
              Loading whiskey…
            </Text>
          </View>
        ) : null}

        {statusError ? (
          <Text style={[type.body, { opacity: 0.75 }]}>Error: {statusError}</Text>
        ) : null}

        {/* Hero photo */}
        {photos.length > 0 ? (
          <View style={{ overflow: "hidden", borderRadius: radii.lg }}>
            <Image
              source={{
                uri: supabase.storage
                  .from("whiskey-photos")
                  .getPublicUrl(photos[0].storage_path).data.publicUrl,
              }}
              style={{ width: "100%", height: 260, borderRadius: radii.lg, resizeMode: "cover" }}
            />
          </View>
        ) : null}

        {/* HERO */}
        <View style={{ alignItems: "center", paddingTop: 6 }}>
          <Text style={[type.screenTitle, { textAlign: "center" }]}>
            {headerName}
          </Text>

          <View
            style={{
              width: 220,
              height: 4,
              borderRadius: 999,
              backgroundColor: colors.accent,
              opacity: 0.65,
              marginTop: 10,
            }}
          />

          {whiskeyStatus === "pending" && (
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginTop: 8,
              paddingVertical: 6,
              paddingHorizontal: 14,
              borderRadius: 999,
              backgroundColor: colors.accentFaint,
              borderWidth: 1,
              borderColor: colors.accent,
            }}>
              <Ionicons name="time-outline" size={14} color={colors.accent} />
              <Text style={[type.labelCaps, { fontSize: 11, color: colors.accent }]}>
                Pending Verification
              </Text>
            </View>
          )}

          {whiskeyStatus === "unverified" && (
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginTop: 8,
              paddingVertical: 6,
              paddingHorizontal: 14,
              borderRadius: 999,
              backgroundColor: colors.accentFaint,
              borderWidth: 1,
              borderColor: colors.accent,
            }}>
              <Ionicons name="hourglass-outline" size={14} color={colors.accent} />
              <Text style={[type.labelCaps, { fontSize: 11, color: colors.accent }]}>
                Pending Review
              </Text>
            </View>
          )}

          {metaLine ? (
            <Text
              style={[
                type.microcopyItalic,
                { opacity: 0.74, marginTop: 10, textAlign: "center" },
              ]}
            >
              {metaLine}
            </Text>
          ) : null}
        </View>

        {/* CTA */}
        {!editMode && (
          <View style={{ marginTop: 6 }}>
            <PrimaryButton
              label="Log a Tasting"
              onPress={withSuccess(logThisWhiskey)}
            />
          </View>
        )}

        {/* Bottle details */}
        <View style={{ gap: 4, marginTop: 4 }}>
          {/* Header row */}
          <Pressable
            onPress={withTick(() => setBottleDetailsOpen(v => !v))}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
          >
            <Text style={[type.sectionHeader, { fontSize: 20 }]}>Bottle details</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              {!editMode ? (
                <Pressable
                  onPress={withTick(openEditMode)}
                  style={({ pressed }) => ({
                    paddingVertical: 4,
                    paddingHorizontal: 10,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    backgroundColor: pressed ? colors.surfaceSunken : "transparent",
                  })}
                >
                  <Text style={[type.labelCaps, { fontSize: 11, color: colors.textSecondary }]}>Suggest edits</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={cancelEditMode}
                  style={({ pressed }) => ({
                    paddingVertical: 4,
                    paddingHorizontal: 10,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    backgroundColor: pressed ? colors.surfaceSunken : "transparent",
                  })}
                >
                  <Text style={[type.labelCaps, { fontSize: 11, color: colors.textMuted }]}>Cancel</Text>
                </Pressable>
              )}
              <Ionicons name={bottleDetailsOpen ? "chevron-up" : "chevron-down"} size={18} color={colors.textMuted} />
            </View>
          </Pressable>

          {bottleDetailsOpen ? (
          <>
          <SectionDivider />

          {/* Display Name — only in edit mode */}
          {editMode && (
            <View style={{ gap: spacing.xs, paddingVertical: 4 }}>
              <Text style={[type.caption, { opacity: 0.7 }]}>
                Whiskey Name{" "}
                <Text style={{ color: colors.accent }}>*</Text>
              </Text>
              <TextInput
                value={editDisplayName}
                onChangeText={t => {
                  setEditDisplayName(t);
                  if (t.trim()) setEditNameError("");
                }}
                autoCapitalize="words"
                placeholder="Enter whiskey name…"
                placeholderTextColor={colors.textMuted}
                style={{
                  color: colors.textPrimary,
                  fontFamily: type.body.fontFamily,
                  fontSize: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: editNameError ? colors.danger : colors.accent,
                  paddingVertical: 2,
                }}
              />
              {editNameError ? (
                <Text style={[type.caption, { color: colors.danger, fontSize: 11 }]}>{editNameError}</Text>
              ) : null}
            </View>
          )}

          {/* Distillery */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4, gap: spacing.lg }}>
            <Text style={[type.caption, { opacity: 0.7, flexShrink: 0 }]}>Distillery</Text>
            {editMode ? (
              <TextInput
                value={editDistillery}
                onChangeText={setEditDistillery}
                autoCapitalize="words"
                placeholder="Enter distillery…"
                placeholderTextColor={colors.textMuted}
                style={{ flex: 1, textAlign: "right", color: colors.textPrimary, fontFamily: type.body.fontFamily, fontSize: 14, borderBottomWidth: 1, borderBottomColor: colors.accent, paddingVertical: 2 }}
              />
            ) : (
              <Text style={[type.body, { fontWeight: "900", opacity: 0.96 }]} numberOfLines={1}>{details.distillery ?? "—"}</Text>
            )}
          </View>

          {/* Category */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4, gap: spacing.lg }}>
            <Text style={[type.caption, { opacity: 0.7, flexShrink: 0 }]}>Category</Text>
            {editMode ? (
              <EditDropdown
                label="Category"
                value={editCategory}
                options={taxCategories}
                dropdownKey="edit-category"
                onSelect={async v => {
                  setEditCategory(v);
                  setEditRegion(null);
                  setEditSubRegion(null);
                  await loadTaxonomy(v, null);
                }}
              />
            ) : (
              <Text style={[type.body, { fontWeight: "900", opacity: 0.96 }]} numberOfLines={1}>{details.category ?? "—"}</Text>
            )}
          </View>

          {/* Region */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4, gap: spacing.lg }}>
            <Text style={[type.caption, { opacity: 0.7, flexShrink: 0 }]}>Region</Text>
            {editMode ? (
              <EditDropdown
                label="Region"
                value={editRegion}
                options={taxRegions}
                disabled={!editCategory}
                dropdownKey="edit-region"
                onSelect={async v => {
                  setEditRegion(v);
                  setEditSubRegion(null);
                  await loadTaxonomy(editCategory, v);
                }}
              />
            ) : (
              <Text style={[type.body, { fontWeight: "900", opacity: 0.96 }]} numberOfLines={1}>{details.region ?? "—"}</Text>
            )}
          </View>

          {/* Sub-Region */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4, gap: spacing.lg }}>
            <Text style={[type.caption, { opacity: 0.7, flexShrink: 0 }]}>Sub-Region</Text>
            {editMode ? (
              <EditDropdown
                label="Sub-Region"
                value={editSubRegion}
                options={taxSubRegions}
                disabled={!editCategory || !editRegion}
                dropdownKey="edit-subregion"
                onSelect={v => setEditSubRegion(v)}
              />
            ) : (
              <Text style={[type.body, { fontWeight: "900", opacity: 0.96 }]} numberOfLines={1}>{details.subRegion ?? "—"}</Text>
            )}
          </View>

          {/* Style */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: editMode ? "flex-start" : "center", paddingVertical: 4, gap: spacing.lg }}>
            <Text style={[type.caption, { opacity: 0.7, flexShrink: 0, paddingTop: editMode ? 8 : 0 }]}>
              Style{editMode ? <Text style={{ color: colors.accent }}> *</Text> : null}
            </Text>
            {editMode ? (
              <View style={{ flex: 1, gap: 2 }}>
                <EditDropdown
                  label="Style"
                  value={editTypeName}
                  options={taxWhiskeyTypes.map(t => t.name)}
                  dropdownKey="edit-type"
                  onSelect={name => {
                    const hit = taxWhiskeyTypes.find(t => t.name === name);
                    setEditTypeId(hit?.id ?? null);
                    setEditTypeName(name);
                    setEditTypeError("");
                  }}
                />
                {editTypeError ? (
                  <Text style={[type.caption, { color: colors.danger, fontSize: 11, textAlign: "right" }]}>{editTypeError}</Text>
                ) : null}
              </View>
            ) : (
              <Text style={[type.body, { fontWeight: "900", opacity: 0.96 }]} numberOfLines={1}>{details.style ?? "—"}</Text>
            )}
          </View>

          {/* Proof */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: editMode ? "flex-start" : "center", paddingVertical: 4, gap: spacing.lg }}>
            <Text style={[type.caption, { opacity: 0.7, flexShrink: 0, paddingTop: editMode ? 2 : 0 }]}>
              Proof{editMode ? <Text style={{ color: colors.accent }}> *</Text> : null}
            </Text>
            {editMode ? (
              <View style={{ flex: 1, gap: 2 }}>
                <TextInput
                  value={editProof}
                  onChangeText={t => {
                    const v = t.replace(/[^0-9.]/g, "");
                    setEditProof(v);
                    if (v.trim()) setEditProofError("");
                  }}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 90"
                  placeholderTextColor={colors.textMuted}
                  style={{ textAlign: "right", color: colors.textPrimary, fontFamily: type.body.fontFamily, fontSize: 14, borderBottomWidth: 1, borderBottomColor: editProofError ? colors.danger : colors.accent, paddingVertical: 2 }}
                />
                {editProofError ? (
                  <Text style={[type.caption, { color: colors.danger, fontSize: 11, textAlign: "right" }]}>{editProofError}</Text>
                ) : null}
              </View>
            ) : (
              <Text style={[type.body, { fontWeight: "900", opacity: 0.96 }]} numberOfLines={1}>{details.proofLabel ?? "—"}</Text>
            )}
          </View>

          {/* Age */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4, gap: spacing.lg }}>
            <Text style={[type.caption, { opacity: 0.7, flexShrink: 0 }]}>Age</Text>
            {editMode ? (
              <TextInput
                value={editAge}
                onChangeText={t => setEditAge(t.replace(/[^0-9.]/g, ""))}
                keyboardType="decimal-pad"
                placeholder="e.g. 12"
                placeholderTextColor={colors.textMuted}
                style={{ flex: 1, textAlign: "right", color: colors.textPrimary, fontFamily: type.body.fontFamily, fontSize: 14, borderBottomWidth: 1, borderBottomColor: colors.accent, paddingVertical: 2 }}
              />
            ) : (
              <Text style={[type.body, { fontWeight: "900", opacity: 0.96 }]} numberOfLines={1}>{details.ageLabel ?? "—"}</Text>
            )}
          </View>

          {/* Mash Bill */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4, gap: spacing.lg }}>
            <Text style={[type.caption, { opacity: 0.7, flexShrink: 0 }]}>Mash Bill</Text>
            {editMode ? (
              <TextInput
                value={editMashBill}
                onChangeText={setEditMashBill}
                autoCapitalize="none"
                placeholder="e.g. 75% corn, 21% rye"
                placeholderTextColor={colors.textMuted}
                style={{ flex: 1, textAlign: "right", color: colors.textPrimary, fontFamily: type.body.fontFamily, fontSize: 14, borderBottomWidth: 1, borderBottomColor: colors.accent, paddingVertical: 2 }}
              />
            ) : (
              <Text style={[type.body, { fontWeight: "900", opacity: 0.96 }]} numberOfLines={1}>{details.mashBill ?? "—"}</Text>
            )}
          </View>

          {/* Edit mode actions */}
          {editMode && (
            <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              {taxLoading && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text style={[type.caption, { color: colors.textMuted }]}>Loading options…</Text>
                </View>
              )}
              <Pressable
                onPress={newEntry ? submitNewEntryDetails : submitEdits}
                disabled={editSaving}
                style={({ pressed }) => ({
                  paddingVertical: 12,
                  borderRadius: radii.md,
                  alignItems: "center",
                  backgroundColor: colors.accent,
                  opacity: editSaving ? 0.5 : pressed ? 0.85 : 1,
                })}
              >
                <Text style={[type.button, { color: colors.background }]}>
                  {editSaving ? "Submitting…" : "Submit"}
                </Text>
              </Pressable>
              <Text style={[type.caption, { color: colors.textMuted, textAlign: "center", opacity: 0.7 }]}>
                {whiskeyStatus === "pending" && whiskeySource === "user"
                  ? "Your submission will be reviewed before going live."
                  : "Edits are reviewed before going live. Only changed fields are submitted."}
              </Text>
            </View>
          )}
          </>
          ) : null}
        </View>

        <View style={{ gap: 5, marginTop: spacing.sm }}>
          <Pressable
            onPress={withTick(() => setImproveOpen(v => !v))}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.xs }}
          >
            <Text style={[type.sectionHeader, { fontSize: 20 }]}>Help improve this entry</Text>
            <Ionicons name={improveOpen ? "chevron-up" : "chevron-down"} size={18} color={colors.textMuted} />
          </Pressable>

          {improveOpen && (
            <View style={{ gap: spacing.md, paddingTop: spacing.xs }}>
              <SectionDivider />

              {!details.proofLabel && (
                <View style={{ gap: spacing.xs }}>
                  <Text style={[type.caption, { opacity: 0.7 }]}>Proof <Text style={{ color: colors.accent }}>*</Text></Text>
                  <TextInput
                    value={improveProof}
                    onChangeText={t => setImproveProof(t.replace(/[^0-9.]/g, ""))}
                    placeholder="e.g. 90 or 100.5"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: spacing.md,
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: colors.divider,
                      color: colors.textPrimary,
                      fontFamily: type.body.fontFamily,
                      fontSize: 15,
                    }}
                  />
                </View>
              )}

              {!details.distillery && (
                <View style={{ gap: spacing.xs }}>
                  <Text style={[type.caption, { opacity: 0.7 }]}>Distillery</Text>
                  <TextInput
                    value={improveDistillery}
                    onChangeText={setImproveDistillery}
                    placeholder="e.g. Buffalo Trace"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="words"
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: spacing.md,
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: colors.divider,
                      color: colors.textPrimary,
                      fontFamily: type.body.fontFamily,
                      fontSize: 15,
                    }}
                  />
                </View>
              )}

              {!details.ageLabel && (
                <View style={{ gap: spacing.xs }}>
                  <Text style={[type.caption, { opacity: 0.7 }]}>Age (years)</Text>
                  <TextInput
                    value={improveAge}
                    onChangeText={t => setImproveAge(t.replace(/[^0-9.]/g, ""))}
                    placeholder="e.g. 12"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: spacing.md,
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: colors.divider,
                      color: colors.textPrimary,
                      fontFamily: type.body.fontFamily,
                      fontSize: 15,
                    }}
                  />
                </View>
              )}

              {taxLoading && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text style={[type.caption, { color: colors.textMuted }]}>Loading options…</Text>
                </View>
              )}

              {!details.style && !taxLoading && (
                <TaxDropdown
                  label="Whiskey Type"
                  value={improveTypeName}
                  options={taxWhiskeyTypes.map(t => t.name)}
                  dropdownKey="type"
                  onSelect={name => {
                    const hit = taxWhiskeyTypes.find(t => t.name === name);
                    setImproveTypeId(hit?.id ?? null);
                    setImproveTypeName(name);
                  }}
                />
              )}

              {!details.category && !taxLoading && (
                <TaxDropdown
                  label="Category"
                  value={improveCategory}
                  options={taxCategories}
                  dropdownKey="category"
                  onSelect={async v => {
                    setImproveCategory(v);
                    setImproveRegion(null);
                    setImproveSubRegion(null);
                    await loadTaxonomy(v, null);
                  }}
                />
              )}

              {!details.region && !taxLoading && (
                <TaxDropdown
                  label="Region"
                  value={improveRegion}
                  options={taxRegions}
                  disabled={!improveCategory}
                  dropdownKey="region"
                  onSelect={async v => {
                    setImproveRegion(v);
                    setImproveSubRegion(null);
                    await loadTaxonomy(improveCategory, v);
                  }}
                />
              )}

              {!details.subRegion && !taxLoading && (
                <TaxDropdown
                  label="Sub-Region"
                  value={improveSubRegion}
                  options={taxSubRegions}
                  disabled={!improveCategory || !improveRegion}
                  dropdownKey="subregion"
                  onSelect={v => setImproveSubRegion(v)}
                />
              )}

              <Pressable
                onPress={uploadPhoto}
                disabled={improvePhotoUploading}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: spacing.sm,
                  paddingVertical: 12,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  backgroundColor: pressed ? colors.surfaceSunken : "transparent",
                  opacity: improvePhotoUploading ? 0.5 : 1,
                })}
              >
                <Ionicons name="camera-outline" size={16} color={colors.textSecondary} />
                <Text style={[type.button, { color: colors.textSecondary }]}>
                  {improvePhotoUploading ? "Uploading…" : "Upload a photo"}
                </Text>
              </Pressable>

              <Pressable
                onPress={submitImprovement}
                disabled={improveSaving || (!improveProof.trim() && !improveDistillery.trim() && !improveAge.trim() && !improveTypeId && !improveCategory)}
                style={({ pressed }) => ({
                  paddingVertical: 13,
                  borderRadius: radii.md,
                  alignItems: "center",
                  backgroundColor: colors.accent,
                  opacity: improveSaving || (!improveProof.trim() && !improveDistillery.trim() && !improveAge.trim() && !improveTypeId && !improveCategory) ? 0.4 : pressed ? 0.85 : 1,
                })}
              >
                <Text style={[type.button, { color: colors.background }]}>
                  {improveSaving ? "Submitting…" : "Submit"}
                </Text>
              </Pressable>

              <Text style={[type.caption, { color: colors.textMuted, textAlign: "center", opacity: 0.7 }]}>
                Only missing fields are shown. Submissions are reviewed before going live.
              </Text>
            </View>
          )}
        </View>

        {/* Accent divider */}
        <View style={{ marginTop: spacing.sm }}>
          <View
            style={{
              height: 2,
              marginTop: 8,
              alignSelf: "center",
              width: "92%",
              backgroundColor: "rgba(190, 150, 99, 0.14)",
              borderRadius: 999,
              opacity: 0.55,
            }}
          />
          <View
            style={{
              height: 2,
              marginTop: -2,
              alignSelf: "center",
              width: "44%",
              backgroundColor: "rgba(190, 150, 99, 0.38)",
              borderRadius: 999,
              opacity: 0.65,
            }}
          />
        </View>

        {/* Flavor Profile */}
        {whiskeyAxes.length > 0 ? (
          <View style={{ gap: 5 }}>
            <Text style={[type.sectionHeader, { fontSize: 20 }]}>Flavor Profile</Text>
            <SectionDivider />

            {/* Block 1: Palate Match */}
            {palateMatch !== null && palateMatch.tier !== "insufficient_data" && !palateMatch.error ? (
              palateMatch.is_premium === false ? (
                <View style={{ alignItems: "center", gap: spacing.sm, paddingVertical: spacing.md }}>
                  <View style={{
                    paddingVertical: 8,
                    paddingHorizontal: 20,
                    borderRadius: 999,
                    backgroundColor: tierBgColor(palateMatch.tier),
                    borderWidth: 1,
                    borderColor: tierBorderColor(palateMatch.tier),
                  }}>
                    <Text style={[type.sectionHeader, { fontSize: 18, color: tierTextColor(palateMatch.tier) }]}>
                      {tierLabel(palateMatch.tier)}
                    </Text>
                  </View>
                  <Text style={[type.caption, { opacity: 0.6 }]}>
                    {confidenceLabel(palateMatch.confidence_label)} confidence
                  </Text>
                  <Pressable
                    onPress={() => router.push("/insights" as any)}
                    style={({ pressed }) => ({
                      marginTop: spacing.xs,
                      paddingVertical: 10,
                      paddingHorizontal: spacing.lg,
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: colors.accent,
                      backgroundColor: pressed ? colors.accentFaint : "transparent",
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <Text style={[type.caption, { color: colors.accent, fontWeight: "700", textAlign: "center" }]}>
                      Unlock your flavor overlay and full match details
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View style={{ alignItems: "center", gap: spacing.sm, paddingVertical: spacing.md }}>
                  <Text style={[type.screenTitle, { fontSize: 48, lineHeight: 52 }]}>
                    {Math.round(palateMatch.score ?? 0)}%
                  </Text>
                  <View style={{
                    paddingVertical: 6,
                    paddingHorizontal: 16,
                    borderRadius: 999,
                    backgroundColor: tierBgColor(palateMatch.tier),
                    borderWidth: 1,
                    borderColor: tierBorderColor(palateMatch.tier),
                  }}>
                    <Text style={[type.labelCaps, { fontSize: 12, color: tierTextColor(palateMatch.tier) }]}>
                      {tierLabel(palateMatch.tier)}
                    </Text>
                  </View>
                  <Text style={[type.caption, { opacity: 0.6 }]}>
                    {confidenceLabel(palateMatch.confidence_label)} confidence
                  </Text>
                  {palateMatch.explanation ? (
                    <Text style={[type.body, { textAlign: "center", opacity: 0.85, paddingHorizontal: spacing.lg }]}>
                      {palateMatch.explanation}
                    </Text>
                  ) : null}
                </View>
              )
            ) : null}

            {/* Block 2: Flavor Radar */}
            <View style={{ position: "relative" }}>
              <View style={{ marginHorizontal: -spacing.md }}>
                <RadarChart
                  axes={whiskeyAxes}
                  size={350}
                  levels={4}
                  showLabels
                  fillColor={colors.accentFaint}
                  strokeColor={colors.textSecondary}
                />
              </View>
              {isPremium && personalAxes.length >= 3 ? (
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: 0.45,
                    marginHorizontal: -spacing.md,
                  }}
                >
                  <RadarChart axes={personalAxes} size={350} levels={4} showLabels={false} />
                </View>
              ) : null}
            </View>

            {whiskeyRadarTier === "fallback" || whiskeyRadarTier === "blended" ? (
              <Text
                style={[
                  type.caption,
                  { opacity: 0.6, textAlign: "center", marginTop: spacing.sm },
                ]}
              >
                {whiskeyRadarTier === "fallback"
                  ? "No one has logged this pour yet, so the radar reflects distillery research and category patterns."
                  : "Only a few tastings so far, so this radar blends real notes with distillery research and category patterns."}
              </Text>
            ) : null}

            {isPremium && flavorCallouts.length > 0 ? (
              <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
                <Text style={[type.caption, { fontWeight: "700", opacity: 0.75 }]}>
                  Flavors Detected
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                  {flavorCallouts.map((c, i) => (
                    <View
                      key={i}
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: 999,
                        backgroundColor: sunken,
                        borderWidth: 1,
                        borderColor: border,
                      }}
                    >
                      <Text style={[type.caption, { fontWeight: "800", opacity: 0.9 }]}>
                        {toDisplayTitleCase(c.label)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <Text
              style={[
                type.caption,
                { opacity: 0.6, textAlign: "center", marginTop: spacing.sm },
              ]}
            >
              Community profile · Based on {community.total} tastings
            </Text>

            {isPremium && personalAxes.length >= 3 ? (
              <Text
                style={[
                  type.caption,
                  { opacity: 0.5, textAlign: "center", marginTop: 4, color: colors.accent },
                ]}
              >
                Gold overlay = your personal profile
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Community + BHH */}
        <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <SummaryCard
              title="Community"
              bigLabel="Average"
              bigValue={community.avg != null ? String(community.avg) : "—"}
              footnote={`Reviews: ${community.total}`}
            />
          </View>

          <View style={{ flex: 1 }}>
            <SummaryCard
              title="Buffalo Happy Hour"
              bigLabel="Score"
              bigValue={bhh.score != null ? String(bhh.score) : "—"}
              footnote={bhh.youtubeUrl ? "Watch Review" : "No video yet"}
              onFootnotePress={bhh.youtubeUrl ? withTick(openYouTube) : undefined}
            />
          </View>
        </View>

        {/* Recent Tastings */}
        <View style={{ gap: 8, marginTop: spacing.md }}>
          <Text style={[type.sectionHeader, { fontSize: 20 }]}>Recent Tastings</Text>

          {recent.length === 0 ? (
            <Text style={[type.body, { opacity: 0.7 }]}>
              None yet — log your first tasting.
            </Text>
          ) : (
            <View style={{ gap: spacing.md }}>
              {recent.map((t, idx) => (
                <Pressable
                  key={`${t.id}:${idx}`}
                  onPress={withTick(() => editTasting(String(t.id)))}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? sunken : surface,
                    borderRadius: radii.md,
                    padding: spacing.lg,
                    borderWidth: 1,
                    borderColor: border,
                    ...shadows.card,
                    opacity: pressed ? 0.98 : 1,
                    gap: 6,
                  })}
                >
                  <Text style={[type.body, { fontWeight: "900" }]}>
                    Rating: {t.rating ?? "—"}
                  </Text>

                  {t.created_at ? (
                    <Text style={[type.caption, { opacity: 0.72 }]}>
                      {formatCreatedAt(t.created_at)}
                    </Text>
                  ) : null}

                  <Text style={[type.caption, { opacity: 0.6 }]}>Tap to edit</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
        {/* Photo carousel */}
        {photos.length > 0 ? (
          <View style={{ gap: 8, marginTop: spacing.md }}>
            <Text style={[type.sectionHeader, { fontSize: 20 }]}>Photos</Text>
            <SectionDivider />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: spacing.sm }}
            >
              {photos.map((photo) => (
                <View key={photo.id} style={{ marginRight: spacing.sm }}>
                  <Image
                    source={{
                      uri: supabase.storage
                        .from("whiskey-photos")
                        .getPublicUrl(photo.storage_path).data.publicUrl,
                    }}
                    style={{
                      width: 160,
                      height: 200,
                      borderRadius: radii.md,
                      resizeMode: "cover",
                    }}
                  />
                  <View
                    style={{
                      flexDirection: "row",
                      gap: spacing.sm,
                      marginTop: spacing.xs,
                      alignItems: "center",
                    }}
                  >
                    <Pressable
                      onPress={() => incrementPhotoVote(photo.id, "up")}
                      hitSlop={8}
                    >
                      <Text style={[type.caption, { opacity: 0.75 }]}>
                        👍 {photo.upvotes}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => incrementPhotoVote(photo.id, "down")}
                      hitSlop={8}
                    >
                      <Text style={[type.caption, { opacity: 0.75 }]}>
                        👎 {photo.downvotes}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </View>
       </ScrollView>

    {/* Welcome sheet — shown on new custom entry */}
    <Modal
      visible={welcomeSheetOpen}
      transparent
      presentationStyle="overFullScreen"
      statusBarTranslucent
      animationType="slide"
      onRequestClose={() => {}}
    >
      <View style={{
        flex: 1,
        backgroundColor: (colors as any).overlay ?? "rgba(0,0,0,0.55)",
        justifyContent: "flex-end",
      }}>
        <View style={{
          backgroundColor: (colors as any).glassSurface ?? colors.surface,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          padding: spacing.lg,
          paddingBottom: spacing.xl * 2,
          borderWidth: 1,
          borderColor: (colors as any).glassBorder ?? colors.divider,
          ...shadows.card,
          gap: spacing.lg,
        }}>
          <Text style={[
            type.screenTitle,
            { textAlign: "center", fontSize: 26, lineHeight: 32 },
          ]}>
            A new pour, uncatalogued.
          </Text>

          <Text style={[
            type.body,
            { textAlign: "center", color: colors.textMuted, fontSize: 14 },
          ]}>
            —◆—
          </Text>

          <Text style={[
            type.body,
            { textAlign: "center", color: colors.textSecondary, fontSize: 14, lineHeight: 21 },
          ]}>
            {"You just logged something we haven't seen before. Help us keep Neat Notes accurate by filling in what you know.\n\nOnly Whiskey Name, Style, and Proof are required — but every detail you add helps the whole community. We review every submission before it goes live.\n\nCheers — and thanks for contributing."}
          </Text>

          <Pressable
            onPress={() => setWelcomeSheetOpen(false)}
            style={({ pressed }) => ({
              paddingVertical: 14,
              borderRadius: radii.md,
              alignItems: "center" as const,
              backgroundColor: colors.accent,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={[type.button, { color: colors.background }]}>
              Let's fill it in
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>

    <AppToast
      visible={toastVisible}
      title={toastTitle}
      message={toastMessage}
      onHide={() => setToastVisible(false)}
    />
  </>
);
}