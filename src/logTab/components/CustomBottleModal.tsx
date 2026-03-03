// src/logTab/components/CustomBottleModal.tsx
import React from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { radii } from "../../../lib/radii";
import { shadows } from "../../../lib/shadows";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

export function CustomBottleModal({
  visible,
  onCancel,
  onHelpImprove,
  onJustLogIt,
}: {
  visible: boolean;
  onCancel: () => void;
  onHelpImprove: () => void;
  onJustLogIt: () => void;
}) {
  if (!visible) return null;

  return (
    <Modal
      visible
      transparent={false}
      presentationStyle="fullScreen"
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          padding: spacing.xl,
          justifyContent: "center",
        }}
      >
        {/* Full-screen tap-away */}
        <Pressable
          onPress={onCancel}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />

        {/* Card */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.divider,
            paddingVertical: spacing.lg,
            paddingHorizontal: spacing.lg,
            gap: spacing.md,
            ...shadows.card,
          }}
        >
          <View style={{ gap: 6 }}>
            <Text
              style={[
                type.sectionHeader,
                { fontSize: 18, opacity: 0.96, letterSpacing: 0.2 },
              ]}
            >
              Add a custom bottle?
            </Text>

            <Text style={[type.body, { opacity: 0.82, lineHeight: 18 }]}>
              We didn’t find that bottle yet. If you’d like, you can add a couple
              details to help keep the catalog clean — totally optional.
            </Text>

            <Text style={[type.microcopyItalic, { opacity: 0.78 }]}>
              Even 1–2 fields helps a ton.
            </Text>
          </View>

          <View style={{ gap: spacing.sm }}>
            <Pressable
              onPress={onHelpImprove}
              style={({ pressed }) => ({
                borderRadius: radii.md,
                paddingVertical: 14,
                alignItems: "center",
                backgroundColor: colors.accent,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={[type.button, { color: colors.background }]}>
                Help improve
              </Text>
            </Pressable>

            <Pressable
              onPress={onJustLogIt}
              style={({ pressed }) => ({
                borderRadius: radii.md,
                paddingVertical: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.divider,
                backgroundColor: colors.surface,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={[type.button, { color: colors.textPrimary }]}>
                Just log it
              </Text>
            </Pressable>

            <Pressable
              onPress={onCancel}
              style={({ pressed }) => ({
                paddingVertical: spacing.sm,
                alignItems: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={[type.microcopyItalic, { opacity: 0.8 }]}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}