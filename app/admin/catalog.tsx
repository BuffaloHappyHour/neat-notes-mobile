// app/admin/catalog.tsx
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

import { radii } from "../../lib/radii";
import { spacing } from "../../lib/spacing";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

type WhiskeyRow = {
  id: string;
  display_name: string;
  whiskey_type: string | null;
  category: string | null;
  distillery: string | null;
  region: string | null;
  sub_region: string | null;
  proof: number | null;
  age: number | null;
  community_count: number;
  community_avg: number | null;
};

type SortKey =
  | "name_asc"
  | "name_desc"
  | "proof_asc"
  | "proof_desc"
  | "age_asc"
  | "age_desc"
  | "tastings_desc"
  | "tastings_asc"
  | "rating_desc"
  | "rating_asc";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "name_asc", label: "Name A–Z" },
  { key: "name_desc", label: "Name Z–A" },
  { key: "proof_asc", label: "Proof Low–High" },
  { key: "proof_desc", label: "Proof High–Low" },
  { key: "age_asc", label: "Age Low–High" },
  { key: "age_desc", label: "Age High–Low" },
  { key: "tastings_desc", label: "Most Tastings" },
  { key: "tastings_asc", label: "Fewest Tastings" },
  { key: "rating_desc", label: "Highest Rated" },
  { key: "rating_asc", label: "Lowest Rated" },
];

function sortRows(rows: WhiskeyRow[], sortKey: SortKey) {
  const out = [...rows];

  if (sortKey === "name_asc") {
    out.sort((a, b) => a.display_name.localeCompare(b.display_name));
    return out;
  }

  if (sortKey === "name_desc") {
    out.sort((a, b) => b.display_name.localeCompare(a.display_name));
    return out;
  }

  if (sortKey === "proof_asc") {
    out.sort(
      (a, b) =>
        (a.proof ?? Number.POSITIVE_INFINITY) -
        (b.proof ?? Number.POSITIVE_INFINITY)
    );
    return out;
  }

  if (sortKey === "proof_desc") {
    out.sort(
      (a, b) =>
        (b.proof ?? Number.NEGATIVE_INFINITY) -
        (a.proof ?? Number.NEGATIVE_INFINITY)
    );
    return out;
  }

  if (sortKey === "age_asc") {
    out.sort(
      (a, b) =>
        (a.age ?? Number.POSITIVE_INFINITY) -
        (b.age ?? Number.POSITIVE_INFINITY)
    );
    return out;
  }

  if (sortKey === "age_desc") {
    out.sort(
      (a, b) =>
        (b.age ?? Number.NEGATIVE_INFINITY) -
        (a.age ?? Number.NEGATIVE_INFINITY)
    );
    return out;
  }

  if (sortKey === "tastings_desc") {
    out.sort((a, b) => b.community_count - a.community_count);
    return out;
  }

  if (sortKey === "tastings_asc") {
    out.sort((a, b) => a.community_count - b.community_count);
    return out;
  }

  if (sortKey === "rating_desc") {
    out.sort(
      (a, b) =>
        (b.community_avg ?? Number.NEGATIVE_INFINITY) -
        (a.community_avg ?? Number.NEGATIVE_INFINITY)
    );
    return out;
  }

  out.sort(
    (a, b) =>
      (a.community_avg ?? Number.POSITIVE_INFINITY) -
      (b.community_avg ?? Number.POSITIVE_INFINITY)
  );
  return out;
}

function MetaLine({ row }: { row: WhiskeyRow }) {
  const top = [row.whiskey_type, row.category].filter(Boolean).join(" • ");
  const bottom = [row.distillery, row.region, row.sub_region]
    .filter(Boolean)
    .join(" • ");

  return (
    <View style={{ gap: 2 }}>
      <Text style={[type.caption, { color: colors.textSecondary }]}>
        {top || "Whiskey"}
        {row.proof != null ? ` • ${row.proof} proof` : ""}
        {row.age != null ? ` • ${row.age} yr` : ""}
      </Text>

      {bottom ? (
        <Text
          style={[type.caption, { color: colors.textSecondary, opacity: 0.8 }]}
        >
          {bottom}
        </Text>
      ) : null}

      <Text style={[type.caption, { color: colors.textSecondary, opacity: 0.9 }]}>
        {row.community_count} tastings
        {row.community_avg != null ? ` • ${row.community_avg.toFixed(1)} avg` : ""}
      </Text>
    </View>
  );
}

function mapWhiskeyRows(data: any[]): WhiskeyRow[] {
  return data.map((row) => {
    const stats = Array.isArray(row.whiskey_community_stats)
      ? row.whiskey_community_stats[0]
      : row.whiskey_community_stats;

    return {
      id: String(row.id),
      display_name: String(row.display_name ?? "Whiskey"),
      whiskey_type: row.whiskey_type ? String(row.whiskey_type) : null,
      category: row.category ? String(row.category) : null,
      distillery: row.distillery ? String(row.distillery) : null,
      region: row.region ? String(row.region) : null,
      sub_region: row.sub_region ? String(row.sub_region) : null,
      proof:
        row.proof == null || !Number.isFinite(Number(row.proof))
          ? null
          : Number(row.proof),
      age:
        row.age == null || !Number.isFinite(Number(row.age))
          ? null
          : Number(row.age),
      community_count:
        stats?.community_count == null || !Number.isFinite(Number(stats.community_count))
          ? 0
          : Number(stats.community_count),
      community_avg:
        stats?.community_avg == null || !Number.isFinite(Number(stats.community_avg))
          ? null
          : Number(stats.community_avg),
    };
  });
}

function mapStatsRows(data: any[]): WhiskeyRow[] {
  return data
    .map((row) => {
      const whiskey = Array.isArray(row.whiskey) ? row.whiskey[0] : row.whiskey;
      if (!whiskey) return null;

      return {
        id: String(whiskey.id),
        display_name: String(whiskey.display_name ?? "Whiskey"),
        whiskey_type: whiskey.whiskey_type ? String(whiskey.whiskey_type) : null,
        category: whiskey.category ? String(whiskey.category) : null,
        distillery: whiskey.distillery ? String(whiskey.distillery) : null,
        region: whiskey.region ? String(whiskey.region) : null,
        sub_region: whiskey.sub_region ? String(whiskey.sub_region) : null,
        proof:
          whiskey.proof == null || !Number.isFinite(Number(whiskey.proof))
            ? null
            : Number(whiskey.proof),
        age:
          whiskey.age == null || !Number.isFinite(Number(whiskey.age))
            ? null
            : Number(whiskey.age),
        community_count:
          row.community_count == null || !Number.isFinite(Number(row.community_count))
            ? 0
            : Number(row.community_count),
        community_avg:
          row.community_avg == null || !Number.isFinite(Number(row.community_avg))
            ? null
            : Number(row.community_avg),
      } as WhiskeyRow;
    })
    .filter(Boolean) as WhiskeyRow[];
}

export default function AdminCatalogScreen() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<WhiskeyRow[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("tastings_desc");
  const [featuringId, setFeaturingId] = useState<string | null>(null);
  const [featureDraft, setFeatureDraft] = useState<WhiskeyRow | null>(null);
const [featureStartDate, setFeatureStartDate] = useState("");
const [featureEndDate, setFeatureEndDate] = useState("");
const [featureNote, setFeatureNote] = useState("");

  async function loadWhiskeys(q: string, sort: SortKey) {
    setLoading(true);

    const trimmed = q.trim();

    if (trimmed.length > 0) {
      const { data, error } = await supabase
        .from("whiskeys")
        .select(
          `
          id,
          display_name,
          whiskey_type,
          category,
          distillery,
          region,
          sub_region,
          proof,
          age,
          whiskey_community_stats (
            community_count,
            community_avg
          )
        `
        )
        .ilike("display_name", `%${trimmed}%`)
        .limit(200);

      if (!error && data) {
        setRows(sortRows(mapWhiskeyRows(data as any[]), sort));
      } else {
        setRows([]);
      }

      setLoading(false);
      return;
    }

    if (
      sort === "tastings_desc" ||
      sort === "tastings_asc" ||
      sort === "rating_desc" ||
      sort === "rating_asc"
    ) {
      const orderColumn =
        sort === "tastings_desc" || sort === "tastings_asc"
          ? "community_count"
          : "community_avg";

      const ascending = sort === "tastings_asc" || sort === "rating_asc";

      const { data, error } = await supabase
        .from("whiskey_community_stats")
        .select(
          `
          community_count,
          community_avg,
          whiskey:whiskeys!inner (
            id,
            display_name,
            whiskey_type,
            category,
            distillery,
            region,
            sub_region,
            proof,
            age
          )
        `
        )
        .order(orderColumn, { ascending })
        .limit(200);

      if (!error && data) {
        setRows(mapStatsRows(data as any[]));
      } else {
        setRows([]);
      }

      setLoading(false);
      return;
    }

    let request = supabase
      .from("whiskeys")
      .select(
        `
        id,
        display_name,
        whiskey_type,
        category,
        distillery,
        region,
        sub_region,
        proof,
        age,
        whiskey_community_stats (
          community_count,
          community_avg
        )
      `
      )
      .limit(200);

    if (sort === "name_asc") {
      request = request.order("display_name", { ascending: true });
    } else if (sort === "name_desc") {
      request = request.order("display_name", { ascending: false });
    } else if (sort === "proof_asc") {
      request = request.order("proof", { ascending: true });
    } else if (sort === "proof_desc") {
      request = request.order("proof", { ascending: false });
    } else if (sort === "age_asc") {
      request = request.order("age", { ascending: true });
    } else if (sort === "age_desc") {
      request = request.order("age", { ascending: false });
    }

    const { data, error } = await request;

    if (!error && data) {
      setRows(mapWhiskeyRows(data as any[]));
    } else {
      setRows([]);
    }

    setLoading(false);
  }

  async function setFeaturedBottle(row: WhiskeyRow) {
  if (!featureStartDate || !featureEndDate) {
    Alert.alert("Please enter both a start date and end date.");
    return;
  }

  const startIso = `${featureStartDate}T00:00:00.000Z`;
  const endIso = `${featureEndDate}T23:59:59.999Z`;

  if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
    Alert.alert("End date must be after start date.");
    return;
  }

  setFeaturingId(row.id);

  const { error } = await supabase.rpc("admin_set_featured_whiskey", {
    p_whiskey_id: row.id,
    p_start_date: startIso,
    p_end_date: endIso,
    p_feature_note: featureNote.trim() ? featureNote.trim() : null,
  });

  setFeaturingId(null);

  if (error) {
    console.log("featured rpc error", error);
    Alert.alert("Could not set featured bottle.", error.message);
    return;
  }

  setFeatureDraft(null);
  setFeatureStartDate("");
  setFeatureEndDate("");
  setFeatureNote("");

  Alert.alert("Featured bottle updated", row.display_name);
}

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadWhiskeys(query, sortKey);
    }, 250);

    return () => clearTimeout(timeout);
  }, [query, sortKey]);

  const listEmptyText = useMemo(() => {
    return query.trim().length > 0 ? "No results." : "No whiskies found.";
  }, [query]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        padding: spacing.xl,
        gap: spacing.md,
      }}
    >
      <Text style={[type.screenTitle, { color: colors.textPrimary }]}>
        Catalog
      </Text>

      <TextInput
        placeholder="Search whiskey..."
        placeholderTextColor={colors.textSecondary}
        value={query}
        onChangeText={setQuery}
        style={{
          borderWidth: 1,
          borderColor: colors.divider,
          borderRadius: radii.lg,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          color: colors.textPrimary,
        }}
      />

      <View style={{ gap: spacing.xs }}>
        <Text style={[type.caption, { color: colors.textSecondary }]}>
          Sort by
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            {SORT_OPTIONS.map((opt) => {
              const active = opt.key === sortKey;

              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setSortKey(opt.key)}
                  style={({ pressed }) => ({
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: active ? colors.accent : colors.divider,
                    backgroundColor: active
                      ? "rgba(190, 150, 99, 0.10)"
                      : colors.surface,
                    opacity: pressed ? 0.92 : 1,
                  })}
                >
                  <Text
                    style={[
                      type.caption,
                      {
                        color: active ? colors.accent : colors.textPrimary,
                        fontWeight: active ? "700" : "400",
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
{featureDraft ? (
  <View
    style={{
      padding: spacing.md,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: "rgba(190, 150, 99, 0.34)",
      backgroundColor: "rgba(190, 150, 99, 0.06)",
      gap: spacing.sm,
    }}
  >
    <Text style={[type.sectionHeader, { color: colors.textPrimary }]}>
      Set Featured Bottle
    </Text>

    <Text style={[type.body, { color: colors.textPrimary }]}>
      {featureDraft.display_name}
    </Text>

    <TextInput
      placeholder="Start date (YYYY-MM-DD)"
      placeholderTextColor={colors.textSecondary}
      value={featureStartDate}
      onChangeText={setFeatureStartDate}
      style={{
        borderWidth: 1,
        borderColor: colors.divider,
        borderRadius: radii.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        color: colors.textPrimary,
        backgroundColor: colors.surface,
      }}
    />

    <TextInput
      placeholder="End date (YYYY-MM-DD)"
      placeholderTextColor={colors.textSecondary}
      value={featureEndDate}
      onChangeText={setFeatureEndDate}
      style={{
        borderWidth: 1,
        borderColor: colors.divider,
        borderRadius: radii.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        color: colors.textPrimary,
        backgroundColor: colors.surface,
      }}
    />

    <TextInput
      placeholder="Why is this featured?"
      placeholderTextColor={colors.textSecondary}
      value={featureNote}
      onChangeText={setFeatureNote}
      multiline
      style={{
        borderWidth: 1,
        borderColor: colors.divider,
        borderRadius: radii.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        color: colors.textPrimary,
        backgroundColor: colors.surface,
        minHeight: 88,
        textAlignVertical: "top",
      }}
    />

    <View style={{ flexDirection: "row", gap: spacing.sm }}>
      <Pressable
        onPress={() => {
          setFeatureDraft(null);
          setFeatureStartDate("");
          setFeatureEndDate("");
          setFeatureNote("");
        }}
        style={{
          flex: 1,
          paddingVertical: 12,
          borderRadius: 999,
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.divider,
          backgroundColor: colors.surface,
        }}
      >
        <Text style={[type.caption, { color: colors.textPrimary }]}>Cancel</Text>
      </Pressable>

      <Pressable
        onPress={() => {
          if (featureDraft) {
            setFeaturedBottle(featureDraft);
          }
        }}
        style={{
          flex: 1,
          paddingVertical: 12,
          borderRadius: 999,
          alignItems: "center",
          borderWidth: 1,
          borderColor: "rgba(190, 150, 99, 0.34)",
          backgroundColor: "rgba(190, 150, 99, 0.10)",
        }}
      >
        <Text style={[type.caption, { color: colors.accent, fontWeight: "700" }]}>
          Save Featured
        </Text>
      </Pressable>
    </View>
  </View>
) : null}
      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View
              style={{
                padding: spacing.md,
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: colors.divider,
                backgroundColor: colors.surface,
                marginBottom: spacing.sm,
                gap: 10,
              }}
            >
              <Pressable
                onPress={() => router.push(`/whiskey/${encodeURIComponent(item.id)}`)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.92 : 1,
                  gap: 6,
                })}
              >
                <Text style={[type.body, { color: colors.textPrimary }]}>
                  {item.display_name}
                </Text>

                <MetaLine row={item} />
              </Pressable>

              <Pressable
                onPress={() => {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + 7);

  setFeatureDraft(item);
  setFeatureStartDate(now.toISOString().slice(0, 10));
  setFeatureEndDate(end.toISOString().slice(0, 10));
  setFeatureNote("");
}}
                disabled={featuringId === item.id}
                style={({ pressed }) => ({
                  alignSelf: "flex-start",
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: "rgba(190, 150, 99, 0.34)",
                  backgroundColor: "rgba(190, 150, 99, 0.10)",
                  opacity: featuringId === item.id ? 0.7 : pressed ? 0.92 : 1,
                })}
              >
                <Text
                  style={[
                    type.caption,
                    {
                      color: colors.accent,
                      fontWeight: "700",
                    },
                  ]}
                >
                  {featuringId === item.id ? "Setting..." : "Feature"}
                </Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <Text style={[type.caption, { color: colors.textSecondary }]}>
              {listEmptyText}
            </Text>
          }
        />
      )}
    </View>
  );
}