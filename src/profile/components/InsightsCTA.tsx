import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";

import { LockedInsightsPreview } from "./LockedInsightsPreview";

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
  const shimmer = React.useRef(new Animated.Value(-1)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(6000),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 220,
        borderRadius: radii.xxl ?? radii.xl,
        borderWidth: 1.5,
        borderColor: isPremium
          ? colors.glassBorderStrong ?? colors.borderStrong
          : "rgba(190,150,99,0.42)",
        backgroundColor: isPremium
          ? pressed
            ? "rgba(190,150,99,0.16)"
            : "rgba(190,150,99,0.12)"
          : pressed
            ? "rgba(18,16,14,0.84)"
            : "rgba(18,16,14,0.76)",
        ...shadows.card,
        overflow: "hidden",
      })}
    >
      {!isPremium ? (
        <>
          {/* Small preview tucked into bottom-right */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              right: -22,
              bottom: -75,
              width: "74%",
              opacity: 0.16,
              transform: [{ scale: 0.68 }],
            }}
          >
            <LockedInsightsPreview />
          </View>

          {/* Dim wash over preview area */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: "62%",
              backgroundColor: "rgba(0,0,0,0.34)",
            }}
          />

          {/* Soft premium glow */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              right: 24,
              top: 28,
              width: 150,
              height: 150,
              borderRadius: 999,
              backgroundColor: "rgba(190,150,99,0.07)",
            }}
          />

          {/* Subtle shimmer sweep */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: -30,
              bottom: -30,
              width: 180,
              backgroundColor: "rgba(190,150,99,0.06)",
              transform: [
                {
                  translateX: shimmer.interpolate({
                    inputRange: [-1, 1],
                    outputRange: [-180, 420],
                  }),
                },
                { rotate: "12deg" },
              ],
            }}
          />
        </>
      ) : null}

      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.lg,
          minHeight: 220,
          justifyContent: "space-between",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: spacing.md,
          }}
        >
          <View style={{ flex: 1, gap: 4, paddingRight: 8, paddingBottom: 8 }}>
            <Text
              style={[
                type.sectionHeader,
                {
                  color: colors.textPrimary,
                  fontSize: 28,
                  lineHeight: 36,
                  paddingBottom: 4,
                },
              ]}
            >
              Unlock Premium Insights
            </Text>

            <Text
              style={[
                type.body,
                {
                  color: colors.textSecondary,
                  lineHeight: 24,
                  opacity: 0.96,
                },
              ]}
            >
              {isPremium
                ? "Deep-dive metrics that reveal your palate."
                : "See your taste profile, behavior trends, and deeper palate intelligence."}
            </Text>
          </View>

          {!isPremium ? (
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "rgba(190,150,99,0.7)",
                backgroundColor: "rgba(0,0,0,0.26)",
              }}
            >
              <Text
                style={[
                  type.body,
                  {
                    color: colors.accent,
                    letterSpacing: 1.2,
                    fontWeight: "900",
                  },
                ]}
              >
                PREMIUM
              </Text>
            </View>
          ) : null}
        </View>

        <View
          style={{
            width: 58,
            height: 3,
            borderRadius: 999,
            backgroundColor: colors.accent,
            opacity: isPremium ? 0.95 : 0.85,
            marginTop: spacing.sm,
          }}
        />

        {!isPremium ? (
          <View
            style={{
              marginTop: "auto",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 999,
              backgroundColor: "rgba(0,0,0,0.24)",
              alignSelf: "flex-start",
            }}
          >
            <Ionicons name="lock-closed" size={16} color={colors.accent} />

            <Text
              style={[
                type.microcopyItalic,
                {
                  color: colors.textSecondary,
                  opacity: 0.92,
                  lineHeight: 20,
                },
              ]}
            >
              Taste profile • behavior trends • palate intelligence
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}