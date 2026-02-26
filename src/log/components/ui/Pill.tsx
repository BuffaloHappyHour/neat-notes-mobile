import React from "react";
import { Pressable, Text } from "react-native";

import { colors } from "../../../../lib/theme";
import { type } from "../../../../lib/typography";

export function Pill({
  label,
  active,
  onPress,
  disabled,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 7,
        paddingHorizontal: 10,
        borderRadius: 999,
        borderWidth: active ? 2 : 1,
        borderColor: active ? colors.accent : colors.divider,
        backgroundColor: active ? colors.highlight : "transparent",
        opacity: disabled ? 0.5 : pressed ? 0.92 : 1,
      })}
    >
      <Text
        style={[
          type.microcopyItalic,
          { opacity: 0.9, fontWeight: active ? "900" : "800" },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}