// components/ui/PrimaryButton.tsx
import React from "react";
import { Pressable, Text, ViewStyle } from "react-native";

import { radii } from "../../lib/radii";
import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

type Variant = "solid" | "outline" | "soft";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: Variant;

  /**
   * Optional: keep defaults premium & slightly tighter than before.
   * Use "lg" only for truly primary CTAs (Home primary action, submit, etc.)
   */
  size?: "md" | "lg";
};

export function PrimaryButton({
  label,
  onPress,
  disabled,
  style,
  variant = "solid",
  size = "md",
}: Props) {
  const isSolid = variant === "solid";
  const isOutline = variant === "outline";
  const isSoft = variant === "soft";

  const padY = size === "lg" ? spacing.lg : spacing.md;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => {
        // --- Backgrounds ---
        const solidBg = pressed ? colors.accentPressed : colors.accent;
        const softBg = pressed ? colors.accentFaint : colors.accentSoft;

        // --- Shared shell ---
        const base: ViewStyle = {
          paddingVertical: padY,
          paddingHorizontal: spacing.md,
          borderRadius: radii.xl,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.55 : 1,
        };

        // --- Variants ---
        const variantStyle: ViewStyle = isSolid
          ? {
              backgroundColor: solidBg,
            }
          : isOutline
          ? {
              backgroundColor: "transparent",
              borderWidth: 1,
              borderColor: pressed ? colors.borderStrong : colors.borderSubtle,
            }
          : {
              // soft
              backgroundColor: softBg,
              borderWidth: 1,
              borderColor: pressed ? colors.borderStrong : colors.borderSubtle,
            };

        // Slight pressed feedback for outline/soft without changing layout
        const pressedFx: ViewStyle =
          !disabled && pressed && (isOutline || isSoft)
            ? { transform: [{ scale: 0.99 }] as any }
            : {};

        return [base, variantStyle, pressedFx, style];
      }}
    >
      <Text
        style={[
          type.button,
          {
            // Keep label understated/premium
            fontSize: 15,
            fontWeight: "400",
            letterSpacing: 0.25,

            // Colors by variant
            color: isSolid ? colors.background : colors.accent,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}