// src/log/components/refine/components/RefineBottomNav.tsx
import React from "react";
import { Pressable, Text, View } from "react-native";

import { radii } from "../../../../../lib/radii";
import { spacing } from "../../../../../lib/spacing";
import { colors } from "../../../../../lib/theme";
import { type } from "../../../../../lib/typography";

export function RefineBottomNav(props: {
  locked: boolean;
  bottomBackEnabled: boolean;
  bottomBackLabel: string;
  doneLabel: string;
  onBack: () => void;
  onDone: () => void;
}) {
  const {
    locked,
    bottomBackEnabled,
    bottomBackLabel,
    doneLabel,
    onBack,
    onDone,
  } = props;

  return (
    <View
      style={{
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg + 40,
        borderTopWidth: 1,
        borderTopColor: colors.divider,
        backgroundColor: colors.background,
      }}
    >
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <Pressable
          disabled={locked || !bottomBackEnabled}
          onPress={onBack}
          style={({ pressed }) => ({
            flex: 1,
            borderRadius: radii.md,
            paddingVertical: 14,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: colors.divider,
            backgroundColor: "transparent",
            opacity: locked || !bottomBackEnabled ? 0.45 : pressed ? 0.9 : 1,
          })}
        >
          <Text style={[type.button, { color: colors.textPrimary }]}>
            {bottomBackLabel}
          </Text>
        </Pressable>

        <Pressable
          disabled={locked}
          onPress={onDone}
          style={({ pressed }) => ({
            flex: 1,
            borderRadius: radii.md,
            paddingVertical: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.accent,
            opacity: locked ? 0.6 : pressed ? 0.92 : 1,
          })}
        >
          <Text style={[type.button, { color: colors.background }]}>
            {doneLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}