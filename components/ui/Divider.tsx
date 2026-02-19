import React from "react";
import { View, ViewStyle } from "react-native";
import { COLORS } from "../../constants/theme";

type Props = {
  style?: ViewStyle;
};

export function Divider({ style }: Props) {
  return (
    <View
      style={[
        {
          height: 1,
          backgroundColor: COLORS.border,
          width: "100%",
        },
        style,
      ]}
    />
  );
}
