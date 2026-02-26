import React from "react";
import { Pressable, Text, View } from "react-native";

import { radii } from "../../../../lib/radii";
import { colors } from "../../../../lib/theme";
import { type } from "../../../../lib/typography";

export function NotesList({
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
  return (
    <View style={{ gap: 10 }}>
      {tags.map((t) => {
        const active = selected.includes(t);

        return (
          <Pressable
            key={t}
            disabled={disabled}
            onPress={() => onToggle(t)}
            style={({ pressed }) => ({
              width: "100%",
              paddingVertical: 11,
              paddingHorizontal: 12,
              borderRadius: radii.md,
              borderWidth: active ? 2 : 1,
              borderColor: active ? colors.accent : colors.divider,
              backgroundColor: active ? colors.highlight : "transparent",
              opacity: disabled ? 0.6 : pressed ? 0.92 : active ? 1 : 0.92,
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <Text
              style={[
                type.body,
                {
                  fontWeight: active ? "900" : "800",
                  textAlign: "center",
                  opacity: active ? 1 : 0.9,
                },
              ]}
            >
              {t}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}