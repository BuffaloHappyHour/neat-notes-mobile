import React from "react";
import { Text, View } from "react-native";

import { spacing } from "../../../../lib/spacing";
import { colors } from "../../../../lib/theme";
import { type } from "../../../../lib/typography";

export function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: spacing.lg }}>
      {/* Page Header */}
      <View
        style={{
          alignItems: "center",
          gap: spacing.xs,
          paddingTop: spacing.sm,
        }}
      >
        <Text
          style={[
            type.sectionHeader,
            {
              textAlign: "center",
              color: colors.textPrimary,
              fontSize: 28,
            },
          ]}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={[
              type.microcopyItalic,
              {
                textAlign: "center",
                color: colors.textSecondary,
                maxWidth: 340,
              },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}

        {/* Gold divider */}
        <View
          style={{
            width: 180,
            height: 3,
            borderRadius: 999,
            backgroundColor: colors.accent,
            marginTop: spacing.xs,
            opacity: 0.9,
          }}
        />
      </View>

      {children}
    </View>
  );
}