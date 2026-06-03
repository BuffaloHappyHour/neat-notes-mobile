import React, { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { spacing } from "../../../../../lib/spacing";
import { type } from "../../../../../lib/typography";
import type { PalateClarityResult } from "../../../../palate/palateClarity.service";

import { colors } from "@/lib/theme";
import { useClarityInsightsData } from "../../hooks/useClarityInsightsData";
import { ClarityDriverDashboard } from "./ClarityDriverDashboard";
import {
  ClarityFactorTiles,
  type ClarityFactorKey,
} from "./ClarityFactorTiles";
import { ClarityHeroCard } from "./ClarityHeroCard";

function DetailBlock({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ gap: 4 }}>
        <Text style={[type.body, { fontWeight: "900", fontSize: 18 }]}>{title}</Text>
        <Text style={[type.microcopyItalic, { opacity: 0.82 }]}>{subtitle}</Text>
      </View>
      {children}
    </View>
  );
}

export default function ClarityDeepDive({
  clarity,
}: {
  clarity: PalateClarityResult | null;
}) {
  const [selectedFactor, setSelectedFactor] =
    useState<ClarityFactorKey>("depth");

  const clarityDetails = useClarityInsightsData();

  if (clarityDetails.loading) {
    return (
      <View style={{ paddingVertical: spacing.xl, alignItems: "center", gap: spacing.sm }}>
        <ActivityIndicator />
        <Text style={[type.caption, { opacity: 0.75 }]}>
          Building your clarity insights…
        </Text>
      </View>
    );
  }

  const activeDetail = clarityDetails.details[selectedFactor];
  const pathToDistinct = clarityDetails.details.pathToDistinct;

return (
  <View style={{ gap: spacing.lg }}>

    <ClarityHeroCard summary={clarityDetails.summary} factors={clarityDetails.factors} />
<Text
  style={[
    type.microcopyItalic,
    {
      opacity: 0.7,
      marginTop: spacing.sm,
    },
  ]}
>
  Your lifetime clarity reflects your full tasting history, while insights below focus on your recent activity.
</Text>
<View
  style={{
    height: 1,
    backgroundColor: colors.divider,
    opacity: 0.5,
    marginTop: spacing.sm,
  }}
/>

      <DetailBlock
        title="What shapes your clarity"
        subtitle="Tap a factor to see what is helping your score and where you can improve next."
      >
        <ClarityFactorTiles
          selected={selectedFactor}
          onSelect={setSelectedFactor}
          factors={clarityDetails.factors}
        />

        <ClarityDriverDashboard
          title={activeDetail.title}
          subtitle={activeDetail.subtitle}
          stats={activeDetail.stats}
          progressLabel={activeDetail.progressLabel}
          progressValue={activeDetail.progressValue}
          progressValueText={activeDetail.progressValueText}
          chipsTitle={activeDetail.chipsTitle}
          chips={activeDetail.chips}
          miniChartTitle={activeDetail.miniChartTitle}
          miniChartData={activeDetail.miniChartData}
          footerLabel={activeDetail.footerLabel}
          footerValue={activeDetail.footerValue}
        />

        <ClarityDriverDashboard
          title={pathToDistinct.title}
          subtitle={pathToDistinct.subtitle}
          stats={pathToDistinct.stats}
          progressLabel={pathToDistinct.progressLabel}
          progressValue={pathToDistinct.progressValue}
          progressValueText={pathToDistinct.progressValueText}
          chipsTitle={pathToDistinct.chipsTitle}
          chips={pathToDistinct.chips}
          miniChartTitle={pathToDistinct.miniChartTitle}
          miniChartData={pathToDistinct.miniChartData}
          footerLabel={pathToDistinct.footerLabel}
          footerValue={pathToDistinct.footerValue}
        />
      </DetailBlock>
    </View>
  );
}