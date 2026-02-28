import React from "react";
import { Text, View } from "react-native";

import { radii } from "../../../lib/radii";
import { shadows } from "../../../lib/shadows";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

type Variant = "card" | "inset";

/**
 * ProfileCard — Level 1 surface component
 *
 * - Default: subtle raised card (Layer 1)
 * - Variant "inset": slightly sunken container (use for tables/lists)
 *
 * This is the foundation for non-flat UI across Profile.
 */
export function ProfileCard({
  title,
  subtitle,
  right,
  children,
  variant = "card",
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  variant?: Variant;
}) {
  const isInset = variant === "inset";

  const bg = isInset ? (colors.surfaceSunken ?? colors.surface) : colors.surface;
  const border = isInset
    ? (colors.borderSubtle ?? colors.divider)
    : (colors.borderSubtle ?? colors.divider);

  const shadowStyle = isInset ? (shadows.e0 ?? {}) : (shadows.e1 ?? {});

  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: radii.xl ?? radii.lg,
        padding: spacing.cardPadding ?? spacing.lg,
        borderWidth: 1,
        borderColor: border,
        gap: spacing.md,

        ...shadowStyle,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: spacing.md,
        }}
      >
        <View style={{ gap: spacing.xs, flex: 1 }}>
          <Text style={[type.sectionHeader, { color: colors.textPrimary }]}>
            {title}
          </Text>

          {subtitle ? (
            <Text
              style={[
                type.caption ?? type.microcopyItalic,
                { color: colors.textSecondary },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {right ? <View style={{ paddingTop: 2 }}>{right}</View> : null}
      </View>

      {children}
    </View>
  );
}