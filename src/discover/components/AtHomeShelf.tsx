// src/discover/components/AtHomeShelf.tsx
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { radii } from "../../../lib/radii";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

import type { AtHomeRow } from "../services/discover.service";

function formatMeta(row: AtHomeRow) {
  const parts: string[] = [];

  if (row.whiskeyType) parts.push(row.whiskeyType);
  if (row.proof != null && Number.isFinite(Number(row.proof))) {
    parts.push(`${Number(row.proof)} proof`);
  }

  return parts.join(" • ");
}

function formatDaysAgo(dateStr: string | null) {
  if (!dateStr) return null;

  const then = new Date(dateStr).getTime();
  const now = Date.now();
  const diffDays = Math.max(
    0,
    Math.floor((now - then) / (1000 * 60 * 60 * 24))
  );

  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

function AtHomeTile({
  row,
  onPress,
}: {
  row: AtHomeRow;
  onPress: () => void;
}) {
  const daysAgo = formatDaysAgo(row.lastTastedAt);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 220,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.glassDivider ?? colors.divider,
        backgroundColor: colors.glassRaised, 
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        opacity: pressed ? 0.92 : 1,
        gap: 6,
      })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: spacing.md,
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={[type.body, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {row.whiskeyName}
          </Text>

          {formatMeta(row) ? (
            <Text
              style={[
                type.caption,
                { color: colors.textSecondary, opacity: 0.9 },
              ]}
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
        {row.rating != null
          ? `You rated this${daysAgo ? ` ${daysAgo}` : ""}. Pour another to see if your palate changed.`
          : `You have this bottle at home${daysAgo ? ` and last logged it ${daysAgo}` : ""}. Give it another pour and see what stands out this time.`}
      </Text>
    </Pressable>
  );
}

export function AtHomeShelf({
  rows,
  onPressRow,
}: {
  rows: AtHomeRow[];
  onPressRow: (row: AtHomeRow) => void;
}) {
  if (rows.length === 0) return null;

  return (
    <View
      style={{
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.accent,
        backgroundColor: colors.accentFaint,

      }}
    >
      <Text style={[type.sectionHeader, { fontSize: 22, lineHeight: 28 }]}>
        At Home
      </Text>

      <Text style={[type.microcopyItalic, { color: colors.textSecondary }]}>
        Bottles you own that deserve another pour
      </Text>

      <View
        style={{
          height: 2,
          width: 60,
          borderRadius: 2,
          backgroundColor: colors.accent,
          opacity: 0.6,
          marginTop: spacing.xs,
        }}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
      >
        <View
          style={{
            flexDirection: "row",
            gap: spacing.md,
            paddingVertical: 2,
          }}
        >
          {rows.map((row) => (
            <AtHomeTile
              key={row.whiskeyId}
              row={row}
              onPress={() => onPressRow(row)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}