import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
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

  // Optional future fields (won’t break if missing)
  distillery?: string | null;
  bar_name?: string | null;
  brand?: string | null;
  region?: string | null;
  country?: string | null;
};

type SortMode = "newest" | "high" | "low";

type ListItem =
  | { kind: "header"; key: string }
  | { kind: "results"; key: string };

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

function safeNumber(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
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

  // Sticky header controls
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

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
        .select("id, whiskey_name, rating, created_at")
        .order("created_at", { ascending: false })
        .limit(5000);

      if (error) throw new Error(error.message);

      setRows(Array.isArray(data) ? (data as any) : []);
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

  const stitchedData: ListItem[] = useMemo(() => {
    return [
      { kind: "header", key: "sticky-header" },
      { kind: "results", key: "results-card" },
    ];
  }, []);

  function renderHeader() {
    return (
      <View
        style={{
          padding: spacing.xl,
          paddingBottom: spacing.lg,
          backgroundColor: colors.background,
          gap: spacing.lg,
        }}
      >
        <Card>
          <Text style={[type.sectionHeader, { color: colors.textPrimary }]}>Your Tastings</Text>
          <Text style={[type.microcopyItalic, { opacity: 0.85, color: colors.textPrimary }]}>
            Search, sort, then tap an entry to view or edit it.
          </Text>

          {/* Search */}
          <View
            style={{
              marginTop: spacing.md,
              borderWidth: 1,
              borderColor: colors.divider,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              paddingVertical: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
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

          {/* Sort trigger + count (MODALS REMOVED: trigger disabled for debug build) */}
          <View
            style={{
              marginTop: spacing.md,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: spacing.md,
            }}
          >
            <Pressable
              onPress={() => {}}
              disabled
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
                opacity: 0.55,
              })}
            >
              <Ionicons name="swap-vertical" size={16} color={colors.textPrimary as any} />
              <Text style={[type.body, { fontWeight: "900", color: colors.textPrimary, fontSize: 13 }]}>
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
                {filteredAndSorted.length} / {rows.length}
              </Text>
            ) : null}
          </View>

          {/* Optional: allow switching sort mode without modals (keeps feature alive, still no overlays) */}
          <View style={{ marginTop: spacing.md, flexDirection: "row", gap: spacing.sm }}>
            {(["newest", "high", "low"] as SortMode[]).map((m) => {
              const active = sortMode === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setSortMode(m)}
                  style={({ pressed }) => ({
                    flex: 1,
                    borderRadius: radii.md,
                    paddingVertical: 10,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: colors.divider,
                    backgroundColor: active ? colors.highlight : colors.surface,
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <Text style={[type.body, { fontWeight: "900", color: colors.textPrimary, fontSize: 12 }]}>
                    {m === "newest" ? "Newest" : m === "high" ? "High" : "Low"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {loading ? (
          <Card>
            <View style={{ alignItems: "center", paddingVertical: spacing.sm, gap: spacing.sm }}>
              <ActivityIndicator />
              <Text style={[type.body, { opacity: 0.7, color: colors.textPrimary }]}>Loading…</Text>
            </View>
          </Card>
        ) : null}

        {err ? (
          <Card>
            <Text style={[type.body, { color: colors.accent, opacity: 0.9 }]}>{err}</Text>
          </Card>
        ) : null}
      </View>
    );
  }

  function RowItem({ r, isFirst }: { r: Row; isFirst: boolean }) {
    const nm = (r.whiskey_name ?? "Whiskey").trim() || "Whiskey";
    const ratingNum = safeNumber(r.rating);
    const ratingText = ratingNum == null ? "—" : String(Math.round(ratingNum));
    const dateText = formatDate(r.created_at);

    return (
      <View>
        {!isFirst ? <View style={{ height: 1, backgroundColor: colors.divider }} /> : null}

        <Pressable
          onPress={() => router.push(`/log/cloud-tasting?tastingId=${encodeURIComponent(r.id)}`)}
          // MODALS REMOVED: disable long-press actions for debug build
          onLongPress={() => {}}
          delayLongPress={250}
          style={({ pressed }) => ({
            opacity: pressed ? 0.88 : 1,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.md,
          })}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <Text
              style={[type.body, { fontWeight: "900", color: colors.textPrimary }]}
              numberOfLines={2}
            >
              {nm}
            </Text>

            <Text style={[type.body, { opacity: 0.7, color: colors.textPrimary, fontSize: 12 }]}>
              Rating: <Text style={{ fontWeight: "900" }}>{ratingText}</Text>
              {dateText ? `  •  ${dateText}` : ""}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color={colors.textPrimary as any} />
        </Pressable>
      </View>
    );
  }

  const ResultsCard = useMemo(() => {
    if (loading || err) return null;

    if (filteredAndSorted.length === 0) {
      return (
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }}>
          <Card>
            <Text style={[type.body, { opacity: 0.7, color: colors.textPrimary }]}>
              {search.trim().length ? "No results for that search." : "No tastings yet."}
            </Text>
          </Card>
        </View>
      );
    }

    return (
      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.divider,
            ...shadows.card,
            overflow: "hidden",
          }}
        >
          {filteredAndSorted.map((r, idx) => (
            <RowItem key={r.id} r={r} isFirst={idx === 0} />
          ))}
        </View>
      </View>
    );
  }, [loading, err, filteredAndSorted, search]);

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

      <FlatList
        data={stitchedData}
        keyExtractor={(it) => it.key}
        stickyHeaderIndices={[0]}
        renderItem={({ item }) => {
          if (item.kind === "header") return renderHeader();
          return <>{ResultsCard}</>;
        }}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}