import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { radii } from "../../../lib/radii";
import { shadows } from "../../../lib/shadows";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";
import { useEventPageData } from "../../../src/events/hooks/useEventPageData";

const warmCardShadow = {
  ...shadows.card,
  shadowColor: colors.shadowWarm,
  shadowOpacity: 0.42,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
};

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

export default function EventHostPage() {
  const params = useLocalSearchParams();
  const eventId = useMemo(() => {
    return typeof params.id === "string" ? params.id : "";
  }, [params.id]);

  const {
    loading,
    event,
    topWhiskies,
    mostRatedWhiskies,
    canViewHostAnalytics,
    summary,
  } = useEventPageData(eventId);

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
            Loading host analytics…
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

  if (!canViewHostAnalytics) {
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
            Host access only
          </Text>

          <Text
            style={[
              type.microcopyItalic,
              {
                marginTop: spacing.sm,
                fontSize: 15,
                lineHeight: 21,
                color: colors.textPrimary,
                opacity: 0.8,
                textAlign: "center",
              },
            ]}
          >
            This page is only available to assigned event hosts and admins.
          </Text>

          <Pressable
            onPress={() => router.replace(`/event/${eventId}` as any)}
            style={{
              marginTop: spacing.lg,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.glassBorderStrong,
              backgroundColor: colors.accentFaint,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
            }}
          >
            <Text style={[type.body, { color: colors.textPrimary }]}>
              Back to Event
            </Text>
          </Pressable>
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
            Host Analytics
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
            {event.name}
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

        <SectionCard
          title="Event Snapshot"
          subtitle="High-level visibility into event activity."
        >
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <MetricPill label="Total Tastings" value={String(summary.tastingCount)} />
            <MetricPill label="Participants" value={String(summary.uniqueUsers)} />
          </View>

          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
            <MetricPill label="Unique Whiskies" value={String(summary.uniqueNames)} />
            <MetricPill
              label="Avg Rating"
              value={summary.averageRating != null ? summary.averageRating.toFixed(1) : "—"}
            />
          </View>
        </SectionCard>

        <SectionCard
          title="Top Rated"
          subtitle="Highest-rated pours from this event so far."
        >
          {topWhiskies.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              {topWhiskies.slice(0, 5).map((row, index) => (
                <View
                  key={`host-top-${row.whiskey_name}-${index}`}
                  style={{
                    borderRadius: radii.lg,
                    borderWidth: 1,
                    borderColor: colors.glassBorder,
                    backgroundColor: colors.glassRaised,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.md,
                  }}
                >
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
                    {row.tasting_count} {row.tasting_count === 1 ? "tasting" : "tastings"} • Avg{" "}
                    {row.avg_rating.toFixed(1)}
                  </Text>
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
              Not enough ratings yet to rank whiskies.
            </Text>
          )}
        </SectionCard>

        <SectionCard
          title="Most Rated"
          subtitle="The pours attracting the most event activity."
        >
          {mostRatedWhiskies.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              {mostRatedWhiskies.map((row, index) => (
                <View
                  key={`host-most-${row.whiskey_name}-${index}`}
                  style={{
                    borderRadius: radii.lg,
                    borderWidth: 1,
                    borderColor: colors.glassBorder,
                    backgroundColor: colors.glassRaised,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.md,
                  }}
                >
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
              No event ratings yet.
            </Text>
          )}
        </SectionCard>
      </ScrollView>
    </>
  );
}