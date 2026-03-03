import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { spacing } from "../../../../lib/spacing";
import { colors } from "../../../../lib/theme";
import { type } from "../../../../lib/typography";

type Row = { label: string; value: string };

export function BottleDetailsCard({
  detailsLabel = "Bottle details",
  rows,
  defaultOpen = false,
}: {
  detailsLabel?: string;
  rows: Row[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);

  const safeRows = useMemo(
    () =>
      (Array.isArray(rows) ? rows : [])
        .map((r) => ({
          label: String(r?.label ?? "").trim(),
          value: String(r?.value ?? "").trim(),
        }))
        .filter((r) => r.label && r.value),
    [rows]
  );

  if (!safeRows.length) return null;

  return (
    <View
      style={{
        alignSelf: "center",
        width: "92%",
        maxWidth: 560,
        marginTop: spacing.sm,
      }}
    >
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: spacing.sm,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {/* ✅ tan caret */}
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.accent}
          />
          <Text style={[type.body, { color: colors.textPrimary, fontWeight: "800" }]}>
            {detailsLabel}
          </Text>
        </View>
      </Pressable>

      {open ? (
  <View
    style={{
      paddingTop: spacing.xs,
      paddingBottom: spacing.xs,
      paddingHorizontal: spacing.md,
    }}
  >
    {safeRows.map((r, idx) => (
      <View
        key={`${r.label}-${idx}`}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 6,
        }}
      >
        <Text
          style={[
            type.microcopyItalic,
            {
              color: colors.textSecondary,
              width: 110,
              paddingRight: 10,
            },
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {r.label}
        </Text>

        <Text
          style={[
            type.body,
            {
              color: colors.textPrimary,
              flex: 1,
              textAlign: "right",
              fontWeight: "700",
            },
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {r.value}
        </Text>
      </View>
    ))}
  </View>
) : null}

    </View>
  );
}