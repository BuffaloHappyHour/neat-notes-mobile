// src/profile/components/PalateClarityCard.tsx

import React from "react";
import { Text, View } from "react-native";

import { radii } from "../../../lib/radii";
import { shadows } from "../../../lib/shadows";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { fontFamilies, type } from "../../../lib/typography";

type Props = {
  clarityIndex: number;
  tierLabel: string;
  confidenceLevel: "low" | "medium" | "high";
  totalTastings: number;
  daysSinceLastTasting: number | null;
};

export function PalateClarityCard({
  clarityIndex,
  tierLabel,
  confidenceLevel,
  totalTastings,
  daysSinceLastTasting,
}: Props) {
  const score = Math.round(clarityIndex);
  const fillPct = Math.max(0, Math.min(100, score));

  const confidenceText = capitalize(confidenceLevel);

  const lastPourShort =
    daysSinceLastTasting == null
      ? "Not yet"
      : daysSinceLastTasting === 0
      ? "Today"
      : daysSinceLastTasting === 1
      ? "1 day ago"
      : `${daysSinceLastTasting} days ago`;

  return (
    <View
      style={{
        borderRadius: radii.xxl ?? radii.xl,
        overflow: "hidden",
        backgroundColor: colors.surfaceRaised ?? colors.surface,
        borderWidth: 1,
        borderColor: colors.borderStrong ?? colors.divider,
        ...shadows.e2,
      }}
    >
      {/* Subtle top highlight (keeps it crafted, not “spotlit”) */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 70,
          backgroundColor: "rgba(255,255,255,0.05)",
          opacity: 0.55,
        }}
      />

      {/* Accent edge (very subtle frame cue) */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 2,
          backgroundColor: colors.accent,
          opacity: 0.35,
        }}
      />

      <View style={{ padding: spacing.heroPadding ?? spacing.sm }}>
        {/* Header */}
        <View style={{ gap: spacing.xs }}>
          <Text
            style={[
              type.labelCaps ?? type.body,
              {
                // make it unmistakably a header label
                fontFamily: fontFamilies.headingSemiBold,
                fontSize: 18,
                lineHeight: 20,
                letterSpacing: 1.6,
                opacity: 1,
              },
            ]}
          >
            YOUR PALATE CLARITY
          </Text>
                  <Text
          style={[
            type.microcopyItalic,
            {color: colors.textSecondary },
          ]}
        >
          <Text style={{ color: colors.textPrimary }}>{" "}
          How clearly your taste identity is understood{" "}
        </Text>
        </Text>
        </View>

        {/* HERO line: 53% + Defining (before bar) */}
        <View
          style={{
            marginTop: spacing.lg,
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: spacing.md,
          }}
        >
          <Text style={type.heroMetric}>{score}%</Text>

          <Text
            style={[
              type.sectionHeader,
              { color: colors.textPrimary, opacity: 0.92, paddingBottom: 10 },
            ]}
            numberOfLines={1}
          >
            
          </Text>
        </View>

        {/* Bar */}
        <View
          style={{
            marginTop: spacing.sm,
            height: 12,
            borderRadius: 999,
            overflow: "hidden",
            backgroundColor: colors.accentFaint ?? colors.divider,
            borderWidth: 1,
            borderColor: colors.borderSubtle ?? colors.divider,
          }}
        >
          <View
            style={{
              height: "100%",
              width: `${fillPct}%`,
              borderRadius: 999,
              backgroundColor: colors.accent,
              opacity: 0.95,
            }}
          />
        </View>

        {/* Supporting meta (quiet line) */}


        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            opacity: 0.65,
            marginTop: spacing.md,
            marginBottom: spacing.md,
          }}
        />

        {/* 3-column “at a glance” row */}
        <View style={{ flexDirection: "row", gap: spacing.sm+2 }}>
          <StatCol label="STATUS" value={tierLabel} />
          <StatCol label="CONFIDENCE" value={confidenceText} />
          <StatCol label="LAST POUR" value={lastPourShort} />
        </View>
      </View>
    </View>
  );
}

function StatCol({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        gap: 3,
        alignItems: "center",     // 👈 center content horizontally
      }}
    >
      <Text
        style={[
          type.labelCaps ?? type.body,
          {
            fontSize: 11,
            lineHeight: 16,
            letterSpacing: 1.1,
            color: colors.textSecondary,
            opacity: 0.85,
            textAlign: "center",   // 👈 center text
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          type.body,
          {
            fontSize: 12,
            lineHeight: 18,
            color: colors.textPrimary,
            textAlign: "center",   // 👈 center value
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function capitalize(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}