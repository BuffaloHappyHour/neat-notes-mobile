// src/logTab/components/SearchCard.tsx

import React from "react";
import {
    ActivityIndicator,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";

import { radii } from "../../../lib/radii";
import { shadows } from "../../../lib/shadows";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

import { Card } from "./Card";

export function SearchCard({
  query,
  inputRef,
  onChangeQuery,
  onClear,
  helperLine,
  loading,
  children,
}: {
  query: string;
  inputRef?: React.RefObject<TextInput | null>;
  onChangeQuery: (v: string) => void;
  onClear: () => void;
  helperLine: string;
  loading: boolean;
  children?: React.ReactNode; // suggestions list etc
}) {
  const surface =
    (colors as any).glassRaised ?? colors.surfaceRaised ?? colors.surface;

  const sunken =
    (colors as any).glassSunken ?? colors.surfaceSunken ?? colors.background;

  const border =
    (colors as any).glassBorder ?? colors.borderStrong ?? colors.divider;

  return (
    <Card title="Start typing to search" subtitle="Search the library by bottle name.">
      {/* Input well */}
      <View
        style={{
          borderWidth: 1,
          borderColor: border,
          borderRadius: radii.lg,
          backgroundColor: sunken,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
        }}
      >
        <TextInput
          ref={inputRef as any}
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

        {query.length > 0 ? (
          <Pressable
            onPress={onClear}
            hitSlop={10}
            style={({ pressed }) => ({
              paddingHorizontal: 10,
              paddingVertical: 8,
              borderRadius: 999,
              borderWidth: 1,
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

      {/* Helper */}
      <Text style={[type.body, { opacity: 0.7, fontSize: 12 }]}>
        {helperLine}
      </Text>

      {/* Loading row */}
      {loading ? (
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <ActivityIndicator />
          <Text style={[type.body, { opacity: 0.7, fontSize: 12 }]}>
            Searching…
          </Text>
        </View>
      ) : null}

      {/* Suggestions / extra content */}
      {children ? <View style={{ marginTop: spacing.xs }}>{children}</View> : null}
    </Card>
  );
}