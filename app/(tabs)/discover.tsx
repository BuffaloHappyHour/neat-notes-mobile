import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";

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

        {subtitle ? (
          <Text
            style={[
              type.microcopyItalic,
              {
                opacity: 0.72,
                lineHeight: 18,
              },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
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
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  badgeText?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.divider,
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: pressed ? colors.highlight : "transparent",
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Ionicons name={icon} size={16} color={colors.textPrimary} style={{ opacity: 0.9 }} />
        {badgeText ? (
          <Text style={[type.body, { fontWeight: "900", fontSize: 12 }]}>{badgeText}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Accent divider: small tan nub + long grey line */
function SectionDivider() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginVertical: spacing.md }}>
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
function WhiskeyTile({ row, onPress }: { row: WhiskeyCardRow; onPress: () => void }) {
  const hasCommunity = row.communityCount > 0 && row.communityAvg != null;

  const proofText =
    row.proof != null && Number.isFinite(Number(row.proof)) ? `${Math.round(Number(row.proof))} proof` : null;

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
      })}
    >
      <View style={{ gap: 6 }}>
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
          <Text style={{ fontWeight: "900" }}>{row.bhhScore != null ? Math.round(row.bhhScore) : "—"}</Text>
        </Text>
      </View>
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

          {subtitle ? (
            <Text style={[type.body, { opacity: 0.65, fontSize: 12 }]}>{subtitle}</Text>
          ) : null}
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

function parseMaybeNumber(v: string) {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return n;
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
      proof: w.proof == null || !Number.isFinite(Number(w.proof)) ? null : Number(w.proof),
    });
  });

  // ✅ Community stats source of truth: whiskey_community_stats
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
      .limit(Math.max(300, limit * 20));
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

/** ---------- Screen ---------- */

export default function DiscoverTab() {
  const [loading, setLoading] = useState(false);
  const [statusError, setStatusError] = useState<string>("");

  // Filter state
  const [filterOpen, setFilterOpen] = useState(false);
  const [typePickerOpen, setTypePickerOpen] = useState(false);

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [minProofText, setMinProofText] = useState("");
  const [maxProofText, setMaxProofText] = useState("");

  const minProof = useMemo(() => parseMaybeNumber(minProofText), [minProofText]);
  const maxProof = useMemo(() => parseMaybeNumber(maxProofText), [maxProofText]);

  const [allTypes, setAllTypes] = useState<string[]>([]);

  // RAW section pools (bigger than 5)
  const [trendingPool, setTrendingPool] = useState<WhiskeyCardRow[]>([]);
  const [recentPool, setRecentPool] = useState<WhiskeyCardRow[]>([]);
  const [highestPool, setHighestPool] = useState<WhiskeyCardRow[]>([]);
  const [newestPool, setNewestPool] = useState<WhiskeyCardRow[]>([]);

  // Display (filtered + sliced to 5)
  const [trending, setTrending] = useState<WhiskeyCardRow[]>([]);
  const [recent, setRecent] = useState<WhiskeyCardRow[]>([]);
  const [highest, setHighest] = useState<WhiskeyCardRow[]>([]);
  const [newest, setNewest] = useState<WhiskeyCardRow[]>([]);

  // View All modal
  const [seeAllOpen, setSeeAllOpen] = useState(false);
  const [seeAllTitle, setSeeAllTitle] = useState("");
  const [seeAllRows, setSeeAllRows] = useState<WhiskeyCardRow[]>([]);
  const [seeAllLoading, setSeeAllLoading] = useState(false);
  const [seeAllError, setSeeAllError] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function goWhiskey(id: string) {
    router.push(`/whiskey/${encodeURIComponent(id)}`);
  }

  const filterBadge = useMemo(() => {
    const parts: string[] = [];
    if (selectedType) parts.push(selectedType);
    if (minProof != null || maxProof != null) {
      const a = minProof != null ? `${Math.round(minProof)}` : "—";
      const b = maxProof != null ? `${Math.round(maxProof)}` : "—";
      parts.push(`Proof ${a}-${b}`);
    }
    return parts.join(" • ");
  }, [selectedType, minProof, maxProof]);

  function applyFilters(rows: WhiskeyCardRow[]) {
    let out = [...rows];

    if (selectedType) out = out.filter((r) => r.whiskeyType === selectedType);

    if (minProof != null || maxProof != null) {
      out = out.filter((r) => {
        const p = r.proof;
        if (p == null || !Number.isFinite(Number(p))) return false;
        const pv = Number(p);
        if (minProof != null && pv < minProof) return false;
        if (maxProof != null && pv > maxProof) return false;
        return true;
      });
    }

    return out;
  }

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

  async function loadSectionPools() {
    setLoading(true);
    setStatusError("");

    try {
      const POOL = 30;

      const [trendIdsRaw, recentIdsRaw, highIdsRaw, newestIdsRaw] = await Promise.all([
        fetchSectionIds("TRENDING", POOL),
        fetchSectionIds("RECENT", POOL),
        fetchSectionIds("HIGHEST", POOL),
        fetchSectionIds("NEWEST", POOL),
      ]);

      const fallbackNewest = newestIdsRaw.slice(0, POOL);

      const trendIds = trendIdsRaw.length ? trendIdsRaw : fallbackNewest;
      const recentIds = recentIdsRaw.length ? recentIdsRaw : fallbackNewest;
      const highIds = highIdsRaw.length ? highIdsRaw : fallbackNewest;
      const newestIds = fallbackNewest;

      const [trendCards, recentCards, highCards, newestCards] = await Promise.all([
        fetchWhiskeyCardsByIds(trendIds),
        fetchWhiskeyCardsByIds(recentIds),
        fetchWhiskeyCardsByIds(highIds),
        fetchWhiskeyCardsByIds(newestIds),
      ]);

      setTrendingPool(trendCards);
      setRecentPool(recentCards);
      setHighestPool(highCards);
      setNewestPool(newestCards);
    } catch (e: any) {
      setTrendingPool([]);
      setRecentPool([]);
      setHighestPool([]);
      setNewestPool([]);
      setStatusError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  // reload pools when filter dimensions change
  useEffect(() => {
    loadSectionPools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType, minProofText, maxProofText]);

  // debounced application of filters to the pools
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setTrending(applyFilters(trendingPool).slice(0, 5));
      setRecent(applyFilters(recentPool).slice(0, 5));
      setHighest(applyFilters(highestPool).slice(0, 5));
      setNewest(applyFilters(newestPool).slice(0, 5));
    }, 120);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendingPool, recentPool, highestPool, newestPool, selectedType, minProofText, maxProofText]);

  const libraryEmpty =
    trendingPool.length === 0 && recentPool.length === 0 && highestPool.length === 0 && newestPool.length === 0;

  async function openSeeAll(section: SectionKey) {
    setSeeAllOpen(true);
    setSeeAllError("");
    setSeeAllRows([]);
    setSeeAllLoading(true);

    const title =
      section === "TRENDING"
        ? "Trending"
        : section === "RECENT"
        ? "Recently Reviewed"
        : section === "HIGHEST"
        ? "Highest Rated"
        : "Newest Additions";
    setSeeAllTitle(title);

    try {
      const ids = await fetchSectionIds(section, 60);
      const finalIds = ids.length > 0 ? ids : await fetchSectionIds("NEWEST", 60);

      const cards = await fetchWhiskeyCardsByIds(finalIds);
      const filtered = applyFilters(cards);
      setSeeAllRows(filtered);
    } catch (e: any) {
      setSeeAllError(String(e?.message ?? e));
      setSeeAllRows([]);
    } finally {
      setSeeAllLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: spacing.xl * 2,
          gap: spacing.lg,
        }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        <View style={{ gap: spacing.sm }}>
          <Text style={type.screenTitle}>Discover</Text>
          <Text style={[type.body, { opacity: 0.7 }]}>See what the community is tasting</Text>
        </View>

        <Card
          title="Discover"
          subtitle="Curated lists, refreshed as the community logs."
          rightHeader={
            <IconButton
              icon="options-outline"
              onPress={() => setFilterOpen(true)}
              badgeText={filterBadge ? "Active" : undefined}
            />
          }
        >
          {/* Softer, italic callout to avoid competing with the title/subtitle */}
          <Text style={[type.microcopyItalic, { opacity: 0.78, lineHeight: 20 }]}>
            See what’s new — maybe you’ll find your next favorite dram.
          </Text>

          {filterBadge ? (
            <Text style={[type.body, { marginTop: spacing.sm, opacity: 0.75, fontSize: 12 }]}>
              Filters: {filterBadge}
            </Text>
          ) : null}

          {loading ? (
            <Text style={[type.body, { marginTop: spacing.sm, opacity: 0.65 }]}>Loading…</Text>
          ) : null}

          {statusError ? (
            <Text style={[type.body, { marginTop: spacing.sm, opacity: 0.75 }]}>Error: {statusError}</Text>
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
      </ScrollView>

      {/* View All Modal */}
      <Modal visible={seeAllOpen} transparent animationType="fade" onRequestClose={() => setSeeAllOpen(false)}>
        <Pressable
          onPress={() => setSeeAllOpen(false)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              padding: spacing.lg,
              paddingBottom: spacing.xl * 2,
              marginBottom: spacing.lg,
              borderWidth: 1,
              borderColor: colors.divider,
              ...shadows.card,
              gap: spacing.lg,
              maxHeight: "82%",
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={type.sectionHeader}>{seeAllTitle}</Text>
              <Pressable onPress={() => setSeeAllOpen(false)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <Text style={[type.body, { fontWeight: "900", color: colors.accent }]}>Close</Text>
              </Pressable>
            </View>

            {seeAllLoading ? <Text style={[type.body, { opacity: 0.7 }]}>Loading…</Text> : null}

            {seeAllError ? <Text style={[type.body, { opacity: 0.75 }]}>Error: {seeAllError}</Text> : null}

            <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
              <View style={{ gap: spacing.md }}>
                {seeAllRows.map((r) => (
                  <WhiskeyTile
                    key={`seeall:${r.whiskeyId}`}
                    row={r}
                    onPress={() => {
                      setSeeAllOpen(false);
                      goWhiskey(r.whiskeyId);
                    }}
                  />
                ))}
                {!seeAllLoading && seeAllRows.length === 0 && !seeAllError ? (
                  <Text style={[type.body, { opacity: 0.7 }]}>No results yet.</Text>
                ) : null}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Filters Modal */}
      <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
        <Pressable
          onPress={() => setFilterOpen(false)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              padding: spacing.lg,
              paddingBottom: spacing.xl * 2,
              marginBottom: spacing.lg,
              borderWidth: 1,
              borderColor: colors.divider,
              ...shadows.card,
              gap: spacing.lg,
            }}
          >
            <Text style={type.sectionHeader}>Filters</Text>

            {/* Type dropdown */}
            <View style={{ gap: spacing.sm }}>
              <Text style={[type.body, { fontWeight: "900" }]}>Type</Text>

              <Pressable
                onPress={() => setTypePickerOpen(true)}
                style={({ pressed }) => ({
                  borderWidth: 1,
                  borderColor: colors.divider,
                  borderRadius: radii.md,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  backgroundColor: pressed ? colors.highlight : "transparent",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                })}
              >
                <Text style={[type.body, { opacity: 0.9 }]}>{selectedType ?? "All Types"}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.textPrimary} />
              </Pressable>
            </View>

            {/* Proof Range */}
            <View style={{ gap: spacing.sm }}>
              <Text style={[type.body, { fontWeight: "900" }]}>Proof</Text>

              <View style={{ flexDirection: "row", gap: spacing.md }}>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={[type.body, { opacity: 0.7, fontSize: 12 }]}>Min</Text>
                  <TextInput
                    value={minProofText}
                    onChangeText={(t) => setMinProofText(t.replace(/[^\d.]/g, ""))}
                    placeholder="e.g. 80"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
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
                </View>

                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={[type.body, { opacity: 0.7, fontSize: 12 }]}>Max</Text>
                  <TextInput
                    value={maxProofText}
                    onChangeText={(t) => setMaxProofText(t.replace(/[^\d.]/g, ""))}
                    placeholder="e.g. 120"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
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
                </View>
              </View>

              <Text style={[type.body, { opacity: 0.6, fontSize: 12 }]}>Tip: Leave blank for no min/max.</Text>
            </View>

            {/* Reset / Done */}
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <Pressable
                onPress={() => {
                  setSelectedType(null);
                  setMinProofText("");
                  setMaxProofText("");
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: spacing.lg,
                  borderRadius: radii.md,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: colors.divider,
                  backgroundColor: pressed ? colors.highlight : colors.surface,
                })}
              >
                <Text style={type.button}>Reset</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  const mn = parseMaybeNumber(minProofText);
                  const mx = parseMaybeNumber(maxProofText);
                  if (mn != null && mx != null && mn > mx) {
                    setMinProofText(String(mx));
                    setMaxProofText(String(mn));
                  }
                  Keyboard.dismiss();
                  setFilterOpen(false);
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: spacing.lg,
                  borderRadius: radii.md,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: pressed ? colors.accentPressed : colors.accent,
                })}
              >
                <Text style={[type.button, { color: colors.background }]}>Done</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Type Picker Modal */}
      <Modal
        visible={typePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTypePickerOpen(false)}
      >
        <Pressable
          onPress={() => setTypePickerOpen(false)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              padding: spacing.lg,
              paddingBottom: spacing.xl * 2,
              marginBottom: spacing.lg,
              borderWidth: 1,
              borderColor: colors.divider,
              ...shadows.card,
              gap: spacing.lg,
              maxHeight: "70%",
            }}
          >
            <Text style={type.sectionHeader}>Select Type</Text>

            <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
              <View style={{ gap: 10 }}>
                <Pressable
                  onPress={() => {
                    setSelectedType(null);
                    setTypePickerOpen(false);
                  }}
                  style={({ pressed }) => ({
                    paddingVertical: 12,
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: colors.divider,
                    backgroundColor: !selectedType ? colors.accent : pressed ? colors.highlight : "transparent",
                    paddingHorizontal: 12,
                  })}
                >
                  <Text style={[type.body, { color: !selectedType ? colors.background : colors.textPrimary }]}>
                    All Types
                  </Text>
                </Pressable>

                {allTypes.map((t) => {
                  const active = selectedType === t;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => {
                        setSelectedType(t);
                        setTypePickerOpen(false);
                      }}
                      style={({ pressed }) => ({
                        paddingVertical: 12,
                        borderRadius: radii.md,
                        borderWidth: 1,
                        borderColor: colors.divider,
                        backgroundColor: active ? colors.accent : pressed ? colors.highlight : "transparent",
                        paddingHorizontal: 12,
                      })}
                    >
                      <Text style={[type.body, { color: active ? colors.background : colors.textPrimary }]}>
                        {t}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}