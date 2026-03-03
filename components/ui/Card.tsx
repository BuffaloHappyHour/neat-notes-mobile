// components/ui/Card.tsx
import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * When true, uses tighter padding for dense sections.
   */
  tight?: boolean;
};

export function Card({ children, style, tight }: Props) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.glassSurface ?? colors.surface,
          borderRadius: radii.xxl ?? radii.xl ?? radii.lg,
          padding: tight ? spacing.md : spacing.lg,
          borderWidth: 1,
          borderColor: colors.glassBorder ?? colors.borderSubtle ?? colors.divider,
          ...shadows.card,
          overflow: "hidden",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}