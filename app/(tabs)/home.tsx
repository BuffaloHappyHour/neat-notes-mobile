import { router } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

import { logClientEvent } from "../../lib/clientLog";
import { withTick } from "../../lib/hapticsPress";

import { useHomeStats } from "../../src/home/hooks/useHomeStats";
import { pluralize } from "../../src/home/utils/pluralize";

/**
 * Local “warm shadow” override:
 * - Keeps your global shadows.card baseline
 * - Adds warmer tone + softer spread
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
        backgroundColor: pressed
          ? "rgba(190, 150, 99, 0.12)"
          : "rgba(255, 255, 255, 0.04)",
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: pressed
          ? "rgba(190, 150, 99, 0.42)"
          : colors.glassBorder,
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

function JournalSnapshotCard({
  tastingCount,
  avgRating,
  onPress,
}: {
  tastingCount: number | null;
  avgRating: number | null;
  onPress: () => void;
}) {
  const tastingsValue = tastingCount === null ? "—" : String(tastingCount);
  const avgValue =
    avgRating === null || !Number.isFinite(avgRating) ? "—" : avgRating.toFixed(1);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: pressed
          ? "rgba(190, 150, 99, 0.42)"
          : colors.glassBorder,
        backgroundColor: pressed
          ? "rgba(190, 150, 99, 0.08)"
          : colors.glassSurface,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        ...warmCardShadow,
        opacity: pressed ? 0.97 : 1,
      })}
    >
      <View style={{ gap: spacing.sm }}>
        <Text
          style={[
            type.microcopyItalic,
            {
              fontSize: 15,
              lineHeight: 21,
              opacity: 0.84,
              color: colors.textPrimary,
            },
          ]}
        >
          A quick snapshot of your journal so far.
        </Text>

        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <View
            style={{
              flex: 1,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              backgroundColor: "rgba(255,255,255,0.03)",
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.sm,
              alignItems: "center",
              justifyContent: "center",
              minHeight: 68,
            }}
          >
            <Text
              style={[
                type.caption,
                {
                  color: colors.textSecondary,
                  fontWeight: "800",
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                },
              ]}
            >
              Tastings
            </Text>

            <Text
              style={[
                type.sectionHeader,
                {
                  marginTop: 4,
                  fontSize: 24,
                  lineHeight: 28,
                  color: colors.textPrimary,
                },
              ]}
            >
              {tastingsValue}
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              backgroundColor: "rgba(255,255,255,0.03)",
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.sm,
              alignItems: "center",
              justifyContent: "center",
              minHeight: 68,
            }}
          >
            <Text
              style={[
                type.caption,
                {
                  color: colors.textSecondary,
                  fontWeight: "800",
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                },
              ]}
            >
              Avg. Rating
            </Text>

            <Text
              style={[
                type.sectionHeader,
                {
                  marginTop: 4,
                  fontSize: 24,
                  lineHeight: 28,
                  color: colors.textPrimary,
                },
              ]}
            >
              {avgValue}
            </Text>
          </View>
        </View>

        <View style={{ alignItems: "center", marginTop: spacing.sm }}>
          <View
            style={{
              width: 260,
              paddingVertical: 9,
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
              View your profile
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function FeaturedBottleCard({
  name,
  whiskeyType,
  proof,
  featureNote,
  onPress,
}: {
  name: string;
  whiskeyType: string | null;
  proof: number | null;
  featureNote: string | null;
  onPress: () => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text
        style={[
          type.sectionHeader,
          { fontSize: 25, lineHeight: 25, color: colors.textPrimary },
        ]}
      >
        Featured Bottle
      </Text>

      <Text
        style={[
          type.microcopyItalic,
          {
            fontSize: 15,
            lineHeight: 21,
            opacity: 0.84,
            color: colors.textPrimary,
          },
        ]}
      >
        A bottle worth your attention right now.
      </Text>

      <View
        style={{
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: "rgba(190, 150, 99, 0.34)",
          backgroundColor: "rgba(190, 150, 99, 0.05)",
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.lg,
          gap: spacing.md,
          ...warmCardShadow,
        }}
      >
        <View style={{ gap: 6, alignItems: "center" }}>
          <Text
            style={[
              type.body,
              {
                color: colors.textPrimary,
                fontSize: 24,
                lineHeight: 30,
                textAlign: "center",
                letterSpacing: 0.35,
              },
            ]}
          >
            {name}
          </Text>

          <Text
            style={[
              type.caption,
              {
                color: colors.textSecondary,
                textAlign: "center",
                fontSize: 14,
                lineHeight: 18,
              },
            ]}
          >
            {whiskeyType ?? "Whiskey"}
            {proof != null ? ` • ${proof} proof` : ""}
          </Text>
        </View>

        <View style={{ alignItems: "center", marginTop: spacing.xs }}>
          <Pressable
            onPress={onPress}
            style={({ pressed }) => ({
              width: "100%",
              paddingVertical: 12,
              borderRadius: 999,
              alignItems: "center",
              backgroundColor: pressed
                ? "rgba(190, 150, 99, 0.16)"
                : "rgba(190, 150, 99, 0.10)",
              borderWidth: 1,
              borderColor: "rgba(190, 150, 99, 0.34)",
              opacity: pressed ? 0.96 : 1,
            })}
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
              Log today
            </Text>
          </Pressable>
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: "rgba(190, 150, 99, 0.18)",
            marginTop: spacing.xs,
          }}
        />

        <View style={{ gap: 6 }}>
          <Text
            style={[
              type.caption,
              {
                color: colors.accent,
                fontWeight: "700",
                letterSpacing: 0.5,
                textTransform: "uppercase",
              },
            ]}
          >
            Featured Notes
          </Text>

          <Text
            style={[
              type.microcopyItalic,
              {
                fontSize: 16,
                lineHeight: 23,
                color: colors.textPrimary,
                opacity: 0.88,
              },
            ]}
          >
            {featureNote ??
              "A bottle worth revisiting right now — balanced, inviting, and easy to recommend."}
          </Text>
        </View>
      </View>
    </View>
  );
}

function BottomCtaCard({
  title,
  subtitle,
  buttonLabel,
  onPress,
}: {
  title: string;
  subtitle: string;
  buttonLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 140,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: pressed
          ? "rgba(190, 150, 99, 0.42)"
          : colors.glassBorder,
        backgroundColor: pressed
          ? "rgba(190, 150, 99, 0.08)"
          : "rgba(255,255,255,0.04)",
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.md,
        justifyContent: "space-between",
        alignItems: "center",
        ...warmCardShadow,
        opacity: pressed ? 0.97 : 1,
      })}
    >
      <View style={{ gap: 6, alignItems: "center" }}>
        <Text
          style={[
            type.sectionHeader,
            {
              fontSize: 20,
              lineHeight: 24,
              color: colors.textPrimary,
              textAlign: "center",
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
              lineHeight: 24,
              opacity: 0.84,
              color: colors.textPrimary,
              textAlign: "center",
            },
          ]}
        >
          {subtitle}
        </Text>
      </View>

      <View
        style={{
          width: "100%",
          paddingVertical: 11,
          borderRadius: 999,
          alignItems: "center",
          backgroundColor: "rgba(190, 150, 99, 0.10)",
          borderWidth: 1,
          borderColor: "rgba(190, 150, 99, 0.34)",
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
          {buttonLabel}
        </Text>
      </View>
    </Pressable>
  );
}

export default function HomeTab() {
  const { isAuthed, firstName, tastingCount, avgRating, statsLoading } =
    useHomeStats();

  const [featured, setFeatured] = React.useState<{
  whiskeyId: string;
  name: string;
  type: string | null;
  proof: number | null;
  featureNote: string | null;
} | null>(null);

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

  useEffect(() => {
    let isMounted = true;

    async function loadFeatured() {
      const { data, error } = await supabase
        .from("featured_whiskeys")
        .select(
  `
  feature_note,
  whiskey:whiskeys (
    id,
    display_name,
    whiskey_type,
    proof
  )
`
)
        .eq("is_active", true)
        .lte("start_date", new Date().toISOString())
        .gte("end_date", new Date().toISOString())
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();
console.log("featured_whiskeys result", { data, error });
if (!isMounted || error || !data?.whiskey) return;

const whiskeyRaw = Array.isArray(data.whiskey) ? data.whiskey[0] : data.whiskey;
if (!whiskeyRaw) return;

const whiskey = whiskeyRaw as {
  id: string;
  display_name: string;
  whiskey_type: string | null;
  proof: number | null;
};

setFeatured({
  featureNote: data.feature_note ?? null,
  whiskeyId: whiskey.id,
  name: whiskey.display_name,
  type: whiskey.whiskey_type,
  proof:
    whiskey.proof == null || !Number.isFinite(Number(whiskey.proof))
      ? null
      : Number(whiskey.proof),
});
    }

    loadFeatured();

    return () => {
      isMounted = false;
    };
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

  const goSignIn = useMemo(
    () =>
      withTick(() => {
        logPress("home_sign_in", "/sign-in");
        router.push("/sign-in");
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

  const goProfile = useMemo(
    () =>
      withTick(() => {
        logPress("home_profile_cta", "/(tabs)/profile");
        router.push("/(tabs)/profile");
      }),
    []
  );

  const goFeatured = useMemo(
    () =>
      withTick(() => {
        if (!featured) return;
        logPress("home_featured_cta", `/whiskey/${featured.whiskeyId}`);
        router.push(`/whiskey/${encodeURIComponent(featured.whiskeyId)}`);
      }),
    [featured]
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
      <View style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.xs }}>
          <Text
            style={[
              type.screenTitle,
              { fontSize: 38, lineHeight: 42, color: colors.textPrimary },
            ]}
          >
            Neat Notes
          </Text>

          <Text
            style={[
              type.microcopyItalic,
              {
                fontSize: 20,
                lineHeight: 24,
                opacity: 0.92,
                color: colors.textPrimary,
              },
            ]}
          >
            Understand your palate
          </Text>

          <View
            style={{
              height: 1,
              backgroundColor: colors.glassDivider,
              marginTop: spacing.md,
            }}
          />
        </View>

        <View style={{ gap: spacing.xs }}>
          {firstName ? (
            <Text
              style={[
                type.sectionHeader,
                { fontSize: 30, lineHeight: 30, opacity: 0.92 },
              ]}
            >
              {firstName},
            </Text>
          ) : null}

          <Text
            style={[
              type.sectionHeader,
              { fontSize: 20, lineHeight: 26, color: colors.textPrimary },
            ]}
          >
            {dynamic.headline}
          </Text>

          <Text
            style={[
              type.microcopyItalic,
              {
                fontSize: 18,
                lineHeight: 22,
                opacity: 0.8,
                color: colors.textPrimary,
              },
            ]}
          >
            {dynamic.subline}
          </Text>

          <View
            style={{
              height: 1,
              backgroundColor: colors.glassDivider,
              marginTop: spacing.md,
            }}
          />
        </View>

        {!isAuthed ? (
          <View style={{ gap: spacing.xs }}>
            <Text
              style={[
                type.sectionHeader,
                { fontSize: 21, lineHeight: 25, color: colors.textPrimary },
              ]}
            >
              Sign in
            </Text>

            <ActionBodyCard
              subtitle="Create an account to sync tastings across devices."
              rightHint="Continue"
              onPress={goSignIn}
            />
          </View>
        ) : null}

        {isAuthed ? (
          <View style={{ gap: 6 }}>
            <Text
              style={[
                type.sectionHeader,
                { fontSize: 25, lineHeight: 30, color: colors.textPrimary },
              ]}
            >
              Your Journal
            </Text>

            <JournalSnapshotCard
              tastingCount={tastingCount}
              avgRating={avgRating}
              onPress={goProfile}
            />
          </View>
        ) : null}

        {featured ? (
          <FeaturedBottleCard
  name={featured.name}
  whiskeyType={featured.type}
  proof={featured.proof}
  featureNote={featured.featureNote}
  onPress={goFeatured}
/>
        ) : null}

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

        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <BottomCtaCard
              title="Log"
              subtitle="Capture your next pour."
              buttonLabel="Continue"
              onPress={goLog}
            />
            <BottomCtaCard
              title="Discover"
              subtitle="Explore trending whiskies."
              buttonLabel="Browse"
              onPress={goDiscover}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}