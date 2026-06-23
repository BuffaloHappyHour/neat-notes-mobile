import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { getEventLineup, type LineupItem } from "../../../lib/eventLineup";
import { getBarrelLineup, type BarrelLineupItem } from "../../../lib/barrelApi";
import { setActiveEventId } from "../../../lib/eventStorage";
import { supabase } from "../../../lib/supabase";
import { useEventPageData } from "../../../src/events/hooks/useEventPageData";

import { radii } from "../../../lib/radii";
import { shadows } from "../../../lib/shadows";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

import type {
  MostRatedWhiskeyRow,
  RecentTastingRow,
  TopWhiskeyRow,
} from "../../../src/events/hooks/useEventPageData";

const warmCardShadow = {
  ...shadows.card,
  shadowColor: colors.shadowWarm,
  shadowOpacity: 0.42,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
};

function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMin < 1) return "Just now";
  if (diffMin === 1) return "1 min ago";
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr === 1) return "1 hr ago";
  if (diffHr < 24) return `${diffHr} hrs ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "1 day ago";
  return `${diffDay} days ago`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SectionCard({
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
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        backgroundColor: colors.glassSurface,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.lg,
        ...warmCardShadow,
      }}
    >
      <View style={{ marginBottom: spacing.sm }}>
        <Text
          style={[
            type.sectionHeader,
            { fontSize: 23, lineHeight: 28, color: colors.textPrimary },
          ]}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={[
              type.microcopyItalic,
              {
                marginTop: 4,
                fontSize: 14.5,
                lineHeight: 20,
                color: colors.textPrimary,
                opacity: 0.8,
              },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {children}
    </View>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: 72,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.glassBorderStrong,
        backgroundColor: colors.accentFaint,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: spacing.sm,
      }}
    >
      <Text
        style={[
          type.caption,
          {
            fontSize: 11.5,
            lineHeight: 16,
            letterSpacing: 1.1,
            textTransform: "uppercase",
            color: colors.textSecondary,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          type.sectionHeader,
          {
            marginTop: 4,
            fontSize: 22,
            lineHeight: 26,
            color: colors.textPrimary,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function RecentRow({
  row,
  isNewest,
}: {
  row: RecentTastingRow;
  isNewest: boolean;
}) {
  return (
    <View
      style={{
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: isNewest ? colors.glassBorderStrong : colors.glassBorder,
        backgroundColor: isNewest ? colors.accentFaint : colors.glassRaised,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
      }}
    >
      {isNewest ? (
        <Text
          style={[
            type.caption,
            {
              marginBottom: 4,
              fontSize: 11.5,
              lineHeight: 16,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: colors.accent,
            },
          ]}
        >
          Just Added
        </Text>
      ) : null}

      <Text
        style={[
          type.body,
          {
            fontSize: 16.5,
            lineHeight: 21,
            color: colors.textPrimary,
          },
        ]}
      >
        {row.whiskey_name?.trim() || "Unknown whiskey"}
      </Text>

      <Text
        style={[
          type.microcopyItalic,
          {
            marginTop: 3,
            fontSize: 13.5,
            lineHeight: 18,
            color: colors.textPrimary,
            opacity: 0.78,
          },
        ]}
      >
        {row.rating != null ? `Rated ${row.rating}` : "No rating"} •{" "}
        {formatRelativeTime(row.created_at)}
      </Text>
    </View>
  );
}

function TopWhiskeyRowCard({ row }: { row: TopWhiskeyRow }) {
  return (
    <View
      style={{
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        backgroundColor: colors.glassRaised,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View style={{ flex: 1, paddingRight: spacing.md }}>
        <Text
          style={[
            type.body,
            {
              fontSize: 16.5,
              lineHeight: 21,
              color: colors.textPrimary,
            },
          ]}
        >
          {row.whiskey_name}
        </Text>

        <Text
          style={[
            type.microcopyItalic,
            {
              marginTop: 3,
              fontSize: 13.5,
              lineHeight: 18,
              color: colors.textPrimary,
              opacity: 0.78,
            },
          ]}
        >
          {row.tasting_count} {row.tasting_count === 1 ? "tasting" : "tastings"}
        </Text>
      </View>

      <View
        style={{
          minWidth: 64,
          paddingVertical: 7,
          paddingHorizontal: 10,
          borderRadius: 999,
          alignItems: "center",
          backgroundColor: colors.accentSoft,
          borderWidth: 1,
          borderColor: colors.glassBorderStrong,
        }}
      >
        <Text
          style={[
            type.caption,
            {
              color: colors.accent,
              letterSpacing: 0.2,
            },
          ]}
        >
          {row.avg_rating?.toFixed(1)}
        </Text>
      </View>
    </View>
  );
}

function MostRatedWhiskeyRowCard({ row }: { row: MostRatedWhiskeyRow }) {
  return (
    <View
      style={{
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        backgroundColor: colors.glassRaised,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View style={{ flex: 1, paddingRight: spacing.md }}>
        <Text
          style={[
            type.body,
            {
              fontSize: 16.5,
              lineHeight: 21,
              color: colors.textPrimary,
            },
          ]}
        >
          {row.whiskey_name}
        </Text>

        <Text
          style={[
            type.microcopyItalic,
            {
              marginTop: 3,
              fontSize: 13.5,
              lineHeight: 18,
              color: colors.textPrimary,
              opacity: 0.78,
            },
          ]}
        >
          {row.tasting_count} {row.tasting_count === 1 ? "rating" : "ratings"}
          {row.avg_rating != null ? ` • Avg ${row.avg_rating.toFixed(1)}` : ""}
        </Text>
      </View>

      <View
        style={{
          minWidth: 64,
          paddingVertical: 7,
          paddingHorizontal: 10,
          borderRadius: 999,
          alignItems: "center",
          backgroundColor: colors.accentSoft,
          borderWidth: 1,
          borderColor: colors.glassBorderStrong,
        }}
      >
        <Text
          style={[
            type.caption,
            {
              color: colors.accent,
              letterSpacing: 0.2,
            },
          ]}
        >
          {row.tasting_count}
        </Text>
      </View>
    </View>
  );
}

type BottleStat = {
  whiskey_id: string;
  count: number;
  avg_rating: number | null;
};

type EventFlags = {
  is_blind: boolean;
  has_lineup: boolean;
  has_pairing: boolean;
  has_direct_from_barrel: boolean;
  pairing_notes: string | null;
  revealed_at: string | null;
  venue_id: string | null;
  venue_name_free: string | null;
  venue_city: string | null;
  venue_state: string | null;
  event_type: string | null;
  description: string | null;
  status: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  venues: {
    display_name: string;
    venue_type: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    logo_url: string | null;
    website: string | null;
    phone: string | null;
  } | null;
};

export default function EventPage() {
  const params = useLocalSearchParams();
  const eventId = useMemo(() => {
    return typeof params.id === "string" ? params.id : "";
  }, [params.id]);

  const {
    loading,
    error,
    event,
    recent,
    topWhiskies,
    mostRatedWhiskies,
    canViewHostAnalytics,
    summary,
  } = useEventPageData(eventId);

  const [flags, setFlags] = useState<EventFlags | null>(null);
  const [lineup, setLineup] = useState<LineupItem[]>([]);
  const [barrelLineup, setBarrelLineup] = useState<BarrelLineupItem[]>([]);
  const [bottleStats, setBottleStats] = useState<BottleStat[]>([]);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [checkInCode, setCheckInCode] = useState("");
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    supabase
      .from("events")
      .select(
        "is_blind, has_lineup, has_pairing, has_direct_from_barrel, pairing_notes, revealed_at, venue_id, venue_name_free, venue_city, venue_state, event_type, description, status, is_active, starts_at, ends_at, venues(display_name, venue_type, address, city, state, logo_url, website, phone)"
      )
      .eq("id", eventId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setFlags(data as unknown as EventFlags);
      });
  }, [eventId]);

  useEffect(() => {
    if (!flags?.has_lineup) return;
    if (flags.has_direct_from_barrel) {
      getBarrelLineup(eventId).then(setBarrelLineup).catch(() => {});
    } else {
      getEventLineup(eventId).then(setLineup).catch(() => {});
    }
  }, [flags?.has_lineup, flags?.has_direct_from_barrel, eventId]);

  useEffect(() => {
    if (lineup.length === 0) return;
    if (flags?.has_direct_from_barrel) return;
    const ids = lineup.map((i) => i.whiskey_id).filter(Boolean) as string[];
    if (ids.length === 0) return;

    async function fetchBottleStats() {
      const { data: eventData } = await supabase
        .from("events")
        .select("starts_at, ends_at")
        .eq("id", eventId)
        .maybeSingle();

      const [resA, resB] = await Promise.all([
        supabase
          .from("public_tastings")
          .select("id, whiskey_id, rating")
          .eq("event_id", eventId)
          .in("whiskey_id", ids),
        eventData?.starts_at && eventData?.ends_at
          ? supabase
              .from("public_tastings")
              .select("id, whiskey_id, rating")
              .gte("created_at", eventData.starts_at)
              .lte("created_at", eventData.ends_at)
              .in("whiskey_id", ids)
          : Promise.resolve({ data: [] as { id: string; whiskey_id: string | null; rating: number | null }[] }),
      ]);

      const combined = [...(resA.data ?? []), ...(resB.data ?? [])];
      const seen = new Set<string>();
      const deduped = combined.filter((r) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });

      const map = new Map<string, { count: number; ratingSum: number; ratingCount: number }>();
      deduped.forEach((r) => {
        if (!r.whiskey_id) return;
        const existing = map.get(r.whiskey_id) ?? { count: 0, ratingSum: 0, ratingCount: 0 };
        existing.count += 1;
        if (r.rating != null) {
          existing.ratingSum += r.rating;
          existing.ratingCount += 1;
        }
        map.set(r.whiskey_id, existing);
      });

      setBottleStats(
        Array.from(map.entries()).map(([whiskey_id, s]) => ({
          whiskey_id,
          count: s.count,
          avg_rating: s.ratingCount > 0 ? s.ratingSum / s.ratingCount : null,
        }))
      );
    }

    void fetchBottleStats();
    const interval = setInterval(() => { void fetchBottleStats(); }, 30000);
    return () => clearInterval(interval);
  }, [lineup, eventId]);

  useEffect(() => {
    if (!eventId) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      supabase
        .from("event_attendees")
        .select("id")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => { if (data) setCheckedIn(true); });
    })();
  }, [eventId]);

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "",
            headerTransparent: true,
            headerShadowVisible: false,
          }}
        />
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator color={colors.accent} />
          <Text
            style={[
              type.microcopyItalic,
              {
                marginTop: spacing.sm,
                color: colors.textPrimary,
                opacity: 0.8,
              },
            ]}
          >
            Loading event…
          </Text>
        </View>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "",
            headerTransparent: true,
            headerShadowVisible: false,
          }}
        />
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={[
              type.microcopyItalic,
              {
                marginTop: spacing.sm,
                color: colors.textPrimary,
                opacity: 0.8,
              },
            ]}
          >
            {error}
          </Text>
        </View>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "",
            headerTransparent: true,
            headerShadowVisible: false,
          }}
        />
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: spacing.xl,
          }}
        >
          <Text
            style={[
              type.sectionHeader,
              {
                fontSize: 26,
                lineHeight: 30,
                color: colors.textPrimary,
                textAlign: "center",
              },
            ]}
          >
            Event not found
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerTransparent: true,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: "transparent" }}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl * 2.1,
          paddingBottom: spacing.xl * 2,
          gap: spacing.sm,
        }}
      >
        {/* 1. HEADER */}
        <View style={{ marginBottom: spacing.xs }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }} />

            <Text
              style={[
                type.screenTitle,
                {
                  flex: 2,
                  fontSize: 31,
                  lineHeight: 36,
                  color: colors.textPrimary,
                  textAlign: "center",
                },
              ]}
            >
              {event.name}
            </Text>

            <View style={{ flex: 1, alignItems: "flex-end" }}>
              {canViewHostAnalytics ? (
                <Pressable
                  onPress={() => router.push(`/event/${eventId}/host` as any)}
                  style={({ pressed }) => ({
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: colors.glassBorderStrong,
                    backgroundColor: pressed ? colors.accentSoft : colors.accentFaint,
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <Text style={[type.caption, { color: colors.accent, fontSize: 11 }]}>Host →</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          {flags?.venues?.display_name || flags?.venue_name_free ? (
            <Text
              style={[
                type.microcopyItalic,
                {
                  marginTop: 4,
                  fontSize: 14,
                  lineHeight: 19,
                  color: colors.textPrimary,
                  opacity: 0.72,
                  textAlign: "center",
                },
              ]}
            >
              {flags.venues?.display_name ?? flags.venue_name_free}
              {flags.venues?.city || flags.venue_city
                ? ` · ${flags.venues?.city ?? flags.venue_city}`
                : ""}
            </Text>
          ) : null}
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: colors.glassDivider,
            opacity: 0.5,
          }}
        />

        {/* 2. CLASS DETAILS */}
        <Pressable
          onPress={() => setDetailsExpanded((v) => !v)}
          style={{
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.glassBorder,
            backgroundColor: colors.glassSurface,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.md,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={[type.labelCaps, { color: colors.accent, letterSpacing: 1.1 }]}>
              Class Details
            </Text>
            <Ionicons
              name={detailsExpanded ? "chevron-up" : "chevron-down"}
              size={14}
              color={colors.accent}
            />
          </View>

          {detailsExpanded ? (
            <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
              {event.starts_at || event.ends_at ? (
                <Text
                  style={[
                    type.microcopyItalic,
                    {
                      fontSize: 13.5,
                      lineHeight: 19,
                      color: colors.textPrimary,
                      opacity: 0.82,
                    },
                  ]}
                >
                  {fmtDate(event.starts_at)}
                  {event.ends_at ? ` – ${fmtDate(event.ends_at)}` : ""}
                </Text>
              ) : null}

              {flags?.event_type ? (
                <View
                  style={{
                    backgroundColor: colors.accentSoft,
                    borderRadius: 4,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text style={[type.labelCaps, { fontSize: 9, color: colors.accent }]}>
                    {flags.event_type}
                  </Text>
                </View>
              ) : null}

              {flags?.is_blind ? (
                <Text
                  style={[
                    type.microcopyItalic,
                    { fontSize: 13, color: colors.textPrimary, opacity: 0.78 },
                  ]}
                >
                  Blind tasting
                </Text>
              ) : null}

              {flags?.description ? (
                <Text
                  style={[
                    type.body,
                    {
                      fontSize: 14.5,
                      lineHeight: 21,
                      color: colors.textPrimary,
                      opacity: 0.85,
                      marginTop: 4,
                    },
                  ]}
                >
                  {flags.description}
                </Text>
              ) : null}
            </View>
          ) : null}
        </Pressable>

        {/* 3. HAPPENING NOW */}
        {recent.length > 0 ? (
          <View
            style={{
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.glassBorderStrong,
              backgroundColor: colors.accentFaint,
              overflow: "hidden",
              paddingVertical: spacing.lg,
              paddingHorizontal: spacing.lg,
              paddingLeft: spacing.lg + 3,
              ...warmCardShadow,
            }}
          >
            <View
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                backgroundColor: colors.accent,
              }}
            />
            <Text style={[type.labelCaps, { color: colors.accent }]}>Happening Now</Text>
            <Text
              style={[
                type.sectionHeader,
                {
                  marginTop: 4,
                  fontSize: 20,
                  lineHeight: 26,
                  color: colors.textPrimary,
                },
              ]}
            >
              {flags?.is_blind && !flags?.revealed_at
                ? "Blind Tasting in Progress"
                : `${recent[0].whiskey_name?.trim() || "A whiskey"} just got poured`}
            </Text>
            <Text
              style={[
                type.caption,
                {
                  marginTop: 4,
                  color: colors.textSecondary,
                  opacity: 0.8,
                },
              ]}
            >
              {formatRelativeTime(recent[0].created_at)}
            </Text>
          </View>
        ) : null}

        {/* 4. EVENT SNAPSHOT */}
        <View
          style={{
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.glassBorder,
            backgroundColor: colors.glassSurface,
            paddingVertical: spacing.lg,
            paddingHorizontal: spacing.lg,
            ...warmCardShadow,
          }}
        >
          <Text
            style={[
              type.sectionHeader,
              {
                fontSize: 18,
                lineHeight: 23,
                color: colors.textPrimary,
                marginBottom: spacing.sm,
              },
            ]}
          >
            Event Snapshot
          </Text>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <MetricPill label="Participants" value={String(summary.uniqueUsers)} />
            <MetricPill label="Total Tastings" value={String(summary.tastingCount)} />
          </View>
          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
            <MetricPill label="Unique Whiskies" value={String(summary.uniqueNames)} />
            <MetricPill
              label="Avg Rating"
              value={summary.averageRating != null ? summary.averageRating.toFixed(1) : "—"}
            />
          </View>
        </View>

        {/* CHECK-IN */}
        {checkedIn ? (
          <View
            style={{
              alignItems: "center",
              paddingVertical: 10,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.glassBorderStrong,
              backgroundColor: colors.accentFaint,
            }}
          >
            <Text style={[type.caption, { color: colors.accent }]}>✓ Checked In</Text>
          </View>
        ) : (!flags?.is_active || (flags?.ends_at != null && new Date(flags.ends_at) < new Date())) ? (
          <View
            style={{
              alignItems: "center",
              paddingVertical: 10,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              backgroundColor: "transparent",
              opacity: 0.45,
            }}
          >
            <Text style={[type.caption, { color: colors.textMuted }]}>Event Ended</Text>
          </View>
        ) : (
          <Pressable
            onPress={() => setCheckInModalVisible(true)}
            style={({ pressed }) => ({
              alignItems: "center",
              paddingVertical: 14,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.borderStrong,
              backgroundColor: colors.accentFaint,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={[type.button, { color: colors.accent }]}>
              Check In to This Event →
            </Text>
          </Pressable>
        )}

        {/* 5. TONIGHT'S LINEUP */}
        {flags?.has_lineup && flags.has_direct_from_barrel && barrelLineup.length > 0 ? (
          <View style={{ gap: spacing.xs }}>
            <Text
              style={[
                type.labelCaps,
                { color: colors.accent, letterSpacing: 1.1, marginBottom: 4 },
              ]}
            >
              Tonight's Barrels
            </Text>
            {barrelLineup.map((barrel, index) => (
              <View
                key={barrel.lineupId}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: colors.glassBorder,
                  backgroundColor: colors.glassRaised,
                  gap: spacing.sm,
                }}
              >
                <Text
                  style={[
                    type.caption,
                    { color: colors.accent, minWidth: 22, textAlign: "center" },
                  ]}
                >
                  {index + 1}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[type.body, { fontSize: 16, lineHeight: 21, color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {barrel.distilleryName}
                  </Text>
                  <Text
                    style={[
                      type.microcopyItalic,
                      { fontSize: 12.5, color: colors.textPrimary, opacity: 0.65, marginTop: 2 },
                    ]}
                  >
                    {[
                      `Barrel #${barrel.barrelNumber}`,
                      barrel.whiskeyTypeName,
                      barrel.proof != null ? `${barrel.proof} proof` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </View>
                <Pressable
                  onPress={() =>
                    router.push(
                      `/log/barrel-tasting?barrelId=${encodeURIComponent(barrel.barrelId)}&eventId=${encodeURIComponent(eventId)}` as any
                    )
                  }
                  style={({ pressed }) => ({
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: colors.glassBorderStrong,
                    backgroundColor: pressed ? colors.accentSoft : colors.accentFaint,
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <Text style={[type.caption, { color: colors.accent }]}>Log →</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : flags?.has_lineup && !flags.has_direct_from_barrel && lineup.length > 0 ? (
          <View style={{ gap: spacing.xs }}>
            <Text
              style={[
                type.labelCaps,
                { color: colors.accent, letterSpacing: 1.1, marginBottom: 4 },
              ]}
            >
              Tonight's Lineup
            </Text>
            {lineup.map((item, index) => {
              const hidden = flags.is_blind && !flags.revealed_at;
              return (
                <View
                  key={item.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                    borderRadius: radii.lg,
                    borderWidth: 1,
                    borderColor: colors.glassBorder,
                    backgroundColor: colors.glassRaised,
                    gap: spacing.sm,
                  }}
                >
                  <Text
                    style={[
                      type.caption,
                      { color: colors.accent, minWidth: 22, textAlign: "center" },
                    ]}
                  >
                    {index + 1}
                  </Text>
                  <View style={{ flex: 1 }}>
                    {hidden ? (
                      <Text
                        style={[
                          type.body,
                          {
                            fontSize: 16,
                            lineHeight: 21,
                            color: colors.textPrimary,
                            opacity: 0.45,
                          },
                        ]}
                      >
                        ● ● ●
                      </Text>
                    ) : (
                      <Text
                        style={[
                          type.body,
                          { fontSize: 16, lineHeight: 21, color: colors.textPrimary },
                        ]}
                        numberOfLines={1}
                      >
                        {item.display_name}
                      </Text>
                    )}
                    {!hidden && (item.whiskey_type || item.proof != null) ? (
                      <Text
                        style={[
                          type.microcopyItalic,
                          {
                            fontSize: 12.5,
                            color: colors.textPrimary,
                            opacity: 0.65,
                            marginTop: 2,
                          },
                        ]}
                      >
                        {[
                          item.whiskey_type,
                          item.proof != null ? `${item.proof} proof` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    onPress={() =>
                      hidden
                        ? router.push(
                            `/log/cloud-tasting?whiskeyName=${encodeURIComponent(
                              item.display_name
                            )}&whiskeyId=${encodeURIComponent(item.whiskey_id)}&isBlind=true&blindPosition=${index + 1}&eventId=${encodeURIComponent(eventId)}` as any
                          )
                        : router.push(
                            `/log/cloud-tasting?whiskeyName=${encodeURIComponent(
                              item.display_name
                            )}&whiskeyId=${encodeURIComponent(item.whiskey_id)}&lockName=1&eventId=${encodeURIComponent(eventId)}` as any
                          )
                    }
                    style={({ pressed }) => ({
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: colors.glassBorderStrong,
                      backgroundColor: pressed ? colors.accentSoft : colors.accentFaint,
                      opacity: pressed ? 0.9 : 1,
                    })}
                  >
                    <Text style={[type.caption, { color: colors.accent }]}>Log →</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : null}

        {/* 6. BOTTLE STATS */}
        {lineup.length > 0 ? (
          <View style={{ gap: spacing.xs }}>
            <Text
              style={[
                type.labelCaps,
                { color: colors.accent, letterSpacing: 1.1, marginBottom: 4 },
              ]}
            >
              Bottle Stats
            </Text>
            {lineup.map((item, index) => {
              const hidden = flags?.is_blind && !flags?.revealed_at;
              const stat = bottleStats.find((s) => s.whiskey_id === item.whiskey_id);
              return (
                <View
                  key={`stat-${item.id}`}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                    borderRadius: radii.lg,
                    borderWidth: 1,
                    borderColor: colors.glassBorder,
                    backgroundColor: colors.glassRaised,
                    gap: spacing.sm,
                  }}
                >
                  <Text
                    style={[
                      type.caption,
                      { color: colors.accent, minWidth: 22, textAlign: "center" },
                    ]}
                  >
                    {index + 1}
                  </Text>
                  <View style={{ flex: 1 }}>
                    {hidden ? (
                      <Text
                        style={[
                          type.body,
                          {
                            fontSize: 15.5,
                            lineHeight: 20,
                            color: colors.textPrimary,
                            opacity: 0.45,
                          },
                        ]}
                      >
                        ● ● ●
                      </Text>
                    ) : (
                      <Text
                        style={[
                          type.body,
                          { fontSize: 15.5, lineHeight: 20, color: colors.textPrimary },
                        ]}
                        numberOfLines={1}
                      >
                        {item.display_name}
                      </Text>
                    )}
                    <Text
                      style={[
                        type.microcopyItalic,
                        {
                          fontSize: 12.5,
                          color: colors.textPrimary,
                          opacity: 0.68,
                          marginTop: 2,
                        },
                      ]}
                    >
                      {stat ? stat.count : 0}{" "}
                      {(stat?.count ?? 0) === 1 ? "tasting" : "tastings"}
                      {stat?.avg_rating != null ? ` · Avg ${stat.avg_rating.toFixed(1)}` : " · —"}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>

      {/* CHECK-IN MODAL */}
      <Modal
        visible={checkInModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setCheckInModalVisible(false);
          setCheckInCode("");
          setCheckInError(null);
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.7)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: spacing.lg,
          }}
        >
          <View
            style={{
              width: "100%",
              backgroundColor: colors.glassSurface,
              borderRadius: radii.lg,
              padding: spacing.lg,
              gap: spacing.md,
            }}
          >
            <Text
              style={[
                type.sectionHeader,
                { fontSize: 20, lineHeight: 26, color: colors.textPrimary },
              ]}
            >
              Enter Check-In Code
            </Text>

            <TextInput
              value={checkInCode}
              onChangeText={setCheckInCode}
              autoCapitalize="characters"
              placeholder="e.g. BOURBON"
              placeholderTextColor={colors.textMuted}
              style={[
                type.body,
                {
                  color: colors.textPrimary,
                  backgroundColor: colors.glassRaised,
                  borderWidth: 1,
                  borderColor: colors.glassBorderStrong,
                  borderRadius: radii.lg,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                },
              ]}
            />

            {checkInError ? (
              <Text style={[type.caption, { color: colors.danger }]}>
                {checkInError}
              </Text>
            ) : null}

            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Pressable
                onPress={() => {
                  setCheckInModalVisible(false);
                  setCheckInCode("");
                  setCheckInError(null);
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: colors.glassBorderStrong,
                  alignItems: "center",
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text style={[type.button, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>

              <Pressable
                disabled={checkInLoading}
                onPress={async () => {
                  setCheckInLoading(true);
                  const { data, error: rpcError } = await supabase.rpc(
                    "checkin_to_event",
                    {
                      p_event_id: eventId,
                      p_checkin_code: checkInCode.trim(),
                    }
                  );
                  if (rpcError) {
                    setCheckInError(rpcError.message);
                  } else if (data === false) {
                    setCheckInError("Incorrect code. Try again.");
                  } else {
                    setCheckedIn(true);
                    setCheckInModalVisible(false);
                    await setActiveEventId(eventId);
                    setCheckInCode("");
                    setCheckInError(null);
                  }
                  setCheckInLoading(false);
                }}
                style={({ pressed }) => ({
                  flex: 2,
                  paddingVertical: 12,
                  borderRadius: 999,
                  backgroundColor: colors.accent,
                  alignItems: "center",
                  opacity: checkInLoading ? 0.6 : pressed ? 0.85 : 1,
                })}
              >
                {checkInLoading ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text style={[type.button, { color: colors.background }]}>Check In</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
