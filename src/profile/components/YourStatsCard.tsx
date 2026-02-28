import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { radii } from "../../../lib/radii";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

import { withTick } from "../../../lib/hapticsPress";

import { type TopRow } from "../types";
import { ProfileCard } from "./ProfileCard";
import { StatPill } from "./StatPill";

export function YourStatsCard({
  embedded = false,
  tastingsText,
  avgText,
  top5,
  onLongPressRow,
}: {
  embedded?: boolean;
  tastingsText: string;
  avgText: string;
  top5: TopRow[];
  onLongPressRow: (row: { id: string; whiskey_name: string | null }) => void;
}) {
  const Content = (
    <>
      <View style={{ gap: spacing.xs }}>
        <Text style={type.sectionHeader}>Statistics</Text>
        <Text style={[type.caption, { color: colors.textSecondary }]}>
          A quick snapshot of your journal so far.
        </Text>
      </View>

      <View style={{ marginTop: spacing.md, flexDirection: "row", gap: spacing.md }}>
        <StatPill label="Tastings" value={tastingsText} />
        <StatPill label="Avg. rating" value={avgText} />
      </View>

      <View
        style={{
          height: 1,
          backgroundColor: colors.divider,
          opacity: 0.65,
          marginTop: spacing.lg,
        }}
      />

      <View style={{ marginTop: spacing.md, flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
        <Text style={[type.labelCaps ?? type.body, { color: colors.textSecondary, opacity: 0.9 }]}>TOP 5</Text>
        <Text style={[type.caption, { color: colors.textSecondary }]}>Tap to open</Text>
      </View>

      {top5.length === 0 ? (
        <Text style={[type.caption, { marginTop: spacing.sm, color: colors.textSecondary }]}>No ratings yet.</Text>
      ) : (
        <View
          style={{
            marginTop: spacing.sm,
            borderWidth: 1,
            borderColor: colors.divider,
            borderRadius: radii.lg,
            overflow: "hidden",
            backgroundColor: colors.surfaceSunken ?? colors.surface,
          }}
        >
          {top5.map((r, idx) => {
            const nm = (r.whiskey_name ?? "Whiskey").trim() || "Whiskey";
            const rt =
              r.rating == null || !Number.isFinite(Number(r.rating)) ? "—" : String(Math.round(Number(r.rating)));

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
                  alignItems: "center",
                  paddingVertical: 10, // ✅ condensed
                  paddingHorizontal: spacing.md,
                  borderBottomWidth: idx === top5.length - 1 ? 0 : 1,
                  borderBottomColor: colors.divider,
                  backgroundColor: pressed ? (colors.accentFaint ?? colors.highlight) : "transparent",
                })}
              >
                {/* Smaller rank */}
                <Text style={[type.caption, { width: 22, color: colors.textSecondary, opacity: 0.9 }]}>
                  {idx + 1}
                </Text>

                {/* Name */}
                <Text style={[type.body, { flex: 1, color: colors.textPrimary }]} numberOfLines={1}>
                  {nm}
                </Text>

                {/* Rating */}
                <Text style={[type.body, { width: 54, textAlign: "right", color: colors.textPrimary, opacity: 0.95 }]}>
                  {rt}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </>
  );

  if (embedded) return <View style={{ gap: spacing.md }}>{Content}</View>;

  return (
    <ProfileCard title="Statistics" subtitle="A quick snapshot of your journal so far.">
      {Content}
    </ProfileCard>
  );
}