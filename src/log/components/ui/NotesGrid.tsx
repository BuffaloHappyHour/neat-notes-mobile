import React from "react";
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
}: {
  tags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
  disabled?: boolean;
}) {
  const GAP = 10;

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
                flexBasis: "46%",
                maxWidth: "46%",

                paddingVertical: 11,
                paddingHorizontal: 12,
                borderRadius: radii.md,
                borderWidth: active ? 2 : 1,
                borderColor: active ? colors.accent : colors.divider,
                backgroundColor: active ? colors.highlight : "transparent",
                opacity: disabled ? 0.6 : pressed ? 0.92 : 1,

                alignItems: "center",
                justifyContent: "center",
                minHeight: 46,
              })}
            >
              <Text
                style={[
                  type.body,
                  {
                    fontWeight: active ? "900" : "800",
                    textAlign: "center",
                    opacity: active ? 1 : 0.9,
                    fontSize: 13,
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