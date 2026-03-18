import { router } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

type WhiskeySearchRow = {
  id: string;
  display_name: string | null;
  whiskey_canonical: string | null;
  distillery: string | null;
  is_active: boolean | null;
};

export default function AdminMergeWhiskeysScreen() {
  const [sourceSearch, setSourceSearch] = useState("");
  const [targetSearch, setTargetSearch] = useState("");

  const [sourceResults, setSourceResults] = useState<WhiskeySearchRow[]>([]);
  const [targetResults, setTargetResults] = useState<WhiskeySearchRow[]>([]);

  const [sourceWhiskey, setSourceWhiskey] = useState<WhiskeySearchRow | null>(null);
  const [targetWhiskey, setTargetWhiskey] = useState<WhiskeySearchRow | null>(null);

  const [loadingSource, setLoadingSource] = useState(false);
  const [loadingTarget, setLoadingTarget] = useState(false);
  const [merging, setMerging] = useState(false);

  async function searchWhiskeys(
    q: string,
    setLoading: (v: boolean) => void,
    setResults: (rows: WhiskeySearchRow[]) => void
  ) {
    const term = q.trim();

    if (term.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("whiskeys")
        .select("id, display_name, whiskey_canonical, distillery, is_active")
        .eq("is_active", true)
        .or(`display_name.ilike.%${term}%,whiskey_canonical.ilike.%${term}%`)
        .order("display_name", { ascending: true })
        .limit(10);

      if (error) throw error;

      setResults((Array.isArray(data) ? data : []) as WhiskeySearchRow[]);
    } catch (e) {
      console.error("searchWhiskeys failed", e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchWhiskeys(sourceSearch, setLoadingSource, setSourceResults);
    }, 250);

    return () => clearTimeout(timeout);
  }, [sourceSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchWhiskeys(targetSearch, setLoadingTarget, setTargetResults);
    }, 250);

    return () => clearTimeout(timeout);
  }, [targetSearch]);

  async function mergeWhiskeys() {
    if (!sourceWhiskey?.id || !targetWhiskey?.id) {
      Alert.alert("Missing selection", "Please choose both a source whiskey and a target whiskey.");
      return;
    }

    if (sourceWhiskey.id === targetWhiskey.id) {
      Alert.alert("Invalid merge", "You cannot merge a whiskey into itself.");
      return;
    }

    Alert.alert(
      "Merge whiskeys?",
      `Retire "${sourceWhiskey.display_name ?? sourceWhiskey.whiskey_canonical}" and merge it into "${targetWhiskey.display_name ?? targetWhiskey.whiskey_canonical}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Merge",
          style: "destructive",
          onPress: async () => {
            try {
              setMerging(true);

              const { error } = await supabase.rpc("admin_merge_whiskeys", {
                p_source_id: sourceWhiskey.id,
                p_target_id: targetWhiskey.id,
              });

              if (error) throw error;

              Alert.alert("Merged", "Whiskeys merged successfully.");

              setSourceWhiskey(null);
              setTargetWhiskey(null);
              setSourceSearch("");
              setTargetSearch("");
              setSourceResults([]);
              setTargetResults([]);
            } catch (e: any) {
              Alert.alert("Merge failed", e?.message ?? "Unknown error");
            } finally {
              setMerging(false);
            }
          },
        },
      ]
    );
  }

  function SearchBlock({
    title,
    value,
    onChangeText,
    loading,
    results,
    selected,
    onSelect,
    onClear,
    placeholder,
  }: {
    title: string;
    value: string;
    onChangeText: (v: string) => void;
    loading: boolean;
    results: WhiskeySearchRow[];
    selected: WhiskeySearchRow | null;
    onSelect: (row: WhiskeySearchRow) => void;
    onClear: () => void;
    placeholder: string;
  }) {
    return (
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.divider,
          padding: spacing.lg,
          ...shadows.card,
          gap: spacing.sm,
        }}
      >
        <Text style={{ ...type.sectionHeader, color: colors.textPrimary }}>{title}</Text>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          style={{
            backgroundColor: colors.background,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.divider,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            ...type.body,
            color: colors.textPrimary,
          }}
        />

        {loading ? <ActivityIndicator size="small" /> : null}

        {selected ? (
          <View
            style={{
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: colors.divider,
              backgroundColor: colors.highlight,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              gap: 4,
            }}
          >
            <Text style={[type.body, { color: colors.textPrimary, fontWeight: "800" }]}>
              {selected.display_name ?? selected.whiskey_canonical ?? "Selected whiskey"}
            </Text>

            {selected.distillery ? (
              <Text style={[type.microcopyItalic, { color: colors.textSecondary }]}>
                {selected.distillery}
              </Text>
            ) : null}

            {selected.whiskey_canonical ? (
              <Text style={[type.microcopyItalic, { color: colors.textSecondary, opacity: 0.8 }]}>
                {selected.whiskey_canonical}
              </Text>
            ) : null}

            <Pressable onPress={onClear} style={{ marginTop: 4 }}>
              <Text style={[type.button, { color: colors.textSecondary }]}>Clear</Text>
            </Pressable>
          </View>
        ) : null}

        {!selected
          ? results.map((row) => {
              const sub = [row.display_name, row.distillery].filter(Boolean).join(" • ");
              return (
                <Pressable
                  key={row.id}
                  onPress={() => onSelect(row)}
                  style={({ pressed }) => ({
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: colors.divider,
                    backgroundColor: pressed ? colors.highlight : colors.surface,
                  })}
                >
                  <Text style={[type.body, { color: colors.textPrimary, fontWeight: "800" }]}>
                    {row.display_name ?? row.whiskey_canonical ?? row.id}
                  </Text>

                  {sub ? (
                    <Text style={[type.microcopyItalic, { color: colors.textSecondary }]}>
                      {sub}
                    </Text>
                  ) : null}

                  {row.whiskey_canonical ? (
                    <Text style={[type.microcopyItalic, { color: colors.textSecondary, opacity: 0.8 }]}>
                      {row.whiskey_canonical}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })
          : null}
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          padding: spacing.lg,
          gap: spacing.md,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Pressable onPress={() => router.back()} style={{ padding: spacing.xs }}>
            <Text style={{ ...type.button, color: colors.textPrimary }}>Back</Text>
          </Pressable>
        </View>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.divider,
            padding: spacing.lg,
            ...shadows.card,
            gap: spacing.sm,
          }}
        >
          <Text style={{ ...type.screenTitle, color: colors.textPrimary }}>
            Merge Whiskeys
          </Text>

          <Text style={{ ...type.body, color: colors.textSecondary }}>
            Choose the duplicate whiskey to retire, then choose the whiskey to keep.
            This will re-point references and mark the source whiskey inactive.
          </Text>
        </View>

        <SearchBlock
          title="Source whiskey (retire this one)"
          value={sourceSearch}
          onChangeText={setSourceSearch}
          loading={loadingSource}
          results={sourceResults.filter((r) => r.id !== targetWhiskey?.id)}
          selected={sourceWhiskey}
          onSelect={(row) => {
            setSourceWhiskey(row);
            setSourceSearch(row.display_name ?? row.whiskey_canonical ?? "");
            setSourceResults([]);
          }}
          onClear={() => {
            setSourceWhiskey(null);
            setSourceSearch("");
            setSourceResults([]);
          }}
          placeholder="Search duplicate whiskey..."
        />

        <SearchBlock
          title="Target whiskey (keep this one)"
          value={targetSearch}
          onChangeText={setTargetSearch}
          loading={loadingTarget}
          results={targetResults.filter((r) => r.id !== sourceWhiskey?.id)}
          selected={targetWhiskey}
          onSelect={(row) => {
            setTargetWhiskey(row);
            setTargetSearch(row.display_name ?? row.whiskey_canonical ?? "");
            setTargetResults([]);
          }}
          onClear={() => {
            setTargetWhiskey(null);
            setTargetSearch("");
            setTargetResults([]);
          }}
          placeholder="Search whiskey to keep..."
        />

        <Pressable
          onPress={mergeWhiskeys}
          disabled={merging || !sourceWhiskey || !targetWhiskey}
          style={({ pressed }) => ({
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.divider,
            paddingVertical: spacing.md,
            alignItems: "center",
            justifyContent: "center",
            ...shadows.card,
            opacity: merging || !sourceWhiskey || !targetWhiskey ? 0.5 : pressed ? 0.9 : 1,
          })}
        >
          {merging ? (
            <ActivityIndicator />
          ) : (
            <Text style={{ ...type.button, color: colors.textPrimary }}>
              Merge Whiskeys
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}