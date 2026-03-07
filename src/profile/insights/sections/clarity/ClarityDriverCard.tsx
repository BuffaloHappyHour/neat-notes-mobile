import React from "react";
import { Text, View } from "react-native";

import { radii } from "../../../../../lib/radii";
import { spacing } from "../../../../../lib/spacing";
import { colors } from "../../../../../lib/theme";
import { type } from "../../../../../lib/typography";

type StatRow = {
  label: string;
  value: string;
};

export function ClarityDriverCard({
  title,
  subtitle,
  stats,
  footerLabel,
  footerValue,
}: {
  title: string;
  subtitle: string;
  stats: StatRow[];
  footerLabel?: string;
  footerValue?: string;
}) {
  return (
    <View
      style={{
        padding: spacing.md,
        borderRadius: radii.xl,
        backgroundColor: colors.surfaceSunken,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        gap: spacing.sm,
      }}
    >
      <View style={{ gap: 4 }}>
        <Text style={[type.body, { fontWeight: "900", fontSize: 17 }]}>{title}</Text>
        <Text style={[type.microcopyItalic, { opacity: 0.82 }]}>{subtitle}</Text>
      </View>

      <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
        {stats.map((row) => (
          <View
            key={`${title}-${row.label}`}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              gap: spacing.md,
            }}
          >
            <Text style={[type.caption, { flex: 1 }]}>{row.label}</Text>
            <Text style={[type.caption, { fontWeight: "900" }]}>{row.value}</Text>
          </View>
        ))}
      </View>

      {footerLabel && footerValue ? (
        <View
          style={{
            marginTop: spacing.sm,
            paddingTop: spacing.sm,
            borderTopWidth: 1,
            borderTopColor: colors.borderSubtle,
            gap: 6,
          }}
        >
          <Text style={[type.caption, { opacity: 0.78 }]}>{footerLabel}</Text>
          <Text style={[type.body, { fontWeight: "800" }]}>{footerValue}</Text>
        </View>
      ) : null}
    </View>
  );
}