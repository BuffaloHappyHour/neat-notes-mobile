// src/discover/components/WhiskeyTile.tsx
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { radii } from "../../../lib/radii";
import { shadows } from "../../../lib/shadows";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

import type { WhiskeyCardRow } from "../services/discover.service";

export function WhiskeyTile({
  row,
  onPress,
}: {
  row: WhiskeyCardRow;
  onPress: () => void;
}) {
  const proofText = useMemo(() => {
    if (row.proof == null) return null;
    const n = Number(row.proof);
    if (!Number.isFinite(n)) return null;
    return `${Math.round(n)} proof`;
  }, [row.proof]);

  const hasCommunity = row.communityCount > 0 && row.communityAvg != null;
  const hasBhh = row.bhhScore != null && Number.isFinite(Number(row.bhhScore));

  const communityText = hasCommunity ? row.communityAvg!.toFixed(1) : null;
  const bhhText = hasBhh ? String(Math.round(Number(row.bhhScore))) : null;

  const metaLine = useMemo(() => {
    const parts: string[] = [];
    if (communityText) parts.push(`Community: ${communityText}`);
    if (bhhText) parts.push(`BHH: ${bhhText}`);
    if (parts.length === 0) return null;
    return parts.join("  •  ");
  }, [communityText, bhhText]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 220,

        // ✅ slightly “raised” tint so it doesn’t feel like the same surface as the page
        backgroundColor: colors.surfaceRaised,

        borderWidth: 1,
        borderColor: colors.divider,
        borderRadius: radii.lg,

        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,

        opacity: pressed ? 0.92 : 1,

        // ✅ more lift, less “outline”
        ...shadows.card,
      })}
    >
      <View style={{ gap: 6 }}>
        <Text style={[type.body, { fontWeight: "900", fontSize: 15 }]} numberOfLines={1}>
          {row.whiskeyName}
        </Text>

        <Text style={[type.caption, { opacity: 0.92 }]} numberOfLines={1}>
          {row.whiskeyType ?? "—"}
          {proofText ? ` • ${proofText}` : ""}
        </Text>

        {metaLine ? (
          <Text style={[type.caption, { opacity: 0.85 }]} numberOfLines={1}>
            {metaLine}
          </Text>
        ) : (
          <Text style={[type.caption, { opacity: 0.7, fontStyle: "italic" }]} numberOfLines={1}>
            No ratings yet
          </Text>
        )}
      </View>
    </Pressable>
  );
}