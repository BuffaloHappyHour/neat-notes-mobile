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
    <View style={{ gap: 10 }}>
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
                width: 9,
                height: 9,
                borderRadius: 2,
                backgroundColor: colors.accent,
                opacity: 0.75,
              }}
            />
            <Text style={[type.sectionHeader, { fontSize: 18, lineHeight: 22 }]}>{title}</Text>
          </View>

          {subtitle ? (
            <Text style={[type.caption, { opacity: 0.86 }]}>{subtitle}</Text>
          ) : null}
        </View>

        <Pressable
          onPress={onSeeAll}
          hitSlop={10}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          {/* ✅ calmer than before (less “button”) */}
          <Text style={[type.caption, { color: colors.textSecondary, opacity: 0.9, fontWeight: "700" }]}>
            View All
          </Text>
        </Pressable>
      </View>

      {rows.length === 0 ? (
        <Text style={[type.caption, { opacity: 0.8 }]}>{emptyMessage ?? "Nothing here yet."}</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled>
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