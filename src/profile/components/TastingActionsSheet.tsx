import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { radii } from "../../../lib/radii";
import { shadows } from "../../../lib/shadows";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

import { withDanger, withTick } from "../../../lib/hapticsPress";

export function TastingActionsSheet({
  visible,
  title,
  deleting,
  onClose,
  onEdit,
  onDelete,
}: {
  visible: boolean;
  title: string;
  deleting: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  const styles = StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.overlay ?? "rgba(0,0,0,0.55)",
      justifyContent: "flex-end",
    },
    backdropCloser: {
      ...StyleSheet.absoluteFillObject,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      presentationStyle="overFullScreen"
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {/* Full-screen closer (behind the sheet) */}
        <Pressable style={styles.backdropCloser} onPress={onClose} />

        {/* Sheet */}
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: colors.surfaceRaised ?? colors.surface,
            borderTopLeftRadius: radii.xxl ?? 24,
            borderTopRightRadius: radii.xxl ?? 24,

            paddingTop: spacing.md,
            paddingHorizontal: spacing.lg,
            paddingBottom: Math.max(spacing.lg, insets.bottom + spacing.lg),

            borderWidth: 1,
            borderColor: colors.borderStrong ?? colors.divider,

            gap: spacing.md,

            // ✅ Modal elevation (Layer 3)
            ...shadows.e3,
          }}
        >
          {/* Subtle top highlight hairline */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 1,
              backgroundColor: colors.borderSubtle ?? colors.divider,
              opacity: 0.8,
              borderTopLeftRadius: radii.xxl ?? 24,
              borderTopRightRadius: radii.xxl ?? 24,
            }}
          />

          {/* Handle */}
          <View style={{ alignItems: "center", marginTop: 2 }}>
            <View
              style={{
                width: 44,
                height: 5,
                borderRadius: 999,
                backgroundColor: colors.divider,
                opacity: 0.75,
              }}
            />
          </View>

          {/* Title block */}
          <View style={{ gap: spacing.xs }}>
            <Text style={[type.labelCaps, { opacity: 0.9 }]}>Tasting</Text>
            <Text
              style={[type.sectionHeader, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              Actions
            </Text>
            <Text
              style={[
                type.caption,
                { color: colors.textSecondary, opacity: 0.95 },
              ]}
              numberOfLines={2}
            >
              {title}
            </Text>
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: colors.divider,
              opacity: 0.7,
              marginTop: spacing.xs,
            }}
          />

          {/* Primary action */}
          <Pressable
            onPress={withTick(onEdit)}
            disabled={deleting}
            style={({ pressed }) => ({
              borderRadius: radii.xl ?? radii.md,
              paddingVertical: spacing.lg,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.accent,
              opacity: deleting ? 0.6 : pressed ? 0.93 : 1,
            })}
          >
            <Text style={[type.button, { color: colors.background }]}>Edit</Text>
          </Pressable>

          {/* Secondary actions */}
          <Pressable
            onPress={withDanger(onDelete)}
            disabled={deleting}
            style={({ pressed }) => ({
              borderRadius: radii.xl ?? radii.md,
              paddingVertical: spacing.lg,
              alignItems: "center",
              justifyContent: "center",

              borderWidth: 1,
              borderColor: colors.borderSubtle ?? colors.divider,
              backgroundColor: pressed
                ? (colors.accentFaint ?? colors.highlight)
                : (colors.surfaceSunken ?? colors.surface),

              opacity: deleting ? 0.6 : 1,
            })}
          >
            <Text style={[type.button, { color: colors.textPrimary }]}>
              {deleting ? "Deleting…" : "Delete"}
            </Text>
          </Pressable>

          <Pressable
            onPress={withTick(onClose)}
            disabled={deleting}
            style={({ pressed }) => ({
              borderRadius: radii.xl ?? radii.md,
              paddingVertical: spacing.lg,
              alignItems: "center",
              justifyContent: "center",

              borderWidth: 1,
              borderColor: colors.borderSubtle ?? colors.divider,
              backgroundColor: pressed
                ? (colors.accentFaint ?? colors.highlight)
                : "transparent",

              opacity: deleting ? 0.6 : 1,
            })}
          >
            <Text style={[type.button, { color: colors.textPrimary }]}>
              Cancel
            </Text>
          </Pressable>
        </Pressable>
      </View>
    </Modal>
  );
}