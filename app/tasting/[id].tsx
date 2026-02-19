import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";
import { spacing } from "../../lib/spacing";
import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";

type TastingRow = {
  id: string;
  whiskey_name: string | null;
  rating: number | null;
  notes: string | null;
  created_at: string | null;
};

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

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function clamp100(n: number) {
  return Math.max(0, Math.min(100, n));
}

export default function TastingDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const tastingId = String(params.id ?? "").trim();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [row, setRow] = useState<TastingRow | null>(null);

  const [isEditing, setIsEditing] = useState(false);

  // Editable fields
  const [name, setName] = useState("");
  const [rating, setRating] = useState<number>(90);
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    if (!tastingId) {
      setRow(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("tastings")
        .select("id, whiskey_name, rating, notes, created_at")
        .eq("id", tastingId)
        .maybeSingle();

      if (error) throw new Error(error.message);

      const r = (data as any as TastingRow) ?? null;
      setRow(r);

      // hydrate edit fields
      const nm = (r?.whiskey_name ?? "Whiskey").trim() || "Whiskey";
      const rt =
        r?.rating == null || !Number.isFinite(Number(r.rating))
          ? 90
          : clamp100(Math.round(Number(r.rating)));
      const nt = (r?.notes ?? "").toString();

      setName(nm);
      setRating(rt);
      setNotes(nt);
    } catch (e: any) {
      Alert.alert("Couldn’t load tasting", String(e?.message ?? e));
      setRow(null);
    } finally {
      setLoading(false);
      setIsEditing(false);
    }
  }, [tastingId]);

  useEffect(() => {
    load();
  }, [load]);

  const titleName = useMemo(() => {
    const base = isEditing ? name : row?.whiskey_name;
    return (base ?? "Whiskey").trim() || "Whiskey";
  }, [isEditing, name, row?.whiskey_name]);

  const ratingText = useMemo(() => {
    const v = isEditing ? rating : row?.rating;
    if (v == null || !Number.isFinite(Number(v))) return "—";
    return String(Math.round(Number(v)));
  }, [isEditing, rating, row?.rating]);

  async function onSave() {
    if (!row?.id) return;

    const safeName = name.trim();
    if (safeName.length < 2) {
      Alert.alert("Whiskey name", "Please enter a whiskey name.");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("tastings")
        .update({
          whiskey_name: safeName,
          rating: Number(rating),
          notes: notes.trim() ? notes.trim() : null,
        })
        .eq("id", row.id);

      if (error) throw new Error(error.message);

      // Reload so read-only view is always true to source
      await load();
    } catch (e: any) {
      Alert.alert("Save failed", String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  function onCancelEdit() {
    // revert fields back to the saved row
    const nm = (row?.whiskey_name ?? "Whiskey").trim() || "Whiskey";
    const rt =
      row?.rating == null || !Number.isFinite(Number(row.rating))
        ? 90
        : clamp100(Math.round(Number(row.rating)));
    const nt = (row?.notes ?? "").toString();

    setName(nm);
    setRating(rt);
    setNotes(nt);
    setIsEditing(false);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: "Tasting",
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
            if (!row) return null;

            if (!isEditing) {
              return (
                <Pressable
                  onPress={() => setIsEditing(true)}
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
            );
          },
        }}
      />

      <View style={{ padding: spacing.xl, gap: spacing.xl }}>
        {loading ? (
          <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: spacing.xl }}>
            <ActivityIndicator />
            <Text style={[type.body, { marginTop: spacing.sm, opacity: 0.7 }]}>Loading…</Text>
          </View>
        ) : row ? (
          <>
            <View style={{ gap: 6 }}>
              <Text style={[type.screenTitle, { fontSize: 34, lineHeight: 38 }]}>
                {titleName}
              </Text>
              <Text style={[type.microcopyItalic, { opacity: 0.85 }]}>
                {formatDate(row.created_at)}
              </Text>
            </View>

            {/* Rating */}
            <Card>
              <Text style={type.sectionHeader}>Overall rating</Text>

              {!isEditing ? (
                <Text style={[type.sectionHeader, { fontSize: 44, marginTop: spacing.sm }]}>
                  {ratingText}
                </Text>
              ) : (
                <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
                  <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
                    <Pressable
                      onPress={() => setRating((v) => clamp100(v - 1))}
                      style={({ pressed }) => ({
                        width: 54,
                        height: 54,
                        borderRadius: radii.md,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: colors.divider,
                        backgroundColor: pressed ? colors.highlight : "transparent",
                      })}
                    >
                      <Text style={[type.button, { fontSize: 22 }]}>−</Text>
                    </Pressable>

                    <Text
                      style={{
                        fontSize: 56,
                        lineHeight: 60,
                        fontWeight: "900",
                        color: colors.textPrimary,
                        includeFontPadding: false as any,
                        fontFamily: type.screenTitle?.fontFamily ?? type.body.fontFamily,
                      }}
                    >
                      {clamp100(rating)}
                    </Text>

                    <Pressable
                      onPress={() => setRating((v) => clamp100(v + 1))}
                      style={({ pressed }) => ({
                        width: 54,
                        height: 54,
                        borderRadius: radii.md,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: colors.divider,
                        backgroundColor: pressed ? colors.highlight : "transparent",
                      })}
                    >
                      <Text style={[type.button, { fontSize: 22 }]}>+</Text>
                    </Pressable>
                  </View>

                  <Text style={[type.microcopyItalic, { opacity: 0.85 }]}>
                    Edit is intentional — small refinements only.
                  </Text>
                </View>
              )}
            </Card>

            {/* Name (editable only in edit mode) */}
            {isEditing ? (
              <Card>
                <Text style={type.sectionHeader}>Whiskey</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Whiskey name"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                  style={{
                    marginTop: spacing.md,
                    borderWidth: 1,
                    borderColor: colors.divider,
                    borderRadius: radii.md,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.md,
                    color: colors.textPrimary,
                    fontFamily: type.body.fontFamily,
                    fontSize: 16,
                    backgroundColor: "transparent",
                  }}
                />
              </Card>
            ) : null}

            {/* Notes */}
            <Card>
              <Text style={type.sectionHeader}>Notes</Text>

              {!isEditing ? (
                <Text style={[type.body, { opacity: 0.9, lineHeight: 22 }]}>
                  {row.notes?.trim() ? row.notes.trim() : "—"}
                </Text>
              ) : (
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="What stood out?"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  style={{
                    marginTop: spacing.md,
                    minHeight: 120,
                    borderWidth: 1,
                    borderColor: colors.divider,
                    borderRadius: radii.md,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.md,
                    color: colors.textPrimary,
                    fontFamily: type.body.fontFamily,
                    fontSize: 16,
                    backgroundColor: "transparent",
                    textAlignVertical: "top",
                  }}
                />
              )}
            </Card>

            {/* Edit actions (only visible in edit mode) */}
            {isEditing ? (
              <View style={{ flexDirection: "row", gap: spacing.md }}>
                <Pressable
                  onPress={onCancelEdit}
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
                  <Text style={[type.button, { color: colors.textPrimary }]}>Cancel</Text>
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
                  <Text style={[type.button, { color: colors.background }]}>
                    {saving ? "Saving…" : "Save"}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </>
        ) : (
          <Card>
            <Text style={type.sectionHeader}>Not found</Text>
            <Text style={[type.microcopyItalic, { opacity: 0.85 }]}>
              This tasting may have been deleted or isn’t available.
            </Text>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}
