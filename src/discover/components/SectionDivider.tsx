// src/discover/components/SectionDivider.tsx
import React from "react";
import { View } from "react-native";

import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";

export function SectionDivider() {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginVertical: spacing.md,
      }}
    >
      <View
        style={{
          width: 26,
          height: 2,
          borderRadius: 1,
          backgroundColor: colors.accent,
          opacity: 0.95,
        }}
      />
      <View
        style={{
          flex: 1,
          height: 1,
          marginLeft: 10,
          backgroundColor: colors.divider,
          opacity: 0.6,
        }}
      />
    </View>
  );
}