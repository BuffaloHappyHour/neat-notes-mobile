import React from "react";
import { Text, View, type DimensionValue } from "react-native";

import { radii } from "../../../lib/radii";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

function DriverRow({
  label,
  valueWidth,
  valueText,
}: {
  label: string;
  valueWidth: DimensionValue;
  valueText: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.md,
        }}
      >
        <Text style={[type.body, { fontWeight: "800", opacity: 0.92 }]}>{label}</Text>
        <Text style={[type.body, { opacity: 0.8 }]}>{valueText}</Text>
      </View>

      <View
        style={{
          height: 8,
          borderRadius: 999,
          overflow: "hidden",
          backgroundColor: "rgba(255,255,255,0.07)",
        }}
      >
        <View
          style={{
            width: valueWidth,
            height: "100%",
            borderRadius: 999,
            backgroundColor: colors.accent,
            opacity: 0.78,
          }}
        />
      </View>
    </View>
  );
}

export function LockedInsightsPreview() {
  return (
    <View
      style={{
        borderRadius: radii.xxl ?? radii.xl,
        borderWidth: 1,
        borderColor: "rgba(190,150,99,0.18)",
        backgroundColor: "rgba(255,255,255,0.04)",
        padding: spacing.md,
        gap: spacing.md,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: spacing.md,
        }}
      >
        <View style={{ gap: 4 }}>
          <Text
            style={[
              type.body,
              {
                letterSpacing: 2,
                fontWeight: "900",
                opacity: 0.92,
              },
            ]}
          >
            PALATE CLARITY
          </Text>

          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6 }}>
            <Text
              style={[
                type.screenTitle,
                {
                  fontSize: 44,
                  lineHeight: 48,
                  color: colors.textPrimary,
                },
              ]}
            >
              74
            </Text>
            <Text style={[type.body, { opacity: 0.8, marginBottom: 6 }]}>/100</Text>
          </View>
        </View>

        <View style={{ alignItems: "flex-end", gap: 4, paddingTop: 4 }}>
          <Text style={[type.body, { opacity: 0.82 }]}>Last 30 days</Text>
          <Text style={[type.body, { color: "#8CCB9B", fontWeight: "800" }]}>+6 points</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
        {[
          { label: "Exploring", active: true },
          { label: "Emerging", active: true },
          { label: "Defining", active: true },
          { label: "Distinct", active: false },
          { label: "Signature", active: false },
        ].map((item) => (
          <View key={item.label} style={{ flex: 1, gap: 6, alignItems: "center" }}>
            <View
              style={{
                width: "100%",
                height: 12,
                borderRadius: 999,
                backgroundColor: item.active ? colors.accent : "rgba(255,255,255,0.07)",
                opacity: item.active ? 0.72 : 1,
              }}
            />
            <Text
              style={[
                type.microcopyItalic,
                {
                  fontSize: 11,
                  opacity: 0.72,
                  textAlign: "center",
                },
              ]}
            >
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      <View
        style={{
          marginTop: spacing.xs,
          borderRadius: radii.xl,
          backgroundColor: "rgba(0,0,0,0.22)",
          padding: spacing.md,
          gap: spacing.md,
        }}
      >
        <Text style={[type.body, { fontWeight: "900", opacity: 0.9 }]}>What drives your score</Text>

        <DriverRow label="Depth" valueWidth="76%" valueText="Strong" />
        <DriverRow label="Diversity" valueWidth="58%" valueText="Medium" />
        <DriverRow label="Consistency" valueWidth="64%" valueText="Medium" />
      </View>

      <Text
        style={[
          type.microcopyItalic,
          {
            opacity: 0.82,
            lineHeight: 22,
          },
        ]}
      >
        Your clarity is improving as your tasting language becomes more specific.
      </Text>
    </View>
  );
}