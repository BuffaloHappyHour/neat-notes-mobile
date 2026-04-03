import { Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

type EventHeader = {
  id: string;
  name: string;
  starts_at: string | null;
  ends_at: string | null;
};

type RecentTastingRow = {
  id: string;
  whiskey_name: string | null;
  rating: number | null;
  created_at: string;
};

type TopWhiskeyRow = {
  whiskey_name: string;
  avg_rating: number;
  tasting_count: number;
};

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
          {row.avg_rating.toFixed(1)}
        </Text>
      </View>
    </View>
  );
}

export default function EventPage() {
  const params = useLocalSearchParams();
  const eventId = useMemo(() => {
    return typeof params.id === "string" ? params.id : "";
  }, [params.id]);

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventHeader | null>(null);
  const [recent, setRecent] = useState<RecentTastingRow[]>([]);
  const [topWhiskies, setTopWhiskies] = useState<TopWhiskeyRow[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadEventPage() {
      if (!eventId) {
        if (mounted) setLoading(false);
        return;
      }

      setLoading(true);

      const [{ data: eventData }, { data: recentData }, { data: topData }] =
        await Promise.all([
          supabase
            .from("events")
            .select("id, name, starts_at, ends_at")
            .eq("id", eventId)
            .maybeSingle(),
          supabase
            .from("tastings")
            .select("id, whiskey_name, rating, created_at")
            .eq("event_id", eventId)
            .order("created_at", { ascending: false })
            .limit(12),
          supabase.rpc("event_top_whiskies", {
            p_event_id: eventId,
            p_limit: 10,
          }),
        ]);

      if (!mounted) return;

      setEvent((eventData as EventHeader | null) ?? null);
      setRecent((recentData as RecentTastingRow[] | null) ?? []);
      setTopWhiskies((topData as TopWhiskeyRow[] | null) ?? []);
      setLoading(false);
    }

    void loadEventPage();

    return () => {
      mounted = false;
    };
  }, [eventId]);

  const summary = useMemo(() => {
    const tastingCount = recent.length;
    const uniqueNames = new Set(
      recent.map((r) => (r.whiskey_name ?? "").trim()).filter(Boolean)
    ).size;

    return {
      tastingCount,
      uniqueNames,
    };
  }, [recent]);

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
        }}
      >
        <View style={{ marginBottom: spacing.sm }}>
         <Text
  style={[
    type.screenTitle,
    {
      fontSize: 31,
      lineHeight: 36,
      color: colors.textPrimary,
      textAlign: "center",
    },
  ]}
>
  {event.name}
</Text>

<Text
  style={[
    type.microcopyItalic,
    {
      marginTop: 6,
      fontSize: 16,
      lineHeight: 21,
      color: colors.textPrimary,
      opacity: 0.82,
      textAlign: "center",
    },
  ]}
>
  See what people are tasting right now.
</Text>

          <View
            style={{
              height: 1,
              backgroundColor: colors.glassDivider,
              marginTop: spacing.sm,
              opacity: 0.5,
            }}
          />
        </View>

        {recent.length > 0 ? (
          <View
            style={{
              marginBottom: spacing.sm,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.glassBorderStrong,
              backgroundColor: colors.accentFaint,
              paddingVertical: spacing.lg,
              paddingHorizontal: spacing.lg,
              ...warmCardShadow,
            }}
          >
            <Text
              style={[
                type.labelCaps,
                {
                  color: colors.accent,
                },
              ]}
            >
              Happening Now
            </Text>

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
              {recent[0].whiskey_name?.trim() || "A whiskey"} just got poured
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

        <View style={{ marginBottom: spacing.sm }}>
          <SectionCard
            title="Event Snapshot"
            subtitle="A quick look at the action so far."
          >
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <MetricPill label="Recent Pours" value={String(summary.tastingCount)} />
              <MetricPill
                label="Unique Whiskies"
                value={String(summary.uniqueNames)}
              />
            </View>
          </SectionCard>
        </View>

        <View style={{ marginBottom: spacing.sm }}>
          <SectionCard
            title="Live at This Event"
            subtitle="See what people have tried most recently."
          >
            {recent.length > 0 ? (
              <View>
                {recent.map((row, index) => (
                  <View
                    key={row.id}
                    style={{
                      marginBottom: index === recent.length - 1 ? 0 : spacing.sm,
                    }}
                  >
                    <RecentRow row={row} isNewest={index === 0} />
                  </View>
                ))}
              </View>
            ) : (
              <Text
                style={[
                  type.microcopyItalic,
                  {
                    fontSize: 14.5,
                    lineHeight: 20,
                    color: colors.textPrimary,
                    opacity: 0.78,
                  },
                ]}
              >
                Be the first to log a tasting at this event.
              </Text>
            )}
          </SectionCard>
        </View>

        <SectionCard
          title="Top Rated at This Event"
          subtitle="Highest-rated pours from event tastings so far."
        >
          {topWhiskies.length > 0 ? (
            <View>
              {topWhiskies.map((row, index) => (
                <View
                  key={`${row.whiskey_name}-${index}`}
                  style={{
                    marginBottom:
                      index === topWhiskies.length - 1 ? 0 : spacing.sm,
                  }}
                >
                  <TopWhiskeyRowCard row={row} />
                </View>
              ))}
            </View>
          ) : (
            <Text
              style={[
                type.microcopyItalic,
                {
                  fontSize: 14.5,
                  lineHeight: 20,
                  color: colors.textPrimary,
                  opacity: 0.78,
                },
              ]}
            >
              Not enough event ratings yet to rank whiskies.
            </Text>
          )}
        </SectionCard>
      </ScrollView>
    </>
  );
}