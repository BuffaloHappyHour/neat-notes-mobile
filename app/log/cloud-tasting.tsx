import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

// ✅ HAPTICS (intentional only; respects settings)
import { hapticError, hapticSuccess } from "../../lib/haptics";

/* ------------------- Helpers ------------------- */

function asString(v: string | string[] | undefined) {
  if (Array.isArray(v)) return v[0];
  return v;
}

function clamp100(n: number) {
  return Math.max(0, Math.min(100, n));
}

function isUuid(v: string) {
  const s = String(v ?? "").trim();
  // UUID v1–v5
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s
  );
}

type Reaction = "ENJOYED" | "NEUTRAL" | "NOT_FOR_ME" | null;

function reactionLabel(v: Reaction) {
  if (v === "ENJOYED") return "Enjoyed";
  if (v === "NEUTRAL") return "Neutral";
  if (v === "NOT_FOR_ME") return "Not for me";
  return "";
}

function reactionFromDb(v: any): Reaction {
  const s = String(v ?? "").trim();
  if (!s) return null;

  if (s === "ENJOYED" || s === "Enjoyed") return "ENJOYED";
  if (s === "NEUTRAL" || s === "Neutral") return "NEUTRAL";
  if (s === "NOT_FOR_ME" || s === "Not for me") return "NOT_FOR_ME";
  return null;
}

/* ------------------- Candidate Helpers (Custom Whiskey Pipeline) ------------------- */

function normalizeName(raw: string) {
  return raw.toLowerCase().trim().replace(/\s+/g, " ");
}

function canonicalSlug(raw: string) {
  return raw
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/\s+-\s+.*$/g, "")
    .replace(/\b(buffalo happy hour|review|wednesday whiskey review)\b/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function maybeCreateWhiskeyCandidate(nameRaw: string) {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) return;

    const raw = nameRaw.trim();
    if (raw.length < 2) return;

    const slug = canonicalSlug(raw);
    if (!slug) return;

    const { data: existing, error: existingErr } = await supabase
      .from("whiskey_candidates")
      .select("id")
      .eq("created_by", userId)
      .eq("canonical_slug", slug)
      .limit(1);

    if (existingErr) return;
    if (existing && existing.length > 0) return;

    await supabase.from("whiskey_candidates").insert({
      created_by: userId,
      name_raw: raw,
      name_normalized: normalizeName(raw),
      canonical_slug: slug,
      status: "pending",
    });
  } catch {
    // Never block the main save flow
  }
}

/* ------------------- Expo-Go Safe Slider (Pure JS) ------------------- */

function SimpleSlider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled,
}: {
  value: number;
  onValueChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}) {
  const [trackW, setTrackW] = useState(0);

  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const snap = (n: number) => {
    const s = step <= 0 ? 1 : step;
    return Math.round(n / s) * s;
  };

  function xToValue(x: number) {
    if (trackW <= 0) return clamp(snap(value));
    const t = Math.max(0, Math.min(1, x / trackW));
    const raw = min + t * (max - min);
    return clamp(snap(raw));
  }

  function handleTouch(evt: any) {
    if (disabled) return;
    const x = Number(evt?.nativeEvent?.locationX ?? 0);
    onValueChange(xToValue(x));
  }

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: (_evt, gesture) => {
          if (disabled) return false;
          const dx = Math.abs(gesture.dx);
          const dy = Math.abs(gesture.dy);
          return dx > 2 && dx > dy;
        },
        onPanResponderGrant: (evt) => handleTouch(evt),
        onPanResponderMove: (evt) => handleTouch(evt),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [disabled, trackW, value, min, max, step]
  );

  const pct = max === min ? 0 : ((clamp(value) - min) / (max - min)) * 100;

  // ✅ Fix: clamp thumb position so it never goes negative / off-track (stops “jumping”)
  const THUMB = 24;
  const thumbLeft = useMemo(() => {
    if (trackW <= 0) return 0;
    const raw = (trackW * pct) / 100 - THUMB / 2;
    return Math.max(0, Math.min(trackW - THUMB, raw));
  }, [trackW, pct]);

  return (
    <View
      onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
      style={{
        height: 34,
        justifyContent: "center",
        opacity: disabled ? 0.55 : 1,
      }}
      {...pan.panHandlers}
    >
      <View
        style={{
          height: 10,
          borderRadius: 999,
          backgroundColor: colors.divider,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${pct}%`,
            height: "100%",
            backgroundColor: colors.accent,
          }}
        />
      </View>

      <View
        style={{
          position: "absolute",
          left: thumbLeft,
          width: THUMB,
          height: THUMB,
          borderRadius: 999,
          backgroundColor: colors.accent,
          borderWidth: 2,
          borderColor: colors.surface,
        }}
      />
    </View>
  );
}

/* ------------------- UI ------------------- */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.divider,
        ...shadows.card,
        gap: spacing.md,
      }}
    >
      {children}
    </View>
  );
}

function ColumnHeader({ title }: { title: string }) {
  return (
    <View style={{ alignItems: "center", gap: 8 }}>
      <Text style={[type.body, { fontWeight: "900", textAlign: "center" }]}>
        {title}
      </Text>
      <View
        style={{
          height: 2,
          width: "82%",
          backgroundColor: colors.divider,
          borderRadius: 999,
          opacity: 0.9,
        }}
      />
    </View>
  );
}

function ReactionList({
  value,
  onChange,
  disabled,
}: {
  value: Reaction;
  onChange: (v: Reaction) => void;
  disabled?: boolean;
}) {
  const opts: { key: Reaction; label: string }[] = [
    { key: "ENJOYED", label: "Enjoyed" },
    { key: "NEUTRAL", label: "Neutral" },
    { key: "NOT_FOR_ME", label: "Not for me" },
  ];

  return (
    <View style={{ gap: 10 }}>
      {opts.map((o) => {
        const active = value === o.key;

        return (
          <Pressable
            key={String(o.key)}
            disabled={disabled}
            onPress={() => onChange(active ? null : o.key)}
            style={({ pressed }) => ({
              paddingVertical: 11,
              paddingHorizontal: 12,
              borderRadius: radii.md,
              borderWidth: active ? 2 : 1,
              borderColor: active ? colors.accent : colors.divider,
              backgroundColor: active ? colors.highlight : "transparent",
              opacity: disabled ? 0.6 : pressed ? 0.92 : active ? 1 : 0.92,
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <Text
              style={[
                type.body,
                {
                  fontWeight: active ? "900" : "800",
                  textAlign: "center",
                  opacity: active ? 1 : 0.9,
                },
              ]}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * ✅ Premium “Notes” UI: stacked full-width buttons
 * - Multi-select up to max
 */
function NotesList({
  tags,
  selected,
  onToggle,
  max,
  disabled,
}: {
  tags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
  max: number;
  disabled?: boolean;
}) {
  return (
    <View style={{ gap: 10 }}>
      {tags.map((t) => {
        const active = selected.includes(t);
        const atLimit = selected.length >= max && !active;

        return (
          <Pressable
            key={t}
            disabled={disabled || atLimit}
            onPress={() => onToggle(t)}
            style={({ pressed }) => ({
              paddingVertical: 11,
              paddingHorizontal: 12,
              borderRadius: radii.md,
              borderWidth: active ? 2 : 1,
              borderColor: active ? colors.accent : colors.divider,
              backgroundColor: active ? colors.highlight : "transparent",
              opacity: disabled
                ? 0.6
                : atLimit
                ? 0.45
                : pressed
                ? 0.92
                : active
                ? 1
                : 0.92,
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <Text
              style={[
                type.body,
                {
                  fontWeight: active ? "900" : "800",
                  textAlign: "center",
                  opacity: active ? 1 : 0.9,
                },
              ]}
            >
              {t}
            </Text>
          </Pressable>
        );
      })}

      <Text
        style={[
          type.microcopyItalic,
          { opacity: 0.75, textAlign: "center" },
        ]}
      >
        {selected.length}/{max} selected
      </Text>
    </View>
  );
}

function NotesGrid({
  tags,
  selected,
  onToggle,
  max,
  disabled,
}: {
  tags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
  max: number;
  disabled?: boolean;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {tags.map((t) => {
          const active = selected.includes(t);
          const atLimit = selected.length >= max && !active;

          return (
            <Pressable
              key={t}
              disabled={disabled || atLimit}
              onPress={() => onToggle(t)}
              style={({ pressed }) => ({
                width: "31%",
                minWidth: 92,
                paddingVertical: 11,
                paddingHorizontal: 10,
                borderRadius: radii.md,
                borderWidth: active ? 2 : 1,
                borderColor: active ? colors.accent : colors.divider,
                backgroundColor: active ? colors.highlight : "transparent",
                opacity: disabled
                  ? 0.6
                  : atLimit
                  ? 0.45
                  : pressed
                  ? 0.92
                  : 1,
                alignItems: "center",
                justifyContent: "center",
              })}
            >
              <Text
                style={[
                  type.body,
                  {
                    fontWeight: active ? "900" : "800",
                    textAlign: "center",
                    opacity: active ? 1 : 0.9,
                    fontSize: 13,
                    lineHeight: 16,
                  },
                ]}
                numberOfLines={2}
              >
                {t}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text
        style={[
          type.microcopyItalic,
          { opacity: 0.75, textAlign: "center" },
        ]}
      >
        {selected.length}/{max} selected
      </Text>
    </View>
  );
}

/* ------------------- Screen ------------------- */

type CloudTastingRow = {
  id: string;
  whiskey_id?: string | null; // UUID
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

type WhiskeyMeta = {
  whiskeyType?: string | null;
  proof?: number | null;
  age?: number | null;
  distillery?: string | null;
};

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

  // ✅ Optional "freeform" notes that are NOT used for intelligence (for now)
  const [personalNotes, setPersonalNotes] = useState("");

  // ✅ single source of truth: store UUID if it’s valid
  const [whiskeyId, setWhiskeyId] = useState<string | null>(
    isUuid(routeWhiskeyIdRaw) ? routeWhiskeyIdRaw : null
  );

  // ✅ show “robust whiskey info” when we have a canonical whiskeyId
  const [whiskeyMeta, setWhiskeyMeta] = useState<WhiskeyMeta | null>(null);

  const FLAVOR_TAGS = useMemo(
    () => [
      "Sweet",
      "Oak",
      "Spice",
      "Smoke",
      "Fruit",
      "Floral",
      "Nutty",
      "Grain",
      "Herbal",
      "Peat",
    ],
    []
  );

  const DISLIKE_TAGS = useMemo(
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
      "Too Hot",
    ],
    []
  );

  const [flavorTags, setFlavorTags] = useState<string[]>([]);
  const [dislikeTags, setDislikeTags] = useState<string[]>([]);

  const [sourceType, setSourceType] = useState<"purchased" | "bar">(
    "purchased"
  );
  const [barName, setBarName] = useState("");

  const [snapshot, setSnapshot] = useState<{
    name: string;
    whiskeyId: string | null;
    rating: number | null;
    nose: Reaction;
    taste: Reaction;
    flavorTags: string[];
    dislikeTags: string[];
    sourceType: "purchased" | "bar";
    barName: string;
    personalNotes: string;
  } | null>(null);

  const canEdit = !locked;
  const canEditName = canEdit && !(!isExisting && lockName);

  const title = useMemo(
    () => (isExisting ? "Tasting" : "New Tasting"),
    [isExisting]
  );

  function toggleFlavor(tag: string) {
    setFlavorTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= 3) return prev;
      return [...prev, tag];
    });
  }

  function toggleDislike(tag: string) {
    setDislikeTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= 3) return prev;
      return [...prev, tag];
    });
  }

  function ensureRatingBase() {
    return rating == null ? 0 : rating;
  }

  function stepRating(delta: number) {
    const base = ensureRatingBase();
    setRating(clamp100(base + delta));
  }

  // ✅ Press-and-hold auto-repeat for +/- (premium feel)
  const repeatRef = useRef<any>(null);
  function startRepeat(delta: number) {
    if (!canEdit) return;
    // immediate tick
    stepRating(delta);

    if (repeatRef.current) clearInterval(repeatRef.current);
    repeatRef.current = setInterval(() => stepRating(delta), 110);
  }
  function stopRepeat() {
    if (repeatRef.current) clearInterval(repeatRef.current);
    repeatRef.current = null;
  }

  useEffect(() => {
    return () => stopRepeat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Load whiskey meta (safe fallback if some columns don't exist)
  const loadWhiskeyMeta = useCallback(async () => {
    if (!whiskeyId || !isUuid(whiskeyId)) {
      setWhiskeyMeta(null);
      return;
    }

    try {
      // Try richer select first (if you later add these columns)
      const { data, error } = await supabase
        .from("whiskeys")
        // NOTE: If age/distillery don't exist, Supabase will error and we fall back.
        .select("whiskey_type, proof, age, distillery")
        .eq("id", whiskeyId)
        .maybeSingle();

      if (error) throw new Error(error.message);

      const row: any = data ?? {};
      setWhiskeyMeta({
        whiskeyType: row.whiskey_type != null ? String(row.whiskey_type) : null,
        proof:
          row.proof == null || !Number.isFinite(Number(row.proof))
            ? null
            : Number(row.proof),
        age: row.age == null || !Number.isFinite(Number(row.age)) ? null : Number(row.age),
        distillery: row.distillery != null ? String(row.distillery) : null,
      });
    } catch {
      try {
        // Fallback: columns we know exist in your current build
        const { data, error } = await supabase
          .from("whiskeys")
          .select("whiskey_type, proof")
          .eq("id", whiskeyId)
          .maybeSingle();

        if (error) throw new Error(error.message);

        const row: any = data ?? {};
        setWhiskeyMeta({
          whiskeyType: row.whiskey_type != null ? String(row.whiskey_type) : null,
          proof:
            row.proof == null || !Number.isFinite(Number(row.proof))
              ? null
              : Number(row.proof),
        });
      } catch {
        setWhiskeyMeta(null);
      }
    }
  }, [whiskeyId]);

  useEffect(() => {
    loadWhiskeyMeta();
  }, [loadWhiskeyMeta]);

  const loadExisting = useCallback(async () => {
    if (!isExisting) return;

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

      const row = (data as any as CloudTastingRow) ?? null;
      if (!row) throw new Error("Not found");

      const nm = (row.whiskey_name ?? "Whiskey").trim() || "Whiskey";
      const rt =
        row.rating == null || !Number.isFinite(Number(row.rating))
          ? null
          : clamp100(Math.round(Number(row.rating)));

      const n = reactionFromDb(row.nose_reaction);
      const t = reactionFromDb(row.taste_reaction);

      const st =
        String(row.source_type ?? "purchased").toLowerCase() === "bar"
          ? "bar"
          : "purchased";
      const bn = String(row.bar_name ?? "");

      const ft = Array.isArray((row as any).flavor_tags)
        ? ((row as any).flavor_tags as string[])
        : [];
      const dt = Array.isArray((row as any).dislike_tags)
        ? ((row as any).dislike_tags as string[])
        : [];

      const wid =
        row.whiskey_id && isUuid(String(row.whiskey_id))
          ? String(row.whiskey_id)
          : null;

      const pn = String((row as any).personal_notes ?? "");

      setName(nm);
      setWhiskeyId(wid);
      setRating(rt);
      setNose(n);
      setTaste(t);
      setFlavorTags(ft);
      setDislikeTags(dt);
      setSourceType(st);
      setBarName(bn);
      setPersonalNotes(pn);

      setSnapshot({
        name: nm,
        whiskeyId: wid,
        rating: rt,
        nose: n,
        taste: t,
        flavorTags: ft,
        dislikeTags: dt,
        sourceType: st,
        barName: bn,
        personalNotes: pn,
      });
    } catch (e: any) {
      Alert.alert("Couldn’t load tasting", String(e?.message ?? e));
      router.back();
    } finally {
      setLoading(false);
    }
  }, [isExisting, tastingId]);

  useEffect(() => {
    loadExisting();
  }, [loadExisting]);

  function onEdit() {
    if (!snapshot) {
      setSnapshot({
        name,
        whiskeyId,
        rating,
        nose,
        taste,
        flavorTags,
        dislikeTags,
        sourceType,
        barName,
        personalNotes,
      });
    }
    setLocked(false);
  }

  function onCancel() {
    if (snapshot) {
      setName(snapshot.name);
      setWhiskeyId(snapshot.whiskeyId);
      setRating(snapshot.rating);
      setNose(snapshot.nose);
      setTaste(snapshot.taste);
      setFlavorTags(snapshot.flavorTags);
      setDislikeTags(snapshot.dislikeTags);
      setSourceType(snapshot.sourceType);
      setBarName(snapshot.barName);
      setPersonalNotes(snapshot.personalNotes);
    }
    setLocked(true);
  }

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

      const payload: any = {
        whiskey_name: safeName,
        whiskey_id: safeWhiskeyId,
        rating: Number(rating),
        nose_reaction: reactionLabel(nose) || null,
        taste_reaction: reactionLabel(taste) || null,
        flavor_tags: flavorTags,
        dislike_tags: taste === "NOT_FOR_ME" ? dislikeTags : null,
        source_type: sourceType,
        bar_name: sourceType === "bar" ? barName.trim() : null,
        personal_notes: personalOrNull,
      };

      if (isExisting) {
        const { error } = await supabase
          .from("tastings")
          .update(payload)
          .eq("id", tastingId);
        if (error) throw new Error(error.message);

        setSnapshot({
          name: safeName,
          whiskeyId: safeWhiskeyId,
          rating,
          nose,
          taste,
          flavorTags,
          dislikeTags: taste === "NOT_FOR_ME" ? dislikeTags : [],
          sourceType,
          barName: sourceType === "bar" ? barName.trim() : "",
          personalNotes: cleanedPersonal,
        });

        setLocked(true);
        await hapticSuccess();

        if (safeWhiskeyId) router.replace(`/whiskey/${encodeURIComponent(safeWhiskeyId)}`);
        else router.replace("/profile");
      } else {
        const { data } = await supabase.auth.getSession();
        const user = data.session?.user;
        if (!user) throw new Error("Not signed in");

        const { error } = await supabase.from("tastings").insert({
          user_id: user.id,
          ...payload,
        });

        if (error) throw new Error(error.message);

        if (!lockName) {
          await maybeCreateWhiskeyCandidate(safeName);
        }

        await hapticSuccess();

        // ✅ Better post-save routing:
        // - If canonical whiskeyId exists, go to whiskey profile
        // - If custom, send to Profile (feels “done”, not bounced back)
        if (safeWhiskeyId) router.replace(`/whiskey/${encodeURIComponent(safeWhiskeyId)}`);
        else router.replace("/profile");
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

  const barNameMissing = sourceType === "bar" && barName.trim().length < 2;

  const proofText =
    whiskeyMeta?.proof != null && Number.isFinite(Number(whiskeyMeta.proof))
      ? `${Math.round(Number(whiskeyMeta.proof))} proof`
      : null;

  const typeText = whiskeyMeta?.whiskeyType ? String(whiskeyMeta.whiskeyType) : null;

  const ageText =
    whiskeyMeta?.age != null && Number.isFinite(Number(whiskeyMeta.age))
      ? `${Math.round(Number(whiskeyMeta.age))} yr`
      : null;

  const distilleryText = whiskeyMeta?.distillery ? String(whiskeyMeta.distillery) : null;

  const hasBottleDetails =
    !!typeText || !!proofText || !!ageText || !!distilleryText;

  return (
    <>
      <Stack.Screen
        options={{
          title,
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
            if (isExisting && locked) {
              return (
                <Pressable
                  onPress={onEdit}
                  style={({ pressed }) => ({
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text style={[type.button, { color: colors.accent }]}>Edit</Text>
                </Pressable>
              );
            }

            return (
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
            );
          },
        }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: spacing.xl * 3 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ padding: spacing.xl, gap: spacing.lg }}>
          {loading ? (
            <View style={{ paddingVertical: spacing.xl, alignItems: "center" }}>
              <ActivityIndicator />
              <Text style={[type.body, { marginTop: spacing.sm, opacity: 0.7 }]}>
                Loading…
              </Text>
            </View>
          ) : null}

          {/* Whiskey */}
          <Card>
            <Text style={type.sectionHeader}>Whiskey</Text>

            <TextInput
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (!lockName) setWhiskeyId(null);
              }}
              editable={canEditName}
              placeholder="Whiskey name"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={{
                marginTop: spacing.md,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.md,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.divider,
                backgroundColor: "transparent",
                color: colors.textPrimary,
                fontSize: 16,
                fontFamily: type.body.fontFamily,
                opacity: canEditName ? 1 : 0.75,
                minHeight: 64,
              }}
            />

            {/* ✅ Bottle details (clean like Whiskey Profile — no pills) */}
            {whiskeyId && whiskeyMeta && hasBottleDetails ? (
              <View
                style={{
                  marginTop: spacing.lg,
                  gap: 8,
                  paddingTop: spacing.md,
                  borderTopWidth: 1,
                  borderTopColor: colors.divider,
                }}
              >
                <Text style={[type.body, { opacity: 0.75, fontSize: 12 }]}>
                  Bottle details
                </Text>

                {distilleryText ? (
                  <Text style={[type.body, { opacity: 0.8 }]}>
                    Distillery:{" "}
                    <Text style={{ fontWeight: "900" }}>{distilleryText}</Text>
                  </Text>
                ) : null}

                {typeText ? (
                  <Text style={[type.body, { opacity: 0.8 }]}>
                    Type: <Text style={{ fontWeight: "900" }}>{typeText}</Text>
                  </Text>
                ) : null}

                {proofText ? (
                  <Text style={[type.body, { opacity: 0.8 }]}>
                    Proof: <Text style={{ fontWeight: "900" }}>{proofText}</Text>
                  </Text>
                ) : null}

                {ageText ? (
                  <Text style={[type.body, { opacity: 0.8 }]}>
                    Age: <Text style={{ fontWeight: "900" }}>{ageText}</Text>
                  </Text>
                ) : null}
              </View>
            ) : null}
          </Card>

          {/* Rating */}
          <Card>
            <Text style={type.sectionHeader}>Rating</Text>
            <Text style={[type.microcopyItalic, { marginTop: spacing.xs, opacity: 0.85 }]}>
              Drag the bar for big moves. Press + / − to refine (hold for fast).
            </Text>

            <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
              <SimpleSlider
                disabled={!canEdit}
                value={rating == null ? 0 : rating}
                min={0}
                max={100}
                step={1}
                onValueChange={(v) => setRating(clamp100(Math.round(v)))}
              />

              <View
                style={{
                  flexDirection: "row",
                  gap: spacing.md,
                  justifyContent: "space-between",
                }}
              >
                <Pressable
                  onPress={() => stepRating(-1)}
                  onPressIn={() => startRepeat(-1)}
                  onPressOut={stopRepeat}
                  disabled={!canEdit}
                  style={({ pressed }) => ({
                    width: 54,
                    height: 54,
                    borderRadius: radii.md,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: colors.divider,
                    backgroundColor: pressed ? colors.highlight : "transparent",
                    opacity: !canEdit ? 0.5 : 1,
                  })}
                >
                  <Text style={[type.button, { fontSize: 22, color: colors.textPrimary }]}>
                    −
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => stepRating(1)}
                  onPressIn={() => startRepeat(1)}
                  onPressOut={stopRepeat}
                  disabled={!canEdit}
                  style={({ pressed }) => ({
                    width: 54,
                    height: 54,
                    borderRadius: radii.md,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: colors.divider,
                    backgroundColor: pressed ? colors.highlight : "transparent",
                    opacity: !canEdit ? 0.5 : 1,
                  })}
                >
                  <Text style={[type.button, { fontSize: 22, color: colors.textPrimary }]}>
                    +
                  </Text>
                </Pressable>
              </View>

              <Text
                style={{
                  fontSize: 56,
                  lineHeight: 60,
                  fontWeight: "900",
                  textAlign: "center",
                  color: colors.textPrimary,
                  fontFamily: type.screenTitle?.fontFamily ?? type.body.fontFamily,
                  opacity: rating == null ? 0.35 : 1,
                }}
              >
                {rating == null ? "—" : String(rating)}
              </Text>
            </View>
          </Card>

          {/* Quick Notes */}
          <Card>
            <Text style={type.sectionHeader}>What do you smell or taste?</Text>
            <Text style={[type.microcopyItalic, { marginTop: spacing.xs, opacity: 0.85 }]}>
              Pick one for Nose + Taste. Choose up to 3 flavor Notes.
            </Text>

            <View style={{ marginTop: spacing.md, flexDirection: "row" }}>
              <View style={{ flex: 1 }}>
                <View style={{ gap: spacing.sm }}>
                  <ColumnHeader title="Nose" />
                  <ReactionList value={nose} onChange={setNose} disabled={!canEdit} />
                </View>

                <View style={{ height: spacing.xl }} />

                <View style={{ gap: spacing.sm }}>
                  <ColumnHeader title="Taste" />
                  <ReactionList value={taste} onChange={setTaste} disabled={!canEdit} />
                </View>
              </View>

              <View style={{ width: spacing.lg, alignItems: "center" }}>
                <View
                  style={{
                    width: 2,
                    height: 14,
                    borderRadius: 999,
                    backgroundColor: colors.accent,
                    marginTop: 6,
                    marginBottom: 6,
                    opacity: 0.95,
                  }}
                />
                <View
                  style={{
                    width: 2,
                    flex: 1,
                    borderRadius: 999,
                    backgroundColor: colors.divider,
                    opacity: 0.9,
                  }}
                />
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ gap: spacing.sm }}>
                  <ColumnHeader title="Notes" />
                  <NotesList
                    tags={FLAVOR_TAGS}
                    selected={flavorTags}
                    onToggle={toggleFlavor}
                    max={3}
                    disabled={!canEdit}
                  />
                </View>
              </View>
            </View>
          </Card>

          {/* Dislike */}
          {taste === "NOT_FOR_ME" ? (
            <Card>
              <Text style={type.sectionHeader}>What did you dislike?</Text>
              <Text style={[type.microcopyItalic, { marginTop: spacing.xs, opacity: 0.85 }]}>
                Choose up to 3. This helps us avoid recommending similar pours.
              </Text>

              <NotesGrid
                tags={DISLIKE_TAGS}
                selected={dislikeTags}
                onToggle={toggleDislike}
                max={3}
                disabled={!canEdit}
              />
            </Card>
          ) : null}

          {/* Personal Notes */}
          <Card>
            <Text style={type.sectionHeader}>Personal Notes</Text>
            <Text style={[type.microcopyItalic, { marginTop: spacing.xs, opacity: 0.85 }]}>
              Optional. Any extra flavors or comments? (e.g., grandma’s apple pie, buttery popcorn).
            </Text>

            <TextInput
              value={personalNotes}
              onChangeText={setPersonalNotes}
              editable={canEdit}
              placeholder="Add a personal note…"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              style={{
                marginTop: spacing.md,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.md,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.divider,
                backgroundColor: "transparent",
                color: colors.textPrimary,
                fontSize: 16,
                fontFamily: type.body.fontFamily,
                opacity: canEdit ? 1 : 0.75,
                minHeight: 120,
              }}
            />
          </Card>

          {/* Source */}
          <Card>
            <Text style={type.sectionHeader}>Where did you have this bottle?</Text>

            <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.md }}>
              <Pressable
                disabled={!canEdit}
                onPress={() => setSourceType("purchased")}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: spacing.lg,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: sourceType === "purchased" ? colors.accent : colors.divider,
                  backgroundColor: sourceType === "purchased" ? colors.highlight : colors.surface,
                  opacity: !canEdit ? 0.6 : pressed ? 0.92 : 1,
                  alignItems: "center",
                  justifyContent: "center",
                })}
              >
                <Text style={[type.button, { color: colors.textPrimary, textAlign: "center" }]}>
                  Purchased Bottle
                </Text>
              </Pressable>

              <Pressable
                disabled={!canEdit}
                onPress={() => setSourceType("bar")}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: spacing.lg,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: sourceType === "bar" ? colors.accent : colors.divider,
                  backgroundColor: sourceType === "bar" ? colors.highlight : colors.surface,
                  opacity: !canEdit ? 0.6 : pressed ? 0.92 : 1,
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
                  editable={canEdit}
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
                    opacity: canEdit ? 1 : 0.75,
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

          <View style={{ height: spacing.lg }} />

          {isExisting && !locked ? (
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <Pressable
                onPress={onCancel}
                disabled={saving}
                style={({ pressed }) => ({
                  flex: 1,
                  borderRadius: radii.md,
                  paddingVertical: spacing.lg,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: colors.divider,
                  backgroundColor: "transparent",
                  opacity: saving ? 0.5 : pressed ? 0.9 : 1,
                })}
              >
                <Text style={[type.button, { color: colors.textPrimary, textAlign: "center" }]}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={onSave}
                disabled={saving}
                style={({ pressed }) => ({
                  flex: 1,
                  borderRadius: radii.md,
                  paddingVertical: spacing.lg,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.accent,
                  opacity: saving ? 0.6 : pressed ? 0.92 : 1,
                })}
              >
                <Text style={[type.button, { color: colors.background, textAlign: "center" }]}>
                  {saving ? "Saving…" : "Save"}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}
