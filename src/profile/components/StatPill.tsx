import React from "react";
import { Text, View } from "react-native";

import { radii } from "../../../lib/radii";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

export function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        borderWidth: 1,
        borderColor: colors.borderSubtle ?? colors.divider,
        backgroundColor: colors.surfaceSunken ?? colors.surface,
        borderRadius: radii.xl ?? radii.lg,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        gap: 6,
      }}
    >
      <Text
        style={[
          type.labelCaps ?? type.caption,
          { textAlign: "center", color: colors.textSecondary, opacity: 0.9 },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          type.statNumber ?? type.sectionHeader,
          { textAlign: "center", color: colors.textPrimary },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}