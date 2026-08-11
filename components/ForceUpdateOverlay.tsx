import React from "react";
import { Linking, Modal, Pressable, Text, View } from "react-native";

import { spacing } from "../lib/spacing";
import { colors } from "../lib/theme";
import { type } from "../lib/typography";

type Props = {
  visible: boolean;
  updateUrl: string;
};

export function ForceUpdateOverlay({ visible, updateUrl }: Props) {
  return (
    <Modal visible={visible} transparent={false} animationType="fade" onRequestClose={() => {}}>
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.xl,
          gap: spacing.lg,
        }}
      >
        <Text style={[type.sectionHeader, { color: colors.textPrimary, textAlign: "center" }]}>
          Update Required
        </Text>
        <Text style={[type.body, { color: colors.textSecondary, textAlign: "center" }]}>
          A new version of Neat Notes is required to continue. Please update to keep using the app.
        </Text>
        <Pressable
          onPress={() => Linking.openURL(updateUrl)}
          style={({ pressed }) => ({
            backgroundColor: colors.accent,
            borderRadius: 999,
            paddingVertical: 14,
            paddingHorizontal: 32,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={[type.button, { color: colors.background }]}>Update Now</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
