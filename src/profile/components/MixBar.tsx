import React from "react";
import { Text, View } from "react-native";

import { radii } from "../../../lib/radii";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

import { type MixRow } from "../types";
import { formatPct, rgba } from "../utils";

export function MixBar({ rows }: { rows: MixRow[] }) {
  return (
    <View style={{ gap: spacing.md }}>
      {/* Distribution bar (matte + restrained) */}
      <View
        style={{
          height: 12,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.borderSubtle ?? colors.divider,
          backgroundColor: colors.accentFaint ?? colors.surfaceSunken ?? colors.surface,
          overflow: "hidden",
          flexDirection: "row",
        }}
      >
        {rows.map((r, idx) => {
          // Ensure very small categories remain visible
          const minPct = r.count > 0 ? 0.03 : 0;
          const widthPct = Math.max(minPct, r.pct);
          const isLast = idx === rows.length - 1;

          // keep it within palette: accent tint, not random colors
          const segColor = rgba(colors.accent, Math.max(0.14, Math.min(0.42, r.alpha)));

          return (
            <View
              key={r.label}
              style={{
                width: `${Math.round(widthPct * 100)}%`,
                height: "100%",
                backgroundColor: segColor,
                borderRightWidth: isLast ? 0 : 1,
                borderRightColor: rgba(colors.divider, 0.65),
              }}
            />
          );
        })}
      </View>

      {/* Legend rows (journal-like, inset) */}
      <View style={{ gap: 10 }}>
        {rows.map((r) => {
          const dotColor = rgba(
            colors.accent,
            Math.max(0.18, Math.min(0.45, r.alpha))
          );

          return (
            <View
              key={r.label}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,

                borderWidth: 1,
                borderColor: colors.borderSubtle ?? colors.divider,
                borderRadius: radii.lg ?? radii.md,
                paddingVertical: 10,
                paddingHorizontal: 12,

                // inset well vibe
                backgroundColor: colors.surfaceSunken ?? colors.background,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: dotColor,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle ?? colors.divider,
                  }}
                />

                <Text
                  style={[
                    type.body,
                    { color: colors.textPrimary, flex: 1 },
                  ]}
                  numberOfLines={1}
                >
                  {r.label}
                </Text>
              </View>

              <Text style={[type.caption, { color: colors.textSecondary }]}>
                <Text style={{ color: colors.textPrimary }}>{r.count}</Text>{" "}
                • {formatPct(r.pct)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}