// src/profile/components/CategoryMixCard.tsx
import React, { useMemo } from "react";
import { Text, View } from "react-native";

import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

import { type MixRow } from "../types";
import { DonutChart } from "./DonutChart";
import { MixBar } from "./MixBar";
import { ProfileCard } from "./ProfileCard";

function pctLabel(p: number) {
  if (!Number.isFinite(p)) return "—";
  return `${Math.round(p * 100)}%`;
}

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

  const sorted = useMemo(() => {
    return [...(mix ?? [])].sort((a, b) => b.pct - a.pct);
  }, [mix]);

  const top = sorted[0];

  const topLabel = top?.label ?? null;
  const topPct = top ? pctLabel(top.pct) : null;

  const topBreakdown = useMemo(() => {
    // show the meaningful items (usually 3–5)
    const take = sorted.slice(0, 4);
    return take;
  }, [sorted]);

  const Content = (
    <>
      <View style={{ gap: 4 }}>
        <Text style={type.sectionHeader}>What you drink most</Text>
        <Text style={[type.caption, { color: colors.textSecondary }]}>
          Your category mix, based on logged pours.
        </Text>
      </View>

      {mixError ? (
        <Text
          style={[
            type.caption,
            {
              marginTop: spacing.sm,
              color: colors.danger ?? colors.accent,
              opacity: 0.95,
            },
          ]}
        >
          {mixError}
        </Text>
      ) : null}

      {mix.length === 0 ? (
        <Text
          style={[
            type.caption,
            { marginTop: spacing.sm, color: colors.textSecondary, opacity: 0.9 },
          ]}
        >
          Log a few tastings to see your breakdown.
        </Text>
      ) : (
        <>
          {/* Donut + real breakdown (right side) */}
          <View
            style={{
              marginTop: spacing.md,
              flexDirection: "row",
              gap: spacing.md, // ✅ tighter
              alignItems: "center",
            }}
          >
            <DonutChart
              rows={donutRows}
              size={132} // ✅ slightly smaller so it doesn’t dominate
              thickness={16}
              centerLabel={topLabel ?? "Top"}
              centerValue={topPct ?? ""}
            />

            <View style={{ flex: 1, gap: 8 }}>
              <View style={{ gap: 2 }}>
                <Text
                  style={[
                    type.caption,
                    { color: colors.textSecondary, opacity: 0.9 },
                  ]}
                >
                  <Text style={{ color: colors.textPrimary, fontWeight: "800" }}>
                    {mixTotal}
                  </Text>{" "}
                  tastings analyzed
                </Text>
                <Text
                  style={[
                    type.microcopyItalic,
                    { color: colors.textSecondary, opacity: 0.85 },
                  ]}
                  numberOfLines={2}
                >
                  Quick snapshot of your pours lately.
                </Text>
              </View>

              {/* ✅ Breakdown list replaces “DISTRIBUTION” block */}
              <View style={{ gap: 8 }}>
                {topBreakdown.map((m) => (
                  <View
                    key={m.label}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: spacing.sm,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        flex: 1,
                      }}
                    >
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 3,
                          backgroundColor: colors.accent,
                          opacity: Math.max(0.35, Math.min(0.95, m.alpha ?? 0.7)),
                        }}
                      />
                      <Text
                        style={[
                          type.body,
                          { fontSize: 13, opacity: 0.92, fontWeight: "700" },
                        ]}
                        numberOfLines={1}
                      >
                        {m.label}
                      </Text>
                    </View>

                    <Text
                      style={[
                        type.body,
                        {
                          fontSize: 13,
                          opacity: 0.85,
                          fontWeight: "800",
                        },
                      ]}
                    >
                      {pctLabel(m.pct)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Divider (subtle) */}
          <View
            style={{
              height: 1,
              backgroundColor: colors.divider,
              opacity: 0.45,
              marginTop: spacing.md,
            }}
          />

          {/* Existing breakdown rows (keep, but tighter) */}
          <View style={{ marginTop: spacing.sm }}>
            <MixBar rows={mix} />
          </View>

          <Text
            style={[
              type.caption,
              { marginTop: spacing.sm, color: colors.textSecondary, opacity: 0.85 },
            ]}
          >
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