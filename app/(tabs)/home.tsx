// app/(tabs)/home.tsx
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

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
  // iOS shadow tuning
  shadowColor: colors.shadowWarm ?? colors.shadow,
  shadowOpacity: 0.55,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  // Android tuning
  elevation: 10,
};

/**
 * Premium action card:
 * - Title lives outside (header)
 * - Card is tappable
 * - Inside card: subtext + a single "hint pill"
 */
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
        backgroundColor: colors.surfaceRaised, // ✅ slight lift tint vs other surfaces
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.divider, // ✅ calm outline

        // ✅ Whoop-ish profile: wider/shorter card
        paddingVertical: 13,
        paddingHorizontal: spacing.lg,

        ...warmCardShadow,

        // ✅ subtle press feedback (no scale to avoid any weirdness)
        opacity: pressed ? 0.94 : 1,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
        {/* Left: subtitle */}
        <View style={{ flex: 1 }}>
          <Text
            style={[
              type.microcopyItalic,
              {
                fontSize: 15.5, // ✅ micro smaller
                lineHeight: 22,
                opacity: 0.84, // ✅ consistent whisper
              },
            ]}
          >
            {subtitle}
          </Text>
        </View>

        {/* Right: hint pill */}
        {rightHint ? (
          <View
            style={{
              width: 108, // ✅ fixed width so Continue/Browse align
              paddingVertical: 7,
              borderRadius: 999,
              alignItems: "center",

              // ✅ calmer than “tan button”, still on-brand
              backgroundColor: colors.accentFaint,
              borderWidth: 1,
              borderColor: colors.borderSubtle,

              // ✅ tiny lift so it reads like an intentional control
              shadowColor: colors.shadowWarm ?? colors.shadow,
              shadowOpacity: 0.25,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 6 },
              elevation: 4,
            }}
          >
            <Text
              style={[
                type.caption,
                {
                  color: colors.textSecondary, // ✅ less shouty than textPrimary
                  opacity: 0.95,
                  letterSpacing: 0.25,
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

        // ✅ slightly tighter so it doesn’t “anchor” the page too hard
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,

        borderWidth: 1,

        // ✅ tint shift so it’s not identical to action cards
        backgroundColor: colors.surface,
        borderColor: colors.divider,

        ...warmCardShadow,
        opacity: pressed ? 0.94 : 1,
        gap: 10,
      })}
    >
      <Text style={[type.body, { fontWeight: "700" }]}>{title}</Text>

      <Text
        style={[
          type.microcopyItalic,
          {
            fontSize: 15,
            lineHeight: 21,
            opacity: 0.80, // ✅ matches the page’s whisper layer
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

  const goSignIn = useMemo(() => withTick(() => router.push("/sign-in")), []);
  const goAccountSettings = useMemo(() => withTick(() => router.push("/account-settings")), []);
  const goLog = useMemo(() => withTick(() => router.push("/(tabs)/log")), []);
  const goDiscover = useMemo(() => withTick(() => router.push("/(tabs)/discover")), []);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl + spacing.lg,
        paddingBottom: spacing.xl * 2,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ gap: spacing.md }}>
        {/* Brand header */}
        <View style={{ gap: spacing.xs }}>
          <Text style={[type.screenTitle, { fontSize: 38, lineHeight: 42 }]}>Neat Notes</Text>

          <Text style={[type.microcopyItalic, { fontSize: 18, lineHeight: 24, opacity: 0.92 }]}>
            Understand your palate
          </Text>

          <View style={{ height: 1, backgroundColor: colors.divider, marginTop: spacing.md }} />
        </View>

        {/* Greeting + dynamic guidance */}
        <View style={{ gap: spacing.xs }}>
          {firstName ? (
            <Text style={[type.body, { fontSize: 18, fontWeight: "600", opacity: 0.92 }]}>
              {firstName},
            </Text>
          ) : null}

          <Text style={[type.sectionHeader, { fontSize: 22, lineHeight: 26 }]}>
            {dynamic.headline}
          </Text>

          <Text style={[type.microcopyItalic, { fontSize: 16, lineHeight: 22, opacity: 0.9 }]}>
            {dynamic.subline}
          </Text>

          {/* ✅ Divider: fades at edges, brighter center (no gradient asset needed) */}
          <View style={{ marginTop: spacing.sm }}>
            
            <View
              style={{
                height: 2,
                marginTop: 8,
                alignSelf: "center",
                width: "92%",
                backgroundColor: colors.accentFaint,
                borderRadius: 999,
                opacity: 0.35, // outer haze
              }}
            />
            <View
              style={{
                height: 2,
                marginTop: -2,
                alignSelf: "center",
                width: "44%",
                backgroundColor: colors.accent,
                borderRadius: 999,
                opacity: 0.55, // center sharpen
              }}
            />
          </View>
        </View>

        {/* SIGN IN (if not authed) */}
        {!isAuthed ? (
          <View style={{ gap: spacing.xs }}>
            <Text style={[type.sectionHeader, { fontSize: 21, lineHeight: 25 }]}>Sign in</Text>
            <ActionBodyCard
              subtitle="Create an account to sync tastings across devices."
              rightHint="Continue"
              onPress={goSignIn}
            />
          </View>
        ) : null}

        {/* LOG */}
        <View style={{ gap: spacing.xs + 3 }}>
          <Text style={[type.sectionHeader, { fontSize: 21, lineHeight: 25 }]}>{logCopy.title}</Text>
          <ActionBodyCard subtitle={logCopy.subtitle} rightHint={logCopy.hint} onPress={goLog} />
        </View>

        {/* DISCOVER */}
        <View style={{ gap: spacing.xs + 3 }}>
          <Text style={[type.sectionHeader, { fontSize: 21, lineHeight: 25 }]}>
            {discoverCopy.title}
          </Text>
          <ActionBodyCard
            subtitle={discoverCopy.subtitle}
            rightHint={discoverCopy.hint}
            onPress={goDiscover}
          />
        </View>

        {/* Beta notice */}
        {isAuthed ? (
          <SubtleNotice
            title="Founding Tester (Beta)"
            subtitle="Your tastings are private. If something feels off, send feedback — it helps us harden the app."
            cta="Account & feedback"
            onPress={goAccountSettings}
          />
        ) : null}
      </View>
    </ScrollView>
  );
}