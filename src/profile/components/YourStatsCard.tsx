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
      {/* ===== Statistics (tight) ===== */}
      <View style={{ gap: 2 }}>
        <Text style={[type.sectionHeader, { fontSize: 16 }]}>Statistics</Text>
        <Text style={[type.caption, { color: colors.textSecondary, opacity: 0.9 }]}>
          A quick snapshot of your journal so far.
        </Text>
      </View>

      <View style={{ marginTop: spacing.sm, flexDirection: "row", gap: spacing.md }}>
        <StatPill label="Tastings" value={tastingsText} />
        <StatPill label="Avg. rating" value={avgText} />
      </View>

      {/* tighter divider */}
      <View
        style={{
          height: 1,
          backgroundColor: colors.divider,
          opacity: 0.5,
          marginTop: spacing.md,
        }}
      />

      {/* ===== Top 5 (make it POP) ===== */}
      <View
        style={{
          marginTop: spacing.md,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.md,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              backgroundColor: colors.accent,
              opacity: 0.9,
            }}
          />
          <Text style={[type.sectionHeader, { fontSize: 16 }]}>Top 5</Text>
        </View>

        <Text style={[type.body, { fontSize: 12, color: colors.accent, fontWeight: "900" }]}>
          Tap to open
        </Text>
      </View>

      {top5.length === 0 ? (
        <Text style={[type.caption, { marginTop: spacing.sm, color: colors.textSecondary }]}>
          No ratings yet.
        </Text>
      ) : (
        <View
          style={{
            marginTop: spacing.sm,

            borderWidth: 1,
            borderColor: colors.divider,
            borderRadius: radii.lg,

            // ✅ TEST PATCH: remove clipping to avoid iOS hit-testing weirdness
            // overflow: "hidden",

            backgroundColor: colors.surfaceSunken ?? colors.surface,
            position: "relative",
          }}
        >
          {/* accent rail */}
          <View
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              backgroundColor: colors.accent,
              opacity: 0.65,
            }}
          />

          {top5.map((r, idx) => {
            const nm = (r.whiskey_name ?? "Whiskey").trim() || "Whiskey";
            const rt =
              r.rating == null || !Number.isFinite(Number(r.rating))
                ? "—"
                : String(Math.round(Number(r.rating)));

            const isLast = idx === top5.length - 1;

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
                  paddingVertical: 11,
                  paddingHorizontal: spacing.md,
                  paddingLeft: spacing.md + 6,
                  borderBottomWidth: isLast ? 0 : 1,
                  borderBottomColor: colors.divider,
                  backgroundColor: pressed ? (colors.accentFaint ?? colors.highlight) : "transparent",
                })}
              >
                {/* Rank badge */}
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: colors.divider,
                    backgroundColor: colors.surface,
                    marginRight: 10,
                  }}
                >
                  <Text style={[type.caption, { color: colors.textSecondary, fontWeight: "900" }]}>
                    {idx + 1}
                  </Text>
                </View>

                {/* Name */}
                <Text
                  style={[type.body, { flex: 1, color: colors.textPrimary, fontWeight: "900" }]}
                  numberOfLines={1}
                >
                  {nm}
                </Text>

                {/* Rating */}
                <Text style={[type.body, { width: 54, textAlign: "right", color: colors.textPrimary, fontWeight: "900" }]}>
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
