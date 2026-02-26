// src/discover/components/DiscoverHeaderCard.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { radii } from "../../../lib/radii";
import { shadows } from "../../../lib/shadows";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

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
          <Text style={[type.microcopyItalic, { lineHeight: 18 }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {children}
    </View>
  );
}

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
        <Ionicons
          name={icon}
          size={16}
          color={colors.textPrimary}
          style={{ opacity: 0.9 }}
        />
        {badgeText ? (
          <Text style={[type.body, { fontWeight: "900", fontSize: 12 }]}>
            {badgeText}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export function DiscoverHeaderCard({
  onOpenFilters,
  filterBadgeActive,
  filterBadgeText,
  loading,
  statusError,
}: {
  onOpenFilters: () => void;
  filterBadgeActive: boolean;
  filterBadgeText: string;
  loading: boolean;
  statusError: string;
}) {
  return (
    <Card
      title="Discover"
      subtitle="Curated lists, refreshed as the community logs."
      rightHeader={
        <IconButton
          icon="options-outline"
          onPress={onOpenFilters}
          badgeText={filterBadgeActive ? "Active" : undefined}
        />
      }
    >
      <Text style={[type.microcopyItalic, { lineHeight: 20 }]}>
        Pull down to refresh — trending updates even when you’re not logging.
      </Text>

      {filterBadgeText ? (
        <Text style={[type.body, { marginTop: spacing.sm, opacity: 0.78, fontSize: 12 }]}>
          Filters: {filterBadgeText}
        </Text>
      ) : null}

      {loading ? (
        <Text style={[type.body, { marginTop: spacing.sm, opacity: 0.72 }]}>
          Loading…
        </Text>
      ) : null}

      {statusError ? (
        <Text style={[type.body, { marginTop: spacing.sm, opacity: 0.8 }]}>
          Error: {statusError}
        </Text>
      ) : null}
    </Card>
  );
}