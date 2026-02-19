import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

import { createCloudTasting } from "../../lib/cloudTastings";
import { fetchFlavorFamilies, saveFlavorFamilyTags } from "../../lib/flavors";
import { supabase } from "../../lib/supabase";

/* ---------- HELPERS ---------- */

function asString(v: string | string[] | undefined) {
  if (Array.isArray(v)) return v[0];
  return v;
}

function clamp100(n: number) {
  return Math.max(0, Math.min(100, n));
}

type Reaction = "ENJOYED" | "NEUTRAL" | "NOT_FOR_ME" | null;

function reactionLabel(v: Reaction) {
  if (v === "ENJOYED") return "Enjoyed";
  if (v === "NEUTRAL") return "Neutral";
  if (v === "NOT_FOR_ME") return "Not for me";
  return "";
}

/* ---------- UI ATOMS ---------- */

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

function Segmented({
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
    <View style={{ gap: spacing.sm }}>
      {opts.map((o) => {
        const active = value === o.key;
        return (
          <Pressable
            key={String(o.key)}
            disabled={disabled}
            onPress={() => onChange(active ? null : o.key)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.md,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: active ? colors.accent : colors.divider,
              backgroundColor: active ? colors.highlight : colors.surface,
              opacity: disabled ? 0.6 : pressed ? 0.92 : 1,
            })}
          >
            <Text
              style={[
                type.body,
                { fontWeight: "800", textAlign: "center", flex: 1 },
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

function ReactionChips({
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
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
      {opts.map((o) => {
        const active = value === o.key;
        return (
          <Pressable
            key={String(o.key)}
            disabled={disabled}
            onPress={() => onChange(active ? null : o.key)}
            style={({ pressed }) => ({
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: active ? colors.accent : colors.divider,
              backgroundColor: active ? colors.highlight : colors.surface,
              opacity: disabled ? 0.6 : pressed ? 0.92 : 1,
            })}
          >
            <Text style={[type.body, { fontWeight: "800" }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TagChips({
  tags,
  selectedIds,
  onToggle,
  max,
  disabled,
}: {
  tags: { id: string; label: string }[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  max: number;
  disabled?: boolean;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {tags.map((t) => {
          const active = selectedIds.includes(t.id);
          const atLimit = selectedIds.length >= max && !active;

          return (
            <Pressable
              key={t.id}
              disabled={disabled || atLimit}
              onPress={() => onToggle(t.id)}
              style={({ pressed }) => ({
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: active ? colors.accent : colors.divider,
                backgroundColor: active ? colors.highlight : colors.surface,
                opacity: disabled ? 0.6 : atLimit ? 0.45 : pressed ? 0.92 : 1,
              })}
            >
              <Text style={[type.body, { fontWeight: active ? "900" : "800" }]}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[type.microcopyItalic, { opacity: 0.75 }]}>
        {selectedIds.length}/{max} selected
      </Text>
    </View>
  );
}

function RatingBar({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  function step(delta: number) {
    onChange(clamp100(value + delta));
  }

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <Pressable
          onPress={() => step(-1)}
          style={({ pressed }) => ({
            width: 54,
            height: 54,
            borderRadius: radii.md,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: colors.divider,
            backgroundColor: pressed ? colors.divider : colors.surface,
            opacity: pressed ? 0.92 : 1,
          })}
        >
          <Text style={[type.button, { color: colors.textPrimary, fontSize: 22 }]}>
            −
          </Text>
        </Pressable>

        <View
          style={{
            flex: 1,
            height: 16,
            borderRadius: 999,
            overflow: "hidden",
            backgroundColor: colors.divider,
            alignSelf: "center",
          }}
        >
          <View
            style={{
              width: `${clamp100(value)}%`,
              height: "100%",
              backgroundColor: colors.accent,
            }}
          />
        </View>

        <Pressable
          onPress={() => step(1)}
          style={({ pressed }) => ({
            width: 54,
            height: 54,
            borderRadius: radii.md,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: colors.divider,
            backgroundColor: pressed ? colors.divider : colors.surface,
            opacity: pressed ? 0.92 : 1,
          })}
        >
          <Text style={[type.button, { color: colors.textPrimary, fontSize: 22 }]}>
            +
          </Text>
        </Pressable>
      </View>

      <Text
        style={{
          fontSize: 56,
          lineHeight: 60,
          fontWeight: "900",
          textAlign: "right",
          color: colors.textPrimary,
          includeFontPadding: false as any,
          fontFamily: type.screenTitle?.fontFamily ?? type.body.fontFamily,
        }}
      >
        {clamp100(value)}
      </Text>
    </View>
  );
}

/* ---------- SCREEN ---------- */

export default function LogTastingScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    whiskeyName?: string | string[];
    tastingId?: string | string[];
    lockName?: string | string[];
  }>();

  const routeWhiskeyId = asString(params.id) ?? "";
  const routeWhiskeyName = (asString(params.whiskeyName) ?? "").trim();
  const tastingId = asString(params.tastingId) ?? "";
  const lockNameParam = (asString(params.lockName) ?? "0") === "1";

  const isEdit = !!tastingId;
  const lockName = !isEdit && lockNameParam;

  useEffect(() => {
    if (!isEdit) return;
    Alert.alert(
      "Edit not available yet",
      "Editing cloud tastings will be added next. For now, please create a new tasting.",
      [{ text: "OK", onPress: () => router.back() }]
    );
  }, [isEdit]);

  const [name, setName] = useState(routeWhiskeyName || "Whiskey");
  const [rating, setRating] = useState<number>(90);

  const [noseReaction, setNoseReaction] = useState<Reaction>(null);
  const [tasteReaction, setTasteReaction] = useState<Reaction>(null);
  const [overallReaction, setOverallReaction] = useState<Reaction>(null);

  const [flavorFamilies, setFlavorFamilies] = useState<
    { id: string; label: string }[]
  >([]);
  const [selectedFamilyIds, setSelectedFamilyIds] = useState<string[]>([]);
  const [loadingFamilies, setLoadingFamilies] = useState(true);

  // ✅ NEW: Personal Notes (unstructured, optional)
  const [personalNotes, setPersonalNotes] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const fams = await fetchFlavorFamilies(supabase);
        if (mounted) setFlavorFamilies(fams.map((f) => ({ id: f.id, label: f.label })));
      } catch (e) {
        console.log("Failed to load flavor families:", e);
      } finally {
        if (mounted) setLoadingFamilies(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  function toggleFamily(id: string) {
    setSelectedFamilyIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  const [sourceType, setSourceType] = useState<"purchased" | "bar">("purchased");
  const [barPlace, setBarPlace] = useState("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const whiskeySlug = useMemo(() => {
    const base = routeWhiskeyId || name || "whiskey";
    return String(base)
      .toLowerCase()
      .trim()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }, [routeWhiskeyId, name]);

  async function onSave() {
    if (saving) return;

    const safeName = name.trim();
    if (safeName.length < 2) {
      Alert.alert("Whiskey name", "Please enter a whiskey name.");
      return;
    }

    if (sourceType === "bar" && barPlace.trim().length < 2) {
      Alert.alert("Bar name", "Please enter the bar name for a Bar Pour.");
      return;
    }

    setSaving(true);
    setSaved(false);

    const region =
      sourceType === "purchased"
        ? "Purchased Bottle"
        : `Bar Pour — ${barPlace.trim()}`;

    const noseText = reactionLabel(noseReaction);
    const palateText = reactionLabel(tasteReaction);
    const overallText = reactionLabel(overallReaction);

    const selectedLabels = flavorFamilies
      .filter((f) => selectedFamilyIds.includes(f.id))
      .map((f) => f.label);

    const tagText = selectedLabels.length ? selectedLabels.join(", ") : "—";

    // IMPORTANT: We do NOT mix Personal Notes into the structured notes block.
    // This keeps your “intelligence” layer clean and consistent later.
    const notesBlock = [
      `Source: ${region}`,
      `Overall: ${overallText || "—"}`,
      `Nose: ${noseText || "—"}`,
      `Taste: ${palateText || "—"}`,
      `Flavor tags: ${tagText}`,
      `Slug: ${whiskeySlug}`,
    ].join("\n");

    const personalNotesClean = personalNotes.trim();
    const personalNotesOrNull = personalNotesClean.length ? personalNotesClean : null;

    try {
      // Using `as any` so we can pass `personal_notes` even if cloudTastings typing
      // hasn’t been updated yet. Next step we’ll update lib/cloudTastings.ts to
      // formally accept/persist it.
      const created = await createCloudTasting({
        whiskey_id: null,
        whiskey_name: safeName,
        rating: Number(rating),
        notes: notesBlock,
        personal_notes: personalNotesOrNull,
      } as any);

      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;

      if (user?.id && created?.id) {
        await saveFlavorFamilyTags({
          supabase,
          tastingId: created.id,
          userId: user.id,
          level1Ids: selectedFamilyIds,
        });
      }

      setSaved(true);
      setSaving(false);

      setTimeout(() => router.back(), 450);
    } catch (e: any) {
      console.log("Cloud save failed:", e);
      setSaving(false);

      const msg = String(e?.message ?? e ?? "");
      if (msg.toLowerCase().includes("not signed in")) {
        Alert.alert(
          "Sign in required",
          "Please sign in before saving tastings to the cloud."
        );
        return;
      }

      Alert.alert("Save failed", "Something went wrong while saving. Try again.");
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: "Tasting" }} />

      <View style={{ padding: spacing.xl, gap: spacing.lg }}>
        <Text style={type.screenTitle}>
          {isEdit ? "Edit Tasting" : "Add a New Tasting"}
        </Text>

        {isEdit ? (
          <View style={{ paddingVertical: spacing.lg }}>
            <ActivityIndicator />
            <Text style={[type.body, { marginTop: spacing.sm, opacity: 0.7 }]}>
              Loading…
            </Text>
          </View>
        ) : null}

        <Card>
          <Text style={type.sectionHeader}>Whiskey</Text>
          <Text style={[type.microcopyItalic, { marginTop: spacing.xs }]}>
            {lockName
              ? "Selected from the database — name is locked."
              : "Name your pour."}
          </Text>

          <TextInput
            value={name}
            onChangeText={(t) => {
              if (!lockName) setName(t);
            }}
            editable={!lockName}
            placeholder="Whiskey"
            placeholderTextColor={colors.textSecondary}
            autoCorrect={false}
            autoCapitalize="words"
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
              opacity: lockName ? 0.75 : 1,
            }}
          />
        </Card>

        <Card>
          <Text style={type.sectionHeader}>Rating</Text>
          <Text style={[type.microcopyItalic, { marginTop: spacing.xs }]}>
            Quick and intentional — refine later if you want.
          </Text>
          <View style={{ marginTop: spacing.md }}>
            <RatingBar value={rating} onChange={setRating} />
          </View>
        </Card>

        <Card>
          <Text style={type.sectionHeader}>Flavor Notes</Text>
          <Text style={[type.microcopyItalic, { marginTop: spacing.xs }]}>
            Select up to 3 — quick and instinctive.
          </Text>

          <View style={{ marginTop: spacing.md, flexDirection: "row", gap: spacing.lg }}>
            <View style={{ flex: 1, gap: spacing.sm }}>
              <Text style={[type.body, { fontWeight: "900" }]}>Overall</Text>
              <ReactionChips value={overallReaction} onChange={setOverallReaction} />
            </View>

            <View style={{ flex: 2, gap: spacing.sm }}>
              <Text style={[type.body, { fontWeight: "900" }]}>Tastes like</Text>
              {loadingFamilies ? (
                <Text style={[type.microcopyItalic, { opacity: 0.7 }]}>Loading tags…</Text>
              ) : (
                <TagChips
                  tags={flavorFamilies}
                  selectedIds={selectedFamilyIds}
                  onToggle={toggleFamily}
                  max={3}
                />
              )}
            </View>
          </View>
        </Card>

        <Card>
          <Text style={type.sectionHeader}>Initial Reaction</Text>
          <Text style={[type.microcopyItalic, { marginTop: spacing.xs }]}>
            First impression — simple, not crowded.
          </Text>

          <View style={{ marginTop: spacing.md, gap: spacing.lg }}>
            <View style={{ gap: spacing.sm }}>
              <Text style={[type.body, { fontWeight: "900" }]}>Nose</Text>
              <Segmented value={noseReaction} onChange={setNoseReaction} />
            </View>

            <View style={{ gap: spacing.sm }}>
              <Text style={[type.body, { fontWeight: "900" }]}>Taste</Text>
              <Segmented value={tasteReaction} onChange={setTasteReaction} />
            </View>
          </View>
        </Card>

        {/* ✅ NEW CARD: Personal Notes */}
        <Card>
          <Text style={type.sectionHeader}>Personal Notes</Text>
          <Text style={[type.microcopyItalic, { marginTop: spacing.xs }]}>
            Optional — for your own memory. This doesn’t affect your taste profile.
          </Text>

          <TextInput
            value={personalNotes}
            onChangeText={setPersonalNotes}
            placeholder="e.g., Grandma’s apple pie, campfire smoke…"
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={300}
            autoCorrect
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
              minHeight: 96,
              textAlignVertical: "top",
            }}
          />

          <Text
            style={[
              type.microcopyItalic,
              { opacity: 0.75, textAlign: "right" },
            ]}
          >
            {personalNotes.length}/300
          </Text>
        </Card>

        <Card>
          <Text style={type.sectionHeader}>Source</Text>

          <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.md }}>
            <Pressable
              onPress={() => setSourceType("purchased")}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: spacing.lg,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: sourceType === "purchased" ? colors.accent : colors.divider,
                backgroundColor: sourceType === "purchased" ? colors.highlight : colors.surface,
                opacity: pressed ? 0.92 : 1,
                alignItems: "center",
                justifyContent: "center",
              })}
            >
              <Text style={[type.button, { color: colors.textPrimary }]}>
                Purchased Bottle
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSourceType("bar")}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: spacing.lg,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: sourceType === "bar" ? colors.accent : colors.divider,
                backgroundColor: sourceType === "bar" ? colors.highlight : colors.surface,
                opacity: pressed ? 0.92 : 1,
                alignItems: "center",
                justifyContent: "center",
              })}
            >
              <Text style={[type.button, { color: colors.textPrimary }]}>Bar Pour</Text>
            </Pressable>
          </View>

          {sourceType === "bar" ? (
            <View style={{ marginTop: spacing.md }}>
              <TextInput
                value={barPlace}
                onChangeText={setBarPlace}
                placeholder="Bar name (required)"
                placeholderTextColor={colors.textSecondary}
                style={{
                  paddingVertical: spacing.md,
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
        </Card>

        <Pressable
          onPress={onSave}
          disabled={saving}
          style={({ pressed }) => ({
            borderRadius: radii.md,
            paddingVertical: spacing.lg,
            alignItems: "center",
            backgroundColor: saved ? colors.success : colors.accent,
            opacity: saving ? 0.7 : pressed ? 0.92 : 1,
          })}
        >
          <Text style={[type.button, { color: colors.background }]}>
            {saved ? "Saved" : saving ? "Saving…" : "Save Notes"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
