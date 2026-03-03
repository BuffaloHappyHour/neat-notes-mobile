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
  rightHeader,
  children,
}: {
  title: string;
  rightHeader?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        backgroundColor: (colors as any).glassSurface ?? colors.surface,
        borderRadius: radii.lg,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,

        borderWidth: 1,
        borderColor: (colors as any).glassBorder ?? colors.divider,

        // keep your existing elevation but make it feel warmer / softer
        ...shadows.card,

        gap: spacing.sm,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.md,
        }}
      >
        <Text style={[type.sectionHeader, { fontSize: 18 }]}>
          {title}
        </Text>
        {rightHeader ? rightHeader : null}
      </View>

      {/* subtle “premium” accent bar */}
      <View
        style={{
          width: 120,
          height: 2,
          backgroundColor: colors.accent,
          marginTop: 0,
          marginBottom: 4,
          opacity: 0.5,
          borderRadius: 999,
        }}
      />

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
        borderColor: (colors as any).glassBorder ?? colors.divider,
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: pressed
          ? ((colors as any).glassSunken ?? colors.highlight)
          : "transparent",
        opacity: pressed ? 0.94 : 1,
        gap: 8,
      })}
    >
      <Ionicons
        name={icon}
        size={16}
        color={colors.textPrimary}
        style={{ opacity: 0.9 }}
      />
      {badgeText ? (
        <Text style={[type.caption, { fontWeight: "800", opacity: 0.9 }]}>
          {badgeText}
        </Text>
      ) : null}
    </Pressable>
  );
}

function SmallPill({ label }: { label: string }) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
        backgroundColor: (colors as any).glassSunken ?? colors.accentFaint,
        borderWidth: 1,
        borderColor: (colors as any).glassBorder ?? colors.borderSubtle,
      }}
    >
      <Text style={[type.caption, { opacity: 0.9 }]}>{label}</Text>
    </View>
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
  const hasFilters = !!filterBadgeText;

  return (
    <Card
      title="Narrow down to what you like"
      rightHeader={
        <IconButton
          icon="options-outline"
          onPress={onOpenFilters}
          badgeText={filterBadgeActive ? "Filters" : undefined}
        />
      }
    >
      <Text style={[type.microcopyItalic, { opacity: 0.72, lineHeight: 18 }]}>
        Trending updates even when you’re not logging.
      </Text>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 2,
        }}
      >
        {hasFilters ? <SmallPill label={`Filters: ${filterBadgeText}`} /> : null}
        {loading ? <SmallPill label="Updating…" /> : null}
        {statusError ? <SmallPill label="Issue loading data" /> : null}
      </View>

      {statusError ? (
        <Text style={[type.caption, { opacity: 0.6, marginTop: 6 }]}>
          {statusError}
        </Text>
      ) : null}
    </Card>
  );
}