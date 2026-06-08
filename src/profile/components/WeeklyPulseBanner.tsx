import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";
import { spacing } from "../../../lib/spacing";
import { radii } from "../../../lib/radii";
import { router } from "expo-router";

type WeeklyTrendRow = {
  palate_clarity_0_100: number;
  palate_clarity_delta: number | null;
  weekly_movement_status: string;
  biggest_driver_label: string | null;
  biggest_driver_delta: number | null;
};

type Props = {
  trend: WeeklyTrendRow | null;
  firstName: string | null;
  isPremium: boolean;
};

function driverCopy(label: string, delta: number): string {
  const dir = delta >= 0 ? "strengthened" : "weakened";
  switch (label) {
    case "Depth": return `Your flavor specificity ${dir} this week.`;
    case "Diversity": return `Your exploration pattern ${dir} this week.`;
    case "Preference Patterns": return `Your taste consistency signal ${dir} this week.`;
    case "Confidence": return `Your logging activity impacted your score this week.`;
    default: return `Your palate signal shifted this week.`;
  }
}

export function WeeklyPulseBanner({ trend, firstName, isPremium }: Props) {
  if (!trend) return null;

  const { weekly_movement_status, palate_clarity_delta, biggest_driver_label, biggest_driver_delta } = trend;

  const showDelta = weekly_movement_status === "increased" || weekly_movement_status === "decreased";
  const arrowIcon = weekly_movement_status === "increased" ? "trending-up" : weekly_movement_status === "decreased" ? "trending-down" : "remove";
  const arrowColor = weekly_movement_status === "increased" ? "#4CAF50" : weekly_movement_status === "decreased" ? "#E57373" : colors.textMuted;
  const deltaText = showDelta && palate_clarity_delta != null ? `${palate_clarity_delta > 0 ? "+" : ""}${palate_clarity_delta} this week` : "Stable this week";
  const lockedCopy = biggest_driver_label && biggest_driver_delta != null ? driverCopy(biggest_driver_label, biggest_driver_delta) : "Your palate signal shifted this week.";
  const greeting = firstName ? `Nice work this week, ${firstName}.` : "Nice work this week.";

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.xs }}>
        <Ionicons name={arrowIcon as any} size={20} color={arrowColor} />
        <Text style={[type.body, { color: arrowColor, fontWeight: "600" }]}>{deltaText}</Text>
      </View>

      {!isPremium && (
        <Pressable
          onPress={() => router.push("/insights" as any)}
          style={({ pressed }) => ({
            borderWidth: 1,
            borderColor: colors.accent + "40",
            borderRadius: radii.xl,
            padding: spacing.md,
            backgroundColor: pressed ? colors.accentSoft : "rgba(255,255,255,0.03)",
            gap: spacing.xs,
          })}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <Ionicons name="lock-closed" size={12} color={colors.textMuted} />
            <Text style={[type.labelCaps, { color: colors.textMuted }]}>This week's insight</Text>
          </View>
          <Text style={[type.microcopyItalic, { opacity: 0.85, fontSize: 16 }]}>{greeting}</Text>
          <Text style={[type.body, { color: colors.textSecondary }]}>{lockedCopy}</Text>
          <Text style={[type.body, { color: colors.accent, fontWeight: "600", marginTop: spacing.xs }]}>
            Unlock Insights to see why →
          </Text>
        </Pressable>
      )}
    </View>
  );
}
