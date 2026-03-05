import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { supabase } from "../../lib/supabase";

import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

/** ---------- Types ---------- */

type WhiskeyCardRow = {
  whiskeyId: string; // UUID
  whiskeyName: string;
  whiskeyType: string | null;
  proof: number | null;

  communityAvg: number | null;
  communityCount: number;

  bhhScore: number | null;
};

type SectionKey = "TRENDING" | "RECENT" | "HIGHEST" | "NEWEST";

/** ---------- UI Helpers ---------- */

function Card({
  title,
  subtitle,
  rightHeader,
  children,
}: {
  title: string;
  subtitle?: string;
  rightHeader?: React.ReactNode;
  children: React.ReactNode;
}) {
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
      <View style={{ gap: 6 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.md,
          }}
        >
          <Text style={type.sectionHeader}>{title}</Text>
          {rightHeader ? rightHeader : null}
        </View>

        {subtitle ? <Text style={[type.body, { opacity: 0.7 }]}>{subtitle}</Text> : null}
      </View>

      {children}
    </View>
  );
}

/** Small icon control */
function IconButton({
  icon,
  onPress,
  badgeText,
  disabled,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  badgeText?: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!!disabled}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderWidth: 1,
        borderColor: colors.divider,
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: pressed ? colors.highlight : "transparent",
        opacity: disabled ? 0.45 : pressed ? 0.92 : 1,
      })}
    >
      <Ionicons name={icon} size={16} color={colors.textPrimary} style={{ opacity: 0.9 }} />
      {badgeText ? (
        <Text style={[type.body, { fontWeight: "900", fontSize: 12 }]}>{badgeText}</Text>
      ) : null}
    </Pressable>
  );
}

/** Accent divider: small tan nub + long grey line */
function SectionDivider() {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginVertical: spacing.md,
      }}
    >
      <View
        style={{
          width: 26,
          height: 2,
          borderRadius: 1,
          backgroundColor: colors.accent,
          opacity: 0.95,
        }}
      />
      <View
        style={{
          flex: 1,
          height: 1,
          marginLeft: 10,
          backgroundColor: colors.divider,
          opacity: 0.6,
        }}
      />
    </View>
  );
}

/** Compact 3-line whiskey tile */
function WhiskeyTile({
  row,
  onPress,
}: {
  row: WhiskeyCardRow;
  onPress: () => void;
}) {
  const hasCommunity = row.communityCount > 0 && row.communityAvg != null;

  const proofText =
    row.proof != null && Number.isFinite(Number(row.proof))
      ? `${Math.round(Number(row.proof))} proof`
      : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 220,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.divider,
        borderRadius: radii.lg,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        opacity: pressed ? 0.9 : 1,
        ...shadows.card,
        gap: 6,
      })}
    >
      <Text style={[type.body, { fontWeight: "900", fontSize: 15 }]} numberOfLines={1}>
        {row.whiskeyName}
      </Text>

      <Text style={[type.body, { opacity: 0.75, fontSize: 12 }]} numberOfLines={1}>
        {row.whiskeyType ?? "—"}
        {proofText ? ` • ${proofText}` : ""}
      </Text>

      <Text style={[type.body, { opacity: 0.8, fontSize: 12 }]} numberOfLines={1}>
        Community:{" "}
        <Text style={{ fontWeight: "900" }}>{hasCommunity ? row.communityAvg?.toFixed(1) : "—"}</Text>
        {"  •  "}
        BHH:{" "}
        <Text style={{ fontWeight: "900" }}>
          {row.bhhScore != null ? Math.round(row.bhhScore) : "—"}
        </Text>
      </Text>
    </Pressable>
  );
}

function SectionRow({
  title,
  subtitle,
  rows,
  onSeeAll,
  onPressRow,
  emptyMessage,
}: {
  title: string;
  subtitle?: string;
  rows: WhiskeyCardRow[];
  onSeeAll: () => void;
  onPressRow: (r: WhiskeyCardRow) => void;
  emptyMessage?: string;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: spacing.md,
        }}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: colors.accent,
                opacity: 0.95,
              }}
            />
            <Text style={[type.sectionHeader, { fontSize: 18 }]}>{title}</Text>
          </View>

          {subtitle ? <Text style={[type.body, { opacity: 0.65, fontSize: 12 }]}>{subtitle}</Text> : null}
        </View>

        <Pressable onPress={onSeeAll} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <Text style={[type.body, { fontWeight: "900", fontSize: 12, color: colors.accent }]}>
            View All
          </Text>
        </Pressable>
      </View>

      {rows.length === 0 ? (
        <Text style={[type.body, { opacity: 0.65 }]}>{emptyMessage ?? "Nothing here yet."}</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: spacing.md, paddingVertical: 2 }}>
            {rows.map((r) => (
              <WhiskeyTile key={r.whiskeyId} row={r} onPress={() => onPressRow(r)} />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

/** ---------- Data Helpers ---------- */

function isUuidLike(id: string) {
  return typeof id === "string" && id.length === 36 && id.includes("-");
}

async function fetchWhiskeyCardsByIds(idsInOrder: string[]): Promise<WhiskeyCardRow[]> {
  const ids = idsInOrder.filter(isUuidLike);
  if (ids.length === 0) return [];

  const { data: wData, error: wErr } = await supabase
    .from("whiskeys")
    .select("id, display_name, whiskey_type, proof")
    .in("id", ids);

  if (wErr) throw new Error(wErr.message);

  const whiskeyMap = new Map<string, { name: string; wType: string | null; proof: number | null }>();

  (wData as any[]).forEach((w) => {
    const id = String(w.id);
    whiskeyMap.set(id, {
      name: String(w.display_name ?? "Whiskey"),
      wType: w.whiskey_type ? String(w.whiskey_type) : null,
      proof:
        w.proof == null || !Number.isFinite(Number(w.proof)) ? null : Number(w.proof),
    });
  });

  const { data: cData, error: cErr } = await supabase
    .from("whiskey_community_stats")
    .select("whiskey_id, community_avg, community_count")
    .in("whiskey_id", ids);

  if (cErr) throw new Error(cErr.message);

  const communityMap = new Map<string, { avg: number | null; count: number }>();
  (cData as any[]).forEach((c) => {
    const id = String(c.whiskey_id);
    const avg =
      c.community_avg == null || !Number.isFinite(Number(c.community_avg)) ? null : Number(c.community_avg);
    const count =
      c.community_count == null || !Number.isFinite(Number(c.community_count)) ? 0 : Number(c.community_count);
    communityMap.set(id, { avg, count });
  });

  const { data: bData, error: bErr } = await supabase
    .from("bhh_reviews")
    .select("whiskey_id, rating_100, published_at")
    .in("whiskey_id", ids)
    .limit(2000);

  if (bErr) throw new Error(bErr.message);

  const bhhMap = new Map<string, { score: number | null; publishedAt: number }>();
  (bData as any[]).forEach((b) => {
    const id = b.whiskey_id ? String(b.whiskey_id) : "";
    if (!id) return;

    const score =
      b.rating_100 == null || !Number.isFinite(Number(b.rating_100)) ? null : Number(b.rating_100);

    const pub = b.published_at ? Date.parse(String(b.published_at)) : 0;

    const existing = bhhMap.get(id);
    if (!existing) {
      bhhMap.set(id, { score, publishedAt: pub });
      return;
    }

    const exScore = existing.score ?? -Infinity;
    const newScore = score ?? -Infinity;

    if (newScore > exScore) {
      bhhMap.set(id, { score, publishedAt: pub });
      return;
    }
    if (newScore === exScore && pub > existing.publishedAt) {
      bhhMap.set(id, { score, publishedAt: pub });
    }
  });

  const out: WhiskeyCardRow[] = [];
  idsInOrder.forEach((id) => {
    if (!isUuidLike(id)) return;
    const w = whiskeyMap.get(id);
    if (!w) return;

    const c = communityMap.get(id);
    const b = bhhMap.get(id);

    out.push({
      whiskeyId: id,
      whiskeyName: w.name,
      whiskeyType: w.wType,
      proof: w.proof,
      communityAvg: c?.avg ?? null,
      communityCount: c?.count ?? 0,
      bhhScore: b?.score ?? null,
    });
  });

  return out;
}

function pickUniqueIds(ids: string[], take: number, used: Set<string>): string[] {
  const out: string[] = [];
  for (const id of ids) {
    if (!isUuidLike(id)) continue;
    if (used.has(id)) continue;
    used.add(id);
    out.push(id);
    if (out.length >= take) break;
  }
  return out;
}

/** ---------- Screen ---------- */

export default function DiscoverTab() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusError, setStatusError] = useState<string>("");

  // Filters disabled for "no modals" debug build
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [minProofText, setMinProofText] = useState("");
  const [maxProofText, setMaxProofText] = useState("");

  const [allTypes, setAllTypes] = useState<string[]>([]);

  // Section data
  const [trending, setTrending] = useState<WhiskeyCardRow[]>([]);
  const [recent, setRecent] = useState<WhiskeyCardRow[]>([]);
  const [highest, setHighest] = useState<WhiskeyCardRow[]>([]);
  const [newest, setNewest] = useState<WhiskeyCardRow[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function goWhiskey(id: string) {
    router.push(`/whiskey/${encodeURIComponent(id)}`);
  }

  const filterBadge = useMemo(() => {
    // Keep badge off for debug build (filters disabled)
    return "";
  }, []);

  async function loadTypes() {
    try {
      const { data, error } = await supabase.from("whiskeys").select("whiskey_type").limit(3000);
      if (error) throw new Error(error.message);

      const set = new Set<string>();
      (data as any[]).forEach((r) => {
        const t = r.whiskey_type ? String(r.whiskey_type).trim() : "";
        if (t) set.add(t);
      });

      setAllTypes(Array.from(set).sort((a, b) => a.localeCompare(b)));
    } catch {
      setAllTypes([]);
    }
  }

  useEffect(() => {
    loadTypes();
  }, []);

  async function fetchSectionIds(section: SectionKey, limit: number): Promise<string[]> {
    if (section === "NEWEST") {
      const { data, error } = await supabase
        .from("whiskeys")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return (data as any[]).map((w) => String(w.id)).filter(isUuidLike);
    }

    if (section === "HIGHEST") {
      const MIN_COUNT = 3;
      const { data, error } = await supabase
        .from("whiskey_community_stats")
        .select("whiskey_id, community_avg, community_count")
        .gte("community_count", MIN_COUNT)
        .order("community_avg", { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return (data as any[]).map((r) => String(r.whiskey_id)).filter(isUuidLike);
    }

    if (section === "RECENT") {
      const { data, error } = await supabase
        .from("tastings")
        .select("whiskey_id, created_at")
        .order("created_at", { ascending: false })
        .limit(Math.max(200, limit * 20));
      if (error) throw new Error(error.message);

      const ids: string[] = [];
      const seen = new Set<string>();
      (data as any[]).forEach((t) => {
        const id = t.whiskey_id ? String(t.whiskey_id) : "";
        if (!isUuidLike(id)) return;
        if (seen.has(id)) return;
        seen.add(id);
        ids.push(id);
      });

      return ids.slice(0, limit);
    }

    // TRENDING
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("tastings")
      .select("whiskey_id, created_at")
      .gte("created_at", since)
      .limit(5000);

    if (error) throw new Error(error.message);

    const counts = new Map<string, number>();
    (data as any[]).forEach((t) => {
      const id = t.whiskey_id ? String(t.whiskey_id) : "";
      if (!isUuidLike(id)) return;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);
  }

  function applyFilters(rows: WhiskeyCardRow[]) {
    // For this debug build, only apply search term (no modal-driven filters)
    let out = [...rows];
    const term = q.trim().toLowerCase();
    if (term.length >= 2) {
      out = out.filter((r) => r.whiskeyName.toLowerCase().includes(term));
    }
    return out;
  }

  async function loadSections() {
    setLoading(true);
    setStatusError("");

    try {
      const [trendIdsRaw, recentIdsRaw, highIdsRaw, newestIdsRaw] = await Promise.all([
        fetchSectionIds("TRENDING", 50),
        fetchSectionIds("RECENT", 50),
        fetchSectionIds("HIGHEST", 50),
        fetchSectionIds("NEWEST", 50),
      ]);

      const fallbackNewest = newestIdsRaw.slice(0, 50);

      const trendIds = trendIdsRaw.length ? trendIdsRaw : fallbackNewest;
      const recentIds = recentIdsRaw.length ? recentIdsRaw : fallbackNewest;
      const highIds = highIdsRaw.length ? highIdsRaw : fallbackNewest;
      const newestIds = fallbackNewest;

      const used = new Set<string>();
      const trendPick = pickUniqueIds(trendIds, 5, used);
      const recentPick = pickUniqueIds(recentIds, 5, used);
      const highPick = pickUniqueIds(highIds, 5, used);
      const newestPick = pickUniqueIds(newestIds, 5, used);

      const [trendCards, recentCards, highCards, newestCards] = await Promise.all([
        fetchWhiskeyCardsByIds(trendPick),
        fetchWhiskeyCardsByIds(recentPick),
        fetchWhiskeyCardsByIds(highPick),
        fetchWhiskeyCardsByIds(newestPick),
      ]);

      setTrending(applyFilters(trendCards));
      setRecent(applyFilters(recentCards));
      setHighest(applyFilters(highCards));
      setNewest(applyFilters(newestCards));
    } catch (e: any) {
      setTrending([]);
      setRecent([]);
      setHighest([]);
      setNewest([]);
      setStatusError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadSections(), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const libraryEmpty =
    trending.length === 0 && recent.length === 0 && highest.length === 0 && newest.length === 0;

  function openSeeAll(_section: SectionKey) {
    // MODALS REMOVED: no View All overlay in debug build.
    // If you have a dedicated list screen, route there here.
    // For now: no-op.
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.xl, gap: spacing.lg }}>
        <View style={{ gap: spacing.sm }}>
          <Text style={type.screenTitle}>Discover</Text>
          <Text style={[type.body, { opacity: 0.7 }]}>See what the community is tasting</Text>
        </View>

        <Card
          title="Search"
          subtitle="Find a bottle from the library."
          rightHeader={
            <IconButton
              icon="options-outline"
              onPress={() => {}}
              badgeText={filterBadge ? "Active" : undefined}
              disabled
            />
          }
        >
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search bottles…"
            placeholderTextColor={colors.textSecondary}
            autoCorrect={false}
            style={{
              borderWidth: 1,
              borderColor: colors.divider,
              borderRadius: radii.md,
              padding: 12,
              backgroundColor: "transparent",
              color: colors.textPrimary,
              fontFamily: type.body.fontFamily,
            }}
          />

          {loading ? (
            <Text style={[type.body, { marginTop: spacing.sm, opacity: 0.65 }]}>Loading…</Text>
          ) : null}

          {statusError ? (
            <Text style={[type.body, { marginTop: spacing.sm, opacity: 0.75 }]}>
              Error: {statusError}
            </Text>
          ) : null}
        </Card>

        <SectionRow
          title="Trending"
          subtitle="Most tasted in the last 7 days."
          rows={trending}
          onSeeAll={() => openSeeAll("TRENDING")}
          onPressRow={(r) => goWhiskey(r.whiskeyId)}
          emptyMessage={libraryEmpty ? "No results." : "No matches for your filters."}
        />

        <SectionDivider />

        <SectionRow
          title="Recently Reviewed"
          subtitle="Latest community tastings."
          rows={recent}
          onSeeAll={() => openSeeAll("RECENT")}
          onPressRow={(r) => goWhiskey(r.whiskeyId)}
          emptyMessage={libraryEmpty ? "No results." : "No matches for your filters."}
        />

        <SectionDivider />

        <SectionRow
          title="Highest Rated"
          subtitle="Top community averages (min review threshold)."
          rows={highest}
          onSeeAll={() => openSeeAll("HIGHEST")}
          onPressRow={(r) => goWhiskey(r.whiskeyId)}
          emptyMessage={libraryEmpty ? "No results." : "No matches for your filters."}
        />

        <SectionDivider />

        <SectionRow
          title="Newest Additions"
          subtitle="Fresh additions to the library."
          rows={newest}
          onSeeAll={() => openSeeAll("NEWEST")}
          onPressRow={(r) => goWhiskey(r.whiskeyId)}
          emptyMessage={libraryEmpty ? "No results." : "No matches for your filters."}
        />

        <View style={{ marginTop: spacing.lg, paddingTop: spacing.lg }}>
          <Text style={[type.body, { opacity: 0.6, fontSize: 12, textAlign: "center" }]}>
            Powered by community tastings and Buffalo Happy Hour reviews
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}