import React, { useMemo } from "react";
import { Text, View } from "react-native";

import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

import { type MixRow } from "../types";
import { DonutChart } from "./DonutChart";
import { MixBar } from "./MixBar";
import { ProfileCard } from "./ProfileCard";

export function CategoryMixCard({
  embedded = false,
  mixError,
  mix,
  mixTotal,
}: {
  embedded?: boolean;
  mixError: string;
  mix: MixRow[];
  mixTotal: number;
}) {
  const donutRows = useMemo(() => {
    // MixRow already has: label, count, pct (0..1), alpha
    return mix.map((m) => ({
      label: m.label,
      pct: m.pct,
      alpha: m.alpha,
    }));
  }, [mix]);

  const topLabel = useMemo(() => {
    if (!mix || mix.length === 0) return null;
    const top = [...mix].sort((a, b) => b.pct - a.pct)[0];
    return top ? `${top.label}` : null;
  }, [mix]);

  const topPct = useMemo(() => {
    if (!mix || mix.length === 0) return null;
    const top = [...mix].sort((a, b) => b.pct - a.pct)[0];
    return top ? `${Math.round(top.pct * 100)}%` : null;
  }, [mix]);

  const Content = (
    <>
      <View style={{ gap: spacing.xs }}>
        <Text style={type.sectionHeader}>What you drink most</Text>
        <Text style={[type.caption, { color: colors.textSecondary }]}>
          Your category mix, based on logged pours.
        </Text>
      </View>

      {mixError ? (
        <Text style={[type.caption, { marginTop: spacing.sm, color: colors.danger ?? colors.accent }]}>
          {mixError}
        </Text>
      ) : null}

      {mix.length === 0 ? (
        <Text style={[type.caption, { marginTop: spacing.sm, color: colors.textSecondary }]}>
          Log a few tastings to see your breakdown.
        </Text>
      ) : (
        <>
          {/* Donut + summary */}
          <View style={{ marginTop: spacing.md, flexDirection: "row", gap: spacing.lg, alignItems: "center" }}>
            <DonutChart
              rows={donutRows}
              size={150}
              thickness={18}
              centerLabel={topLabel ?? "Top"}
              centerValue={topPct ?? ""}
            />

            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text style={[type.labelCaps ?? type.body, { color: colors.textSecondary, opacity: 0.9 }]}>
                DISTRIBUTION
              </Text>
              <Text style={[type.caption, { color: colors.textSecondary }]}>
                <Text style={{ color: colors.textPrimary }}>{mixTotal}</Text> tastings analyzed
              </Text>

              <Text style={[type.caption, { color: colors.textSecondary, marginTop: spacing.sm }]}>
                The donut is the “at a glance” view. The rows below are the details.
              </Text>
            </View>
          </View>

          {/* Existing breakdown rows */}
          <View style={{ marginTop: spacing.md }}>
            <MixBar rows={mix} />
          </View>

          <Text style={[type.caption, { marginTop: spacing.sm, color: colors.textSecondary }]}>
            Premium can add trends over time and palate shifts.
          </Text>
        </>
      )}
    </>
  );

  if (embedded) return <View style={{ gap: spacing.md }}>{Content}</View>;

  return (
    <ProfileCard title="What you drink most" subtitle="Your category mix, based on logged pours.">
      {Content}
    </ProfileCard>
  );
}