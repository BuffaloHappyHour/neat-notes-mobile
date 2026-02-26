// src/discover/components/SectionRow.tsx
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

import type { WhiskeyCardRow } from "../services/discover.service";
import { WhiskeyTile } from "./WhiskeyTile";

export function SectionRow({
  title,
  subtitle,
  rows,
  onSeeAll,
  onPressRow,
  emptyMessage,
}: {
  title: string;
  subtitle?: string;
  rows: WhiskeyCardRow[];
  onSeeAll: () => void;
  onPressRow: (r: WhiskeyCardRow) => void;
  emptyMessage?: string;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: spacing.md,
        }}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: colors.accent,
                opacity: 0.95,
              }}
            />
            <Text style={[type.sectionHeader, { fontSize: 18 }]}>{title}</Text>
          </View>

          {subtitle ? (
            <Text style={[type.body, { opacity: 0.72, fontSize: 12 }]}>{subtitle}</Text>
          ) : null}
        </View>

        <Pressable
          onPress={() => onSeeAll()} // ✅ ensure we call THIS instance’s handler
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Text style={[type.body, { fontWeight: "900", fontSize: 12, color: colors.accent }]}>
            View All
          </Text>
        </Pressable>
      </View>

      {rows.length === 0 ? (
        <Text style={[type.body, { opacity: 0.7 }]}>{emptyMessage ?? "Nothing here yet."}</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: spacing.md, paddingVertical: 2 }}>
            {rows.map((r) => (
              <WhiskeyTile key={r.whiskeyId} row={r} onPress={() => onPressRow(r)} />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}