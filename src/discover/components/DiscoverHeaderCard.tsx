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
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderWidth: 1,
        borderColor: colors.divider,
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
<View
  style={{
    width: 24,
    height: 2,
    backgroundColor: colors.accent,
    marginTop: 6,
    marginBottom: 2,
    opacity: 0.7,
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
        borderColor: colors.divider,
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: pressed ? colors.highlight : "transparent",
        opacity: pressed ? 0.92 : 1,
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
        backgroundColor: colors.accentFaint,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
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


      {/* Helper line (caption) */}
      <Text style={[type.microcopyItalic, { opacity: 0.72, lineHeight: 18 }]}>
        Trending updates even when you’re not logging.
      </Text>

      {/* Chips / status */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 2 }}>
        {hasFilters ? <SmallPill label={`Filters: ${filterBadgeText}`} /> : null}
        {loading ? <SmallPill label="Updating…" /> : null}
        {statusError ? <SmallPill label="Issue loading data" /> : null}
      </View>

      {/* If you want the actual error visible, keep it subtle */}
      {statusError ? (
        <Text style={[type.caption, { opacity: 0.6, marginTop: 6 }]}>
          {statusError}
        </Text>
      ) : null}
    </Card>
  );
}