// components/ui/PrimaryButton.tsx
import React from "react";
import { Pressable, Text, ViewStyle } from "react-native";

import { radii } from "../../lib/radii";
import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export function PrimaryButton({ label, onPress, disabled, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          backgroundColor: pressed ? colors.accentPressed : colors.accent,
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.md,
          borderRadius: radii.xl,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.55 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          type.button,
          {
            color: colors.background, // 👈 charcoal theme text
            fontSize: 17,
            fontWeight: "400", // 👈 more subtle/premium
            letterSpacing: 0.2,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}