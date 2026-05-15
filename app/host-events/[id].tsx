import { useLocalSearchParams } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        padding: spacing.xl,
        gap: spacing.md,
      }}
    >
      <Text style={[type.screenTitle, { color: colors.textPrimary }]}>
        Event Detail
      </Text>
      <Text style={[type.caption, { color: colors.textSecondary }]}>{id}</Text>
    </View>
  );
}
