import React from "react";
import { Text, View } from "react-native";

import { Card } from "../../../../components/ui/Card";
import { radii } from "../../../../lib/radii";
import { spacing } from "../../../../lib/spacing";
import { colors } from "../../../../lib/theme";
import { type } from "../../../../lib/typography";

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function ProgressBar({ pct }: { pct: number }) {
  const safe = clamp01(pct);

  return (
    <View
      style={{
        height: 7,
        borderRadius: 999,
        backgroundColor: colors.accentFaint,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.borderSubtle,
      }}
    >
      <View
        style={{
          width: `${Math.round(safe * 100)}%`,
          height: "100%",
          backgroundColor: colors.accent,
          opacity: 0.9,
        }}
      />
    </View>
  );
}

function MetricRow({
  label,
  valueLabel,
  pct,
}: {
  label: string;
  valueLabel: string;
  pct: number; // 0..1
}) {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={type.caption}>{label}</Text>
        <Text style={type.caption}>{valueLabel}</Text>
      </View>
      <ProgressBar pct={pct} />
    </View>
  );
}

function SubCard({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        marginTop: spacing.md,
        padding: spacing.md,
        borderRadius: radii.xl,
        backgroundColor: colors.surfaceSunken,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
      }}
    >
      {children}
    </View>
  );
}

/**
 * Tier pills (5)
 * - All same base color
 * - Only opacity changes to show progression
 */
function TierProgress({
  tierLabels,
  tierIndex, // 1..5
}: {
  tierLabels: string[];
  tierIndex: number;
}) {
  const idx = Math.max(1, Math.min(5, tierIndex));

  return (
    <View style={{ marginTop: spacing.md }}>
     

      <View style={{ marginTop: 10 }}>
        {/* Pills */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          {tierLabels.map((_, i) => {
            const step = i + 1;
            const active = step <= idx;

            return (
              <View
                key={`tier-pill-${step}`}
                style={{
                  flex: 1,
                  height: 12,
                  borderRadius: 999,
                  backgroundColor: colors.accent,
                  opacity: active ? 0.6: 0.08, // ✅ same color, only opacity changes
                }}
              />
            );
          })}
        </View>

        {/* Labels */}
        <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
          {tierLabels.map((t, i) => {
            const step = i + 1;
            const isCurrent = step === idx;

            return (
              <Text
                key={`tier-lbl-${t}`}
                style={[
                  type.caption,
                  {
                    flex: 1,
                    textAlign: "center",
                    fontSize: 10, // ✅ slightly smaller so it doesn't overpower
                    opacity: isCurrent ? 0.85 : 0.45,
                    color: colors.textSecondary,
                  },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {t}
              </Text>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function ClarityDeepDive() {
  // TEMP preview values — wire real values next via useInsightsData
  const score = 56; // 0..100
  const delta30d = +4; // can be negative

  // Tier (1..5): Exploring, Emerging, Defining, Distinct, Signature
  const tierIndex = 3;
  const tierLabels = ["Exploring", "Emerging", "Defining", "Distinct", "Signature"];

  const deltaLabel = delta30d >= 0 ? `+${delta30d}` : `${delta30d}`;
  const deltaColor = delta30d >= 0 ? colors.success : colors.danger;

  return (
    <Card
      style={{
        backgroundColor: colors.surfaceRaised,
        borderRadius: radii.xxl,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderWidth: 1,
        borderColor: colors.borderStrong,
      }}
    >
      {/* Small caps label */}
      <Text style={type.labelCaps}>Palate clarity</Text>

      {/* Score row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginTop: 10,
        }}
      >
        <View style={{ flexShrink: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
            <Text style={type.heroMetric}>{score}</Text>
            <Text style={[type.caption, { marginLeft: 8, marginBottom: 10 }]}>
              / 100
            </Text>
          </View>
        </View>

        {/* ✅ keep this compact: 2 lines total */}
        <View style={{ alignItems: "flex-end" }}>
          <Text style={type.caption}>Last 30 days</Text>
          <Text style={[type.caption, { marginTop: 6, color: deltaColor }]}>
            {deltaLabel} points
          </Text>
        </View>
      </View>

      {/* ✅ Removed "Clarity tier — Defining" row (redundant) */}
      <TierProgress tierLabels={tierLabels} tierIndex={tierIndex} />

      {/* Drivers (sub-card) */}
      <SubCard>
        <Text style={[type.caption, { opacity: 0.9, marginBottom: spacing.sm }]}>
          What drives your score
        </Text>

        <View style={{ gap: spacing.sm }}>
          <MetricRow label="Depth" valueLabel="Strong" pct={0.62} />
          <MetricRow label="Diversity" valueLabel="Medium" pct={0.48} />
          <MetricRow label="Consistency" valueLabel="Medium" pct={0.52} />
          <MetricRow label="Confidence pattern" valueLabel="Medium" pct={0.44} />
        </View>
      </SubCard>

      {/* Interpretation */}
      <Text style={[type.microcopyItalic, { marginTop: spacing.md }]}>
        Your clarity improved this month as you used more specific flavor notes and stayed
        consistent across pours.
      </Text>
    </Card>
  );
}