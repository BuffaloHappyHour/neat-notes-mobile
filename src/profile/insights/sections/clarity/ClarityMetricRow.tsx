import React from "react";
import { Text, View } from "react-native";

import { colors } from "../../../../../lib/theme";
import { type } from "../../../../../lib/typography";

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

export function ClarityMetricRow({
  label,
  valueLabel,
  pct,
}: {
  label: string;
  valueLabel: string;
  pct: number;
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