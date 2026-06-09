import { router, useFocusEffect } from "expo-router";
import * as StoreReview from "expo-store-review";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { clearActiveEventId, getActiveEventId } from "../../lib/eventStorage";
import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

import { Ionicons } from "@expo/vector-icons";
import { logClientEvent } from "../../lib/clientLog";

import { withTick } from "../../lib/hapticsPress";

import { type RecommendationItem, useHomeStats } from "../../src/home/hooks/useHomeStats";
import { getTierCopy } from "../../src/palate/constants/palateTiers";
import type { PalateClarityTierLabel } from "../../src/palate/palateClarity.service";
import { InsightsCTA } from "../../src/profile/components/InsightsCTA";

const warmCardShadow = {
  ...shadows.card,
  shadowColor: colors.shadowWarm ?? colors.shadow,
  shadowOpacity: 0.55,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  elevation: 10,
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
      <Text style={[type.statNumber, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[type.caption, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}


const PALATE_3_NODES = [
  { label: "Emerging" },
  { label: "Defining" },
  { label: "Signature" },
];

function get3NodeIndex(tierLabel: PalateClarityTierLabel | null): number {
  if (!tierLabel || tierLabel === "Emerging") return 0;
  if (tierLabel === "Developing" || tierLabel === "Defining") return 1;
  return 2;
}

function PalateInsightsCard({
  tierLabel,
  clarityIndex,
  tastingCount,
  avgRating,
  topAffinities,
  isPremium,
  onPress,
  onInsightsCTA,
}: {
  tierLabel: PalateClarityTierLabel | null;
  clarityIndex: number | null;
  tastingCount: number | null;
  avgRating: number | null;
  topAffinities: string[];
  isPremium: boolean;
  onPress: () => void;
  onInsightsCTA: () => void;
}) {
  const clarity = clarityIndex ?? 0;
  const fillPct = `${Math.min(100, clarity)}%` as `${number}%`;
  const currentNode = get3NodeIndex(tierLabel);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.borderStrong,
        backgroundColor: colors.glassSurface,
        padding: spacing.cardPadding,
        gap: spacing.sm,
        ...warmCardShadow,
        opacity: pressed ? 0.97 : 1,
      })}
    >
      {/* Tier label + clarity index */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={[type.labelCaps, { color: colors.accent }]}>
          {tierLabel ?? "Emerging"}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 3 }}>
          <Text style={[type.statNumber, { color: colors.textPrimary }]}>
            {Math.round(clarity)}
          </Text>
          <Text style={[type.caption, { color: colors.textSecondary }]}>clarity</Text>
        </View>
      </View>

      {/* Clarity progress bar */}
      <View
        style={{
          width: "100%",
          height: 2,
          backgroundColor: colors.accentFaint,
          borderRadius: 999,
        }}
      >
        <View
          style={{
            width: fillPct,
            height: 2,
            backgroundColor: colors.accent,
            borderRadius: 999,
          }}
        />
      </View>

      {/* Stat row: Tastings + Avg Rating */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: spacing.xs,
        }}
      >
        <StatCell
          label="Tastings"
          value={tastingCount === null ? "—" : String(tastingCount)}
        />
        <View style={{ width: 0.5, height: 28, backgroundColor: colors.borderSubtle }} />
        <StatCell
          label="Avg. Rating"
          value={avgRating === null ? "—" : avgRating.toFixed(1)}
        />
      </View>

      {/* Flavor chips */}
      {topAffinities.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
          {topAffinities.slice(0, 3).map((a) => (
            <View
              key={a}
              style={{
                borderWidth: 0.5,
                borderColor: colors.borderStrong,
                backgroundColor: colors.accentFaint,
                borderRadius: 2,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text style={[type.caption, { color: colors.accent }]}>{a}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={[type.microcopyItalic, { color: colors.textTertiary }]}>
          Log tastings with flavor notes to reveal your signature.
        </Text>
      )}

      {/* 3-node tier progression */}
      <View style={{ width: "100%", paddingVertical: spacing.sm }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            height: 14,
          }}
        >
          {/* Connector line */}
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: 1,
              backgroundColor: colors.borderStrong,
              top: 6,
              zIndex: 0,
            }}
          />
          {/* Nodes */}
          {PALATE_3_NODES.map((node, i) => {
            const isCurrent = i === currentNode;
            const isPastOrCurrent = i <= currentNode;
            const nodeSize = isCurrent ? 14 : 10;
            return (
              <View
                key={node.label}
                style={{
                  width: nodeSize,
                  height: nodeSize,
                  borderRadius: nodeSize / 2,
                  backgroundColor: isPastOrCurrent ? colors.accent : colors.background,
                  borderWidth: 1,
                  borderColor: isPastOrCurrent ? colors.accent : colors.borderStrong,
                  zIndex: 1,
                  ...(isCurrent
                    ? {
                        shadowColor: colors.accent,
                        shadowOpacity: 0.6,
                        shadowRadius: 6,
                        shadowOffset: { width: 0, height: 0 },
                        elevation: 4,
                      }
                    : {}),
                }}
              />
            );
          })}
        </View>

        {/* Node labels */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 8,
          }}
        >
          {PALATE_3_NODES.map((node, i) => (
            <Text
              key={node.label}
              style={[
                type.caption,
                {
                  flex: 1,
                  textAlign: "center",
                  color: i === currentNode ? colors.accent : colors.textMuted,
                  fontWeight: i === currentNode ? "700" : undefined,
                },
              ]}
            >
              {node.label}
            </Text>
          ))}
        </View>
      </View>

      {/* Compact InsightsCTA — always shown; component handles premium vs free display */}
      <Pressable onPress={(e) => { e.stopPropagation?.(); }}>
        <InsightsCTA isPremium={isPremium} compact={true} onPress={onInsightsCTA} />
      </Pressable>
    </Pressable>
  );
}

function DrinkNextCard({
  name,
  whiskeyType,
  reason,
  onPress,
  blurred,
  onUnlock,
}: {
  name: string;
  whiskeyType: string | null;
  reason: string | null;
  onPress: () => void;
  blurred?: boolean;
  onUnlock?: () => void;
}) {
  return (
    <Pressable
      onPress={blurred ? onUnlock : onPress}
      style={({ pressed }) => ({
        width: 160,
        marginRight: spacing.sm,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.borderStrong,
        backgroundColor: colors.glassSurface,
        padding: spacing.md,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View style={{ opacity: blurred ? 0.3 : 1 }}>
        <Text
          style={[type.sectionHeader, { fontSize: 15, color: colors.textPrimary }]}
          numberOfLines={2}
        >
          {name}
        </Text>
        {whiskeyType ? (
          <Text style={[type.caption, { color: colors.textSecondary, marginTop: 4 }]}>
            {whiskeyType}
          </Text>
        ) : null}
        {reason ? (
          <Text
            style={[type.microcopyItalic, { color: colors.textTertiary, marginTop: spacing.xs }]}
            numberOfLines={2}
          >
            {reason}
          </Text>
        ) : null}
      </View>
      {blurred ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="lock-closed" size={16} color={colors.accent} />
          <Text style={[type.caption, { color: colors.accent }]}>Unlock with Premium</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function ActiveEventCard({
  eventName,
  onView,
  onLeave,
}: {
  eventName: string;
  onView: () => void;
  onLeave: () => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text
        style={[
          type.sectionHeader,
          { fontSize: 25, lineHeight: 30, color: colors.textPrimary },
        ]}
      >
        Active Event
      </Text>

      <Pressable
        onPress={onView}
        style={({ pressed }) => ({
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: pressed
            ? "rgba(190, 150, 99, 0.42)"
            : "rgba(190, 150, 99, 0.34)",
          backgroundColor: pressed
            ? "rgba(190, 150, 99, 0.08)"
            : "rgba(190, 150, 99, 0.05)",
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.lg,
          gap: spacing.md,
          ...warmCardShadow,
          opacity: pressed ? 0.97 : 1,
        })}
      >
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
            Checked In
          </Text>

          <Text
            style={[
              type.sectionHeader,
              {
                fontSize: 22,
                lineHeight: 28,
                color: colors.textPrimary,
              },
            ]}
          >
            {eventName}
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
            New tastings will be tagged to this event automatically.
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Pressable
            onPress={onView}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 11,
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
              View Event
            </Text>
          </Pressable>

          <Pressable
            onPress={onLeave}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 11,
              borderRadius: 999,
              alignItems: "center",
              backgroundColor: pressed
                ? "rgba(255,255,255,0.08)"
                : "rgba(255,255,255,0.04)",
              borderWidth: 1,
              borderColor: colors.glassBorder,
              opacity: pressed ? 0.96 : 1,
            })}
          >
            <Text
              style={[
                type.caption,
                {
                  color: colors.textPrimary,
                  opacity: 0.96,
                  letterSpacing: 0.25,
                  fontWeight: "700",
                },
              ]}
            >
              Leave Event
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </View>
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

        {featureNote ? (
          <>
            <View
              style={{
                height: 1,
                backgroundColor: "rgba(190, 150, 99, 0.18)",
                marginTop: spacing.xs,
              }}
            />
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
              {featureNote}
            </Text>
          </>
        ) : null}
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

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HomeTab() {
  const {
    isAuthed,
    firstName,
    tastingCount,
    avgRating,
    tierLabel,
    clarityIndex,
    topAffinities,
    recommendations,
    isPremium,
    statsLoading,
    latestTastingRating,
  } = useHomeStats();

  const [featured, setFeatured] = React.useState<{
    whiskeyId: string;
    name: string;
    type: string | null;
    proof: number | null;
    featureNote: string | null;
  } | null>(null);

  const [activeEvent, setActiveEvent] = React.useState<{
    id: string;
    name: string;
  } | null>(null);

  const reviewCheckRan = useRef(false);

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

  const loadActiveEvent = useCallback(async () => {
    const eventId = await getActiveEventId();

    if (!eventId) {
      setActiveEvent(null);
      return;
    }

    const { data, error } = await supabase
      .from("events")
      .select("id, name")
      .eq("id", eventId)
      .maybeSingle();

    if (error || !data) {
      setActiveEvent(null);
      return;
    }

    setActiveEvent({ id: data.id, name: data.name });
  }, []);

  useEffect(() => {
    void logClientEvent("screen_view", {
      screen: "home",
      detail: { ts: Date.now() },
    });
  }, []);

  useEffect(() => {
    if (!isAuthed || tastingCount === null || tastingCount < 3) return;
    if (latestTastingRating === null || latestTastingRating < 80) return;
    (async () => {
      if (reviewCheckRan.current) return;
      reviewCheckRan.current = true;
      try {
        const { data } = await supabase.auth.getSession();
        const uid = data.session?.user?.id;
        if (!uid) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("review_prompted_at")
          .eq("id", uid)
          .maybeSingle();
        const lastPrompted = profile?.review_prompted_at
          ? new Date(profile.review_prompted_at).getTime()
          : null;
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        if (lastPrompted !== null && lastPrompted > thirtyDaysAgo) return;
        const available = await StoreReview.isAvailableAsync();
        if (!available) return;
        await StoreReview.requestReview();
        await supabase
          .from("profiles")
          .update({ review_prompted_at: new Date().toISOString() })
          .eq("id", uid);
      } catch {}
    })();
  }, [isAuthed, tastingCount, latestTastingRating]);

  useFocusEffect(
    useCallback(() => {
      void loadActiveEvent();
    }, [loadActiveEvent])
  );

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

      if (__DEV__) console.log("featured_whiskeys result", { data, error });
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

    void loadFeatured();

    return () => {
      isMounted = false;
    };
  }, []);

  // Greeting copy driven by tier label
  const dynamic = useMemo(() => {
    if (!isAuthed) {
      return {
        headline: "Start your palate journey.",
        subline: "Log your first pour — Neat Notes gets clearer as you go.",
      };
    }
    if (statsLoading || tierLabel === null) {
      return {
        headline: "Checking your progress…",
        subline: "Every pour adds clarity.",
      };
    }
    return getTierCopy(tierLabel);
  }, [isAuthed, statsLoading, tierLabel]);

  const goPalateCard = useMemo(
    () =>
      withTick(() => {
        logPress("home_palate_card", "/(tabs)/profile");
        router.push("/(tabs)/profile");
      }),
    []
  );

  const goInsightsTeaser = useMemo(
    () =>
      withTick(() => {
        if (isPremium) {
          logPress("home_insights_teaser", "/(tabs)/profile");
          router.push("/(tabs)/profile");
        } else {
          logPress("home_insights_paywall", "/insights");
          router.push("/insights" as any);
        }
      }),
    [isPremium]
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

  const goEvent = useMemo(
    () =>
      withTick(() => {
        if (!activeEvent) return;
        logPress("home_active_event_view", `/event/${activeEvent.id}`);
        router.push({
          pathname: "/event/[id]",
          params: { id: activeEvent.id },
        });
      }),
    [activeEvent]
  );

  const leaveEvent = useMemo(
    () =>
      withTick(async () => {
        logPress("home_active_event_leave");
        await clearActiveEventId();
        setActiveEvent(null);
      }),
    []
  );

  const goSearchQuick = useMemo(
    () =>
      withTick(() => {
        logPress("home_search_quick", "/(tabs)/log");
        router.push("/(tabs)/log");
      }),
    []
  );

  const goScanQuick = useMemo(
    () =>
      withTick(() => {
        logPress("home_scan_quick", "/scan");
        router.push("/scan");
      }),
    []
  );

  // Map recommendations to row shape
  const recRows = useMemo(
    () =>
      recommendations.map((r: RecommendationItem) => ({
        whiskeyId: r.whiskey_id,
        whiskeyName: r.display_name,
        whiskeyType: r.whiskey_type,
        proof: r.proof,
        recommendationBasis: r.recommendationBasis,
      })),
    [recommendations]
  );

  const visibleRecs = recRows.slice(0, 2);

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

        {/* ── Header ─────────────────────────────────────────────────────── */}
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

        {/* ── Greeting ───────────────────────────────────────────────────── */}
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
        </View>

        {/* ── Log Your Next Pour ──────────────────────────────────────────── */}
        <View style={{ gap: spacing.sm }}>
          <Text style={[type.sectionHeader, { fontSize: 22, color: colors.textPrimary }]}>
            Log Your Next Pour
          </Text>

          <View style={{ flexDirection: "row", gap: spacing.sm, width: "100%" }}>
  <Pressable
    onPress={goSearchQuick}
    style={({ pressed }) => ({
      flex: 1,
      paddingVertical: 12,
      borderRadius: 999,
      alignItems: "center",
      backgroundColor: colors.accentFaint,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      opacity: pressed ? 0.75 : 1,
    })}
  >
    <Text style={[type.button, { color: colors.accent }]} numberOfLines={1} adjustsFontSizeToFit>
      Search
    </Text>
  </Pressable>

  <Pressable
    onPress={goScanQuick}
    style={({ pressed }) => ({
      flex: 1,
      paddingVertical: 12,
      borderRadius: 999,
      alignItems: "center",
      backgroundColor: colors.accentFaint,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      opacity: pressed ? 0.75 : 1,
    })}
  >
    <Text style={[type.button, { color: colors.accent }]} numberOfLines={1} adjustsFontSizeToFit>
      Scan
    </Text>
  </Pressable>
</View>

          <View style={{ height: 1, backgroundColor: colors.glassDivider, marginTop: spacing.md }} />
        </View>

        {/* ── YOUR PALATE (merged PalateInsightsCard) ─────────────────────── */}
        {isAuthed ? (
          <View style={{ gap: 6 }}>
            <Text style={[type.sectionHeader, { fontSize: 22, color: colors.textPrimary }]}>
              YOUR PALATE
            </Text>
            <PalateInsightsCard
              tierLabel={tierLabel}
              clarityIndex={clarityIndex}
              tastingCount={tastingCount}
              avgRating={avgRating}
              topAffinities={topAffinities}
              isPremium={isPremium}
              onPress={goPalateCard}
              onInsightsCTA={goInsightsTeaser}
            />
          </View>
        ) : null}

{/* ── Active Event ────────────────────────────────────────────────── */}
        {activeEvent ? (
          <ActiveEventCard
            eventName={activeEvent.name}
            onView={goEvent}
            onLeave={leaveEvent}
          />
        ) : null}

        {/* ── What to Drink Next ──────────────────────────────────────────── */}
        {isAuthed ? (
          <View style={{ gap: 6 }}>
            <Text style={[type.sectionHeader, { fontSize: 22, color: colors.textPrimary }]}>
              What to Drink Next
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.lg }}
              style={{ marginHorizontal: -spacing.lg }}
            >
              {/* Slot 0: type-based */}
              <DrinkNextCard
                key={visibleRecs[0]?.whiskeyId ?? "slot-0"}
                name={visibleRecs[0]?.whiskeyName ?? "Explore a New Bottle"}
                whiskeyType={visibleRecs[0]?.whiskeyType ?? null}
                reason={
                  visibleRecs[0]?.recommendationBasis === "whiskey_type" && visibleRecs[0]?.whiskeyType
                    ? `Popular in ${visibleRecs[0].whiskeyType}`
                    : topAffinities[0]
                    ? `Matches your ${topAffinities[0]} affinity`
                    : null
                }
                blurred={false}
                onPress={() => {
                  if (visibleRecs[0]) {
                    logPress("home_recommendation_tap", `/whiskey/${visibleRecs[0].whiskeyId}`);
                    router.push(`/whiskey/${encodeURIComponent(visibleRecs[0].whiskeyId)}`);
                  }
                }}
                onUnlock={goInsightsTeaser}
              />

              {/* Slot 1: flavor-based */}
              <DrinkNextCard
                key={visibleRecs[1]?.whiskeyId ?? "slot-1"}
                name={visibleRecs[1]?.whiskeyName ?? "Flavor Match"}
                whiskeyType={visibleRecs[1]?.whiskeyType ?? null}
                reason={
                  visibleRecs[1]?.recommendationBasis === "flavor" && topAffinities[0]
                    ? `Matches your ${topAffinities[0]} affinity`
                    : "Unlock flavor-based picks"
                }
                blurred={!isPremium}
                onPress={() => {
                  if (visibleRecs[1]) {
                    logPress("home_recommendation_tap", `/whiskey/${visibleRecs[1].whiskeyId}`);
                    router.push(`/whiskey/${encodeURIComponent(visibleRecs[1].whiskeyId)}`);
                  }
                }}
                onUnlock={goInsightsTeaser}
              />
            </ScrollView>
          </View>
        ) : null}

        {/* ── Featured Bottle ──────────────────────────────────────────────── */}
        {featured ? (
          <FeaturedBottleCard
            name={featured.name}
            whiskeyType={featured.type}
            proof={featured.proof}
            featureNote={featured.featureNote}
            onPress={goFeatured}
          />
        ) : null}

      </View>
    </ScrollView>
  );
}
