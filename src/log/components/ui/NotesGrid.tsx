// src/log/components/ui/NotesGrid.tsx
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { radii } from "../../../../lib/radii";
import { spacing } from "../../../../lib/spacing";
import { colors } from "../../../../lib/theme";
import { type } from "../../../../lib/typography";

export function NotesGrid({
  tags,
  selected,
  onToggle,
  disabled,
  columns = 2,
}: {
  tags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
  disabled?: boolean;
  columns?: 2 | 3;
}) {
  const GAP = 10;

  // These percentages are tuned for RN flexWrap + gap.
  // (RN doesn't "true-grid" measure gaps like CSS grid, so we pick stable values.)
  const basis = useMemo(() => {
    return columns === 3 ? "30%" : "45%";
  }, [columns]);

  const pillMinHeight = columns === 3 ? 40 : 46;
  const pillPadV = columns === 3 ? 8 : 8;
  const labelFontSize = columns === 3 ? 12 : 13;

  return (
    <View style={{ gap: spacing.sm }}>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: GAP,
        }}
      >
        {tags.map((t) => {
          const active = selected.includes(t);

          return (
            <Pressable
              key={t}
              disabled={disabled}
              onPress={() => onToggle(t)}
              style={({ pressed }) => ({
                flexGrow: 0,
                flexShrink: 0,
                flexBasis: basis,
                maxWidth: basis,

                paddingVertical: pillPadV,
                paddingHorizontal: 12,
                borderRadius: radii.md,
                borderWidth: active ? 2 : 1,
                borderColor: active ? colors.accent : colors.divider,
                backgroundColor: active ? colors.highlight : "transparent",
                opacity: disabled ? 0.6 : pressed ? 0.92 : 1,

                alignItems: "center",
                justifyContent: "center",
                minHeight: pillMinHeight,
              })}
            >
              <Text
                style={[
                  type.body,
                  {
                    fontWeight: active ? "900" : "800",
                    textAlign: "center",
                    opacity: active ? 1 : 0.9,
                    fontSize: labelFontSize,
                  },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}