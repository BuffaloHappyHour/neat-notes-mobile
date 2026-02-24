// app/(tabs)/home.tsx
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { supabase } from "../../lib/supabase";

import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

// ✅ Intentional haptics wrapper (respects user setting)
import { withTick } from "../../lib/hapticsPress";

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
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        borderRadius: radii.md,
        paddingVertical: spacing.lg,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: pressed ? colors.accentPressed : colors.accent,
        opacity: disabled ? 0.5 : pressed ? 0.95 : 1,
      })}
    >
      <Text style={[type.button, { fontSize: 17, color: colors.background }]}>
        {label}
      </Text>
    </Pressable>
  );
}

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

function pluralize(n: number, singular: string, plural = `${singular}s`) {
  return n === 1 ? singular : plural;
}

export default function HomeTab() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);

  const [tastingCount, setTastingCount] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const refreshAuthAndStats = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    const authed = !!user;

    setIsAuthed(authed);

    if (!authed) {
      setFirstName(null);
      setTastingCount(null);
      return;
    }

    const userId = user!.id;

    try {
      setStatsLoading(true);

      // 1) Fetch first_name (personalization)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", userId)
        .maybeSingle();

      if (!profileError && profile?.first_name) {
        setFirstName(profile.first_name);
      } else {
        setFirstName(null);
      }

      // 2) Fetch tasting count
      const { count, error } = await supabase
        .from("tastings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

      if (error) {
        setTastingCount(null);
      } else {
        setTastingCount(typeof count === "number" ? count : 0);
      }
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuthAndStats();
  }, [refreshAuthAndStats]);

  useFocusEffect(
    useCallback(() => {
      refreshAuthAndStats();
      return () => {};
    }, [refreshAuthAndStats])
  );

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
        subtitle: "Capture your rating and impressions — fast, clean, and consistent.",
      };
    }
    if (tastingCount <= 0) {
      return {
        title: "Log your first pour",
        subtitle: "Start simple. Neat Notes gets smarter as your history grows.",
      };
    }
    return {
      title: "Log your next pour",
      subtitle: "Build consistency. That’s how your palate becomes clear.",
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
        {/* Brand header (STATIC) */}
        <View style={{ gap: spacing.sm }}>
          <Text style={[type.screenTitle, { fontSize: 38, lineHeight: 42 }]}>
            Neat Notes
          </Text>

          <Text style={[type.microcopyItalic, { fontSize: 18, lineHeight: 24 }]}>
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

        {/* Dynamic warmth block (UNDER brand header) */}
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

          {/* Sign-in CTA lives right here when not authed */}
          {!isAuthed ? (
            <View style={{ marginTop: spacing.sm }}>
              <PrimaryButton label="Sign In / Create Account" onPress={goSignIn} />
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

        {/* Beta framing (only for authed users) */}
        {isAuthed ? (
          <InlineNotice
            title="Founding Tester (Beta)"
            subtitle="Your tastings are private. If something feels off, send feedback — it helps us harden the app."
            cta="Submit feedback"
            onPress={goAccountSettings}
          />
        ) : null}

        {/* Log */}
        <Card title={logCard.title} subtitle={logCard.subtitle}>
          <PrimaryButton label="Start Logging" onPress={goLog} />
        </Card>

        {/* Discover */}
        <Card
          title="Discover"
          subtitle="Explore whiskies and build your personal library. Community insights come later."
        >
          <PrimaryButton label="Open Discover" onPress={goDiscover} />
        </Card>
      </View>
    </ScrollView>
  );
}