import React from "react";
import { Pressable, Text, ViewStyle } from "react-native";
import { COLORS, RADIUS, SPACING, TEXT as TEXTS } from "../../constants/theme";

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
      style={[
        {
          backgroundColor: COLORS.tan,
          paddingVertical: SPACING.sm + 2,
          paddingHorizontal: SPACING.md,
          borderRadius: RADIUS.xl,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: COLORS.card,
          fontSize: TEXTS.body,
          fontWeight: "800",
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
