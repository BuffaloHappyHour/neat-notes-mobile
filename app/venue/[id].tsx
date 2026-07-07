// app/venue/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BulletproofSheet } from "../../components/BulletproofSheet";
import { radii } from "../../lib/radii";
import { spacing } from "../../lib/spacing";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";
import { hapticTick, withTick } from "../../lib/hapticsPress";
import { CameraView, useCameraPermissions } from "expo-camera";

/* ---------- TYPES ---------- */

type FilterState = {
  types: string[];
  regions: string[];
  proofMin: string;
  proofMax: string;
  priceMin: string;
  priceMax: string;
  sortBy: string;
};

/* ---------- CONSTANTS ---------- */

const defaultFilter: FilterState = {
  types: [],
  regions: [],
  proofMin: "",
  proofMax: "",
  priceMin: "",
  priceMax: "",
  sortBy: "Category",
};

const SORT_OPTIONS = ["Category", "Community Rating", "Proof", "Price", "Palate Match"] as const;

const REGIONS = [
  "New York",
  "Kentucky",
  "Tennessee",
  "Texas",
  "Colorado",
  "Indiana",
  "New Jersey",
  "Washington",
];

/* ---------- UI ATOMS ---------- */

function PulsingDot({ color }: { color: string }) {
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.4,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return (
    <Animated.View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
        opacity: anim,
      }}
    />
  );
}

function WhiskeyMenuRow({
  item,
  stats,
  isPremium,
  venueId,
  venueName,
  isLocked,
}: {
  item: any;
  stats: any;
  isPremium: boolean;
  venueId: string;
  venueName: string;
  isLocked: boolean;
}) {
  const w = (item.whiskeys as any) ?? {};
  const available = item.available !== false;
  const name = (w.display_name as string | null) ?? "Unknown";
  const isLocal = w.region === "New York";
  const proof = w.proof != null ? `${w.proof} proof` : null;
  const price1oz = item.price_cents_1oz != null ? `$${(Number(item.price_cents_1oz) / 100).toFixed(0)} / 1oz` : null;
  const price2oz = item.price_cents_2oz != null ? `$${(Number(item.price_cents_2oz) / 100).toFixed(0)} / 2oz` : null;
  const priceStr = [price1oz, price2oz].filter(Boolean).join("  ·  ");
  const communityAvg =
    stats?.community_avg != null ? Number(stats.community_avg).toFixed(1) : null;
  const communityCount = stats?.community_count ?? 0;

  const matchSymbol = (): string => {
    if (isPremium && communityAvg != null) return communityAvg;
    if (communityAvg == null) return "–";
    const avg = Number(communityAvg);
    if (avg >= 80) return "✓";
    if (avg >= 60) return "–";
    return "✕";
  };

  const matchColor = (() => {
    if (communityAvg == null) return colors.textMuted;
    const avg = Number(communityAvg);
    if (avg >= 80) return colors.success;
    if (avg >= 60) return colors.textMuted;
    return colors.danger;
  })();

  return (
    <Pressable
      onPress={withTick(() => {
        if (!w?.id) return;
        router.push(`/whiskey/${w.id}` as any);
      })}
      style={({ pressed }) => ({
        backgroundColor: pressed ? colors.surfaceSunken : "transparent",
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        opacity: available ? 1 : 0.4,
      })}
    >
      <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" }}>
        {/* Left column */}
        <View style={{ flex: 1, gap: 4 }}>
          {/* Name + badges */}
          <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 5 }}>
            <Text
              style={[type.body, { fontFamily: "Montserrat_500Medium" }]}
              numberOfLines={2}
            >
              {name}
            </Text>
            {isLocal && (
              <View
                style={{
                  backgroundColor: colors.accentFaint,
                  borderRadius: radii.sm,
                  paddingVertical: 2,
                  paddingHorizontal: 6,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                }}
              >
                <Text style={[type.labelCaps, { fontSize: 10, color: colors.accent }]}>Local</Text>
              </View>
            )}
            {!available && (
              <View
                style={{
                  backgroundColor: colors.surfaceSunken,
                  borderRadius: radii.sm,
                  paddingVertical: 2,
                  paddingHorizontal: 6,
                  borderWidth: 1,
                  borderColor: colors.divider,
                }}
              >
                <Text style={[type.labelCaps, { fontSize: 10, color: colors.textMuted }]}>
                  Out of Stock
                </Text>
              </View>
            )}
          </View>

          {/* Proof */}
          {proof != null && (
            <Text style={[type.caption, { color: colors.textTertiary }]}>{proof}</Text>
          )}

          {/* Price + action */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: 2 }}>
            {priceStr != null && !isLocked && (
              <Text style={[type.caption, { color: colors.textTertiary }]}>{priceStr}</Text>
            )}
            {isLocked ? (
              <Text style={[type.labelCaps, { fontSize: 11, color: colors.textMuted }]}>
                Check in to log
              </Text>
            ) : available ? (
              <Pressable
                onPress={withTick(() =>
                  router.push(
                    `/log/cloud-tasting?whiskeyId=${encodeURIComponent(w.id ?? "")}&whiskeyName=${encodeURIComponent(name)}&lockName=1&sourceType=bar&venueId=${encodeURIComponent(venueId)}&venueName=${encodeURIComponent(venueName)}&pricePerOz=${encodeURIComponent(item.price_cents_1oz ? String(Math.round(item.price_cents_1oz / 100)) : "")}` as any
                  )
                )}
                style={({ pressed }) => ({
                  paddingVertical: 4,
                  paddingHorizontal: 10,
                  borderRadius: 999,
                  backgroundColor: pressed ? colors.accentSoft : "transparent",
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                })}
              >
                <Text style={[type.labelCaps, { fontSize: 11, color: colors.accent }]}>Log</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={withTick(() => {})}
                style={({ pressed }) => ({
                  paddingVertical: 4,
                  paddingHorizontal: 10,
                  borderRadius: 999,
                  backgroundColor: pressed ? colors.surfaceSunken : "transparent",
                  borderWidth: 1,
                  borderColor: colors.divider,
                })}
              >
                <Text style={[type.labelCaps, { fontSize: 11, color: colors.textMuted }]}>
                  Notify
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Right column */}
        <View style={{ width: 72, alignItems: "flex-end", gap: 4, paddingTop: 2 }}>
          {/* Match circle */}
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: colors.surfaceSunken,
              borderWidth: 1,
              borderColor: matchColor,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{ fontFamily: "Montserrat_500Medium", fontSize: 9, color: matchColor }}
            >
              {matchSymbol()}
            </Text>
          </View>

          {/* Community rating */}
          {communityAvg != null && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
              <Ionicons name="star" size={10} color={colors.accent} />
              <Text style={[type.caption, { fontSize: 11, color: colors.textSecondary }]}>
                {communityAvg} ({communityCount})
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function FullMenuRow({ item }: { item: any }) {
  const available = item.available !== false;
  const name = (item.name as string | null) ?? "Unknown";
  const description = typeof item.description === "string" ? item.description.trim() : "";
  const price1oz = item.price_cents_1oz != null ? `$${(Number(item.price_cents_1oz) / 100).toFixed(0)} / 1oz` : null;
  const price2oz = item.price_cents_2oz != null ? `$${(Number(item.price_cents_2oz) / 100).toFixed(0)} / 2oz` : null;
  const priceFlat = item.price_cents != null ? `$${(Number(item.price_cents) / 100).toFixed(0)}` : null;
  const priceStr = [price1oz, price2oz, priceFlat].filter(Boolean).join("  ·  ");

  return (
    <View
      style={{
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        opacity: available ? 1 : 0.4,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 5 }}>
        <Text style={[type.body, { fontFamily: "Montserrat_500Medium" }]} numberOfLines={2}>
          {name}
        </Text>
        {!available && (
          <View
            style={{
              backgroundColor: colors.surfaceSunken,
              borderRadius: radii.sm,
              paddingVertical: 2,
              paddingHorizontal: 6,
              borderWidth: 1,
              borderColor: colors.divider,
            }}
          >
            <Text style={[type.labelCaps, { fontSize: 10, color: colors.textMuted }]}>
              Out of Stock
            </Text>
          </View>
        )}
      </View>
      {description.length > 0 && (
        <Text style={[type.caption, { color: colors.textTertiary, marginTop: 2 }]}>
          {description}
        </Text>
      )}
      {priceStr.length > 0 && (
        <Text style={[type.caption, { color: colors.textTertiary, marginTop: 2 }]}>{priceStr}</Text>
      )}
    </View>
  );
}

function VenueFilterSheet({
  visible,
  onClose,
  whiskeyTypes,
  filter,
  onApply,
  isLocked,
  activeTab,
  otherCategoryOptions,
  otherFilter,
  onApplyOther,
}: {
  visible: boolean;
  onClose: () => void;
  whiskeyTypes: any[];
  filter: FilterState;
  onApply: (f: FilterState) => void;
  isLocked: boolean;
  activeTab: "whiskey" | "full";
  otherCategoryOptions: string[];
  otherFilter: string[];
  onApplyOther: (categories: string[]) => void;
}) {
  const [draft, setDraft] = useState<FilterState>(filter);
  const [draftOtherCategories, setDraftOtherCategories] = useState<string[]>(otherFilter);
  const [typeSectionOpen, setTypeSectionOpen] = useState(false);
  const [regionSectionOpen, setRegionSectionOpen] = useState(false);
  const [categorySectionOpen, setCategorySectionOpen] = useState(false);

  const isWhiskeyTab = activeTab === "whiskey";

  useEffect(() => {
    if (visible) {
      setDraft(filter);
      setDraftOtherCategories(otherFilter);
    }
  }, [visible]);

  const toggleType = (id: string) => {
    setDraft(prev => ({
      ...prev,
      types: prev.types.includes(id)
        ? prev.types.filter(t => t !== id)
        : [...prev.types, id],
    }));
  };

  const toggleRegion = (r: string) => {
    setDraft(prev => ({
      ...prev,
      regions: prev.regions.includes(r)
        ? prev.regions.filter(x => x !== r)
        : [...prev.regions, r],
    }));
  };

  const toggleOtherCategory = (c: string) => {
    setDraftOtherCategories(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  };

  const sheetInputStyle = {
    flex: 1,
    height: 40,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
    color: "white",
    paddingHorizontal: 10,
    fontFamily: "Montserrat_400Regular",
    fontSize: 14,
  } as const;

  return (
    <BulletproofSheet
      visible={visible}
      title={isWhiskeyTab ? "Filter & Sort" : "Filter"}
      onClose={onClose}
      footer={
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Pressable
            onPress={() => {
              if (isWhiskeyTab) setDraft(defaultFilter);
              else setDraftOtherCategories([]);
              void hapticTick();
            }}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 12,
              borderRadius: radii.md,
              alignItems: "center" as const,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              backgroundColor: pressed ? colors.surfaceSunken : "transparent",
            })}
          >
            <Text style={[type.button, { color: colors.textSecondary }]}>Clear</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (isWhiskeyTab) onApply(draft);
              else onApplyOther(draftOtherCategories);
              void hapticTick();
              onClose();
            }}
            style={({ pressed }) => ({
              flex: 2,
              paddingVertical: 12,
              borderRadius: radii.md,
              alignItems: "center" as const,
              backgroundColor: pressed ? colors.accentPressed : colors.accent,
            })}
          >
            <Text style={[type.button, { color: colors.background }]}>Apply</Text>
          </Pressable>
        </View>
      }
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.lg }}
      >
        {isWhiskeyTab ? (
        <>
        {/* Whiskey Type */}
        <Pressable
          onPress={() => setTypeSectionOpen(v => !v)}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 }}
        >
          <Text style={[type.labelCaps, { color: colors.textMuted }]}>Whiskey Type</Text>
          <View style={{ transform: [{ rotate: typeSectionOpen ? "180deg" : "0deg" }] }}>
            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
          </View>
        </Pressable>
        {typeSectionOpen && (
          <View style={{ maxHeight: 220 }}>
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {whiskeyTypes.map(wt => (
                <Pressable
                  key={wt.id}
                  onPress={() => toggleType(wt.id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Montserrat_400Regular",
                      fontSize: 15,
                      color: "rgba(244,241,234,0.9)",
                    }}
                  >
                    {wt.name}
                  </Text>
                  {draft.types.includes(wt.id) && (
                    <Ionicons name="checkmark" size={18} color={colors.accent} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Region */}
        <Pressable
          onPress={() => setRegionSectionOpen(v => !v)}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 }}
        >
          <Text style={[type.labelCaps, { color: colors.textMuted }]}>Region</Text>
          <View style={{ transform: [{ rotate: regionSectionOpen ? "180deg" : "0deg" }] }}>
            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
          </View>
        </Pressable>
        {regionSectionOpen && (
          <View
            style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}
          >
            {REGIONS.map(r => {
              const selected = draft.regions.includes(r);
              return (
                <Pressable
                  key={r}
                  onPress={() => toggleRegion(r)}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 999,
                    backgroundColor: selected ? colors.accentSoft : "transparent",
                    borderWidth: 1,
                    borderColor: selected ? colors.accent : "rgba(255,255,255,0.12)",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Montserrat_400Regular",
                      fontSize: 13,
                      color: selected ? colors.accent : "rgba(244,241,234,0.75)",
                    }}
                  >
                    {r}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Proof Range */}
        <Text style={[type.labelCaps, { color: colors.textMuted }]}>
          Proof Range
        </Text>
        <View
          style={{
            flexDirection: "row",
            gap: spacing.sm,
            alignItems: "center",
          }}
        >
          <TextInput
            value={draft.proofMin}
            onChangeText={v => setDraft(prev => ({ ...prev, proofMin: v }))}
            placeholder="Min"
            placeholderTextColor="rgba(244,241,234,0.35)"
            keyboardType="numeric"
            style={sheetInputStyle}
          />
          <Text style={{ color: "rgba(244,241,234,0.4)", fontSize: 16 }}>–</Text>
          <TextInput
            value={draft.proofMax}
            onChangeText={v => setDraft(prev => ({ ...prev, proofMax: v }))}
            placeholder="Max"
            placeholderTextColor="rgba(244,241,234,0.35)"
            keyboardType="numeric"
            style={sheetInputStyle}
          />
        </View>

        {/* Price Range */}
        <Text style={[type.labelCaps, { color: colors.textMuted }]}>
          Price per oz ($)
        </Text>
        <View
          style={{
            flexDirection: "row",
            gap: spacing.sm,
            alignItems: "center",
          }}
        >
          <TextInput
            value={draft.priceMin}
            onChangeText={v => setDraft(prev => ({ ...prev, priceMin: v }))}
            placeholder="Min"
            placeholderTextColor="rgba(244,241,234,0.35)"
            keyboardType="numeric"
            style={sheetInputStyle}
          />
          <Text style={{ color: "rgba(244,241,234,0.4)", fontSize: 16 }}>–</Text>
          <TextInput
            value={draft.priceMax}
            onChangeText={v => setDraft(prev => ({ ...prev, priceMax: v }))}
            placeholder="Max"
            placeholderTextColor="rgba(244,241,234,0.35)"
            keyboardType="numeric"
            style={sheetInputStyle}
          />
        </View>

        {/* Sort By */}
        <Text style={[type.labelCaps, { color: colors.textMuted }]}>
          Sort By
        </Text>
        <View
          style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}
        >
          {SORT_OPTIONS.filter(opt => !isLocked || opt !== "Palate Match").map(opt => {
            const selected = draft.sortBy === opt;
            return (
              <Pressable
                key={opt}
                onPress={() => setDraft(prev => ({ ...prev, sortBy: opt }))}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  backgroundColor: selected ? colors.accentSoft : "transparent",
                  borderWidth: 1,
                  borderColor: selected ? colors.accent : "rgba(255,255,255,0.12)",
                }}
              >
                <Text
                  style={{
                    fontFamily: "Montserrat_400Regular",
                    fontSize: 13,
                    color: selected ? colors.accent : "rgba(244,241,234,0.75)",
                  }}
                >
                  {opt}
                </Text>
              </Pressable>
            );
          })}
        </View>
        </>
        ) : (
        <>
        {/* Category */}
        <Pressable
          onPress={() => setCategorySectionOpen(v => !v)}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 }}
        >
          <Text style={[type.labelCaps, { color: colors.textMuted }]}>Category</Text>
          <View style={{ transform: [{ rotate: categorySectionOpen ? "180deg" : "0deg" }] }}>
            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
          </View>
        </Pressable>
        {categorySectionOpen && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
            {otherCategoryOptions.length === 0 ? (
              <Text style={[type.caption, { color: colors.textMuted }]}>No categories yet.</Text>
            ) : (
              otherCategoryOptions.map(cat => {
                const selected = draftOtherCategories.includes(cat);
                return (
                  <Pressable
                    key={cat}
                    onPress={() => toggleOtherCategory(cat)}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: 999,
                      backgroundColor: selected ? colors.accentSoft : "transparent",
                      borderWidth: 1,
                      borderColor: selected ? colors.accent : "rgba(255,255,255,0.12)",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Montserrat_400Regular",
                        fontSize: 13,
                        color: selected ? colors.accent : "rgba(244,241,234,0.75)",
                      }}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </View>
        )}
        </>
        )}
      </ScrollView>
    </BulletproofSheet>
  );
}

function VenueSearchModal({
  visible,
  onClose,
  menuItems,
}: {
  visible: boolean;
  onClose: () => void;
  menuItems: any[];
}) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const inputRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    } else {
      setQuery("");
    }
  }, [visible]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return menuItems.filter((item: any) =>
      String((item.whiskeys as any)?.display_name ?? "").toLowerCase().includes(q)
    );
  }, [query, menuItems]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Top bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: spacing.lg,
            paddingTop: insets.top + spacing.md,
            paddingBottom: spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.divider,
            gap: spacing.md,
          }}
        >
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search whiskeys…"
            placeholderTextColor={colors.textMuted}
            style={[type.body, { flex: 1, color: colors.textPrimary }]}
            autoCorrect={false}
            autoCapitalize="none"
          />
          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text style={[type.labelCaps, { color: colors.textMuted }]}>Cancel</Text>
          </Pressable>
        </View>

        {/* Results */}
        <ScrollView
          style={{ flex: 1 }}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          {!query.trim() ? (
            <View style={{ alignItems: "center", paddingTop: spacing.xl * 2 }}>
              <Text style={[type.microcopyItalic, { color: colors.textMuted }]}>
                {menuItems.length} whiskeys on the menu
              </Text>
            </View>
          ) : results.length === 0 ? (
            <View style={{ alignItems: "center", paddingTop: spacing.xl * 2 }}>
              <Text style={[type.caption, { color: colors.textMuted }]}>
                No results for "{query}"
              </Text>
            </View>
          ) : (
            results.map((item: any, idx: number) => {
              const w = (item.whiskeys as any) ?? {};
              const name = String(w.display_name ?? "Unknown");
              const isLocal = w.region === "New York";
              const proof = w.proof != null ? `${w.proof} proof` : null;
              const price1oz = item.price_cents_1oz != null ? `$${(Number(item.price_cents_1oz) / 100).toFixed(0)} / 1oz` : null;
              const price2oz = item.price_cents_2oz != null ? `$${(Number(item.price_cents_2oz) / 100).toFixed(0)} / 2oz` : null;
              const priceStr = [price1oz, price2oz].filter(Boolean).join("  ·  ");

              return (
                <View key={item.id}>
                  <Pressable
                    onPress={() => {
                      hapticTick();
                      onClose();
                      router.push((`/whiskey/${w.id}`) as any);
                    }}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "flex-start",
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.lg,
                      backgroundColor: pressed ? colors.surfaceSunken : "transparent",
                      gap: spacing.sm,
                    })}
                  >
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 5 }}>
                        <Text style={[type.body, { fontFamily: "Montserrat_500Medium" }]} numberOfLines={2}>
                          {name}
                        </Text>
                        {isLocal && (
                          <View style={{ backgroundColor: colors.accentFaint, borderRadius: radii.sm, paddingVertical: 2, paddingHorizontal: 6, borderWidth: 1, borderColor: colors.borderSubtle }}>
                            <Text style={[type.labelCaps, { fontSize: 10, color: colors.accent }]}>Local</Text>
                          </View>
                        )}
                      </View>
                      {proof != null && (
                        <Text style={[type.caption, { color: colors.textTertiary }]}>{proof}</Text>
                      )}
                      {priceStr != null && (
                        <Text style={[type.caption, { color: colors.textTertiary }]}>{priceStr}</Text>
                      )}
                    </View>
                  </Pressable>
                  {idx < results.length - 1 && (
                    <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.lg, opacity: 0.4 }} />
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ---------- SCREEN ---------- */

function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function VenueScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = (Array.isArray(params.id) ? params.id[0] : params.id) ?? "";
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [statusError, setStatusError] = useState("");
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [fullMenuItems, setFullMenuItems] = useState<any[]>([]);
  const [communityStats, setCommunityStats] = useState<any[]>([]);
  const [whiskeyTypes, setWhiskeyTypes] = useState<any[]>([]);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInId, setCheckInId] = useState<string | null>(null);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [checkinCount, setCheckinCount] = useState(0);
  const [filterVisible, setFilterVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"whiskey" | "full">("whiskey");
  const [appliedFilter, setAppliedFilter] = useState<FilterState>(defaultFilter);
  const [appliedOtherFilter, setAppliedOtherFilter] = useState<string[]>([]);

  const [isPremium, setIsPremium] = useState(false);
  const [venueData, setVenueData] = useState<any>(null);
  const [requireCheckin, setRequireCheckin] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannerPermission, requestScannerPermission] = useCameraPermissions();
  const [codeEntry, setCodeEntry] = useState("");
  const [codeEntryVisible, setCodeEntryVisible] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);

  const fetchCheckinCount = async () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("venue_checkins")
      .select("id", { count: "exact", head: true })
      .eq("venue_id", id)
      .is("checked_out_at", null)
      .gte("checked_in_at", threeHoursAgo);
    setCheckinCount(count ?? 0);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setStatusError("");

        const { data: venue, error: venueErr } = await supabase
          .from("venues")
          .select("id, name, display_name, venue_type, address, city, state, phone, website, is_active, updated_at, require_checkin, join_code")
          .eq("id", id)
          .single();
        if (venueErr) throw new Error(venueErr.message);
        if (!alive) return;
        setVenueData(venue as any);
        setRequireCheckin((venue as any)?.require_checkin === true);

        const { data: items, error: itemsErr } = await supabase
          .from("venue_menu_items")
          .select(
            "id, whiskey_id, price_cents_1oz, price_cents_2oz, available, whiskeys(id, display_name, whiskey_type, whiskey_type_id, category, region, sub_region, proof, distillery)"
          )
          .eq("venue_id", id)
          .order("available", { ascending: false });

        if (itemsErr) throw new Error(itemsErr.message);
        if (!alive) return;

        const nextItems = ((items as any) ?? []) as any[];
        setMenuItems(nextItems);

        const { data: fullMenu, error: fullMenuErr } = await supabase.rpc(
          "get_venue_full_menu",
          { p_venue_id: id }
        );
        if (fullMenuErr) throw new Error(fullMenuErr.message);
        if (!alive) return;
        setFullMenuItems(((fullMenu as any) ?? []) as any[]);

        const whiskeyIds = nextItems.map((i: any) => i.whiskey_id).filter(Boolean);

        if (whiskeyIds.length > 0) {
          const { data: stats, error: statsErr } = await supabase
            .from("whiskey_community_stats")
            .select("whiskey_id, community_avg, community_count")
            .in("whiskey_id", whiskeyIds);

          if (statsErr) throw new Error(statsErr.message);
          if (!alive) return;
          setCommunityStats(((stats as any) ?? []) as any[]);
        }

        const { data: types, error: typesErr } = await supabase
          .from("whiskey_types")
          .select("id, name");

        if (typesErr) throw new Error(typesErr.message);
        if (!alive) return;
        setWhiskeyTypes(((types as any) ?? []) as any[]);

        const { data: authData } = await supabase.auth.getSession();
        const userId = authData.session?.user?.id;
        if (userId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("is_premium")
            .eq("id", userId)
            .maybeSingle();
          if (alive) setIsPremium((profile as any)?.is_premium === true);

          const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
          const { data: ci } = await supabase
            .from("venue_checkins")
            .select("id, checked_in_at")
            .eq("venue_id", id)
            .eq("user_id", userId)
            .is("checked_out_at", null)
            .gte("checked_in_at", threeHoursAgo)
            .maybeSingle();
          if (ci) {
            if (alive) {
              setCheckedIn(true);
              setCheckInId((ci as any).id);
              setCheckInTime(new Date((ci as any).checked_in_at));
            }
          } else {
            await supabase
              .from("venue_checkins")
              .update({ checked_out_at: new Date().toISOString(), auto_expired: true })
              .eq("venue_id", id)
              .eq("user_id", userId)
              .is("checked_out_at", null)
              .lt("checked_in_at", threeHoursAgo);
          }
        }
        await fetchCheckinCount();
      } catch (e: any) {
        if (alive) setStatusError(String(e?.message ?? e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const totalTastings = useMemo(
    () => communityStats.reduce((acc, s) => acc + Number(s.community_count ?? 0), 0),
    [communityStats]
  );

  const statsMap = useMemo(() => {
    const m: Record<string, any> = {};
    communityStats.forEach((s: any) => { m[s.whiskey_id] = s; });
    return m;
  }, [communityStats]);

  const filteredItems = useMemo(() => {
    let items = [...menuItems];

    if (appliedFilter.types.length > 0) {
      items = items.filter(item => {
        const typeId = (item.whiskeys as any)?.whiskey_type_id;
        return typeId && appliedFilter.types.includes(typeId);
      });
    }

    if (appliedFilter.regions.length > 0) {
      items = items.filter(item => {
        const region = String((item.whiskeys as any)?.region ?? "").toLowerCase();
        return appliedFilter.regions.some(r => region.includes(r.toLowerCase()));
      });
    }

    if (appliedFilter.proofMin) {
      const min = Number(appliedFilter.proofMin);
      if (Number.isFinite(min)) {
        items = items.filter(
          item => Number((item.whiskeys as any)?.proof ?? 0) >= min
        );
      }
    }
    if (appliedFilter.proofMax) {
      const max = Number(appliedFilter.proofMax);
      if (Number.isFinite(max)) {
        items = items.filter(item => {
          const proof = (item.whiskeys as any)?.proof;
          return proof != null && Number(proof) <= max;
        });
      }
    }

    if (appliedFilter.priceMin) {
      const min = Number(appliedFilter.priceMin) * 100;
      if (Number.isFinite(min)) {
        items = items.filter(item => Number(item.price_cents_1oz ?? 0) >= min);
      }
    }
    if (appliedFilter.priceMax) {
      const max = Number(appliedFilter.priceMax) * 100;
      if (Number.isFinite(max)) {
        items = items.filter(item => {
          const cents = item.price_cents_1oz;
          return cents != null && Number(cents) <= max;
        });
      }
    }

    if (appliedFilter.sortBy === "Community Rating") {
      items.sort((a, b) => {
        const aS = communityStats.find(s => s.whiskey_id === a.whiskey_id);
        const bS = communityStats.find(s => s.whiskey_id === b.whiskey_id);
        return Number(bS?.community_avg ?? 0) - Number(aS?.community_avg ?? 0);
      });
    } else if (appliedFilter.sortBy === "Proof") {
      items.sort(
        (a, b) =>
          Number((b.whiskeys as any)?.proof ?? 0) -
          Number((a.whiskeys as any)?.proof ?? 0)
      );
    } else if (appliedFilter.sortBy === "Price") {
      items.sort((a, b) => Number(b.price_cents ?? 0) - Number(a.price_cents ?? 0));
    }

    return items;
  }, [menuItems, communityStats, appliedFilter]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, any[]> = {};
    for (const item of filteredItems) {
      const key = String((item.whiskeys as any)?.whiskey_type ?? "Other");
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, items]) => [
        key,
        [...items].sort((a, b) => {
          const aAvail = a.available !== false ? 0 : 1;
          const bAvail = b.available !== false ? 0 : 1;
          if (aAvail !== bAvail) return aAvail - bAvail;
          return String((a.whiskeys as any)?.display_name ?? "").localeCompare(
            String((b.whiskeys as any)?.display_name ?? "")
          );
        }),
      ] as [string, any[]]);
  }, [filteredItems]);

  const otherMenuItems = useMemo(
    () => fullMenuItems.filter((item: any) => item.category_kind === "other"),
    [fullMenuItems]
  );

  const otherCategoryOptions = useMemo(() => {
    const set = new Set<string>();
    otherMenuItems.forEach((item: any) => {
      if (item.type_name) set.add(String(item.type_name));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [otherMenuItems]);

  const filteredOtherMenuItems = useMemo(() => {
    if (appliedOtherFilter.length === 0) return otherMenuItems;
    return otherMenuItems.filter((item: any) =>
      appliedOtherFilter.includes(String(item.type_name))
    );
  }, [otherMenuItems, appliedOtherFilter]);

  const groupedFullMenuItems = useMemo(() => {
    const groups: Record<string, any[]> = {};
    for (const item of filteredOtherMenuItems) {
      const key = String(item.type_name ?? "Other");
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, items]) => [
        key,
        [...items].sort((a, b) => {
          const aAvail = a.available !== false ? 0 : 1;
          const bAvail = b.available !== false ? 0 : 1;
          if (aAvail !== bAvail) return aAvail - bAvail;
          return String(a.name ?? "").localeCompare(String(b.name ?? ""));
        }),
      ] as [string, any[]]);
  }, [filteredOtherMenuItems]);

  const venueName = (venueData as any)?.display_name ?? (venueData as any)?.name ?? "";

  const addressLine = venueData
    ? [
        (venueData as any).address,
        [(venueData as any).city, (venueData as any).state].filter(Boolean).join(" "),
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  const openMaps = async () => {
    await hapticTick();
    const query = encodeURIComponent(addressLine);
    const url =
      Platform.OS === "ios"
        ? `maps://maps.apple.com/?q=${query}`
        : `https://maps.google.com/?q=${query}`;
    try {
      await Linking.openURL(url);
    } catch {}
  };

  const statRows = [
    { value: String(menuItems.length), label: "whiskeys", color: colors.accent },
    { value: String(totalTastings), label: "tastings logged", color: colors.accent },
    { value: formatRelativeTime((venueData as any)?.updated_at), label: "last updated", color: colors.accent },
  ];

  async function handleJoinVenue(code: string) {
    setCodeLoading(true);
    setCodeError("");
    try {
      const { data, error } = await supabase.rpc("join_venue", {
        p_join_code: code.trim().toUpperCase(),
      });
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Invalid check-in code.");
      setCheckedIn(true);
      setCodeEntryVisible(false);
      setScannerVisible(false);
      setCodeEntry("");
      await fetchCheckinCount();
      await hapticTick();
    } catch (e: any) {
      setCodeError(String(e?.message ?? "Invalid code. Try again."));
    } finally {
      setCodeLoading(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: "" }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
      >
        {/* ── Venue Hero ─────────────────────────────────────── */}
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: spacing.md,
            gap: 6,
          }}
        >
          <Text style={[type.labelCaps, { color: colors.textMuted }]}>
            {(venueData as any)?.venue_type ?? ""}
          </Text>
          <Text style={[type.screenTitle, { fontSize: 34, lineHeight: 40 }]}>
            {(venueData as any)?.display_name ?? (venueData as any)?.name ?? ""}
          </Text>
          <Pressable
            onPress={openMaps}
            style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
          >
            <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
            <Text style={[type.caption, { color: colors.textTertiary }]}>{addressLine}</Text>
          </Pressable>
        </View>

        {/* ── Stats Row ───────────────────────────────────────── */}
        <View
          style={{
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.borderSubtle,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ flexDirection: "row" }}
          >
            {statRows.map((stat, idx) => (
              <View key={idx} style={{ flexDirection: "row", alignItems: "stretch" }}>
                <View
                  style={{
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                    alignItems: "center",
                    gap: 4,
                    minWidth: 88,
                  }}
                >
                  <Text style={[type.statNumber, { color: (stat as any).color ?? colors.accent }]}>
                    {stat.value}
                  </Text>
                  <Text style={[type.labelCaps, { color: colors.textMuted, fontSize: 10 }]}>
                    {stat.label}
                  </Text>
                </View>
                {idx < statRows.length - 1 && (
                  <View
                    style={{
                      width: 1,
                      backgroundColor: colors.borderSubtle,
                      marginVertical: spacing.sm,
                    }}
                  />
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        <View
          style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md }}
        >
          {/* ── Action Row ──────────────────────────────────────── */}
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Pressable
              onPress={async () => {
                await hapticTick();
                try {
                  await Share.share({
                    message: `Check out ${venueName} on Neat Notes — ${menuItems.length} whiskeys on their menu.\nneatnotes://venue/${id}`,
                    url: `neatnotes://venue/${id}`,
                  });
                } catch {}
              }}
              style={({ pressed }) => ({
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing.xs,
                paddingVertical: 13,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                backgroundColor: pressed ? colors.surfaceSunken : "transparent",
              })}
            >
              <Ionicons name="share-outline" size={16} color={colors.textSecondary} />
              <Text style={[type.button, { color: colors.textSecondary }]}>Share</Text>
            </Pressable>

            <Pressable
              onPress={async () => {
                await hapticTick();
                const { data: authData } = await supabase.auth.getSession();
                const userId = authData.session?.user?.id;
                if (!userId) return;
                if (checkedIn) {
                  if (checkInId) {
                    await supabase
                      .from("venue_checkins")
                      .update({ checked_out_at: new Date().toISOString() })
                      .eq("id", checkInId);
                  }
                  setCheckedIn(false);
                  setCheckInId(null);
                  setCheckInTime(null);
                  fetchCheckinCount();
                  Alert.alert(
                    "Before you go",
                    "Would you like to log a tasting while you were here?",
                    [
                      { text: "No thanks", style: "cancel" },
                      {
                        text: "Log a Tasting",
                        onPress: () => router.push(
                          `/log/cloud-tasting?sourceType=bar&venueId=${encodeURIComponent(id)}&venueName=${encodeURIComponent(venueName)}` as any
                        ),
                      },
                    ]
                  );
                } else {
                  if (requireCheckin) {
                    if (!scannerPermission?.granted) {
                      await requestScannerPermission();
                    }
                    setScannerVisible(true);
                  } else {
                    const { data: ci } = await supabase
                      .from("venue_checkins")
                      .insert({ venue_id: id, user_id: userId, checked_in_at: new Date().toISOString() })
                      .select("id")
                      .single();
                    if (ci) {
                      setCheckedIn(true);
                      setCheckInId((ci as any).id);
                      setCheckInTime(new Date());
                      fetchCheckinCount();
                    }
                  }
                }
              }}
              style={({ pressed }) => ({
                flex: 2,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing.xs,
                paddingVertical: 13,
                borderRadius: radii.md,
                backgroundColor: checkedIn
                  ? "transparent"
                  : pressed
                  ? colors.accentPressed
                  : colors.accent,
                borderWidth: 1,
                borderColor: checkedIn ? colors.success : "transparent",
              })}
            >
              {checkedIn ? (
                <Ionicons name="checkmark" size={16} color={colors.success} />
              ) : (
                <PulsingDot color={colors.background} />
              )}
              <Text
                style={[
                  type.button,
                  { color: checkedIn ? colors.success : colors.background },
                ]}
              >
                {checkedIn ? "Checked In" : "Check In"}
              </Text>
            </Pressable>
          </View>

          {checkinCount > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <PulsingDot color={colors.success} />
              <Text style={[type.caption, { color: colors.textMuted }]}>
                {checkinCount === 1 ? "1 person checked in right now" : `${checkinCount} people checked in right now`}
              </Text>
            </View>
          )}

          {/* ── Search Trigger ──────────────────────────────────── */}
          <Pressable
            onPress={withTick(() => setSearchVisible(true))}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              paddingVertical: 12,
              paddingHorizontal: spacing.md,
              borderRadius: radii.md,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Ionicons name="search-outline" size={16} color={colors.textMuted} />
            <Text style={[type.body, { flex: 1, color: colors.textMuted, fontSize: 15 }]}>
              Search {menuItems.length > 0 ? `${menuItems.length}+` : ""} whiskeys…
            </Text>
            <Pressable
              onPress={withTick(() => setFilterVisible(true))}
              hitSlop={8}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Ionicons name="options-outline" size={16} color={colors.textSecondary} />
              <Text style={[type.labelCaps, { fontSize: 11, color: colors.textSecondary }]}>
                {activeTab === "whiskey" ? "Filter & Sort" : "Filter"}
              </Text>
            </Pressable>
          </Pressable>

          {/* ── Upsell Banner ───────────────────────────────────── */}
          {!isPremium && (
            <Pressable
              onPress={withTick(() => router.push("/insights" as any))}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: spacing.md,
                borderRadius: radii.md,
                backgroundColor: colors.accentFaint,
                borderWidth: 1,
                borderColor: colors.borderStrong,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View style={{ gap: 2 }}>
                <Text style={[type.labelCaps, { color: colors.accent }]}>Premium</Text>
                <Text style={[type.body, { fontSize: 14, color: colors.textPrimary }]}>
                  Unlock Full Match
                </Text>
                <Text style={[type.caption, { color: colors.textMuted }]}>
                  See your palate score for every whiskey
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.accent} />
            </Pressable>
          )}

          {/* ── Check-in required banner ────────────────────────── */}
          {requireCheckin && !checkedIn && (
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              padding: spacing.md,
              borderRadius: radii.md,
              backgroundColor: colors.accentFaint,
              borderWidth: 1,
              borderColor: colors.borderStrong,
            }}>
              <Ionicons name="qr-code-outline" size={20} color={colors.accent} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[type.labelCaps, { color: colors.accent }]}>Check in required</Text>
                <Text style={[type.caption, { color: colors.textMuted }]}>
                  Scan the QR code at the venue to see prices and log tastings.
                </Text>
              </View>
            </View>
          )}

          {/* ── Menu Toggle ─────────────────────────────────────── */}
          <View
            style={{
              flexDirection: "row",
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              overflow: "hidden",
            }}
          >
            {(["whiskey", "full"] as const).map(tab => (
              <Pressable
                key={tab}
                onPress={withTick(() => setActiveTab(tab))}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: "center",
                  backgroundColor:
                    activeTab === tab ? colors.surface : "transparent",
                }}
              >
                <Text
                  style={[
                    type.button,
                    { color: activeTab === tab ? colors.textPrimary : colors.textMuted },
                  ]}
                >
                  {tab === "whiskey" ? "Whiskey" : "Other Drinks"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Content ─────────────────────────────────────────── */}
        {loading ? (
          <View
            style={{ paddingVertical: spacing.xl, alignItems: "center", gap: spacing.sm }}
          >
            <ActivityIndicator color={colors.accent} />
            <Text style={[type.caption, { color: colors.textMuted }]}>Loading menu…</Text>
          </View>
        ) : statusError ? (
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
            <Text style={[type.caption, { color: colors.danger }]}>{statusError}</Text>
          </View>
        ) : activeTab === "whiskey" ? (
          <View style={{ paddingTop: spacing.sm }}>
            {groupedItems.length === 0 ? (
              <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
                <Text style={[type.body, { color: colors.textMuted }]}>
                  No whiskeys on the menu yet.
                </Text>
              </View>
            ) : (
              groupedItems.map(([groupName, items]) => (
                <View key={groupName}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.sm,
                      paddingHorizontal: spacing.lg,
                      paddingVertical: 10,
                      backgroundColor: colors.surfaceSunken,
                      borderTopWidth: 1,
                      borderBottomWidth: 1,
                      borderColor: colors.divider,
                      marginTop: spacing.xs,
                    }}
                  >
                    <Text
                      style={[
                        type.sectionHeader,
                        {
                          fontStyle: "italic",
                          color: colors.textSecondary,
                          flex: 1,
                        },
                      ]}
                    >
                      {groupName}
                    </Text>
                    <Text
                      style={[type.labelCaps, { color: colors.textMuted, fontSize: 11 }]}
                    >
                      {items.length}
                    </Text>
                  </View>
                  {items.map((item: any, idx: number) => {
                    const itemStats = statsMap[item.whiskey_id];
                    return (
                      <View key={item.id}>
                        <WhiskeyMenuRow
                          item={item}
                          stats={itemStats}
                          isPremium={isPremium}
                          venueId={id}
                          venueName={venueName}
                          isLocked={requireCheckin && !checkedIn}
                        />
                        {idx < items.length - 1 && (
                          <View
                            style={{
                              height: 1,
                              backgroundColor: colors.divider,
                              marginHorizontal: spacing.lg,
                              opacity: 0.4,
                            }}
                          />
                        )}
                      </View>
                    );
                  })}
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={{ paddingTop: spacing.sm }}>
            {groupedFullMenuItems.length === 0 ? (
              <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
                <Text style={[type.body, { color: colors.textMuted }]}>
                  No items on the menu yet.
                </Text>
              </View>
            ) : (
              groupedFullMenuItems.map(([groupName, items]) => (
                <View key={groupName}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.sm,
                      paddingHorizontal: spacing.lg,
                      paddingVertical: 10,
                      backgroundColor: colors.surfaceSunken,
                      borderTopWidth: 1,
                      borderBottomWidth: 1,
                      borderColor: colors.divider,
                      marginTop: spacing.xs,
                    }}
                  >
                    <Text
                      style={[
                        type.sectionHeader,
                        {
                          fontStyle: "italic",
                          color: colors.textSecondary,
                          flex: 1,
                        },
                      ]}
                    >
                      {groupName}
                    </Text>
                    <Text
                      style={[type.labelCaps, { color: colors.textMuted, fontSize: 11 }]}
                    >
                      {items.length}
                    </Text>
                  </View>
                  {items.map((item: any, idx: number) => (
                    <View key={item.item_id}>
                      <FullMenuRow item={item} />
                      {idx < items.length - 1 && (
                        <View
                          style={{
                            height: 1,
                            backgroundColor: colors.divider,
                            marginHorizontal: spacing.lg,
                            opacity: 0.4,
                          }}
                        />
                      )}
                    </View>
                  ))}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <VenueFilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        whiskeyTypes={whiskeyTypes}
        filter={appliedFilter}
        onApply={f => setAppliedFilter(f)}
        isLocked={requireCheckin && !checkedIn}
        activeTab={activeTab}
        otherCategoryOptions={otherCategoryOptions}
        otherFilter={appliedOtherFilter}
        onApplyOther={cats => setAppliedOtherFilter(cats)}
      />

      <VenueSearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        menuItems={menuItems}
      />

      {/* ── QR Scanner Modal ────────────────────────────────── */}
      <Modal
        visible={scannerVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setScannerVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: spacing.lg,
            paddingTop: insets.top + spacing.md,
            paddingBottom: spacing.md,
          }}>
            <Text style={[type.sectionHeader, { color: "#fff" }]}>Scan to Check In</Text>
            <Pressable onPress={() => setScannerVisible(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>

          {scannerPermission?.granted ? (
            <CameraView
              style={{ flex: 1 }}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={async ({ data }) => {
                if (!codeLoading) {
                  const code = data.replace("neatnotes://venue-checkin/", "").trim();
                  await handleJoinVenue(code);
                }
              }}
            />
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
              <Text style={[type.body, { color: "#fff", textAlign: "center", marginBottom: spacing.lg }]}>
                Camera access is needed to scan the QR code.
              </Text>
              <Pressable
                onPress={requestScannerPermission}
                style={{ paddingVertical: spacing.md, paddingHorizontal: spacing.xl, backgroundColor: colors.accent, borderRadius: 999 }}
              >
                <Text style={[type.button, { color: colors.background }]}>Allow Camera</Text>
              </Pressable>
            </View>
          )}

          <View style={{ padding: spacing.xl, paddingBottom: insets.bottom + spacing.xl }}>
            {codeError ? (
              <Text style={[type.caption, { color: colors.danger, textAlign: "center", marginBottom: spacing.md }]}>
                {codeError}
              </Text>
            ) : null}
            <Pressable
              onPress={() => { setScannerVisible(false); setCodeEntryVisible(true); }}
              style={{ alignItems: "center", paddingVertical: spacing.md }}
            >
              <Text style={[type.labelCaps, { color: "rgba(255,255,255,0.6)" }]}>
                Enter code manually instead
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Manual Code Entry Modal ──────────────────────────── */}
      <Modal
        visible={codeEntryVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCodeEntryVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}
          onPress={() => setCodeEntryVisible(false)}
        >
          <View style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: radii.lg,
            borderTopRightRadius: radii.lg,
            padding: spacing.xl,
            paddingBottom: insets.bottom + spacing.xl,
            gap: spacing.md,
          }}>
            <Text style={[type.sectionHeader, { color: colors.textPrimary }]}>Enter Check-In Code</Text>
            <Text style={[type.caption, { color: colors.textMuted }]}>
              Ask a staff member for the code if you can't scan the QR.
            </Text>
            <TextInput
              value={codeEntry}
              onChangeText={v => { setCodeEntry(v.toUpperCase()); setCodeError(""); }}
              placeholder="e.g. HARTMAN"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              style={[type.body, {
                color: colors.textPrimary,
                backgroundColor: colors.surfaceSunken,
                borderWidth: 1,
                borderColor: codeError ? colors.danger : colors.borderStrong,
                borderRadius: radii.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                fontSize: 20,
                letterSpacing: 4,
              }]}
            />
            {codeError ? (
              <Text style={[type.caption, { color: colors.danger }]}>{codeError}</Text>
            ) : null}
            <Pressable
              onPress={() => handleJoinVenue(codeEntry)}
              disabled={codeEntry.trim().length < 3 || codeLoading}
              style={({ pressed }) => ({
                paddingVertical: spacing.md,
                borderRadius: 999,
                backgroundColor: colors.accent,
                alignItems: "center",
                opacity: codeEntry.trim().length < 3 || codeLoading ? 0.45 : pressed ? 0.85 : 1,
              })}
            >
              <Text style={[type.button, { color: colors.background }]}>
                {codeLoading ? "Checking…" : "Check In"}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
