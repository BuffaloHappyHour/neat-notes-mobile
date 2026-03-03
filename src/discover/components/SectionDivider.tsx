// src/discover/components/SectionDivider.tsx
import React from "react";
import { View } from "react-native";

import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";

/**
 * Premium divider:
 * dim edges → brighter middle (Home-style)
 * Now uses glassDivider token so it matches the new theme.
 */
export function SectionDivider() {
  const divider = (colors as any).glassDivider ?? colors.divider;

  return (
    <View style={{ marginVertical: spacing.sm }}>
      <View
        style={{
          height: 2,
          marginTop: 4,
          borderRadius: 999,
          overflow: "hidden",
          opacity: 0.95,
        }}
      >
        {/* left fade */}
        <View
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "25%",
            backgroundColor: divider,
            opacity: 0.65,
          }}
        />
        {/* center highlight */}
        <View
          style={{
            position: "absolute",
            left: "25%",
            top: 0,
            bottom: 0,
            width: "50%",
            backgroundColor: colors.accent,
            opacity: 0.12,
          }}
        />
        {/* right fade */}
        <View
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: "25%",
            backgroundColor: divider,
            opacity: 0.65,
          }}
        />
      </View>
    </View>
  );
}