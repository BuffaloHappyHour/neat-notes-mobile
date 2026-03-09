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
  compact = false,
}: {
  isPremium: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  const shimmer = React.useRef(new Animated.Value(-1)).current;

  React.useEffect(() => {
    if (compact || isPremium) return;

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
  }, [shimmer, compact, isPremium]);

  if (compact) {
    if (isPremium) {
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
                Explore the metrics shaping your palate.
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
          borderColor: "rgba(190,150,99,0.34)",
          backgroundColor: pressed ? "rgba(18,16,14,0.84)" : "rgba(18,16,14,0.72)",
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          ...shadows.card,
          overflow: "hidden",
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
              Unlock Premium Insights
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
              Deeper taste profile, behavior trends, and palate intelligence.
            </Text>

            <Text
              style={[
                type.microcopyItalic,
                {
                  color: colors.accent,
                  opacity: 0.92,
                  marginTop: 8,
                },
              ]}
            >
              Best after 3 pours.
            </Text>
          </View>

          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "rgba(190,150,99,0.55)",
              backgroundColor: "rgba(0,0,0,0.2)",
            }}
          >
            <Text
              style={[
                type.body,
                {
                  color: colors.accent,
                  letterSpacing: 1,
                  fontWeight: "900",
                },
              ]}
            >
              PREMIUM
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginTop: spacing.sm,
          }}
        >
          <Ionicons name="lock-closed" size={14} color={colors.accent} />
          <Text
            style={[
              type.caption,
              {
                color: colors.textSecondary,
                opacity: 0.9,
              },
            ]}
          >
            Insights become more meaningful with a few logged pours.
          </Text>
        </View>
      </Pressable>
    );
  }

  if (isPremium) {
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
              Explore the metrics shaping your palate.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={colors.accent} />
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 220,
        borderRadius: radii.xxl ?? radii.xl,
        borderWidth: 1.5,
        borderColor: "rgba(190,150,99,0.42)",
        backgroundColor: pressed ? "rgba(18,16,14,0.84)" : "rgba(18,16,14,0.76)",
        ...shadows.card,
        overflow: "hidden",
      })}
    >
      <>
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
              See your taste profile, behavior trends, and deeper palate intelligence.
            </Text>
          </View>

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
        </View>

        <View
          style={{
            width: 58,
            height: 3,
            borderRadius: 999,
            backgroundColor: colors.accent,
            opacity: 0.85,
            marginTop: spacing.sm,
          }}
        />

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
      </View>
    </Pressable>
  );
}