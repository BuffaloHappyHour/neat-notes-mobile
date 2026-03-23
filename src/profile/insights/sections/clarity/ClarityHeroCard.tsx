import React from "react";
import { Text, View } from "react-native";

import { Card } from "../../../../../components/ui/Card";
import { radii } from "../../../../../lib/radii";
import { spacing } from "../../../../../lib/spacing";
import { colors } from "../../../../../lib/theme";
import { type } from "../../../../../lib/typography";

import { ClarityMetricRow } from "./ClarityMetricRow";
import { ClarityTierProgress } from "./ClarityTierProgress";

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

type FactorInput = {
  status: string;
  pct: number;
};

type SummaryInput = {
  clarityIndex: number;
  tastingCount: number;
  tierLabel: string;
  confidenceLabel: string;
};

function tierIndexFromLabel(label: string) {
  switch (label) {
    case "Developing":
      return 2;
    case "Defining":
      return 3;
    case "Refining":
      return 4;
    case "Signature":
    case "Signature Palate":
      return 5;
    case "Emerging":
    default:
      return 1;
  }
}

export function ClarityHeroCard({
  summary,
  factors,
}: {
  summary: SummaryInput;
  factors: {
    depth: FactorInput;
    diversity: FactorInput;
    consistency: FactorInput;
    confidence: FactorInput;
  };
}) {
  const score = Math.round(summary.clarityIndex);

  const tierLabels = [
    "Emerging",
    "Developing",
    "Defining",
    "Refining",
    "Signature",
  ];

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
      <Text style={type.labelCaps}>Palate clarity</Text>

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

        <View style={{ alignItems: "flex-end" }}>
          <Text style={type.caption}>Last 90 days</Text>
          <Text style={[type.caption, { marginTop: 6, color: colors.textSecondary }]}>
            {summary.tastingCount} tastings
          </Text>
        </View>
      </View>

      <ClarityTierProgress
        tierLabels={tierLabels}
        tierIndex={tierIndexFromLabel(summary.tierLabel)}
      />

      <SubCard>
        <Text style={[type.caption, { opacity: 0.9, marginBottom: spacing.sm }]}>
          What drives your score
        </Text>

        <View style={{ gap: spacing.sm }}>
          <ClarityMetricRow
            label="Depth"
            valueLabel={factors.depth.status}
            pct={factors.depth.pct}
          />
          <ClarityMetricRow
            label="Diversity"
            valueLabel={factors.diversity.status}
            pct={factors.diversity.pct}
          />
          <ClarityMetricRow
            label="Consistency"
            valueLabel={factors.consistency.status}
            pct={factors.consistency.pct}
          />
          <ClarityMetricRow
            label="Confidence"
            valueLabel={factors.confidence.status}
            pct={factors.confidence.pct}
          />
        </View>
      </SubCard>

      <Text style={[type.microcopyItalic, { marginTop: spacing.md }]}>
        Your recent clarity is {score}/100 across {summary.tastingCount} tastings.
        Your current tier is {summary.tierLabel.toLowerCase()} with{" "}
        {summary.confidenceLabel.toLowerCase()} confidence.
      </Text>
    </Card>
  );
}