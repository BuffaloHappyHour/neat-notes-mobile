// app/(tabs)/home.tsx
import { router } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

import { logClientEvent } from "../../lib/clientLog";
import { withTick } from "../../lib/hapticsPress";

import { useHomeStats } from "../../src/home/hooks/useHomeStats";
import { pluralize } from "../../src/home/utils/pluralize";

/**
 * Local “warm shadow” override:
 * - Keeps your global shadows.card baseline
 * - Adds warmer tone + softer spread (more premium, less “plugin”)
 * - No touch/gesture impact (pure styles)
 */
const warmCardShadow = {
  ...shadows.card,
  shadowColor: colors.shadowWarm ?? colors.shadow,
  shadowOpacity: 0.55,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  elevation: 10,
};

function ActionBodyCard({
  subtitle,
  onPress,
  rightHint,
}: {
  subtitle: string;
  onPress: () => void;
  rightHint?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? "rgba(190, 150, 99, 0.12)" : "rgba(255, 255, 255, 0.04)",
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: pressed ? "rgba(190, 150, 99, 0.42)" : colors.glassBorder,
        paddingVertical: 13,
        paddingHorizontal: spacing.lg,
        ...warmCardShadow,
        opacity: pressed ? 0.96 : 1,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              type.microcopyItalic,
              {
                fontSize: 15.5,
                lineHeight: 22,
                opacity: 0.88,
                color: colors.textPrimary,
              },
            ]}
          >
            {subtitle}
          </Text>
        </View>

        {rightHint ? (
          <View
            style={{
              width: 108,
              paddingVertical: 7,
              borderRadius: 999,
              alignItems: "center",
              backgroundColor: "rgba(190, 150, 99, 0.10)",
              borderWidth: 1,
              borderColor: "rgba(190, 150, 99, 0.34)",
              shadowColor: colors.shadowWarm ?? colors.shadow,
              shadowOpacity: 0.18,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3,
            }}
          >
            <Text
              style={[
                type.caption,
                {
                  color: colors.accent,
                  opacity: 0.96,
                  letterSpacing: 0.25,
                  fontWeight: "700",
                },
              ]}
            >
              {rightHint}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function SubtleNotice({
  title,
  subtitle,
  cta,
  onPress,
}: {
  title: string;
  subtitle: string;
  cta: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: radii.lg,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderWidth: 1,
        backgroundColor: colors.glassSurface,
        borderColor: pressed ? colors.glassBorderStrong : colors.glassBorder,
        ...warmCardShadow,
        opacity: pressed ? 0.94 : 1,
        gap: 10,
      })}
    >
      <Text
        style={[
          type.sectionHeader,
          {
            fontSize: 18,
            lineHeight: 22,
            opacity: 0.72,
            color: colors.textPrimary,
          },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          type.microcopyItalic,
          {
            fontSize: 15,
            lineHeight: 21,
            opacity: 0.82,
            color: colors.textPrimary,
          },
        ]}
      >
        {subtitle}
      </Text>

      <Text style={[type.caption, { color: colors.accent, fontWeight: "700", opacity: 0.92 }]}>
        → {cta}
      </Text>
    </Pressable>
  );
}

export default function HomeTab() {
  const { isAuthed, firstName, tastingCount, statsLoading } = useHomeStats();

  const logPress = (action: string, href?: string) => {
    void logClientEvent("press", {
      screen: "home",
      detail: {
        action,
        href: href ?? null,
        ts: Date.now(),
      },
    });
  };

  useEffect(() => {
    void logClientEvent("screen_view", {
      screen: "home",
      detail: { ts: Date.now() },
    });
  }, []);

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
        subline: `You’ve logged ${tastingCount} ${pluralize(tastingCount, "pour")}. Patterns are forming.`,
      };
    }

    if (tastingCount <= 24) {
      return {
        headline: "You’re building momentum.",
        subline: `You’ve logged ${tastingCount} ${pluralize(tastingCount, "pour")}. Your palate is getting clearer.`,
      };
    }

    return {
      headline: "You’re building a palate map.",
      subline: `You’ve logged ${tastingCount} ${pluralize(tastingCount, "pour")}. You’re learning your taste.`,
    };
  }, [isAuthed, tastingCount, statsLoading]);

  const logCopy = useMemo(() => {
    if (!isAuthed || tastingCount === null) {
      return {
        title: "Log a pour",
        subtitle: "Capture your rating and impressions — fast, clean, and consistent.",
        hint: "Continue",
      };
    }
    if (tastingCount <= 0) {
      return {
        title: "Log your first pour",
        subtitle: "Neat Notes gets smarter as your history grows.",
        hint: "Start",
      };
    }
    return {
      title: "Log your next pour",
      subtitle: "Your palate becomes clearer the more you log.",
      hint: "Continue",
    };
  }, [isAuthed, tastingCount]);

  const discoverCopy = useMemo(() => {
    return {
      title: "Discover",
      subtitle: "Explore beyond your comfort zone.",
      hint: "Browse",
    };
  }, []);

  const goSignIn = useMemo(
    () =>
      withTick(() => {
        logPress("home_sign_in", "/sign-in");
        router.push("/sign-in");
      }),
    []
  );

  const goAccountSettings = useMemo(
    () =>
      withTick(() => {
        logPress("home_account_feedback", "/account-settings");
        router.push("/account-settings");
      }),
    []
  );

  const goLog = useMemo(
    () =>
      withTick(() => {
        logPress("home_log_cta", "/(tabs)/log");
        router.push("/(tabs)/log");
      }),
    []
  );

  const goDiscover = useMemo(
    () =>
      withTick(() => {
        logPress("home_discover_cta", "/(tabs)/discover");
        router.push("/(tabs)/discover");
      }),
    []
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "transparent" }}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl + spacing.lg,
        paddingBottom: spacing.xl * 2,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ gap: spacing.md }}>
        <View style={{ gap: spacing.xs }}>
          <Text style={[type.screenTitle, { fontSize: 38, lineHeight: 42, color: colors.textPrimary }]}>
            Neat Notes
          </Text>

          <Text
            style={[
              type.microcopyItalic,
              { fontSize: 20, lineHeight: 24, opacity: 0.92, color: colors.textPrimary },
            ]}
          >
            Understand your palate
          </Text>

          <View style={{ height: 1, backgroundColor: colors.glassDivider, marginTop: spacing.md }} />
        </View>

        <View style={{ gap: spacing.xs }}>
          {firstName ? (
            <Text style={[type.sectionHeader, { fontSize: 30, lineHeight: 24, opacity: 0.92 }]}>
              {firstName},
            </Text>
          ) : null}

          <Text style={[type.sectionHeader, { fontSize: 20, lineHeight: 26, color: colors.textPrimary }]}>
            {dynamic.headline}
          </Text>

          <Text
            style={[
              type.microcopyItalic,
              { fontSize: 18, lineHeight: 22, opacity: 0.8, color: colors.textPrimary },
            ]}
          >
            {dynamic.subline}
          </Text>

          <View style={{ marginTop: spacing.sm }}>
            <View
              style={{
                height: 2,
                marginTop: 8,
                alignSelf: "center",
                width: "92%",
                backgroundColor: "rgba(190, 150, 99, 0.14)",
                borderRadius: 999,
                opacity: 0.55,
              }}
            />
            <View
              style={{
                height: 2,
                marginTop: -2,
                alignSelf: "center",
                width: "44%",
                backgroundColor: "rgba(190, 150, 99, 0.38)",
                borderRadius: 999,
                opacity: 0.65,
              }}
            />
          </View>
        </View>

        {!isAuthed ? (
          <View style={{ gap: spacing.xs }}>
            <Text style={[type.sectionHeader, { fontSize: 21, lineHeight: 25, color: colors.textPrimary }]}>
              Sign in
            </Text>
            <ActionBodyCard
              subtitle="Create an account to sync tastings across devices."
              rightHint="Continue"
              onPress={goSignIn}
            />
          </View>
        ) : null}

      <View style={{ gap: 6 }}>
  <Text style={[type.sectionHeader, { fontSize: 20, lineHeight: 25, color: colors.textPrimary }]}>
    {logCopy.title}
  </Text>
          <ActionBodyCard subtitle={logCopy.subtitle} rightHint={logCopy.hint} onPress={goLog} />
          <View
    style={{
      height: 3,
      width: 46,
      borderRadius: 999,
      backgroundColor: colors.accent,
      opacity: 0.65,
    }}
  />
        </View>

       <View style={{ gap: 6 }}>
  <Text style={[type.sectionHeader, { fontSize: 20, lineHeight: 25, color: colors.textPrimary }]}>
    {discoverCopy.title}
  </Text>
          <ActionBodyCard subtitle={discoverCopy.subtitle} rightHint={discoverCopy.hint} onPress={goDiscover} />
          <View
    style={{
      height: 3,
      width: 46,
      borderRadius: 999,
      backgroundColor: colors.accent,
      opacity: 0.65,
    }}
  />
        </View>

        <View style={{ marginTop: spacing.sm }}>
          <View
            style={{
              height: 2,
              marginTop: 8,
              alignSelf: "center",
              width: "92%",
              backgroundColor: "rgba(190, 150, 99, 0.14)",
              borderRadius: 999,
              opacity: 0.55,
            }}
          />
          <View
            style={{
              height: 2,
              marginTop: -2,
              alignSelf: "center",
              width: "44%",
              backgroundColor: "rgba(190, 150, 99, 0.38)",
              borderRadius: 999,
              opacity: 0.65,
            }}
          />
        </View>

        {isAuthed ? (
          <View style={{ marginTop: spacing.md + 4 }}>
            <SubtleNotice
              title="Founding Tester (Beta)"
              subtitle="Your tastings are private. If something feels off, send feedback — it helps us harden the app."
              cta="Account & feedback"
              onPress={goAccountSettings}
            />
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}