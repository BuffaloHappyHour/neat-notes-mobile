import React from "react";
import { Text, View } from "react-native";

import { colors } from "../../../../../lib/theme";
import { type } from "../../../../../lib/typography";

export function ClarityTierProgress({
  tierLabels,
  tierIndex,
}: {
  tierLabels: string[];
  tierIndex: number;
}) {
  const idx = Math.max(1, Math.min(5, tierIndex));

  return (
    <View style={{ marginTop: 16 }}>
      <View style={{ marginTop: 10 }}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {tierLabels.map((_, i) => {
            const step = i + 1;
            const active = step <= idx;

            return (
              <View
                key={`tier-pill-${step}`}
                style={{
                  flex: 1,
                  height: 12,
                  borderRadius: 999,
                  backgroundColor: colors.accent,
                  opacity: active ? 0.6 : 0.08,
                }}
              />
            );
          })}
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
          {tierLabels.map((t, i) => {
            const step = i + 1;
            const isCurrent = step === idx;

            return (
              <Text
                key={`tier-lbl-${t}`}
                style={[
                  type.caption,
                  {
                    flex: 1,
                    textAlign: "center",
                    fontSize: 10,
                    opacity: isCurrent ? 0.85 : 0.45,
                    color: colors.textSecondary,
                  },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {t}
              </Text>
            );
          })}
        </View>
      </View>
    </View>
  );
}