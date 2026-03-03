import React from "react";
import { Pressable, Text, View } from "react-native";

import { radii } from "../../../lib/radii";
import { shadows } from "../../../lib/shadows";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

import type { RecentTastingRow } from "../types";
import { formatWhen } from "../utils";

export function SoftDivider() {
  // tan line that’s softer at edges and brighter in the middle (like Home)
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.md }}>
      <View
        style={{
          flex: 1,
          height: 2,
          backgroundColor: colors.accentFaint,
          opacity: 0.15,
          borderRadius: 2,
        }}
      />
      <View
        style={{
          width: 170,
          height: 2,
          backgroundColor: colors.accent,
          opacity: 0.7,
          borderRadius: 2,
          marginHorizontal: spacing.sm,
        }}
      />
      <View
        style={{
          flex: 1,
          height: 2,
          backgroundColor: colors.accentFaint,
          opacity: 0.15,
          borderRadius: 2,
        }}
      />
    </View>
  );
}

export function Card({
  title,
  subtitle,
  rightHeader,
  children,
  padV,
  padH,
  gap,
}: {
  title: string;
  subtitle?: string;
  rightHeader?: React.ReactNode;
  children: React.ReactNode;

  // Optional overrides (lets Bottle be tighter without touching Recent)
  padV?: number;
  padH?: number;
  gap?: number;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.divider,

        paddingVertical: padV ?? 14,
        paddingHorizontal: padH ?? spacing.lg,

        ...shadows.card,
        gap: gap ?? spacing.md,
      }}
    >
      <View style={{ gap: 6 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: spacing.md,
          }}
        >
          <Text style={[type.sectionHeader, { fontSize: 18 }]}>{title}</Text>
          {rightHeader ? rightHeader : null}
        </View>

        {subtitle ? (
          <Text style={[type.microcopyItalic, { opacity: 0.82, lineHeight: 18 }]}>{subtitle}</Text>
        ) : null}
      </View>

      {children}
    </View>
  );
}

export function SmallLink({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!!disabled}
      style={({ pressed }) => ({
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
      })}
    >
      <Text style={[type.body, { fontWeight: "900", fontSize: 12, color: colors.accent }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function RecentRow({ row, onPress }: { row: RecentTastingRow; onPress: () => void }) {
  const when = formatWhen(row.createdAt);
  const ratingText =
    row.rating != null && Number.isFinite(Number(row.rating)) ? `${Math.round(row.rating)}` : "—";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: colors.divider,
        borderRadius: radii.md,
        backgroundColor: colors.surface,
        ...shadows.card,
        opacity: pressed ? 0.92 : 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.body, { fontWeight: "900" }]} numberOfLines={1}>
          {row.whiskeyName}
        </Text>
        <Text style={[type.microcopyItalic, { opacity: 0.75 }]} numberOfLines={1}>
          {when ? `Logged ${when}` : "Logged"}
        </Text>
      </View>

      <View style={{ minWidth: 44, alignItems: "flex-end", justifyContent: "center" }}>
        <Text style={[type.body, { fontWeight: "900" }]}>{ratingText}</Text>
      </View>
    </Pressable>
  );
}