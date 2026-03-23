// src/profile/components/PalateClarityCard.tsx

import React from "react";
import { Pressable, Text, View } from "react-native";

import { radii } from "../../../lib/radii";
import { shadows } from "../../../lib/shadows";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { fontFamilies, type } from "../../../lib/typography";
import { shareInsight } from "../insights/utils/shareInsight";

type ReadyProps = {
  pending?: false;
  clarityIndex: number;
  tierLabel: string;
  confidenceLevel: "low" | "medium" | "high";
  totalTastings: number;
  daysSinceLastTasting: number | null;
};

type PendingProps = {
  pending: true;
  tastingGoal?: number;
  totalTastings?: number;
};

type Props = ReadyProps | PendingProps;

export function PalateClarityCard(props: Props) {
  const isPending = props.pending === true;
  const daysSinceLastTasting = isPending ? null : props.daysSinceLastTasting;

  const score = isPending ? null : Math.round(props.clarityIndex);
  const fillPct = isPending ? 0 : Math.max(0, Math.min(100, score ?? 0));

  const confidenceText = isPending ? "Building" : capitalize(props.confidenceLevel);
  const statusText = isPending ? "Pending" : props.tierLabel;
  const tastingGoal = isPending ? props.tastingGoal ?? 3 : null;
  const totalTastings = isPending ? props.totalTastings ?? 0 : props.totalTastings;

  const lastPourShort =
    daysSinceLastTasting == null
      ? isPending && totalTastings === 0
        ? "Not yet"
        : "Today"
      : daysSinceLastTasting === 0
      ? "Today"
      : daysSinceLastTasting === 1
      ? "1 day ago"
      : `${daysSinceLastTasting} days ago`;

  const shareText = buildClarityShareText({
    score,
    statusText,
    confidenceText,
  });

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
        <View style={{ gap: spacing.xs }}>
          <Text
            style={[
              type.labelCaps ?? type.body,
              {
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
              { color: colors.textSecondary },
            ]}
          >
            <Text style={{ color: colors.textPrimary }}>
              {isPending
                ? ` Log ${tastingGoal} tastings to begin building your palate profile`
                : " How clearly your taste identity is understood "}
            </Text>
          </Text>
        </View>

        <View
          style={{
            marginTop: spacing.lg,
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: spacing.md,
          }}
        >
          <Text style={type.heroMetric}>{isPending ? "Pending" : `${score}%`}</Text>

          <Text
            style={[
              type.sectionHeader,
              { color: colors.textPrimary, opacity: 0.92, paddingBottom: 10 },
            ]}
            numberOfLines={1}
          />
        </View>

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
              width: isPending
                ? `${Math.min(100, (totalTastings / tastingGoal!) * 100)}%`
                : `${fillPct}%`,
              borderRadius: 999,
              backgroundColor: colors.accent,
              opacity: isPending ? 0.55 : 0.95,
            }}
          />
        </View>

        {isPending ? (
          <>
            <Text
              style={[
                type.caption,
                {
                  color: colors.textSecondary,
                  marginTop: spacing.sm,
                  opacity: 0.92,
                },
              ]}
            >
              {totalTastings} of {tastingGoal} tastings logged
            </Text>

            {totalTastings === 1 && (
              <Text
                style={[
                  type.microcopyItalic,
                  {
                    color: colors.accent,
                    marginTop: 4,
                    opacity: 0.9,
                  },
                ]}
              >
                Nice start. Two more pours reveal your first palate signal.
              </Text>
            )}

            {totalTastings === 2 && (
              <Text
                style={[
                  type.microcopyItalic,
                  {
                    color: colors.accent,
                    marginTop: 4,
                    opacity: 0.9,
                  },
                ]}
              >
                One more pour unlocks your first clarity signal.
              </Text>
            )}
          </>
        ) : null}

        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            opacity: 0.65,
            marginTop: spacing.md,
            marginBottom: spacing.md,
          }}
        />

        <View style={{ flexDirection: "row", gap: spacing.sm + 2 }}>
          <StatCol label="STATUS" value={statusText} />
          <StatCol label="CONFIDENCE" value={confidenceText} />
          <StatCol label="LAST POUR" value={lastPourShort} />
        </View>

        <Pressable
          onPress={() => shareInsight(shareText)}
          style={{
            marginTop: spacing.md,
            alignSelf: "flex-start",
          }}
        >
          <Text style={[type.caption, { opacity: 0.8 }]}>
            Share your palate →
          </Text>
        </Pressable>
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
        alignItems: "center",
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
            textAlign: "center",
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
            textAlign: "center",
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

function buildClarityShareText({
  score,
  statusText,
  confidenceText,
}: {
  score: number | null;
  statusText: string;
  confidenceText: string;
}) {
  if (score == null) {
    return "I’m building my Palate Clarity in Neat Notes.";
  }

  return `My Palate Clarity is ${score}/100 in Neat Notes — ${statusText} with ${confidenceText.toLowerCase()} confidence.`;
}