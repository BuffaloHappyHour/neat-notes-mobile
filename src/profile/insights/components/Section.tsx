import React from "react";
import { Text, View } from "react-native";

import { spacing } from "../../../../lib/spacing";
import { colors } from "../../../../lib/theme";
import { type } from "../../../../lib/typography";

export function Section({
  title,
  subtitle,
  children,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginTop: spacing.sm }}>
      {/* Header row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: spacing.lg,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={type.sectionHeader}>{title}</Text>
          {!!subtitle && (
            <Text
              style={[
                type.microcopyItalic,
                { marginTop: spacing.sm, opacity: 0.85 },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {!!right && <View>{right}</View>}
      </View>

      {/* Divider */}
      <View
        style={{
          height: 1,
          backgroundColor: colors.divider,
          opacity: 0.55,
          marginTop: spacing.md,
        }}
      />

      {/* Content */}
      <View style={{ marginTop: spacing.lg }}>{children}</View>
    </View>
  );
}