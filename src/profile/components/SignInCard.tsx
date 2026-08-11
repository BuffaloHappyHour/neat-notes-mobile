import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, Text } from "react-native";

import { radii } from "../../../lib/radii";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

import { withSuccess } from "../../../lib/hapticsPress";
import { ProfileCard } from "./ProfileCard";

export function SignInCard({ compact = false }: { compact?: boolean } = {}) {
  if (compact) {
    return (
      <Pressable
        onPress={withSuccess(() => router.push("/sign-in"))}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          borderRadius: radii.xl ?? radii.lg,
          borderWidth: 1,
          borderColor: colors.glassBorderStrong ?? colors.borderStrong,
          backgroundColor: pressed ? "rgba(190,150,99,0.16)" : "rgba(190,150,99,0.12)",
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
        })}
      >
        <Ionicons name="person-circle-outline" size={20} color={colors.accent} />
        <Text style={[type.body, { color: colors.textPrimary, flex: 1 }]}>
          Sign in to save your tastings
        </Text>
        <Ionicons name="chevron-forward" size={18} color={colors.accent} />
      </Pressable>
    );
  }

  return (
    <ProfileCard title="Sign in" subtitle="Create an account to keep tastings safe across devices.">
      <Pressable
        onPress={withSuccess(() => router.push("/sign-in"))}
        style={({ pressed }) => ({
          borderRadius: radii.md,
          paddingVertical: spacing.lg,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.accent,
          opacity: pressed ? 0.92 : 1,
        })}
      >
        <Text style={[type.button, { color: colors.background }]}>Sign In / Create Account</Text>
      </Pressable>
    </ProfileCard>
  );
}