import React from "react";
import { Text, View } from "react-native";
import { colors } from "../../lib/theme";
import { spacing } from "../../lib/spacing";
import { type } from "../../lib/typography";

export default function DiscoverTab() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.xl }}>
      <Text style={type.screenTitle}>Discover</Text>
      <Text style={[type.body, { marginTop: spacing.md, opacity: 0.7 }]}>
        Disabled for iOS navigation isolate test.
      </Text>
    </View>
  );
}