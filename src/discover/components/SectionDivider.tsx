// src/discover/components/SectionDivider.tsx
import React from "react";
import { View } from "react-native";

import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";

/**
 * Premium divider:
 * dim edges → brighter middle (Home-style)
 */
export function SectionDivider() {
  return (
    <View style={{ marginVertical: spacing.md }}>

      <View
        style={{
          height: 2,
          marginTop: 8,
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
            backgroundColor: colors.accentFaint,
            opacity: 0.5,
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
            opacity: 0.2,
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
            backgroundColor: colors.accentFaint,
            opacity: 0.5,
          }}
        />
      </View>
    </View>
  );
}