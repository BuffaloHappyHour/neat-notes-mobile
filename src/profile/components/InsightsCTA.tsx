import React from "react";
import { Pressable, Text, View } from "react-native";

import { BlurView } from "expo-blur";
import { radii } from "../../../lib/radii";
import { shadows } from "../../../lib/shadows";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

export function InsightsCTA({
  isPremium,
  onPress,
}: {
  isPremium: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: radii.xxl ?? radii.xl,
        borderWidth: 1,
        borderColor: isPremium
          ? (colors.glassBorderStrong ?? colors.borderStrong)
          : (colors.glassBorder ?? colors.borderSubtle ?? colors.divider),
        backgroundColor: isPremium
          ? (pressed ? "rgba(190,150,99,0.16)" : "rgba(190,150,99,0.12)")
          : (pressed ? "rgba(244,241,234,0.06)" : (colors.glassSurface ?? colors.surface)),
        ...shadows.card,
        overflow: "hidden",
      })}
    >
      <View style={{ padding: spacing.md }}>
        <Text style={[type.sectionHeader, { color: colors.textPrimary }]}>
          View your Insights
        </Text>

        <Text style={[type.caption, { color: colors.textSecondary, marginTop: 4 }]}>
          {isPremium
            ? "Deep-dive metrics that reveal your palate."
            : "Unlock deeper trends and palate insights."}
        </Text>

        <View
          style={{
            width: 26,
            height: 2,
            borderRadius: 1,
            backgroundColor: colors.accent,
            opacity: isPremium ? 0.9 : 0.6,
            marginTop: spacing.xs,
          }}
        />
      </View>

      {!isPremium ? (
  <View
    pointerEvents="none"
    style={{
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    }}
  >
    {/* True blur */}
    <BlurView
      intensity={28}
      tint="dark"
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      }}
    />

    {/* Soft gradient-style wash (lighter than before) */}
    <View
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(0,0,0,0.18)",
      }}
    />

    {/* Center lock badge */}
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          paddingHorizontal: 18,
          paddingVertical: 10,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: "rgba(190,150,99,0.6)",
          backgroundColor: "rgba(0,0,0,0.25)",
        }}
      >
        <Text
          style={[
            type.body,
            {
              color: colors.accent,
              letterSpacing: 1,
            },
          ]}
        >
          PREMIUM
        </Text>
      </View>
    </View>
  </View>
) : null}
    </Pressable>
  );
}