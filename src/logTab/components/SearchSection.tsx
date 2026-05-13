import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { radii } from "../../../lib/radii";
import { shadows } from "../../../lib/shadows";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

export function SearchSection({
  onOpenSearch,
  onScanPress,
}: {
  onOpenSearch: () => void;
  onScanPress: () => void;
}) {
  const sunken = (colors as any).glassSunken ?? (colors as any).surfaceSunken ?? colors.background;
  const border = (colors as any).borderStrong ?? (colors as any).glassBorder ?? colors.divider;

  return (
    <View
      style={{
        height: 52,
        backgroundColor: sunken,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: border,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
        ...shadows.card,
      }}
    >
      <Pressable
        onPress={onOpenSearch}
        style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm, height: "100%" }}
      >
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <Text
          style={[type.body, { flex: 1, color: colors.textMuted, fontSize: 16 }]}
          numberOfLines={1}
        >
          Search whiskeys…
        </Text>
      </Pressable>

      <Pressable
        onPress={onScanPress}
        hitSlop={10}
        style={({ pressed }) => ({
          width: 38,
          height: 38,
          borderRadius: 999,
          borderWidth: 0.8,
          borderColor: border,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: pressed ? colors.surface : "transparent",
          opacity: pressed ? 0.9 : 1,
        })}
      >
        <MaterialCommunityIcons name="barcode-scan" size={20} color={colors.accent} />
      </Pressable>
    </View>
  );
}
