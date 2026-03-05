import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

export default function ResetPasswordDisabled() {
  useEffect(() => {
    // Debug isolate: disable in-app reset entirely.
    const t = setTimeout(() => {
      router.replace("/sign-in");
    }, 50);

    return () => clearTimeout(t);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.xl,
        gap: spacing.md,
      }}
    >
      <ActivityIndicator />
      <Text style={[type.body, { opacity: 0.8, textAlign: "center" }]}>
        Password reset disabled for iOS nav isolate test…
      </Text>
    </View>
  );
}