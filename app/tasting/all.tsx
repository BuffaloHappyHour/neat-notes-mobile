import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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

import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

type Row = {
  id: string;
  whiskey_name: string | null;
  rating: number | null;
  created_at: string | null;
  whiskey_type?: string | null;
  distillery?: string | null;
  bar_name?: string | null;
  brand?: string | null;
  region?: string | null;
  country?: string | null;
};

type SortMode = "newest" | "high" | "low";

function safeNumber(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function sortLabel(mode: SortMode) {
  if (mode === "newest") return "Newest";
  if (mode === "high") return "Highest → Lowest";
  return "Lowest → Highest";
}

export default function AllTastingsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState("");

  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [sortOpen, setSortOpen] = useState(false);

  const [actionsOpen, setActionsOpen] = useState(false);
  const [activeRow, setActiveRow] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sameWhiskeyCount = useMemo(() => {
    if (!activeRow?.whiskey_name) return 0;
    const needle = activeRow.whiskey_name.trim().toLowerCase();
    return rows.filter(
      (r) => (r.whiskey_name ?? "").trim().toLowerCase() === needle
    ).length;
  }, [activeRow, rows]);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = !!opts?.silent;
    setErr("");
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        setRows([]);
        setErr("You must be signed in to view your tastings.");
        return;
      }

      const { data, error } = await supabase
        .from("tastings")
        .select("id, whiskey_name, rating, created_at, whiskey_id, whiskeys(whiskey_type)")
        .order("created_at", { ascending: false })
        .limit(5000);

      if (error) throw new Error(error.message);

      const mapped = (Array.isArray(data) ? data : []).map((r: any) => ({
        ...r,
        whiskey_type: r.whiskeys?.whiskey_type ?? null,
      }));
      setRows(mapped);
    } catch (e: any) {
      setRows([]);
      setErr(String(e?.message ?? e));
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();

    let list = rows;

    if (q.length) {
      list = list.filter((r) => {
        const fields = [
          r.whiskey_name,
          (r as any).distillery,
          (r as any).bar_name,
          (r as any).brand,
          (r as any).region,
          (r as any).country,
        ]
          .map((x) => String(x ?? "").toLowerCase())
          .filter(Boolean)
          .join(" • ");

        return fields.includes(q);
      });
    }

    const out = [...list];

    if (sortMode === "newest") {
      out.sort((a, b) => {
        const ta = Date.parse(a.created_at ?? "") || 0;
        const tb = Date.parse(b.created_at ?? "") || 0;
        return tb - ta;
      });
      return out;
    }

    if (sortMode === "high") {
      out.sort((a, b) => {
        const ra = safeNumber(a.rating);
        const rb = safeNumber(b.rating);

        if (ra == null && rb == null) return 0;
        if (ra == null) return 1;
        if (rb == null) return -1;

        if (rb !== ra) return rb - ra;

        const ta = Date.parse(a.created_at ?? "") || 0;
        const tb = Date.parse(b.created_at ?? "") || 0;
        return tb - ta;
      });
      return out;
    }

    out.sort((a, b) => {
      const ra = safeNumber(a.rating);
      const rb = safeNumber(b.rating);

      if (ra == null && rb == null) return 0;
      if (ra == null) return 1;
      if (rb == null) return -1;

      if (ra !== rb) return ra - rb;

      const ta = Date.parse(a.created_at ?? "") || 0;
      const tb = Date.parse(b.created_at ?? "") || 0;
      return tb - ta;
    });

    return out;
  }, [rows, search, sortMode]);

  function openActionsForRow(r: Row) {
    setActiveRow(r);
    setActionsOpen(true);
  }

  function closeActions() {
    if (deleting) return;
    setActionsOpen(false);
    setActiveRow(null);
  }

  async function deleteActiveRow() {
    if (!activeRow) return;

    setDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        throw new Error("You must be signed in to delete a tasting.");
      }

      const { error } = await supabase
        .from("tastings")
        .delete()
        .eq("id", activeRow.id);
      if (error) throw new Error(error.message);

      setRows((prev) => prev.filter((x) => x.id !== activeRow.id));

      setActionsOpen(false);
      setActiveRow(null);
      await load({ silent: true });
    } catch (e: any) {
      setErr(String(e?.message ?? e));
      setActionsOpen(false);
      setActiveRow(null);
    } finally {
      setDeleting(false);
    }
  }

  function RowItem({ r }: { r: Row }) {
    const nm = (r.whiskey_name ?? "Whiskey").trim() || "Whiskey";
    const ratingNum = safeNumber(r.rating);
    const ratingText = ratingNum == null ? "—" : String(Math.round(ratingNum));
    const dateText = formatDate(r.created_at);
    const meta = r.whiskey_type ?? null;

    return (
      <Pressable
        onPress={() => openActionsForRow(r)}
        style={({ pressed }) => ({
          backgroundColor: pressed
            ? "rgba(190, 150, 99, 0.08)"
            : ((colors as any).glassSurface ?? colors.surface),
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: pressed
            ? "rgba(190, 150, 99, 0.42)"
            : ((colors as any).glassBorder ?? colors.divider),
          paddingVertical: 14,
          paddingHorizontal: spacing.lg,
          ...shadows.card,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.md,
          opacity: pressed ? 0.96 : 1,
        })}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text
            style={[type.body, { fontWeight: "900", color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {nm}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            {dateText ? (
              <Text style={[type.microcopyItalic, { opacity: 0.6, fontSize: 12 }]}>
                {dateText}
              </Text>
            ) : null}
            {meta && dateText ? (
              <Text style={[type.microcopyItalic, { opacity: 0.4, fontSize: 12 }]}>·</Text>
            ) : null}
            {meta ? (
              <Text style={[type.microcopyItalic, { opacity: 0.6, fontSize: 12, color: colors.accent }]}>
                {meta}
              </Text>
            ) : null}
          </View>
        </View>

        <View
          style={{
            minWidth: 44,
            height: 44,
            borderRadius: radii.md,
            backgroundColor: "rgba(190, 150, 99, 0.10)",
            borderWidth: 1,
            borderColor: "rgba(190, 150, 99, 0.30)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={[type.body, { fontWeight: "900", color: colors.accent, fontSize: 18 }]}>
            {ratingText}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: "All Tastings",
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
              onPress={() => load({ silent: true })}
              disabled={refreshing}
              style={({ pressed }) => ({
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              {refreshing ? (
                <ActivityIndicator size="small" />
              ) : (
                <Ionicons name="refresh" size={20} color={colors.textPrimary} />
              )}
            </Pressable>
          ),
        }}
      />

      <View style={{ flex: 1 }}>
        {/* Sticky header */}
        <View
          style={{
            backgroundColor: colors.background,
            borderBottomWidth: 1,
            borderBottomColor: colors.divider,
            zIndex: 10,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: spacing.md,
            gap: spacing.md,
          }}
        >
          <View
            style={{
              borderWidth: 1,
              borderColor: (colors as any).glassBorder ?? colors.divider,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              paddingVertical: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              backgroundColor: (colors as any).glassSurface ?? colors.surface,
            }}
          >
            <Ionicons name="search" size={18} color={colors.textPrimary as any} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search tastings…"
              placeholderTextColor={colors.textSecondary}
              autoCorrect={false}
              autoCapitalize="none"
              style={{
                flex: 1,
                color: colors.textPrimary,
                fontFamily: type.body.fontFamily,
                fontSize: 15,
                paddingVertical: 0,
              }}
            />
            {search.trim().length ? (
              <Pressable
                onPress={() => setSearch("")}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Ionicons name="close-circle" size={18} color={colors.textPrimary as any} />
              </Pressable>
            ) : null}
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: spacing.md,
            }}
          >
            <Pressable
              onPress={() => setSortOpen(true)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                borderWidth: 1,
                borderColor: colors.divider,
                borderRadius: radii.md,
                paddingVertical: 10,
                paddingHorizontal: 12,
                backgroundColor: colors.surface,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Ionicons name="swap-vertical" size={16} color={colors.textPrimary as any} />
              <Text
                style={[
                  type.body,
                  { fontWeight: "900", color: colors.textPrimary, fontSize: 13 },
                ]}
              >
                {sortLabel(sortMode)}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.textPrimary as any} />
            </Pressable>

            {!loading && !err ? (
              <Text
                style={[
                  type.body,
                  { opacity: 0.65, color: colors.textPrimary, fontSize: 12 },
                ]}
              >
                {filteredAndSorted.length < rows.length
                  ? `${filteredAndSorted.length} of ${rows.length}`
                  : `${rows.length} tastings`}
              </Text>
            ) : null}
          </View>

          {loading ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <ActivityIndicator size="small" />
              <Text style={[type.body, { opacity: 0.7, color: colors.textPrimary }]}>
                Loading…
              </Text>
            </View>
          ) : null}

          {err ? (
            <Text style={[type.body, { color: colors.accent, opacity: 0.9 }]}>{err}</Text>
          ) : null}
        </View>

        {/* Scrollable results */}
        <ScrollView
          contentContainerStyle={{
            padding: spacing.lg,
            gap: spacing.sm,
            paddingBottom: spacing.xl * 2,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filteredAndSorted.length === 0 && !loading ? (
            <Text style={[type.body, { opacity: 0.7, color: colors.textPrimary }]}>
              {search.trim().length ? "No results for that search." : "No tastings yet."}
            </Text>
          ) : (
            filteredAndSorted.map((r) => <RowItem key={r.id} r={r} />)
          )}
        </ScrollView>

        {/* Sort modal */}
        <Modal
          visible={sortOpen}
          transparent
          presentationStyle="overFullScreen"
          statusBarTranslucent
          animationType="fade"
          onRequestClose={() => setSortOpen(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.55)",
              padding: spacing.xl,
              justifyContent: "center",
            }}
          >
            <Pressable
              onPress={() => setSortOpen(false)}
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            />

            <Pressable
              onPress={() => {}}
              style={{
                backgroundColor: colors.surface,
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: colors.divider,
                padding: spacing.lg,
                gap: spacing.md,
                ...shadows.card,
              }}
            >
              <Text style={[type.sectionHeader, { fontSize: 16 }]}>Sort tastings</Text>

              {([
                { mode: "newest", label: "Newest → Oldest" },
                { mode: "high", label: "Highest → Lowest" },
                { mode: "low", label: "Lowest → Highest" },
              ] as const).map((opt) => {
                const active = sortMode === opt.mode;
                return (
                  <Pressable
                    key={opt.mode}
                    onPress={() => {
                      setSortMode(opt.mode);
                      setSortOpen(false);
                    }}
                    style={({ pressed }) => ({
                      borderRadius: radii.md,
                      paddingVertical: spacing.md,
                      paddingHorizontal: spacing.md,
                      borderWidth: 1,
                      borderColor: colors.divider,
                      backgroundColor: active ? colors.highlight : colors.surface,
                      opacity: pressed ? 0.9 : 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    })}
                  >
                    <Text
                      style={[
                        type.body,
                        { fontWeight: "900", color: colors.textPrimary },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {active ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={colors.textPrimary as any}
                      />
                    ) : (
                      <Ionicons
                        name="ellipse-outline"
                        size={18}
                        color={colors.textPrimary as any}
                      />
                    )}
                  </Pressable>
                );
              })}

              <Pressable
                onPress={() => setSortOpen(false)}
                style={({ pressed }) => ({
                  paddingVertical: spacing.sm,
                  alignItems: "center",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={[type.microcopyItalic, { opacity: 0.8 }]}>Close</Text>
              </Pressable>
            </Pressable>
          </View>
        </Modal>

        {/* Actions modal */}
        <Modal
          visible={actionsOpen}
          transparent
          presentationStyle="overFullScreen"
          statusBarTranslucent
          animationType="fade"
          onRequestClose={closeActions}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.55)",
              padding: spacing.xl,
              justifyContent: "flex-end",
            }}
          >
            <Pressable
              onPress={closeActions}
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            />

            <Pressable
              onPress={() => {}}
              style={{
                backgroundColor: colors.surface,
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: colors.divider,
                padding: spacing.lg,
                gap: spacing.md,
                ...shadows.card,
              }}
            >
              <View style={{ gap: 6 }}>
                <Text style={[type.sectionHeader, { fontSize: 16 }]}>
                  Tasting options
                </Text>
                <Text style={[type.microcopyItalic, { opacity: 0.8 }]}>
                  {(activeRow?.whiskey_name ?? "Whiskey").trim() || "Whiskey"}
                </Text>
              </View>

              <View style={{ gap: spacing.sm }}>
                <Pressable
                  onPress={() => {
                    if (!activeRow) return;
                    closeActions();
                    router.push(
                      `/log/cloud-tasting?tastingId=${encodeURIComponent(activeRow.id)}`
                    );
                  }}
                  style={({ pressed }) => ({
                    borderRadius: radii.md,
                    paddingVertical: spacing.lg,
                    alignItems: "center",
                    backgroundColor: colors.accent,
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <Text style={[type.button, { color: colors.background }]}>Edit</Text>
                </Pressable>

                <Pressable
                  onPress={deleteActiveRow}
                  disabled={deleting}
                  style={({ pressed }) => ({
                    borderRadius: radii.md,
                    paddingVertical: spacing.lg,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: colors.divider,
                    backgroundColor: colors.surface,
                    opacity: deleting ? 0.6 : pressed ? 0.9 : 1,
                  })}
                >
                  <Text style={[type.button, { color: colors.accent }]}>
                    {deleting ? "Deleting…" : "Delete"}
                  </Text>
                </Pressable>

                {sameWhiskeyCount >= 2 ? (
                  <Pressable
                    onPress={() => {
                      if (!activeRow) return;
                      const whiskeyLabel =
                        (activeRow.whiskey_name ?? "this whiskey").trim() ||
                        "this whiskey";
                      closeActions();
                      Alert.alert(
                        "Log Again",
                        `Start a new tasting for ${whiskeyLabel}?`,
                        [
                          {
                            text: "Use Previous Ratings",
                            onPress: () =>
                              router.push(
                                `/log/cloud-tasting?templateTastingId=${encodeURIComponent(activeRow.id)}&lockName=1`
                              ),
                          },
                          {
                            text: "Start Fresh",
                            onPress: () =>
                              router.push(
                                `/log/cloud-tasting?whiskeyName=${encodeURIComponent(activeRow.whiskey_name ?? "")}&lockName=1`
                              ),
                          },
                          { text: "Cancel", style: "cancel" },
                        ]
                      );
                    }}
                    style={({ pressed }) => ({
                      borderRadius: radii.md,
                      paddingVertical: spacing.lg,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: colors.divider,
                      backgroundColor: colors.surface,
                      opacity: pressed ? 0.9 : 1,
                    })}
                  >
                    <Text style={[type.button, { color: colors.accent }]}>Log Again</Text>
                  </Pressable>
                ) : null}

                <Pressable
                  onPress={closeActions}
                  disabled={deleting}
                  style={({ pressed }) => ({
                    paddingVertical: spacing.sm,
                    alignItems: "center",
                    opacity: deleting ? 0.6 : pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={[type.microcopyItalic, { opacity: 0.8 }]}>Cancel</Text>
                </Pressable>
              </View>
            </Pressable>
          </View>
        </Modal>
      </View>
    </View>
  );
}
