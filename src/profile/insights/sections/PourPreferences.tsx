import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { usePourPreferencesData } from "../hooks/usePourPreferencesData";
import type { PerceptionBucket } from "../hooks/usePourPreferencesData";
import { spacing } from "../../../../lib/spacing";
import { colors } from "../../../../lib/theme";
import { type } from "../../../../lib/typography";
import { radii } from "../../../../lib/radii";

const MAX_BAR_HEIGHT = 80;
const MIN_BAR_HEIGHT = 8;

const TEXTURE_LABELS: Record<number, string> = {
  1: "Light",
  2: "Med-Light",
  3: "Medium",
  4: "Med-Rich",
  5: "Rich",
};

const PROOF_LABELS: Record<number, string> = {
  1: "Low",
  2: "Moderate",
  3: "Med-High",
  4: "High",
  5: "Very High",
};

const FLAVOR_LABELS: Record<number, string> = {
  1: "Subtle",
  2: "Delicate",
  3: "Balanced",
  4: "Bold",
  5: "Intense",
};

type SectionConfig = {
  title: string;
  buckets: PerceptionBucket[];
  sweetSpot: number | null;
  gapText: string | null;
  labels: Record<number, string>;
};

function computeBarHeight(count: number, maxCount: number): number {
  if (count === 0 || maxCount === 0) return MIN_BAR_HEIGHT;
  return Math.max(MIN_BAR_HEIGHT, (count / maxCount) * MAX_BAR_HEIGHT);
}

function computeBarColor(avgRating: number | undefined): string {
  if (avgRating == null) return "rgba(255,255,255,0.15)";
  if (avgRating >= 85) return colors.accent;
  if (avgRating >= 75) return "rgba(190,150,99,0.55)";
  return "rgba(255,255,255,0.15)";
}

function confidenceLabel(confidence: "building" | "moderate" | "high"): string {
  if (confidence === "high") return "High Confidence";
  if (confidence === "moderate") return "Moderate Confidence";
  return "Building";
}

function PerceptionSection({ title, buckets, sweetSpot, gapText, labels }: SectionConfig) {
  const bucketMap = new Map(buckets.map((b) => [b.level, b]));
  const maxCount = buckets.reduce((m, b) => Math.max(m, b.count), 0);

  return (
    <View style={{ paddingVertical: spacing.md }}>
      <Text style={type.labelCaps}>{title}</Text>
      {gapText != null && (
        <Text
          style={[
            type.body,
            { color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.md },
          ]}
        >
          {gapText}
        </Text>
      )}
      <View style={{ flexDirection: "row", gap: spacing.xs }}>
        {([1, 2, 3, 4, 5] as const).map((level) => {
          const bucket = bucketMap.get(level);
          const count = bucket?.count ?? 0;
          const avgRating = bucket?.avgRating;
          const barHeight = computeBarHeight(count, maxCount);
          const barColor = computeBarColor(avgRating);
          const isSweet = sweetSpot === level;

          return (
            <View key={level} style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 12, color: colors.accent, opacity: isSweet ? 1 : 0 }}>
                ★
              </Text>
              <View style={{ height: MAX_BAR_HEIGHT, width: "100%", justifyContent: "flex-end" }}>
                <View style={{ height: barHeight, backgroundColor: barColor, borderRadius: 3 }} />
              </View>
              <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 3 }}>
                {level}
              </Text>
              <Text
                style={{
                  fontSize: 9,
                  color: colors.textMuted,
                  textAlign: "center",
                  lineHeight: 12,
                  marginTop: 1,
                }}
                numberOfLines={2}
              >
                {labels[level]}
              </Text>
              <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 1 }}>
                {count > 0 ? `${count} pours` : "—"}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function PourPreferences() {
  const data = usePourPreferencesData();

  if (data.loading) {
    return (
      <View
        style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: spacing.xxl }}
      >
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const { proofPoint } = data;
  const isInsufficient = proofPoint.type === "insufficient_data";

  const allSections: (SectionConfig | null)[] = [
    data.texture.length > 0
      ? {
          title: "Texture",
          buckets: data.texture,
          sweetSpot: data.sweetSpots.texture,
          gapText: data.gaps.texture,
          labels: TEXTURE_LABELS,
        }
      : null,
    data.proof.length > 0
      ? {
          title: "Proof Intensity",
          buckets: data.proof,
          sweetSpot: data.sweetSpots.proof,
          gapText: data.gaps.proof,
          labels: PROOF_LABELS,
        }
      : null,
    data.flavor.length > 0
      ? {
          title: "Flavor Intensity",
          buckets: data.flavor,
          sweetSpot: data.sweetSpots.flavor,
          gapText: data.gaps.flavor,
          labels: FLAVOR_LABELS,
        }
      : null,
  ];
  const sections = allSections.filter((s): s is SectionConfig => s !== null);

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.md }}>
      <View
        style={{
          borderWidth: 1,
          borderColor: "rgba(190,150,99,0.4)",
          borderRadius: radii.xl,
          padding: spacing.cardPadding,
          backgroundColor: "rgba(190,150,99,0.06)",
          marginBottom: spacing.sectionGap,
        }}
      >
        <Text style={type.sectionHeader}>Your Proof Point</Text>
        <Text
          style={[
            type.microcopyItalic,
            { marginTop: spacing.xs },
            isInsufficient ? { color: colors.textMuted, opacity: 0.7 } : null,
          ]}
        >
          {proofPoint.insightLine}
        </Text>
        {!isInsufficient && (
          <View
            style={{
              alignSelf: "flex-start",
              marginTop: spacing.sm,
              paddingHorizontal: spacing.sm,
              paddingVertical: 4,
              borderRadius: radii.sm,
              backgroundColor: "rgba(255,255,255,0.06)",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: proofPoint.confidence === "high" ? colors.accent : colors.textSecondary,
              }}
            >
              {`● ${confidenceLabel(proofPoint.confidence)} · ${proofPoint.population} pours`}
            </Text>
          </View>
        )}
      </View>

      {sections.map((section, idx) => (
        <React.Fragment key={section.title}>
          {idx > 0 && (
            <View
              style={{
                height: 1,
                backgroundColor: colors.divider,
                opacity: 0.3,
                marginVertical: spacing.md,
              }}
            />
          )}
          <PerceptionSection {...section} />
        </React.Fragment>
      ))}
    </ScrollView>
  );
}
