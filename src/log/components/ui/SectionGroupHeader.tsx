import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { colors } from "../../../../lib/theme";
import { type } from "../../../../lib/typography";

export function SectionGroupHeader({
  title,
  onBrowse,
  disabled,
}: {
  title: string;
  onBrowse: () => void;
  disabled?: boolean;
}) {
  return (
    <View style={{ gap: 10 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
          <Ionicons name="chevron-forward" size={18} color={colors.accent} />
          <Text style={[type.body, { fontWeight: "900", opacity: 0.9 }]} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <Pressable
          disabled={disabled}
          onPress={onBrowse}
          style={({ pressed }) => ({
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.divider,
            backgroundColor: pressed ? colors.highlight : "transparent",
            opacity: disabled ? 0.6 : 1,
          })}
        >
          <Text style={[type.microcopyItalic, { opacity: 0.85 }]}>Browse</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            width: 26,
            height: 2,
            borderRadius: 999,
            backgroundColor: colors.accent,
            opacity: 0.95,
          }}
        />
        <View
          style={{
            flex: 1,
            height: 2,
            borderRadius: 999,
            backgroundColor: colors.divider,
            opacity: 0.8,
          }}
        />
      </View>
    </View>
  );
}