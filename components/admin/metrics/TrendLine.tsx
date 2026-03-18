import React from "react";
import { Text, View } from "react-native";

import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";
import { fmt, fmtPct, trendArrow, trendTone } from "./formatters";

export function TrendLine({
  title,
  value,
  pctPrev7,
  pct30Avg,
}: {
  title: string;
  value: any;
  pctPrev7: any;
  pct30Avg: any;
}) {
  const arrow = trendArrow(pctPrev7);
  const tone = trendTone(pctPrev7);

  return (
    <View
      style={{
        gap: 6,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: spacing.md,
        }}
      >
        <Text style={[type.body, { color: colors.textSecondary, fontSize: 14, flex: 1 }]}>
          {title}
        </Text>

        <Text style={[type.body, { color: tone, fontWeight: "900", fontSize: 14 }]}>
          {arrow} {fmt(value)}
        </Text>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.md }}>
        <Text style={[type.microcopyItalic, { color: colors.textSecondary, opacity: 0.9 }]}>
          vs prev 7d: {fmtPct(pctPrev7)}
        </Text>
        <Text style={[type.microcopyItalic, { color: colors.textSecondary, opacity: 0.9 }]}>
          vs 30d avg: {fmtPct(pct30Avg)}
        </Text>
      </View>
    </View>
  );
}