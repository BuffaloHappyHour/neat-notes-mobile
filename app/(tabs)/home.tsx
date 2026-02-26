// app/(tabs)/home.tsx
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { FeatureCard } from "../../components/ui/FeatureCard";
import { PrimaryButton } from "../../components/ui/PrimaryButton";

import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

// ✅ Intentional haptics wrapper (respects user setting)
import { withTick } from "../../lib/hapticsPress";

import { useHomeStats } from "../../src/home/hooks/useHomeStats";
import { pluralize } from "../../src/home/utils/pluralize";

function InlineNotice({
  title,
  subtitle,
  cta,
  onPress,
  disabled,
}: {
  title: string;
  subtitle: string;
  cta: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        borderRadius: radii.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.divider,
        backgroundColor: colors.surface,
        ...shadows.card,
        opacity: disabled ? 0.5 : pressed ? 0.92 : 1,
        gap: 8,
      })}
    >
      <Text style={[type.body, { fontWeight: "900" }]}>{title}</Text>
      <Text style={[type.microcopyItalic, { opacity: 0.85, lineHeight: 20 }]}>
        {subtitle}
      </Text>
      <Text style={[type.button, { color: colors.accent }]}>→ {cta}</Text>
    </Pressable>
  );
}

export default function HomeTab() {
  const { isAuthed, firstName, tastingCount, statsLoading } = useHomeStats();

  const dynamic = useMemo(() => {
    if (!isAuthed) {
      return {
        headline: "Start your palate journey.",
        subline: "Log your first pour — Neat Notes gets clearer as you go.",
      };
    }

    if (tastingCount === null) {
      return {
        headline: statsLoading ? "Checking your progress…" : "Welcome back.",
        subline: "Every pour adds clarity.",
      };
    }

    if (tastingCount <= 0) {
      return {
        headline: "Start your palate journey.",
        subline: "Log your first pour and begin building your taste map.",
      };
    }

    if (tastingCount <= 4) {
      return {
        headline: "Nice start.",
        subline: `You’ve logged ${tastingCount} ${pluralize(
          tastingCount,
          "pour"
        )}. Patterns are forming.`,
      };
    }

    if (tastingCount <= 24) {
      return {
        headline: "You’re building momentum.",
        subline: `You’ve logged ${tastingCount} ${pluralize(
          tastingCount,
          "pour"
        )}. Your palate is getting clearer.`,
      };
    }

    return {
      headline: "You’re building a palate map.",
      subline: `You’ve logged ${tastingCount} ${pluralize(
        tastingCount,
        "pour"
      )}. You’re learning your taste.`,
    };
  }, [isAuthed, tastingCount, statsLoading]);

  const logCard = useMemo(() => {
    if (!isAuthed || tastingCount === null) {
      return {
        title: "Log a pour",
        subtitle:
          "Capture your rating and impressions — fast, clean, and consistent.",
      };
    }
    if (tastingCount <= 0) {
      return {
        title: "Log your first pour",
        subtitle:
          "Start simple. Neat Notes gets smarter as your history grows.",
      };
    }
    return {
      title: "Log your next pour",
      subtitle:
        "Build consistency. That’s how your palate becomes clear.",
    };
  }, [isAuthed, tastingCount]);

  // ✅ Haptic-wrapped actions (tick on intentional navigation)
  const goSignIn = useMemo(() => withTick(() => router.push("/sign-in")), []);
  const goAccountSettings = useMemo(
    () => withTick(() => router.push("/account-settings")),
    []
  );
  const goLog = useMemo(() => withTick(() => router.push("/(tabs)/log")), []);
  const goDiscover = useMemo(
    () => withTick(() => router.push("/(tabs)/discover")),
    []
  );

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
        {/* Brand header */}
        <View style={{ gap: spacing.sm }}>
          <Text style={[type.screenTitle, { fontSize: 38, lineHeight: 42 }]}>
            Neat Notes
          </Text>

          <Text
            style={[
              type.microcopyItalic,
              { fontSize: 18, lineHeight: 24 },
            ]}
          >
            Understand your palate
          </Text>

          <View
            style={{
              height: 1,
              backgroundColor: colors.divider,
              marginTop: spacing.md,
            }}
          />
        </View>

        {/* Dynamic section */}
        <View style={{ gap: spacing.sm }}>
          {firstName ? (
            <Text style={[type.body, { fontSize: 18, fontWeight: "600" }]}>
              {firstName},
            </Text>
          ) : null}

          <Text style={[type.sectionHeader, { fontSize: 20, lineHeight: 24 }]}>
            {dynamic.headline}
          </Text>

          <Text
            style={[
              type.microcopyItalic,
              { fontSize: 16, lineHeight: 22, opacity: 0.9 },
            ]}
          >
            {dynamic.subline}
          </Text>

          {!isAuthed ? (
            <View style={{ marginTop: spacing.sm }}>
              <PrimaryButton
                label="Sign In / Create Account"
                onPress={goSignIn}
              />
            </View>
          ) : null}

          <View
            style={{
              height: 1,
              backgroundColor: colors.divider,
              marginTop: spacing.md,
            }}
          />
        </View>

        {isAuthed ? (
          <InlineNotice
            title="Founding Tester (Beta)"
            subtitle="Your tastings are private. If something feels off, send feedback — it helps us harden the app."
            cta="Submit feedback"
            onPress={goAccountSettings}
          />
        ) : null}

        <FeatureCard title={logCard.title} subtitle={logCard.subtitle}>
          <PrimaryButton label="Continue" onPress={goLog} />
        </FeatureCard>

        <FeatureCard
          title="Discover"
          subtitle="Explore whiskies and build your personal library. Community insights come later."
        >
          <PrimaryButton label="Find your next pour" onPress={goDiscover} />
        </FeatureCard>
      </View>
    </ScrollView>
  );
}