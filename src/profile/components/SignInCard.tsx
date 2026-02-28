import { router } from "expo-router";
import React from "react";
import { Pressable, Text } from "react-native";

import { radii } from "../../../lib/radii";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

import { withSuccess } from "../../../lib/hapticsPress";
import { ProfileCard } from "./ProfileCard";

export function SignInCard() {
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