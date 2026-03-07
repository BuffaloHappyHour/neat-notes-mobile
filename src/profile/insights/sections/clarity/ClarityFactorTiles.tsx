import React from "react";
import { Pressable, Text, View } from "react-native";

import { radii } from "../../../../../lib/radii";
import { spacing } from "../../../../../lib/spacing";
import { colors } from "../../../../../lib/theme";
import { type } from "../../../../../lib/typography";

export type ClarityFactorKey =
  | "depth"
  | "diversity"
  | "consistency"
  | "confidence";

type FactorInput = {
  status: string;
  pct: number;
};

function MiniBar({ pct, active }: { pct: number; active: boolean }) {
  return (
    <View
      style={{
        height: 6,
        borderRadius: 999,
        overflow: "hidden",
        backgroundColor: "rgba(255,255,255,0.08)",
      }}
    >
      <View
        style={{
          width: `${Math.round(Math.max(0, Math.min(1, pct)) * 100)}%`,
          height: "100%",
          borderRadius: 999,
          backgroundColor: colors.accent,
          opacity: active ? 0.95 : 0.7,
        }}
      />
    </View>
  );
}

function FactorTile({
  label,
  status,
  pct,
  active,
  onPress,
}: {
  label: string;
  status: string;
  pct: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minWidth: "47%",
        padding: spacing.md,
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: active ? colors.accent : colors.borderSubtle,
        backgroundColor: active
          ? colors.surfaceRaised
          : pressed
            ? "rgba(255,255,255,0.05)"
            : colors.surfaceSunken,
        opacity: pressed ? 0.94 : 1,
        gap: spacing.sm,
      })}
    >
      <Text
        style={[
          type.body,
          {
            fontWeight: "900",
            fontSize: 16,
            color: colors.textPrimary,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          type.caption,
          {
            color: active ? colors.accent : colors.textSecondary,
            opacity: active ? 0.95 : 0.82,
            fontWeight: "800",
          },
        ]}
      >
        {status}
      </Text>

      <MiniBar pct={pct} active={active} />
    </Pressable>
  );
}

export function ClarityFactorTiles({
  selected,
  onSelect,
  factors,
}: {
  selected: ClarityFactorKey;
  onSelect: (key: ClarityFactorKey) => void;
  factors: {
    depth: FactorInput;
    diversity: FactorInput;
    consistency: FactorInput;
    confidence: FactorInput;
  };
}) {
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <FactorTile
          label="Depth"
          status={factors.depth.status}
          pct={factors.depth.pct}
          active={selected === "depth"}
          onPress={() => onSelect("depth")}
        />
        <FactorTile
          label="Diversity"
          status={factors.diversity.status}
          pct={factors.diversity.pct}
          active={selected === "diversity"}
          onPress={() => onSelect("diversity")}
        />
      </View>

      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <FactorTile
          label="Consistency"
          status={factors.consistency.status}
          pct={factors.consistency.pct}
          active={selected === "consistency"}
          onPress={() => onSelect("consistency")}
        />
        <FactorTile
          label="Confidence"
          status={factors.confidence.status}
          pct={factors.confidence.pct}
          active={selected === "confidence"}
          onPress={() => onSelect("confidence")}
        />
      </View>
    </View>
  );
}