// src/log/components/ui/ColumnHeader.tsx
import React from "react";
import { Text, View } from "react-native";

import { colors } from "../../../../lib/theme";
import { type } from "../../../../lib/typography";

export function ColumnHeader({ title }: { title: string }) {
  return (
    <View style={{ alignItems: "center", gap: 8 }}>
      <Text style={[type.body, { fontWeight: "900", textAlign: "center" }]}>{title}</Text>

      <View
        style={{
          height: 2,
          width: "82%",
          backgroundColor: colors.divider,
          borderRadius: 999,
          opacity: 0.9,
        }}
      />
    </View>
  );
}