import React from "react";
import { Pressable, Text, View } from "react-native";

import { radii } from "../../../../lib/radii";
import { colors } from "../../../../lib/theme";
import { type } from "../../../../lib/typography";

export type Reaction = "ENJOYED" | "NEUTRAL" | "NOT_FOR_ME" | null;

export function ReactionList({
  value,
  onChange,
  disabled,
}: {
  value: Reaction;
  onChange: (v: Reaction) => void;
  disabled?: boolean;
}) {
  const opts: { key: Reaction; label: string }[] = [
    { key: "ENJOYED", label: "Enjoyed" },
    { key: "NEUTRAL", label: "Neutral" },
    { key: "NOT_FOR_ME", label: "Not for me" },
  ];

  return (
    <View style={{ gap: 5 }}>
      {opts.map((o) => {
        const active = value === o.key;

        return (
          <Pressable
            key={String(o.key)}
            disabled={disabled}
            onPress={() => onChange(active ? null : o.key)}
            style={({ pressed }) => ({
              paddingVertical: 10,
              paddingHorizontal: 10,
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
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}