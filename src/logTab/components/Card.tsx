// src/logTab/components/Card.tsx

import React from "react";
import { Text, View } from "react-native";

import { radii } from "../../../lib/radii";
import { shadows } from "../../../lib/shadows";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

type Props = {
  title: string;
  subtitle?: string;
  rightHeader?: React.ReactNode;
  children: React.ReactNode;
};

export function Card({ title, subtitle, rightHeader, children }: Props) {
  const surface =
    (colors as any).glassRaised ??
    colors.surfaceRaised ??
    colors.surface;

  const border =
    (colors as any).glassBorder ??
    colors.borderStrong ??
    colors.divider;

  return (
    <View
      style={{
        backgroundColor: surface,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: border,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.lg,
        gap: spacing.md,
        ...shadows.card,
      }}
    >
      <View style={{ gap: 6 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: spacing.md,
          }}
        >
          <Text style={[type.sectionHeader, { fontSize: 18 }]}>
            {title}
          </Text>

          {rightHeader ? rightHeader : null}
        </View>

        {subtitle ? (
          <Text
            style={[
              type.microcopyItalic,
              { opacity: 0.82, lineHeight: 18 },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {children}
    </View>
  );
}