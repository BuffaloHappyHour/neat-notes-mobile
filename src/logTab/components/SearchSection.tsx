// src/logTab/components/SearchSection.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { radii } from "../../../lib/radii";
import { shadows } from "../../../lib/shadows";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

type Suggestion = {
  whiskeyId: string;
  whiskeyName: string;
  bhhScore: number | null;
};

export function SearchSection({
  query,
  onChangeQuery,
  onClear,
  onScanPress,
  suggestions,
  loading,
  helperLine,
  hasEnoughQuery,
  canContinue,
  onPick,
  onCustom,
  onContinue,
}: {
  query: string;
  onChangeQuery: (v: string) => void;
  onClear: () => void;
  onScanPress: () => void;

  suggestions: Suggestion[];
  loading: boolean;

  helperLine: string;
  hasEnoughQuery: boolean;
  canContinue: boolean;

  onPick: (s: Suggestion) => void;
  onCustom: () => void;
  onContinue: () => void;
}) {
  const inputRef = useRef<TextInput | null>(null);

  const surface = (colors as any).glassRaised ?? colors.surfaceRaised ?? colors.surface;
  const sunken = (colors as any).glassSunken ?? colors.surfaceSunken ?? colors.background;
  const border = (colors as any).glassBorder ?? colors.divider;

  const showSuggestions = suggestions.length > 0;
  const showNoMatches = hasEnoughQuery && !loading && suggestions.length === 0;

  const cardSubtitle = useMemo(() => {
    if (!hasEnoughQuery) return "Start typing a bottle name to search.";
    if (loading) return "Searching the library…";
    if (showSuggestions) return "Tap a result to open the whiskey profile.";
    return "No matches found — add a custom bottle to keep logging.";
  }, [hasEnoughQuery, loading, showSuggestions]);

  return (
    <View
      style={{
        backgroundColor: surface,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: border,
        paddingVertical: 14,
        paddingHorizontal: spacing.lg,
        ...shadows.card,
        gap: spacing.md,
      }}
    >
      <View style={{ gap: 4 }}>
        <Text style={[type.sectionHeader, { fontSize: 18 }]}>
          Start typing to search
        </Text>
      </View>

      <View
        style={{
          borderWidth: 1,
          borderColor: border,
          borderRadius: radii.lg,
          backgroundColor: sunken,
          paddingHorizontal: spacing.md,
          paddingVertical: 8,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
        }}
      >
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={onChangeQuery}
          placeholder="Type a bottle name…"
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="search"
          selectionColor={colors.accent}
          style={{
            flex: 1,
            paddingVertical: 10,
            paddingHorizontal: 0,
            color: colors.textPrimary,
            backgroundColor: "transparent",
            fontFamily: type.body.fontFamily,
            fontSize: 16,
          }}
        />

        <Pressable
          onPress={onScanPress}
          hitSlop={10}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 999,
            borderWidth: 0.8,
            borderColor: border,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: pressed ? surface : "transparent",
            opacity: pressed ? 0.9 : 1,
            ...shadows.card,
          })}
        >
          <MaterialCommunityIcons
            name="barcode-scan"
            size={20}
            color={colors.accent}
          />
        </Pressable>

        {query.length > 0 ? (
          <Pressable
            onPress={() => {
              onClear();
              setTimeout(() => inputRef.current?.focus?.(), 50);
            }}
            hitSlop={10}
            style={({ pressed }) => ({
              paddingHorizontal: 10,
              paddingVertical: 8,
              borderRadius: 999,
              borderWidth: 0.8,
              borderColor: border,
              backgroundColor: pressed ? surface : "transparent",
              opacity: pressed ? 0.9 : 1,
              ...shadows.card,
            })}
          >
            <Text style={[type.caption, { fontWeight: "900", opacity: 0.9 }]}>
              Clear
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={[type.body, { opacity: 0.7, fontSize: 12 }]}>
        {helperLine}
      </Text>

      {loading ? (
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <ActivityIndicator />
          <Text style={[type.body, { opacity: 0.7, fontSize: 12 }]}>
            Searching…
          </Text>
        </View>
      ) : null}

      {showSuggestions ? (
        <ScrollView
          style={{
            maxHeight: 170,
            borderWidth: 1,
            borderColor: border,
            borderRadius: radii.lg,
            overflow: "hidden",
            backgroundColor: sunken,
          }}
          contentContainerStyle={{ paddingVertical: 6 }}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          {suggestions.map((s, idx) => (
            <Pressable
              key={`${s.whiskeyId}:${s.whiskeyName}:${idx}`}
              onPress={() => onPick(s)}
              style={({ pressed }) => ({
                marginHorizontal: 6,
                marginVertical: 4,
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: border,
                backgroundColor: pressed ? colors.highlight : surface,
                opacity: pressed ? 0.95 : 1,
                ...shadows.card,
                gap: 6,
              })}
            >
              <Text style={[type.body, { fontWeight: "900" }]} numberOfLines={2}>
                {s.whiskeyName}
              </Text>

              <Text
                style={[type.microcopyItalic, { opacity: 0.75, fontSize: 12 }]}
                numberOfLines={1}
              >
                Tap to view profile
                {typeof s.bhhScore === "number" ? ` • BHH ${Math.round(s.bhhScore)}` : ""}
                {idx === 0 ? " • Top match" : ""}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : showNoMatches ? (
        <Text style={[type.body, { opacity: 0.65, fontSize: 12 }]}>
          No matches found. Use “Add custom”.
        </Text>
      ) : null}

      <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: 2 }}>
        <Pressable
          onPress={onCustom}
          disabled={!hasEnoughQuery}
          style={({ pressed }) => ({
            flex: 0.44,
            borderRadius: radii.md,
            paddingVertical: 14,
            alignItems: "center",
            borderWidth: 1,
            borderColor: border,
            backgroundColor: surface,
            ...shadows.card,
            opacity: !hasEnoughQuery ? 0.45 : pressed ? 0.92 : 1,
          })}
        >
          <Text style={[type.button, { color: colors.textPrimary }]}>Add custom</Text>
        </Pressable>

        <Pressable
          onPress={onContinue}
          disabled={!canContinue}
          style={({ pressed }) => ({
            flex: 0.56,
            borderRadius: radii.md,
            paddingVertical: 14,
            alignItems: "center",
            backgroundColor: canContinue ? colors.accent : colors.divider,
            ...shadows.card,
            opacity: pressed ? 0.92 : 1,
          })}
        >
          <Text style={[type.button, { color: colors.background }]}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}