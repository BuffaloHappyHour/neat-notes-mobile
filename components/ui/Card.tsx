import React from "react";
import { View, ViewStyle } from "react-native";
import { COLORS, RADIUS, SHADOW, SPACING } from "../../constants/theme";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
};

export function Card({ children, style, padding = SPACING.md }: Props) {
  return (
    <View
      style={[
        {
          backgroundColor: COLORS.card,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: RADIUS.lg,
          padding,
          ...SHADOW.card,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
