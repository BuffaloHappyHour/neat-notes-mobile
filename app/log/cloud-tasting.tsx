import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams, type Href } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
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

// ✅ ANALYTICS
import {
  trackTastingSaved,
  trackTastingSaveFailed,
  trackTastingStart,
} from "../../lib/analytics";

/* ------------------- Helpers ------------------- */

function safeText(v: any) {
  return String(v ?? "").trim();
}

function normalizeKey(s: string) {
  return safeText(s).toLowerCase().replace(/\s+/g, " ");
}

function cleanText(v: any): string | null {
  const s = safeText(v);
  return s ? s : null;
}

function clamp100(n: number) {
  return Math.max(0, Math.min(100, n));
}

function isUuid(v: string) {
  const s = String(v ?? "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s
  );
}

function asString(v: string | string[] | undefined) {
  if (Array.isArray(v)) return v[0];
  return v;
}

function uniqStringsKeepOrder(list: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of list) {
    const k = String(s ?? "").trim();
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

function uniqUuidsKeepOrder(list: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of list) {
    const k = safeText(s);
    if (!k) continue;
    if (!isUuid(k)) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

function nullIfOther(v: string | null | undefined) {
  const s = safeText(v);
  if (!s) return null;
  if (s.toLowerCase() === "other") return null;
  return s;
}

function isOtherLike(v: any) {
  return safeText(v).toLowerCase() === "other";
}

function isMissingLike(v: any) {
  // For prompting + edit gating ONLY:
  // treat null/empty OR "Other" as missing.
  const s = safeText(v);
  return !s || isOtherLike(s);
}

function isNullOrOther(v: any) {
  const s = safeText(v);
  if (!s) return true;
  return s.toLowerCase() === "other";
}

function parseNumericOrNull(s: string) {
  const t = safeText(s);
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return n;
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

/* ------------------- Flavor Nodes (Refine Modal) ------------------- */

type FlavorNode = {
  id: string;
  parent_id: string | null;
  level: number | null;
  family: string | null;
  label: string;
  sort_order: number | null;
  is_active: boolean | null;
  slug: string | null;
};

function isFinishLabel(label: string) {
  return safeText(label).toLowerCase() === "finish";
}

function getRootIdForNode(nodeId: string, byId: Map<string, FlavorNode>) {
  let cur = byId.get(nodeId);
  if (!cur) return null;

  let safety = 0;
  while (cur && cur.parent_id && safety < 25) {
    const parent = byId.get(cur.parent_id);
    if (!parent) break;
    cur = parent;
    safety++;
  }
  return cur?.id ?? null;
}

function getTopLevelLabelForNode(nodeId: string, byId: Map<string, FlavorNode>) {
  const rootId = getRootIdForNode(nodeId, byId);
  if (!rootId) return null;
  const root = byId.get(rootId);
  const lbl = safeText(root?.label);
  if (!lbl) return null;

  // exclude finish + dislikes from ever contributing to flavor_tags
  if (isFinishLabel(lbl)) return null;
  if (normalizeKey(lbl) === "dislikes") return null;

  return lbl;
}

function isNodeUnderAnyRoot(
  nodeId: string,
  allowedRootIds: Set<string>,
  byId: Map<string, FlavorNode>
) {
  if (allowedRootIds.size === 0) return true; // no scope => all
  const rootId = getRootIdForNode(nodeId, byId);
  if (!rootId) return false;
  return allowedRootIds.has(rootId);
}

/* ------------------- tasting_flavor_nodes join helpers ------------------- */

type TastingFlavorNodeRow = {
  node_id: string;
  sentiment: string | null;
};

function isNegativeSentiment(v: any) {
  const s = safeText(v).toLowerCase();
  return s === "negative" || s === "neg" || s === "-1" || s === "dislike";
}

// IMPORTANT: enum is case-sensitive in Postgres
const POS_SENTIMENT = "positive";

/* ------------------- Community share helpers (PUBLIC TABLES) ------------------- */

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

  const { error: delParent } = await supabase
    .from("public_tastings")
    .delete()
    .eq("id", publicId);

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
  const {
    sourceTastingId,
    whiskeyId,
    rating,
    flavorTags,
    dislikeTags,
    personalNotes,
    selectedNodeIds,
  } = params;

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
    if (!isUuid(publicTastingId))
      throw new Error("Public mirror saved, but missing public tasting id.");
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
    sentiment: POS_SENTIMENT,
  }));

  const { error: insKidsErr } = await supabase
    .from("public_tasting_flavor_nodes")
    .insert(inserts);

  if (insKidsErr) throw new Error(insKidsErr.message);
}

/* ------------------- Expo-Go Safe Slider (Pure JS) ------------------- */

function SimpleSlider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  onSlidingChange,
}: {
  value: number;
  onValueChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onSlidingChange?: (sliding: boolean) => void;
}) {
  const trackRef = useRef<View>(null);

  const [trackW, setTrackW] = useState(0);
  const [trackX, setTrackX] = useState(0);

  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<number | null>(null);

  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const snap = (n: number) => {
    const s = step <= 0 ? 1 : step;
    return Math.round(n / s) * s;
  };

  function measureTrackX() {
    const node = trackRef.current as any;
    if (!node?.measureInWindow) return;
    node.measureInWindow((x: number) => {
      if (Number.isFinite(x)) setTrackX(x);
    });
  }

  function flushPending() {
    if (pendingRef.current == null) return;
    const v = pendingRef.current;
    pendingRef.current = null;
    onValueChange(v);
  }

  function scheduleValue(next: number) {
    pendingRef.current = next;
    if (rafRef.current != null) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      flushPending();
    });
  }

  function xToValue(pageX: number) {
    if (trackW <= 0) return clamp(snap(value));
    const localX = pageX - trackX;
    const t = Math.max(0, Math.min(1, localX / trackW));
    const raw = min + t * (max - min);
    return clamp(snap(raw));
  }

  function handleTouch(evt: any) {
    if (disabled) return;
    const pageX = Number(evt?.nativeEvent?.pageX ?? 0);
    scheduleValue(xToValue(pageX));
  }

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onStartShouldSetPanResponderCapture: () => !disabled,
        onMoveShouldSetPanResponder: (_evt, gesture) => {
          if (disabled) return false;
          const dx = Math.abs(gesture.dx);
          const dy = Math.abs(gesture.dy);
          return dx > 2 && dx > dy;
        },
        onMoveShouldSetPanResponderCapture: (_evt, gesture) => {
          if (disabled) return false;
          const dx = Math.abs(gesture.dx);
          const dy = Math.abs(gesture.dy);
          return dx > 2 && dx > dy;
        },
        onPanResponderGrant: (evt) => {
          measureTrackX();
          onSlidingChange?.(true);
          handleTouch(evt);
        },
        onPanResponderMove: (evt) => handleTouch(evt),
        onPanResponderRelease: () => onSlidingChange?.(false),
        onPanResponderTerminate: () => onSlidingChange?.(false),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [disabled, trackW, trackX, value, min, max, step]
  );

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const pct = max === min ? 0 : ((clamp(value) - min) / (max - min)) * 100;

  const THUMB = 24;
  const thumbLeft = useMemo(() => {
    if (trackW <= 0) return 0;
    const raw = (trackW * pct) / 100 - THUMB / 2;
    return Math.max(0, Math.min(trackW - THUMB, raw));
  }, [trackW, pct]);

  return (
    <View
      ref={trackRef}
      onLayout={(e) => {
        setTrackW(e.nativeEvent.layout.width);
        setTimeout(() => measureTrackX(), 0);
      }}
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
      <Text style={[type.body, { fontWeight: "900", textAlign: "center" }]}>{title}</Text>
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

type Reaction = "ENJOYED" | "NEUTRAL" | "NOT_FOR_ME" | null;

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

function NotesList({
  tags,
  selected,
  onToggle,
  disabled,
}: {
  tags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
  disabled?: boolean;
}) {
  return (
    <View style={{ gap: 10 }}>
      {tags.map((t) => {
        const active = selected.includes(t);

        return (
          <Pressable
            key={t}
            disabled={disabled}
            onPress={() => onToggle(t)}
            style={({ pressed }) => ({
              width: "100%",
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
              {t}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function NotesGrid({
  tags,
  selected,
  onToggle,
  disabled,
}: {
  tags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
  disabled?: boolean;
}) {
  const GAP = 10;

  return (
    <View style={{ gap: spacing.sm }}>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: GAP,
        }}
      >
        {tags.map((t) => {
          const active = selected.includes(t);

          return (
            <Pressable
              key={t}
              disabled={disabled}
              onPress={() => onToggle(t)}
              style={({ pressed }) => ({
                flexGrow: 0,
                flexShrink: 0,
                flexBasis: "46%",
                maxWidth: "46%",

                paddingVertical: 11,
                paddingHorizontal: 12,
                borderRadius: radii.md,
                borderWidth: active ? 2 : 1,
                borderColor: active ? colors.accent : colors.divider,
                backgroundColor: active ? colors.highlight : "transparent",
                opacity: disabled ? 0.6 : pressed ? 0.92 : 1,

                alignItems: "center",
                justifyContent: "center",
                minHeight: 46,
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
                  },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

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

/* ------------------- Refine UI Bits ------------------- */

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

/* ------------------- Controlled Select (NO TYPING) ------------------- */

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

/* ------------------- Screen Types ------------------- */

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

type RefineSortMode = "DEFAULT" | "SELECTED" | "AZ";

/* ------------------- Constants ------------------- */

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

  // Refine modal state
  const [refineOpen, setRefineOpen] = useState(false);
  const [nodesLoading, setNodesLoading] = useState(false);
  const [nodesError, setNodesError] = useState<string | null>(null);
  const [allNodes, setAllNodes] = useState<FlavorNode[]>([]);
  const [refineSearch, setRefineSearch] = useState("");
  const [refinePath, setRefinePath] = useState<string[]>([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [refineSort, setRefineSort] = useState<RefineSortMode>("SELECTED");
  const [addFamilyOpen, setAddFamilyOpen] = useState(false);

  /* ------------------- Flavor Node Indexes ------------------- */

  const byId = useMemo(() => {
    const m = new Map<string, FlavorNode>();
    for (const n of allNodes) m.set(n.id, n);
    return m;
  }, [allNodes]);

  const byParent = useMemo(() => {
    const m = new Map<string, FlavorNode[]>();
    for (const n of allNodes) {
      const key = n.parent_id ?? "__ROOT__";
      const arr = m.get(key) ?? [];
      arr.push(n);
      m.set(key, arr);
    }

    for (const [k, arr] of m.entries()) {
      arr.sort((a, b) => {
        const fa = safeText(a.family).toLowerCase();
        const fb = safeText(b.family).toLowerCase();
        if (fa !== fb) return fa < fb ? -1 : 1;

        const la = Number(a.level ?? 0);
        const lb = Number(b.level ?? 0);
        if (la !== lb) return la - lb;

        const sa = Number(a.sort_order ?? 999);
        const sb = Number(b.sort_order ?? 999);
        if (sa !== sb) return sa - sb;

        const aa = safeText(a.label).toLowerCase();
        const bb = safeText(b.label).toLowerCase();
        return aa < bb ? -1 : aa > bb ? 1 : 0;
      });

      m.set(k, arr);
    }

    return m;
  }, [allNodes]);

  // root children (top-level families)
  const topLevelNodes = useMemo(() => {
    const root = byParent.get("__ROOT__") ?? [];
    return root
      .filter((n) => !isFinishLabel(n.label))
      .filter((n) => normalizeKey(n.label) !== "dislikes");
  }, [byParent]);

  // label -> rootId
  const rootIdByLabel = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of topLevelNodes) {
      const k = normalizeKey(n.label);
      if (!k) continue;
      m.set(k, n.id);
    }
    // include dislikes root lookup for dislike grid (but NOT in topLevelNodes)
    const rootAll = byParent.get("__ROOT__") ?? [];
    for (const n of rootAll) {
      const k = normalizeKey(n.label);
      if (!k) continue;
      if (!m.has(k)) m.set(k, n.id);
    }
    return m;
  }, [topLevelNodes, byParent]);

  // rootId -> label (for scoped section headers)
  const rootLabelById = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of topLevelNodes) {
      if (isFinishLabel(n.label)) continue;
      if (normalizeKey(n.label) === "dislikes") continue;
      m.set(n.id, safeText(n.label));
    }
    return m;
  }, [topLevelNodes]);

  const ALL_TOP_LEVEL_LABELS = useMemo(() => {
    const fromDb = topLevelNodes.map((n) => safeText(n.label)).filter(Boolean);
    return fromDb.filter((t) => !isFinishLabel(t) && normalizeKey(t) !== "dislikes");
  }, [topLevelNodes]);

  // dislikes from flavor_nodes "Dislikes" branch (fallback if missing)
  const DISLIKE_TAGS = useMemo(() => {
    const dislikesRootId = rootIdByLabel.get("dislikes");
    if (!dislikesRootId) return FALLBACK_DISLIKE_TAGS;

    const kids = (byParent.get(dislikesRootId) ?? [])
      .map((n) => safeText(n.label))
      .filter(Boolean);

    return kids.length ? kids : FALLBACK_DISLIKE_TAGS;
  }, [rootIdByLabel, byParent, FALLBACK_DISLIKE_TAGS]);

  /* ------------------- Option A: Scope refine to selected top-level notes ------------------- */

  const scopedRootIds = useMemo(() => {
    const ids: string[] = [];
    for (const lbl of flavorTags) {
      const id = rootIdByLabel.get(normalizeKey(lbl));
      if (id && !ids.includes(id)) ids.push(id);
    }
    // ensure dislikes never sneaks in
    return ids.filter((id) => normalizeKey(rootLabelById.get(id) ?? "") !== "dislikes");
  }, [flavorTags, rootIdByLabel, rootLabelById]);

  const scopedRootIdSet = useMemo(() => new Set(scopedRootIds), [scopedRootIds]);

  /* ------------------- Drilldown navigation ------------------- */

  const currentParentId = refinePath.length ? refinePath[refinePath.length - 1] : "__ROOT__";

  const currentNodes = useMemo(() => byParent.get(currentParentId) ?? [], [byParent, currentParentId]);

  /* ------------------- Sorting ------------------- */

  function applySort(list: FlavorNode[]) {
    const selectedSet = new Set(selectedNodeIds);

    if (refineSort === "DEFAULT") return list;

    if (refineSort === "AZ") {
      const copy = list.slice();
      copy.sort((a, b) => {
        const aa = safeText(a.label).toLowerCase();
        const bb = safeText(b.label).toLowerCase();
        return aa < bb ? -1 : aa > bb ? 1 : 0;
      });
      return copy;
    }

    // SELECTED first
    const selected: FlavorNode[] = [];
    const rest: FlavorNode[] = [];
    for (const n of list) {
      if (selectedSet.has(n.id)) selected.push(n);
      else rest.push(n);
    }
    return [...selected, ...rest];
  }

  /* ------------------- Visible nodes logic (search + drilldown + scope) ------------------- */

  const visibleNodes = useMemo(() => {
    const q = safeText(refineSearch).toLowerCase();

    // Search mode: show all matches (scoped if scoped roots exist)
    if (q) {
      const all = allNodes
        .filter((n) => !isFinishLabel(n.label))
        .filter((n) => {
          // hard exclude anything under Dislikes root
          if (normalizeKey(safeText(getTopLevelLabelForNode(n.id, byId) ?? "")) === "dislikes") {
            return false;
          }

          if (!isNodeUnderAnyRoot(n.id, scopedRootIdSet, byId)) return false;

          const label = safeText(n.label).toLowerCase();
          const slug = safeText(n.slug).toLowerCase();
          const family = safeText(n.family).toLowerCase();
          return label.includes(q) || slug.includes(q) || family.includes(q);
        });

      all.sort((a, b) => {
        const fa = safeText(a.family).toLowerCase();
        const fb = safeText(b.family).toLowerCase();
        if (fa !== fb) return fa < fb ? -1 : 1;

        const la = Number(a.level ?? 0);
        const lb = Number(b.level ?? 0);
        if (la !== lb) return la - lb;

        const sa = Number(a.sort_order ?? 999);
        const sb = Number(b.sort_order ?? 999);
        if (sa !== sb) return sa - sb;

        const aa = safeText(a.label).toLowerCase();
        const bb = safeText(b.label).toLowerCase();
        return aa < bb ? -1 : aa > bb ? 1 : 0;
      });

      return applySort(all);
    }

    // Drilldown mode: children of current parent (no scope filtering here; scope is handled by entrypoint)
    const levelList = currentNodes.filter((n) => !isFinishLabel(n.label));
    // also hide dislikes anywhere
    const filtered = levelList.filter(
      (n) => normalizeKey(safeText(getTopLevelLabelForNode(n.id, byId) ?? "")) !== "dislikes"
    );
    return applySort(filtered);
  }, [refineSearch, allNodes, currentNodes, refineSort, selectedNodeIds, scopedRootIdSet, byId]);

  /* ------------------- Selected preview + counts ------------------- */

  const selectedNodeLabelsPreview = useMemo(() => {
    const labels = selectedNodeIds.map((id) => safeText(byId.get(id)?.label)).filter(Boolean);
    const uniq = uniqStringsKeepOrder(labels);
    return uniq.slice(0, 4).join(", ");
  }, [selectedNodeIds, byId]);

  const selectedCountText = useMemo(() => {
    const n = selectedNodeIds.length;
    if (n === 0) return "None selected";
    if (n === 1) return "1 selected";
    return `${n} selected`;
  }, [selectedNodeIds.length]);

  const additionalNotesLine = useMemo(() => {
    const labels = uniqStringsKeepOrder(
      selectedNodeIds.map((id) => safeText(byId.get(id)?.label)).filter(Boolean)
    );
    if (!labels.length) return null;
    return `Additional notes: ${labels.slice(0, 8).join(", ")}${labels.length > 8 ? "…" : ""}`;
  }, [selectedNodeIds, byId]);

  /* ------------------- Breadcrumb ------------------- */

  const refineBreadcrumb = useMemo(() => {
    if (!refinePath.length) {
      if (scopedRootIds.length) return "Your selected notes";
      return "All notes";
    }
    const labels = refinePath.map((id) => safeText(byId.get(id)?.label)).filter(Boolean);
    return labels.length ? labels.join("  ›  ") : "Notes";
  }, [refinePath, byId, scopedRootIds.length]);

  /* ------------------- “Not seeing it?” add-family helpers ------------------- */

  function addFamilyLabel(label: string) {
    const clean = safeText(label);
    if (!clean) return;

    setFlavorTags((prev) => {
      const next = prev.includes(clean) ? prev : [...prev, clean];
      return next.filter((x) => !isFinishLabel(x) && normalizeKey(x) !== "dislikes");
    });

    setAddFamilyOpen(false);
    setRefineSearch("");
    setRefinePath([]);
  }

  const addableFamilies = useMemo(() => {
    const existing = new Set(flavorTags.map((t) => normalizeKey(t)));
    return ALL_TOP_LEVEL_LABELS.filter((lbl) => !existing.has(normalizeKey(lbl)));
  }, [ALL_TOP_LEVEL_LABELS, flavorTags]);

  /* ------------------- Toggling ------------------- */

  const startedRef = useRef(false);

  function toggleFlavor(tag: string) {
    setFlavorTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      return [...prev, tag];
    });
  }

  function toggleDislike(tag: string) {
    setNoDislikes(false);
    setDislikeTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function setNoDislikesActive() {
    setNoDislikes(true);
    setDislikeTags([]);
  }

  function toggleNodeId(id: string) {
    setSelectedNodeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  /* ------------------- Fetch flavor_nodes ------------------- */

  const fetchFlavorNodes = useCallback(async () => {
    setNodesLoading(true);
    setNodesError(null);
    try {
      const { data, error } = await supabase
        .from("flavor_nodes")
        .select("id,parent_id,level,family,label,sort_order,is_active,slug")
        .eq("is_active", true);

      if (error) throw new Error(error.message);

      const rows = Array.isArray(data) ? (data as any[]) : [];
      const cleaned: FlavorNode[] = rows
        .map((r) => ({
          id: safeText(r.id),
          parent_id: r.parent_id ? safeText(r.parent_id) : null,
          level: r.level == null ? null : Number(r.level),
          family: r.family != null ? safeText(r.family) : null,
          label: safeText(r.label),
          sort_order: r.sort_order == null ? null : Number(r.sort_order),
          is_active: r.is_active == null ? true : Boolean(r.is_active),
          slug: r.slug != null ? safeText(r.slug) : null,
        }))
        .filter((n) => isUuid(n.id) && n.label.length > 0)
        .filter((n) => !isFinishLabel(n.label)); // ✅ remove finish globally

      setAllNodes(cleaned);
    } catch (e: any) {
      setNodesError(String(e?.message ?? e));
    } finally {
      setNodesLoading(false);
    }
  }, []);

  const didInitFetch = useRef(false);
  useEffect(() => {
    if (didInitFetch.current) return;
    didInitFetch.current = true;
    void fetchFlavorNodes();
  }, [fetchFlavorNodes]);

  function openRefine() {
    setRefineOpen(true);
    setRefineSort("SELECTED");
    setRefineSearch("");
    setRefinePath([]);
    setAddFamilyOpen(false);
    if (allNodes.length === 0) void fetchFlavorNodes();
  }

  function closeRefine() {
    setRefineOpen(false);
    setRefineSearch("");
    setRefinePath([]);
    setAddFamilyOpen(false);
  }

  /* ------------------- Rating helpers (fast hold) ------------------- */

  function ensureRatingBase() {
    return rating == null ? 0 : rating;
  }

  function stepRating(delta: number) {
    const base = ensureRatingBase();
    setRating(clamp100(base + delta));
  }

  const repeatRef = useRef<any>(null);

  function startRepeat(delta: number) {
    if (locked) return;
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

  /* ------------------- Load whiskey meta (bottle details) ------------------- */

  const loadWhiskeyMeta = useCallback(async () => {
    if (!whiskeyId || !isUuid(whiskeyId)) {
      setWhiskeyMeta(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("whiskeys")
        .select("category, region, sub_region, whiskey_type, proof, age, distillery")
        .eq("id", whiskeyId)
        .maybeSingle();

      if (error) throw new Error(error.message);

      const row: any = data ?? {};
      setWhiskeyMeta({
        distillery: cleanText(row.distillery),
        whiskey_type: cleanText(row.whiskey_type),
        category: cleanText(row.category),
        region: cleanText(row.region),
        sub_region: cleanText(row.sub_region),
        proof: row.proof == null || !Number.isFinite(Number(row.proof)) ? null : Number(row.proof),
        age: row.age == null || !Number.isFinite(Number(row.age)) ? null : Number(row.age),
      });
    } catch {
      setWhiskeyMeta(null);
    }
  }, [whiskeyId]);

  useEffect(() => {
    loadWhiskeyMeta();
  }, [loadWhiskeyMeta]);

  /* ------------------- tasting_flavor_nodes load/replace ------------------- */

  async function loadTastingFlavorNodes(tid: string) {
    const { data, error } = await supabase
      .from("tasting_flavor_nodes")
      .select("node_id, sentiment")
      .eq("tasting_id", tid);

    if (error) throw new Error(error.message);

    const rows = Array.isArray(data) ? ((data as any) as TastingFlavorNodeRow[]) : [];
    const positive = rows
      .filter((r) => isUuid(r.node_id) && !isNegativeSentiment(r.sentiment))
      .map((r) => safeText(r.node_id));

    return uniqUuidsKeepOrder(positive);
  }

  async function replaceTastingFlavorNodes(tid: string, nodeIds: string[]) {
    const { error: delErr } = await supabase.from("tasting_flavor_nodes").delete().eq("tasting_id", tid);
    if (delErr) throw new Error(delErr.message);

    const clean = uniqUuidsKeepOrder(nodeIds);
    if (!clean.length) return;

    const inserts = clean.map((id) => ({
      tasting_id: tid,
      node_id: id,
      sentiment: POS_SENTIMENT,
    }));

    const { error: insErr } = await supabase.from("tasting_flavor_nodes").insert(inserts);
    if (insErr) throw new Error(insErr.message);
  }

  /* ------------------- Load existing tasting ------------------- */

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

      const row = ((data as any) as CloudTastingRow) ?? null;
      if (!row) throw new Error("Not found");

      const nm = (row.whiskey_name ?? "Whiskey").trim() || "Whiskey";
      const rt =
        row.rating == null || !Number.isFinite(Number(row.rating))
          ? null
          : clamp100(Math.round(Number(row.rating)));

      const st = String(row.source_type ?? "purchased").toLowerCase() === "bar" ? "bar" : "purchased";
      const bn = String(row.bar_name ?? "");

      const ft = Array.isArray((row as any).flavor_tags) ? (((row as any).flavor_tags as any) as string[]) : [];
      const dt = Array.isArray((row as any).dislike_tags) ? (((row as any).dislike_tags as any) as string[]) : [];

      const wid = row.whiskey_id && isUuid(String(row.whiskey_id)) ? String(row.whiskey_id) : null;

      const pn = String((row as any).personal_notes ?? "");

      setName(nm);
      setWhiskeyId(wid);
      setRating(rt);
      setNose((() => {
        const s = safeText(row.nose_reaction);
        if (s === "Enjoyed" || s === "ENJOYED") return "ENJOYED";
        if (s === "Neutral" || s === "NEUTRAL") return "NEUTRAL";
        if (s === "Not for me" || s === "NOT_FOR_ME") return "NOT_FOR_ME";
        return null;
      })());
      setTaste((() => {
        const s = safeText(row.taste_reaction);
        if (s === "Enjoyed" || s === "ENJOYED") return "ENJOYED";
        if (s === "Neutral" || s === "NEUTRAL") return "NEUTRAL";
        if (s === "Not for me" || s === "NOT_FOR_ME") return "NOT_FOR_ME";
        return null;
      })());

      // flavor tags exclude finish + dislikes label
      setFlavorTags(ft.filter((x) => !isFinishLabel(x) && normalizeKey(x) !== "dislikes"));
      setDislikeTags(dt);
      setNoDislikes(dt.length === 0);

      setSourceType(st);
      setBarName(bn);
      setPersonalNotes(pn);

      const nodes = await loadTastingFlavorNodes(tastingId);
      setSelectedNodeIds(nodes);
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

  /* ------------------- Analytics start event ------------------- */

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

  /* ------------------- Derived UI helpers ------------------- */

  const barNameMissing = sourceType === "bar" && barName.trim().length < 2;

  const hasBottleDetails =
    !!whiskeyMeta?.category ||
    !!whiskeyMeta?.region ||
    !!whiskeyMeta?.sub_region ||
    !!whiskeyMeta?.whiskey_type ||
    (whiskeyMeta?.proof != null && Number.isFinite(Number(whiskeyMeta.proof))) ||
    (whiskeyMeta?.age != null && Number.isFinite(Number(whiskeyMeta.age))) ||
    !!whiskeyMeta?.distillery;

  /* ------------------- Refine rendering ------------------- */

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

  /* ------------------- Taxonomy + Post-save metadata modal ------------------- */

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
            proof: row.proof == null || !Number.isFinite(Number(row.proof)) ? null : Number(row.proof),
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

  /* ------------------- Save ------------------- */

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
        selectedNodeIds.map((id) => getTopLevelLabelForNode(id, byId)).filter(Boolean) as string[]
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
          await maybeOpenPostSaveMetadata(safeWhiskeyId, `/whiskey/${encodeURIComponent(safeWhiskeyId)}`);
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
          await maybeOpenPostSaveMetadata(safeWhiskeyId, `/whiskey/${encodeURIComponent(safeWhiskeyId)}`);
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

  /* ------------------- Taxonomy modal gating ------------------- */

  function withOtherOption(list: string[]) {
    const cleaned = uniqStringsKeepOrder(list.map((x) => safeText(x)).filter(Boolean));
    if (!cleaned.some((x) => x.toLowerCase() === "other")) cleaned.push("Other");
    return cleaned;
  }

  const categoryOptions = withOtherOption(taxCategories);
  const regionOptions = withOtherOption(fCategory ? taxRegions : []);
  const subRegionOptions = withOtherOption(fCategory && fRegion ? taxSubRegions : []);

  const canEditCategory = isMissingLike(fCategory) || taxCategories.length === 0;

  const canEditRegion = !isMissingLike(fCategory) && (isMissingLike(fRegion) || taxRegions.length === 0);

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

  /* ------------------- Header config ------------------- */

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
              <Text style={[type.button, { color: colors.accent }]}>{saving ? "Saving…" : "Save"}</Text>
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
                    Distillery: <Text style={{ fontWeight: "900" }}>{String(whiskeyMeta.distillery)}</Text>
                  </Text>
                ) : null}

                {whiskeyMeta?.category ? (
                  <Text style={[type.body, { opacity: 0.8 }]}>
                    Category: <Text style={{ fontWeight: "900" }}>{String(whiskeyMeta.category)}</Text>
                  </Text>
                ) : null}

                {whiskeyMeta?.region ? (
                  <Text style={[type.body, { opacity: 0.8 }]}>
                    Region: <Text style={{ fontWeight: "900" }}>{String(whiskeyMeta.region)}</Text>
                  </Text>
                ) : null}

                {whiskeyMeta?.sub_region ? (
                  <Text style={[type.body, { opacity: 0.8 }]}>
                    Sub-Region: <Text style={{ fontWeight: "900" }}>{String(whiskeyMeta.sub_region)}</Text>
                  </Text>
                ) : null}

                {whiskeyMeta?.whiskey_type ? (
                  <Text style={[type.body, { opacity: 0.8 }]}>
                    Style: <Text style={{ fontWeight: "900" }}>{String(whiskeyMeta.whiskey_type)}</Text>
                  </Text>
                ) : null}

                {whiskeyMeta?.proof != null ? (
                  <Text style={[type.body, { opacity: 0.8 }]}>
                    Proof: <Text style={{ fontWeight: "900" }}>{Math.round(Number(whiskeyMeta.proof))} proof</Text>
                  </Text>
                ) : null}

                {whiskeyMeta?.age != null ? (
                  <Text style={[type.body, { opacity: 0.8 }]}>
                    Age: <Text style={{ fontWeight: "900" }}>{Math.round(Number(whiskeyMeta.age))} yr</Text>
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
                disabled={locked}
                value={rating == null ? 0 : rating}
                min={0}
                max={100}
                step={1}
                onSlidingChange={(s) => setIsSliding(s)}
                onValueChange={(v) => setRating(clamp100(Math.round(v)))}
              />

              <View style={{ flexDirection: "row", gap: spacing.md, justifyContent: "space-between" }}>
                <Pressable
                  onPress={() => stepRating(-1)}
                  onPressIn={() => startRepeat(-1)}
                  onPressOut={stopRepeat}
                  disabled={locked}
                  style={({ pressed }) => ({
                    width: 54,
                    height: 54,
                    borderRadius: radii.md,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: colors.divider,
                    backgroundColor: pressed ? colors.highlight : "transparent",
                    opacity: locked ? 0.5 : 1,
                  })}
                >
                  <Text style={[type.button, { fontSize: 22, color: colors.textPrimary }]}>−</Text>
                </Pressable>

                <Pressable
                  onPress={() => stepRating(1)}
                  onPressIn={() => startRepeat(1)}
                  onPressOut={stopRepeat}
                  disabled={locked}
                  style={({ pressed }) => ({
                    width: 54,
                    height: 54,
                    borderRadius: radii.md,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: colors.divider,
                    backgroundColor: pressed ? colors.highlight : "transparent",
                    opacity: locked ? 0.5 : 1,
                  })}
                >
                  <Text style={[type.button, { fontSize: 22, color: colors.textPrimary }]}>+</Text>
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
              Top-level notes are perfect. Refining is optional.
            </Text>

            <View style={{ marginTop: spacing.md, flexDirection: "row" }}>
              <View style={{ flex: 1 }}>
                <View style={{ gap: spacing.sm }}>
                  <ColumnHeader title="Nose" />
                  <ReactionList value={nose} onChange={setNose} disabled={locked} />
                </View>

                <View style={{ height: spacing.xl }} />

                <View style={{ gap: spacing.sm }}>
                  <ColumnHeader title="Taste" />
                  <ReactionList value={taste} onChange={setTaste} disabled={locked} />
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
                  <NotesList tags={ALL_TOP_LEVEL_LABELS} selected={flavorTags} onToggle={toggleFlavor} disabled={locked} />
                </View>
              </View>
            </View>

            {additionalNotesLine ? (
              <Text style={[type.microcopyItalic, { marginTop: spacing.md, opacity: 0.85 }]}>
                {additionalNotesLine}
              </Text>
            ) : null}

            <Pressable
              disabled={locked}
              onPress={openRefine}
              style={({ pressed }) => ({
                marginTop: spacing.md,
                width: "100%",
                paddingVertical: spacing.lg,
                paddingHorizontal: spacing.lg,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.divider,
                backgroundColor: pressed ? colors.highlight : "transparent",
                opacity: locked ? 0.6 : 1,
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              })}
            >
              <Text style={[type.body, { fontWeight: "900" }]}>Refine notes (optional)</Text>
              <Text style={[type.microcopyItalic, { opacity: 0.8, textAlign: "center" }]}>
                {selectedNodeIds.length
                  ? `${selectedCountText} • ${selectedNodeIds.length ? selectedNodeLabelsPreview : ""}`
                  : scopedRootIds.length
                  ? "Explore deeper under your selected notes"
                  : "Explore more specific flavors"}
              </Text>
            </Pressable>
          </Card>

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

            <NotesGrid tags={DISLIKE_TAGS} selected={dislikeTags} onToggle={toggleDislike} disabled={locked} />
          </Card>

          {/* Personal Notes */}
          <Card>
            <Text style={type.sectionHeader}>Personal Notes</Text>
            <Text style={[type.microcopyItalic, { marginTop: spacing.xs, opacity: 0.85 }]}>
              Optional. Any extra flavors or comments? (e.g., grandma’s apple pie, buttery popcorn).
            </Text>

            <TextInput
              value={personalNotes}
              onChangeText={setPersonalNotes}
              editable={!locked}
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
                opacity: !locked ? 1 : 0.75,
                minHeight: 120,
              }}
            />
          </Card>

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

      {/* ✅ FULLSCREEN Refine Modal */}
      <Modal
        visible={refineOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => closeRefine()}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Header */}
          <View
            style={{
              paddingTop: spacing.lg,
              paddingHorizontal: spacing.lg,
              paddingBottom: spacing.md,
              gap: spacing.xs,
              borderBottomWidth: 1,
              borderBottomColor: colors.divider,
              backgroundColor: colors.background,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={[type.sectionHeader, { marginBottom: 0 }]}>Refine flavor notes</Text>

              <Pressable
                onPress={() => closeRefine()}
                style={({ pressed }) => ({
                  paddingVertical: 20,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: colors.divider,
                  backgroundColor: pressed ? colors.highlight : "transparent",
                })}
              >
                <Text style={[type.button, { color: colors.textPrimary }]}>Done</Text>
              </Pressable>
            </View>

            <Text style={[type.microcopyItalic, { opacity: 0.8 }]}>
              Advanced is optional — explore deeper if you’d like.
            </Text>

            <TextInput
              value={refineSearch}
              onChangeText={(t) => {
                setRefineSearch(t);
                setRefinePath([]);
              }}
              placeholder={scopedRootIds.length ? "Search within your selected notes…" : "Search notes…"}
              placeholderTextColor={colors.textSecondary}
              editable={!locked}
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
                opacity: locked ? 0.7 : 1,
              }}
            />

            {/* Controls */}
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Pressable
                  disabled={locked || (!refinePath.length && !refineSearch)}
                  onPress={() => {
                    if (refineSearch) {
                      setRefineSearch("");
                      return;
                    }
                    setRefinePath((p) => p.slice(0, -1));
                  }}
                  style={({ pressed }) => ({
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: colors.divider,
                    backgroundColor: pressed ? colors.highlight : "transparent",
                    opacity: locked || (!refinePath.length && !refineSearch) ? 0.4 : 1,
                  })}
                >
                  <Text style={[type.button, { color: colors.textPrimary }]}>
                    {refineSearch ? "Clear search" : "Back"}
                  </Text>
                </Pressable>

                <Text style={[type.microcopyItalic, { opacity: 0.8 }]}>{selectedCountText}</Text>
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                <Text style={[type.microcopyItalic, { opacity: 0.75 }]}>Sort:</Text>
                <Pill label="Default" active={refineSort === "DEFAULT"} onPress={() => setRefineSort("DEFAULT")} disabled={locked} />
                <Pill label="Selected" active={refineSort === "SELECTED"} onPress={() => setRefineSort("SELECTED")} disabled={locked} />
                <Pill label="A–Z" active={refineSort === "AZ"} onPress={() => setRefineSort("AZ")} disabled={locked} />
              </View>

              <Text style={[type.microcopyItalic, { opacity: 0.75 }]}>{refineBreadcrumb}</Text>

              {/* Not seeing it? */}
              {scopedRootIds.length > 0 ? (
                <View style={{ gap: 8 }}>
                  <Pressable
                    disabled={locked}
                    onPress={() => setAddFamilyOpen((v) => !v)}
                    style={({ pressed }) => ({
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: colors.divider,
                      backgroundColor: pressed ? colors.highlight : "transparent",
                      opacity: locked ? 0.6 : 1,
                    })}
                  >
                    <Text style={[type.body, { fontWeight: "900" }]}>
                      Not seeing it? Add another top-level note
                    </Text>
                    <Text style={[type.microcopyItalic, { opacity: 0.75 }]}>
                      Example: caramel is usually under Sweet.
                    </Text>
                  </Pressable>

                  {addFamilyOpen ? (
                    <View
                      style={{
                        borderWidth: 1,
                        borderColor: colors.divider,
                        borderRadius: radii.md,
                        padding: spacing.md,
                        gap: 8,
                        backgroundColor: colors.surface,
                        ...shadows.card,
                      }}
                    >
                      <Text style={[type.microcopyItalic, { opacity: 0.75 }]}>Add a family:</Text>

                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        {addableFamilies.map((lbl) => (
                          <Pill key={lbl} label={lbl} active={false} onPress={() => addFamilyLabel(lbl)} disabled={locked} />
                        ))}
                        {!addableFamilies.length ? (
                          <Text style={[type.microcopyItalic, { opacity: 0.75 }]}>
                            You’ve already added all families.
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>

          {/* Body */}
          <View style={{ flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
            {nodesLoading ? (
              <View style={{ paddingVertical: spacing.xl, alignItems: "center" }}>
                <ActivityIndicator />
                <Text style={[type.body, { marginTop: spacing.sm, opacity: 0.7 }]}>Loading notes…</Text>
              </View>
            ) : nodesError ? (
              <View style={{ gap: spacing.sm }}>
                <Text style={[type.body, { opacity: 0.85 }]}>Couldn’t load refined notes.</Text>
                <Text style={[type.microcopyItalic, { opacity: 0.75 }]}>{nodesError}</Text>

                <Pressable
                  disabled={locked}
                  onPress={() => fetchFlavorNodes()}
                  style={({ pressed }) => ({
                    paddingVertical: 11,
                    paddingHorizontal: 12,
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: colors.divider,
                    backgroundColor: pressed ? colors.highlight : "transparent",
                    opacity: locked ? 0.6 : 1,
                    alignItems: "center",
                    justifyContent: "center",
                  })}
                >
                  <Text style={[type.button, { color: colors.textPrimary }]}>Retry</Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: spacing.xl * 2 }}>
                {/* 1) Search results */}
                {refineSearch ? (
                  <View style={{ gap: 10 }}>
                    {visibleNodes.map((n) => renderNodeRow(n, true))}
                    {!visibleNodes.length ? (
                      <View style={{ gap: 6, alignItems: "center", paddingTop: spacing.md }}>
                        <Text style={[type.microcopyItalic, { opacity: 0.75, textAlign: "center" }]}>
                          No matches{scopedRootIds.length ? " in your selected notes" : ""}.
                        </Text>
                        {scopedRootIds.length ? (
                          <Text style={[type.microcopyItalic, { opacity: 0.75, textAlign: "center" }]}>
                            Try adding another top-level note (e.g., Sweet for caramel).
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <>
                    {/* 2) Drilldown */}
                    {refinePath.length ? (
                      <View style={{ gap: 10 }}>
                        {visibleNodes.map((n) => renderNodeRow(n, true))}
                        {!visibleNodes.length ? (
                          <Text style={[type.microcopyItalic, { opacity: 0.75, textAlign: "center" }]}>
                            Nothing here yet.
                          </Text>
                        ) : null}
                      </View>
                    ) : (
                      <>
                        {/* 3) Scoped groups (Option A) */}
                        {scopedRootIds.length ? (
                          <View style={{ gap: spacing.xl }}>
                            {scopedRootIds.map((rootId) => {
                              const title = safeText(rootLabelById.get(rootId) ?? "");
                              const children = (byParent.get(rootId) ?? []).filter(
                                (n) => !isFinishLabel(n.label)
                              );
                              const list = applySort(children);
                              if (!title || !list.length) return null;

                              return (
                                <View key={rootId} style={{ gap: 10 }}>
                                  <SectionGroupHeader
                                    title={title}
                                    disabled={locked}
                                    onBrowse={() => setRefinePath([rootId])}
                                  />
                                  {list.map((n) => (
                                    <React.Fragment key={n.id}>{renderNodeRow(n, true)}</React.Fragment>
                                  ))}
                                </View>
                              );
                            })}
                          </View>
                        ) : (
                         /* 4) Full browse: sectioned previews for ALL top-level families (matches scoped layout) */
                              <View style={{ gap: spacing.xl }}>
                                {applySort(topLevelNodes)
                                  .filter((root) => !isFinishLabel(root.label) && normalizeKey(root.label) !== "dislikes")
                                  .map((root) => {
                                    const title = safeText(root.label);
                                    const children = (byParent.get(root.id) ?? [])
                                      .filter((n) => !isFinishLabel(n.label))
                                      .filter((n) => normalizeKey(safeText(getTopLevelLabelForNode(n.id, byId) ?? "")) !== "dislikes");

                                    const list = applySort(children).slice(0, 4); // ✅ preview rows (adjust 4 -> 3/5 if you want)

                                    if (!title) return null;

                                    return (
                                      <View key={root.id} style={{ gap: 10 }}>
                                        <SectionGroupHeader
                                          title={title}
                                          disabled={locked}
                                          onBrowse={() => setRefinePath([root.id])}
                                        />

                                        {list.length ? (
                                          list.map((n) => (
                                            <React.Fragment key={n.id}>{renderNodeRow(n, true)}</React.Fragment>
                                          ))
                                        ) : (
                                          <Text style={[type.microcopyItalic, { opacity: 0.7, textAlign: "center" }]}>
                                            Nothing here yet.
                                          </Text>
                                        )}
                                      </View>
                                    );
                                  })}
                            </View>
                        )}
                      </>
                    )}
                  </>
                )}
              </ScrollView>
            )}
          </View>

          {/* Footer */}
          <View
            style={{
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.md,
              paddingBottom: spacing.lg + 40,
              borderTopWidth: 1,
              borderTopColor: colors.divider,
              backgroundColor: colors.background,
            }}
          >
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <Pressable
                disabled={locked || selectedNodeIds.length === 0}
                onPress={() => setSelectedNodeIds([])}
                style={({ pressed }) => ({
                  flex: 1,
                  borderRadius: radii.md,
                  paddingVertical: spacing.lg,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: colors.divider,
                  backgroundColor: "transparent",
                  opacity: locked || selectedNodeIds.length === 0 ? 0.45 : pressed ? 0.9 : 1,
                })}
              >
                <Text style={[type.button, { color: colors.textPrimary, textAlign: "center" }]}>Clear</Text>
              </Pressable>

              <Pressable
                disabled={locked}
                onPress={closeRefine}
                style={({ pressed }) => ({
                  flex: 1,
                  borderRadius: radii.md,
                  paddingVertical: spacing.lg,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.accent,
                  opacity: locked ? 0.6 : pressed ? 0.92 : 1,
                })}
              >
                <Text style={[type.button, { color: colors.background, textAlign: "center" }]}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

/* ------------------- Reaction helpers (bottom) ------------------- */

function reactionLabel(v: Reaction) {
  if (v === "ENJOYED") return "Enjoyed";
  if (v === "NEUTRAL") return "Neutral";
  if (v === "NOT_FOR_ME") return "Not for me";
  return "";
}