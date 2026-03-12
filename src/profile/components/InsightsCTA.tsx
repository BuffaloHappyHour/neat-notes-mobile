import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { radii } from "../../../lib/radii";
import { shadows } from "../../../lib/shadows";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

export function InsightsCTA({
  isPremium,
  onPress,
  compact = false,
}: {
  isPremium: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          borderRadius: radii.xl ?? radii.lg,
          borderWidth: 1,
          borderColor: colors.glassBorderStrong ?? colors.borderStrong,
          backgroundColor: pressed
            ? "rgba(190,150,99,0.16)"
            : "rgba(190,150,99,0.12)",
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          ...shadows.card,
          overflow: "hidden",
        })}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.md,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={[
                type.body,
                {
                  color: colors.textPrimary,
                  fontSize: 20,
                  lineHeight: 26,
                },
              ]}
            >
              View Insights
            </Text>

            <Text
              style={[
                type.caption,
                {
                  color: colors.textSecondary,
                  marginTop: 6,
                  lineHeight: 20,
                },
              ]}
            >
              Explore how your tasting history is taking shape.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color={colors.accent} />
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: radii.xl ?? radii.lg,
        borderWidth: 1,
        borderColor: colors.glassBorderStrong ?? colors.borderStrong,
        backgroundColor: pressed
          ? "rgba(190,150,99,0.16)"
          : "rgba(190,150,99,0.12)",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        ...shadows.card,
        overflow: "hidden",
      })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.md,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={[
              type.sectionHeader,
              {
                fontSize: 22,
                lineHeight: 28,
                color: colors.textPrimary,
              },
            ]}
          >
            View Insights
          </Text>

          <Text
            style={[
              type.caption,
              {
                color: colors.textSecondary,
                marginTop: 4,
                lineHeight: 20,
              },
            ]}
          >
            Explore how your tasting history is taking shape.
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color={colors.accent} />
      </View>
    </Pressable>
  );
}