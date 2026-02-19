import React from "react";
import { Text, TextStyle } from "react-native";
import { COLORS, TEXT as TEXTS } from "../../constants/theme";

type Props = {
  children: string;
  style?: TextStyle;
};

export function SectionTitle({ children, style }: Props) {
  return (
    <Text
      style={[
        {
          fontSize: TEXTS.h2,
          fontWeight: "800",
          color: COLORS.ink,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
