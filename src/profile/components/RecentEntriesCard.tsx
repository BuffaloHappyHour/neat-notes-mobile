import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { radii } from "../../../lib/radii";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

import { withTick } from "../../../lib/hapticsPress";

import { type RecentRow } from "../types";
import { ProfileCard } from "./ProfileCard";

export function RecentEntriesCard({
  embedded = false,
  recentError,
  recent,
  onLongPressRow,
}: {
  embedded?: boolean;
  recentError: string;
  recent: RecentRow[];
  onLongPressRow: (row: { id: string; whiskey_name: string | null }) => void;
}) {
  const RightAction = (
    <Pressable
      onPress={withTick(() => router.push("/tasting/all" as any))}
      hitSlop={8}
      style={({ pressed }) => ({
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.borderSubtle ?? colors.divider,
        backgroundColor: pressed
          ? (colors.accentFaint ?? colors.surface)
          : (colors.surfaceSunken ?? colors.surface),
        opacity: pressed ? 0.95 : 1,
      })}
    >
      <Text style={[type.button, { color: colors.textPrimary }]}>View all</Text>
    </Pressable>
  );

  const Content = (
    <>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: spacing.md,
        }}
      >
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text style={type.sectionHeader}>Recent entries</Text>
          <Text style={[type.caption, { color: colors.textSecondary }]}>
            A quick look at your latest pours.
          </Text>
        </View>
        <View style={{ paddingTop: 2 }}>{RightAction}</View>
      </View>

      {recentError ? (
        <Text style={[type.caption, { color: colors.danger ?? colors.accent }]}>
          {recentError}
        </Text>
      ) : null}

      {/* Inset journal table */}
      <View
        style={{
          marginTop: spacing.sm,
          backgroundColor: colors.surfaceSunken ?? colors.surface,
          borderRadius: radii.lg,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.borderSubtle ?? colors.divider,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            backgroundColor: colors.surfaceSunken ?? colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.divider,
            alignItems: "center",
          }}
        >
          <Text style={[type.labelCaps, { flex: 1, color: colors.textSecondary, opacity: 0.9 }]}>
            Whiskey
          </Text>
          <Text style={[type.labelCaps, { width: 64, textAlign: "right", color: colors.textSecondary, opacity: 0.9 }]}>
            Rating
          </Text>
        </View>

        {recent.length === 0 ? (
          <View style={{ paddingVertical: spacing.lg, paddingHorizontal: spacing.md }}>
            <Text style={[type.caption, { color: colors.textSecondary }]}>No tastings yet.</Text>
          </View>
        ) : (
          recent.map((r, idx) => {
            const nm = (r.whiskey_name ?? "Whiskey").trim() || "Whiskey";
            const rt =
              r.rating == null || !Number.isFinite(Number(r.rating))
                ? "—"
                : String(Math.round(Number(r.rating)));

            return (
              <Pressable
                key={r.id}
                onPress={withTick(() =>
                  router.push(`/log/cloud-tasting?tastingId=${encodeURIComponent(r.id)}` as any)
                )}
                onLongPress={() => onLongPressRow({ id: r.id, whiskey_name: r.whiskey_name ?? null })}
                delayLongPress={260}
                hitSlop={6}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  paddingVertical: 12,
                  paddingHorizontal: spacing.md,
                  borderBottomWidth: idx === recent.length - 1 ? 0 : 1,
                  borderBottomColor: colors.divider,
                  backgroundColor: pressed ? (colors.accentSoft ?? colors.highlight) : "transparent",
                  alignItems: "center",
                })}
              >
                <Text style={[type.body, { flex: 1, color: colors.textPrimary }]} numberOfLines={1}>
                  {nm}
                </Text>

                <Text style={[type.statNumber ?? type.body, { width: 64, textAlign: "right", color: colors.textPrimary }]}>
                  {rt}
                </Text>
              </Pressable>
            );
          })
        )}
      </View>

      {recent.length > 0 ? (
        <Text style={[type.caption, { marginTop: spacing.sm, color: colors.textSecondary }]}>
          Tip: press and hold a tasting to edit or delete.
        </Text>
      ) : null}
    </>
  );

  if (embedded) return <View style={{ gap: spacing.md }}>{Content}</View>;

  return (
    <ProfileCard
      title="Recent entries"
      subtitle="A quick look at your latest pours."
      right={RightAction}
    >
      {Content}
    </ProfileCard>
  );
}