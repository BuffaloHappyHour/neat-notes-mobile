// WhiskeyAppBeta/app/auth/reset.tsx
import * as Linking from "expo-linking";
import { router } from "expo-router";
import React from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

function PrimaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: radii.md,
        paddingVertical: spacing.lg,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.accent,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <Text style={[type.button, { color: colors.background }]}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: radii.md,
        paddingVertical: spacing.lg,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.divider,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <Text style={[type.button, { color: colors.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

export default function ResetPasswordScreen() {
  // 🔁 Pattern B web reset page (replace with your real domain)
  const WEB_RESET_URL = "https://YOUR_VERCEL_DOMAIN/auth/reset";

  const openWebReset = async () => {
    try {
      await Linking.openURL(WEB_RESET_URL);
    } catch (e: any) {
      Alert.alert("Could not open link", String(e?.message ?? e));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.xl, gap: spacing.xl }}>
        <Text style={type.screenTitle}>Reset Password</Text>

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
          <Text style={[type.body, { opacity: 0.9, lineHeight: 22 }]}>
            Password reset is handled on the secure Neat Notes web reset page.
          </Text>

          <Text style={[type.microcopyItalic, { opacity: 0.8, lineHeight: 20 }]}>
            Tap below to open the reset page and set a new password.
          </Text>

          <PrimaryButton label="Open Reset Page" onPress={openWebReset} />
          <SecondaryButton label="Back to Sign In" onPress={() => router.replace("/sign-in")} />
        </View>
      </View>
    </View>
  );
}
