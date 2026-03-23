import React from "react";
import { Pressable, Text, View } from "react-native";

import { radii } from "../../../../lib/radii";
import { spacing } from "../../../../lib/spacing";
import { colors } from "../../../../lib/theme";
import { type } from "../../../../lib/typography";
import { shareInsight } from "../utils/shareInsight";

import { RadarChart } from "../components/RadarChart";
import { useInsightsData } from "../hooks/useInsightsData";

function TraitPill({ text }: { text: string }) {
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: colors.surfaceSunken,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
      }}
    >
      <Text style={[type.caption, { opacity: 0.95 }]}>{text}</Text>
    </View>
  );
}

export default function TasteProfileRadar() {
  const { axes, topTraits, avoidedTraits, sentence, loading } = useInsightsData();

  const isLocked = false;

  const traitText =
    topTraits.length >= 2
      ? `${topTraits[0]} and ${topTraits[1]}`
      : topTraits[0] ?? "balanced flavors";

  const avoidedText =
    avoidedTraits.length > 0
      ? ` while steering away from ${avoidedTraits.slice(0, 2).join(" and ")}`
      : "";

  const shareText = `My whiskey taste profile in Neat Notes leans ${traitText.toLowerCase()}${avoidedText.toLowerCase()}.`;

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ marginHorizontal: -spacing.lg }}>
        <RadarChart axes={axes} size={350} levels={4} showLabels />
      </View>

      <Text style={type.microcopyItalic}>{sentence}</Text>

      <View
        style={{
          borderRadius: radii.xl,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          padding: spacing.cardPadding,
          gap: spacing.md,
        }}
      >
        <View style={{ flexDirection: "row", gap: spacing.lg }}>
          <View style={{ flex: 1, gap: spacing.sm }}>
            <Text style={type.labelCaps}>Top traits</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {topTraits.slice(0, 5).map((t) => (
                <TraitPill key={t} text={t} />
              ))}
            </View>
          </View>

          <View style={{ flex: 1, gap: spacing.sm }}>
            <Text style={type.labelCaps}>Avoided</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {avoidedTraits.slice(0, 4).map((t) => (
                <TraitPill key={t} text={t} />
              ))}
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => shareInsight(shareText)}
          style={{
            marginTop: spacing.md,
            alignSelf: "flex-start",
          }}
        >
          <Text style={[type.caption, { opacity: 0.8 }]}>
            Share your taste profile →
          </Text>
        </Pressable>

        <Pressable
          disabled={isLocked}
          onPress={() => {}}
          style={{
            marginTop: spacing.sm,
            borderRadius: radii.lg,
            paddingVertical: 12,
            alignItems: "center",
            backgroundColor: isLocked ? colors.surfaceSunken : colors.accentSoft,
            borderWidth: 1,
            borderColor: isLocked ? colors.divider : colors.borderStrong,
          }}
        >
          <Text style={[type.button, { color: colors.textPrimary, opacity: isLocked ? 0.6 : 1 }]}>
            Share your taste profile
          </Text>
        </Pressable>

        {isLocked && (
          <Text style={[type.caption, { marginTop: spacing.xs, opacity: 0.85 }]}>
            Unlock Premium to generate and share your full taste profile.
          </Text>
        )}
      </View>
    </View>
  );
}