import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
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
      <View style={{ gap: spacing.xs }}>
        <Text style={type.sectionHeader}>{title}</Text>
        {subtitle ? (
          <Text style={[type.microcopyItalic, { fontSize: 16, lineHeight: 22 }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

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
        backgroundColor: pressed ? colors.accentPressed : colors.accent,
        opacity: pressed ? 0.95 : 1,
      })}
    >
      <Text style={[type.button, { fontSize: 17, color: colors.background }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function HomeTab() {
  const [tapCount, setTapCount] = useState(0);
  const [lastTap, setLastTap] = useState<number | null>(null);

  const bumpTap = useCallback((label: string) => {
    const t = Date.now();
    console.log(`[HOME_TAP] ${label} t=${t}`);
    setTapCount((c) => c + 1);
    setLastTap(t);
  }, []);

  const lastTapText = lastTap ? new Date(lastTap).toLocaleTimeString() : "—";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: spacing.xl,
        paddingBottom: spacing.xl * 2,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ gap: spacing.xl }}>
        <Card
          title="DEBUG: Home Startup Isolate"
          subtitle="This screen has no auth/session/bootstrap logic. If tabs still fail, Home startup is not the cause."
        >
          <Text style={[type.body, { opacity: 0.85 }]}>
            Tap Count: <Text style={{ fontWeight: "900" }}>{tapCount}</Text>{" "}
            • Last Tap: <Text style={{ fontWeight: "900" }}>{lastTapText}</Text>
          </Text>

          <PrimaryButton
            label="Tap Test Button"
            onPress={() => bumpTap("TapTestButton")}
          />

          <Pressable
            onPress={() => bumpTap("TapTestInline")}
            style={({ pressed }) => ({
              marginTop: spacing.sm,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: colors.divider,
              backgroundColor: pressed ? colors.highlight : "transparent",
            })}
          >
            <Text style={[type.microcopyItalic, { opacity: 0.9 }]}>
              Tap here too (inline pressable)
            </Text>
          </Pressable>
        </Card>

        <Card
          title="Neat Notes"
          subtitle="Static Home screen for iOS navigation isolate test."
        >
          <PrimaryButton
            label="Open Sign In"
            onPress={() => router.push("/sign-in")}
          />
        </Card>

        <Card
          title="Navigation Links"
          subtitle="These are here only to keep basic navigation available during the test."
        >
          <View style={{ gap: spacing.md }}>
            <PrimaryButton
              label="Open Discover"
              onPress={() => router.push("/(tabs)/discover")}
            />
            <PrimaryButton
              label="Open Log"
              onPress={() => router.push("/(tabs)/log")}
            />
            <PrimaryButton
              label="Open Profile"
              onPress={() => router.push("/(tabs)/profile")}
            />
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}