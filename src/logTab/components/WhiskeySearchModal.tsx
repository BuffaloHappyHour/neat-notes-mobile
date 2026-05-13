import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { supabase } from "../../../lib/supabase";
import { radii } from "../../../lib/radii";
import { shadows } from "../../../lib/shadows";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

type WhiskeyResult = {
  id: string;
  displayName: string;
  whiskeyType: string | null;
  distillery: string | null;
  proof: number | null;
  age: number | null;
  region: string | null;
};

const PREFERRED_FILTER_ORDER = [
  "Single Malt",
  "Bourbon",
  "Rye",
  "Blended Scotch",
  "American Whiskey",
  "Flavored Whiskey",
  "Rye (Canadian)",
  "Blended Irish",
  "Blended Malt",
  "Tennessee Whiskey",
];

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text
        style={[type.labelCaps, { fontSize: 9, color: colors.textSecondary, lineHeight: 11 }]}
      >
        {label}
      </Text>
      <Text
        style={[type.button, { fontSize: 13, color: colors.textPrimary, lineHeight: 16 }]}
      >
        {value}
      </Text>
    </View>
  );
}

function ResultCard({
  result,
  isFuzzy,
  onPress,
}: {
  result: WhiskeyResult;
  isFuzzy: boolean;
  onPress: () => void;
}) {
  const bg = isFuzzy
    ? (colors as any).surfaceRaised ?? colors.surface
    : colors.surface;

  const showProof = result.proof != null;
  const showRegion = !!result.region;
  const showAge = result.age != null;
  const hasMeta = showProof || showRegion || showAge;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: bg,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: (colors as any).borderStrong ?? colors.divider,
        marginHorizontal: spacing.lg,
        marginVertical: 4,
        padding: spacing.md,
        gap: 6,
        opacity: pressed ? 0.9 : 1,
        ...shadows.card,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
        <Text
          style={[type.sectionHeader, { fontSize: 17, flex: 1, lineHeight: 22 }]}
          numberOfLines={2}
        >
          {result.displayName}
        </Text>

        {result.whiskeyType ? (
          <View
            style={{
              backgroundColor: (colors as any).accentSoft ?? colors.accentFaint,
              borderRadius: (radii as any).sm ?? radii.md,
              paddingHorizontal: 8,
              paddingVertical: 3,
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            <Text
              style={[type.labelCaps, { fontSize: 9, color: colors.accent, lineHeight: 12 }]}
              numberOfLines={1}
            >
              {result.whiskeyType}
            </Text>
          </View>
        ) : null}
      </View>

      {result.distillery ? (
        <Text
          style={[type.microcopyItalic, { fontSize: 12, color: colors.textMuted, lineHeight: 16 }]}
          numberOfLines={1}
        >
          {result.distillery}
        </Text>
      ) : null}

      {hasMeta ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
          {showProof ? <MetaCell label="Proof" value={`${result.proof}`} /> : null}
          {showProof && (showRegion || showAge) ? (
            <View style={{ width: 1, height: 22, backgroundColor: colors.divider }} />
          ) : null}
          {showRegion ? <MetaCell label="Region" value={result.region!} /> : null}
          {showRegion && showAge ? (
            <View style={{ width: 1, height: 22, backgroundColor: colors.divider }} />
          ) : null}
          {showAge ? <MetaCell label="Age" value={`${result.age} yr`} /> : null}
        </View>
      ) : null}
    </Pressable>
  );
}

export function WhiskeySearchModal({
  visible,
  onClose,
  onSelect,
  onCustomEntry,
  initialQuery,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (whiskeyId: string, whiskeyName: string) => void;
  onCustomEntry: (name: string) => void;
  initialQuery?: string;
}) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState(initialQuery ?? "");
  const [activeFilter, setActiveFilter] = useState("All");
  const [results, setResults] = useState<WhiskeyResult[]>([]);
  const [fuzzyResults, setFuzzyResults] = useState<WhiskeyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterTypes, setFilterTypes] = useState<string[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    if (!visible) return;
    async function loadFilters() {
      const { data } = await supabase
        .from("whiskeys")
        .select("whiskey_type")
        .eq("is_active", true)
        .not("whiskey_type", "is", null)
        .neq("whiskey_type", "")
        .neq("whiskey_type", "Other");

      if (!data) return;

      const seen = new Set<string>();
      const all: string[] = [];
      for (const row of data as any[]) {
        const t = String(row.whiskey_type ?? "").trim();
        if (t && !seen.has(t)) {
          seen.add(t);
          all.push(t);
        }
      }

      const sorted = [
        ...PREFERRED_FILTER_ORDER.filter((t) => seen.has(t)),
        ...all.filter((t) => !PREFERRED_FILTER_ORDER.includes(t)),
      ];

      setFilterTypes(sorted.slice(0, 8));
    }
    loadFilters();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    setQuery(initialQuery ?? "");
    setActiveFilter("All");
    setResults([]);
    setFuzzyResults([]);
    setTimeout(() => inputRef.current?.focus?.(), 100);
  }, [visible, initialQuery]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const t = query.trim();
      if (t.length < 2) {
        setResults([]);
        setFuzzyResults([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase.rpc("search_whiskeys", {
          p_query: t,
          p_type_filter: activeFilter !== "All" ? activeFilter : null,
          p_limit: 20,
        });
        if (error) throw error;

        const mapped: WhiskeyResult[] = (data as any[]).map((r) => ({
          id: String(r.id),
          displayName: String(r.display_name ?? "Whiskey"),
          whiskeyType: r.whiskey_type ? String(r.whiskey_type) : null,
          distillery: r.distillery ? String(r.distillery) : null,
          proof:
            r.proof != null && Number.isFinite(Number(r.proof))
              ? Number(r.proof)
              : null,
          age:
            r.age != null && Number.isFinite(Number(r.age))
              ? Number(r.age)
              : null,
          region: r.region ? String(r.region) : null,
        }));

        setResults(mapped);

        if (mapped.length === 0 && t.length >= 3) {
          const { data: fuzzy, error: fuzzyErr } = await supabase.rpc(
            "find_duplicate_whiskey_candidates",
            { p_name: t, p_limit: 5 }
          );

          if (!fuzzyErr && fuzzy && fuzzy.length > 0) {
            const fuzzyMapped: WhiskeyResult[] = (fuzzy as any[])
              .filter((r) => r.similarity >= 0.3)
              .map((r) => ({
                id: String(r.id),
                displayName: String(r.display_name ?? "Whiskey"),
                whiskeyType: null,
                distillery: null,
                proof: null,
                age: null,
                region: null,
              }));
            setFuzzyResults(fuzzyMapped);
          } else {
            setFuzzyResults([]);
          }
        } else {
          setFuzzyResults([]);
        }
      } catch (e: any) {
        console.log("[WhiskeySearchModal] search error:", e?.message ?? e);
        setResults([]);
        setFuzzyResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, activeFilter]);

  const canCustomEntry = query.trim().length >= 2;
  const showEmpty =
    !loading &&
    query.trim().length >= 2 &&
    results.length === 0 &&
    fuzzyResults.length === 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header — fixed */}
        <View
          style={{
            paddingTop: 52,
            paddingHorizontal: spacing.lg,
            gap: spacing.sm,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <View
              style={{
                flex: 1,
                height: 46,
                backgroundColor: (colors as any).surfaceSunken ?? colors.background,
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: (colors as any).borderStrong ?? colors.divider,
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: spacing.md,
                gap: spacing.sm,
              }}
            >
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                placeholder="Search whiskeys…"
                placeholderTextColor={colors.textMuted}
                autoCorrect={false}
                autoCapitalize="words"
                returnKeyType="search"
                selectionColor={colors.accent}
                style={{
                  flex: 1,
                  color: colors.textPrimary,
                  fontFamily: type.body.fontFamily,
                  fontSize: 16,
                  paddingVertical: 0,
                }}
              />
              {query.length > 0 ? (
                <Pressable onPress={() => setQuery("")} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </Pressable>
              ) : null}
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text style={[type.button, { color: colors.accent, fontSize: 15 }]}>
                Cancel
              </Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: spacing.xs, paddingVertical: spacing.xs }}
          >
            {["All", ...filterTypes].map((f) => {
              const active = f === activeFilter;
              return (
                <Pressable
                  key={f}
                  onPress={() => setActiveFilter(f)}
                  style={({ pressed }) => ({
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: active
                      ? colors.accent
                      : (colors as any).borderStrong ?? colors.divider,
                    backgroundColor: active
                      ? (colors as any).accentSoft ?? colors.accentFaint
                      : "transparent",
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text
                    style={[
                      type.button,
                      {
                        fontSize: 12,
                        lineHeight: 16,
                        color: active ? colors.textPrimary : colors.textMuted,
                      },
                    ]}
                  >
                    {f}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={{ height: 1, backgroundColor: colors.divider }} />
        </View>

        {/* Results — scrollable */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: spacing.md,
            paddingBottom: spacing.xl * 2,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {loading ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
              }}
            >
              <ActivityIndicator color={colors.accent} />
              <Text style={[type.body, { opacity: 0.7, fontSize: 13 }]}>
                Searching…
              </Text>
            </View>
          ) : null}

          {!loading && results.length > 0 ? (
            <>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: spacing.lg,
                  paddingBottom: spacing.xs,
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: colors.accent,
                  }}
                />
                <Text style={[type.labelCaps, { color: colors.textSecondary }]}>
                  {results.length} {results.length === 1 ? "match" : "matches"}
                </Text>
              </View>

              {results.map((r) => (
                <ResultCard
                  key={r.id}
                  result={r}
                  isFuzzy={false}
                  onPress={() => onSelect(r.id, r.displayName)}
                />
              ))}
            </>
          ) : null}

          {!loading && results.length === 0 && fuzzyResults.length > 0 ? (
            <>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: spacing.lg,
                  paddingBottom: spacing.xs,
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: "#D46A6A",
                  }}
                />
                <Text style={[type.labelCaps, { color: colors.textSecondary }]}>
                  Similar matches — did you mean one of these?
                </Text>
              </View>

              {fuzzyResults.map((r) => (
                <ResultCard
                  key={r.id}
                  result={r}
                  isFuzzy={true}
                  onPress={() => onSelect(r.id, r.displayName)}
                />
              ))}
            </>
          ) : null}

          {showEmpty ? (
            <Text
              style={[
                type.body,
                {
                  opacity: 0.65,
                  fontSize: 13,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                },
              ]}
            >
              No matches found.
            </Text>
          ) : null}
        </ScrollView>

        {/* Footer — fixed */}
        <Pressable
          onPress={() => {
            if (!canCustomEntry) return;
            onCustomEntry(query.trim());
            onClose();
          }}
          disabled={!canCustomEntry}
          style={({ pressed }) => ({
            borderTopWidth: 1,
            borderTopColor: colors.divider,
            paddingTop: spacing.lg,
            paddingBottom: spacing.lg + insets.bottom,
            paddingHorizontal: spacing.lg,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            opacity: !canCustomEntry ? 0.4 : pressed ? 0.8 : 1,
          })}
        >
          <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
          <Text style={[type.body, { color: colors.accent, fontSize: 14 }]}>
            Not finding it? Log as custom entry
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}
