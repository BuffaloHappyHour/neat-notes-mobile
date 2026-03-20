import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { radii } from "../../../lib/radii";
import { shadows } from "../../../lib/shadows";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

type Row = {
  whiskeyId: string;
  whiskeyName: string;
  whiskeyType?: string | null;
  proof?: number | null;
  rating?: number | null;
};

function formatMeta(row: Row) {
  const parts: string[] = [];
  if (row.whiskeyType) parts.push(row.whiskeyType);
  if (row.proof != null) parts.push(`${row.proof} proof`);
  return parts.join(" • ");
}

function Tile({
  row,
  subtitle,
  onPress,
}: {
  row: Row;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 220,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        backgroundColor: "rgba(255,255,255,0.03)",
        padding: spacing.md,
        opacity: pressed ? 0.92 : 1,
        gap: 6,
        ...shadows.card,
        shadowOpacity: 0.08,
      })}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={[type.body, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {row.whiskeyName}
          </Text>

          {formatMeta(row) ? (
            <Text
              style={[type.caption, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {formatMeta(row)}
            </Text>
          ) : null}
        </View>

        {row.rating != null ? (
          <Text style={[type.statNumber, { color: colors.textPrimary }]}>
            {Math.round(row.rating)}
          </Text>
        ) : null}
      </View>

      <Text
        style={[type.caption, { color: colors.accent, opacity: 0.95 }]}
        numberOfLines={3}
      >
        {subtitle}
      </Text>
    </Pressable>
  );
}

export function WhatToDrinkNext({
  featured,
  recommendations,
  onPress,
}: {
  featured: Row | null;
  recommendations: Row[];
  onPress: (id: string) => void;
}) {
  if (!featured && recommendations.length === 0) return null;

  return (
    <View
      style={{
        padding: spacing.lg,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.accent,
        backgroundColor: "rgba(255, 180, 120, 0.05)", // warm tint
        gap: spacing.md,
      }}
    >
      {/* Header */}
      <View style={{ gap: 6 }}>
        <Text style={[type.sectionHeader, { fontSize: 22 }]}>
          What to Drink Next
        </Text>

        <Text style={[type.microcopyItalic, { color: colors.textSecondary }]}>
          A mix of curated and personalized picks
        </Text>

        <View
          style={{
            width: 56,
            height: 2,
            backgroundColor: colors.accent,
            marginTop: spacing.xs,
          }}
        />
      </View>

      {/* Featured */}
      {featured ? (
        <Tile
          row={featured}
          subtitle="Featured this week — a must-try"
          onPress={() => onPress(featured.whiskeyId)}
        />
      ) : null}

      {/* Personalized */}
      {recommendations.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            {recommendations.map((r) => (
              <Tile
                key={r.whiskeyId}
                row={r}
                subtitle="Based on your palate"
                onPress={() => onPress(r.whiskeyId)}
              />
            ))}
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}