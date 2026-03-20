import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { radii } from "../../../../lib/radii";
import { spacing } from "../../../../lib/spacing";
import { colors } from "../../../../lib/theme";
import { type } from "../../../../lib/typography";

type Props = {
  locked: boolean;
  sourceType: "purchased" | "bar";
  onChangeSourceType: (val: "purchased" | "bar") => void;
  barName: string;
  onChangeBarName: (val: string) => void;
  barNameMissing: boolean;
};

export default function TastingSourceCard({
  locked,
  sourceType,
  onChangeSourceType,
  barName,
  onChangeBarName,
  barNameMissing,
}: Props) {
  return (
    <View
      style={{
        borderRadius: radii.lg,
        padding: spacing.lg,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.divider,
      }}
    >
      <Text style={type.sectionHeader}>Tasting source</Text>

      <Text
        style={[
          type.microcopyItalic,
          {
            marginTop: 2,
            opacity: 0.7,
            color: colors.textSecondary,
          },
        ]}
      >
        Add where this came from to improve your history and insights
      </Text>

      <View
        style={{
          flexDirection: "row",
          gap: spacing.md,
          marginTop: spacing.md,
        }}
      >
        <Pressable
          disabled={locked}
          onPress={() => onChangeSourceType("purchased")}
          style={({ pressed }) => ({
            flex: 1,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.md,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor:
              sourceType === "purchased" ? colors.accent : colors.divider,
            backgroundColor:
              sourceType === "purchased" ? colors.highlight : colors.surface,
            opacity: locked ? 0.6 : pressed ? 0.92 : 1,
            alignItems: "center",
            justifyContent: "center",
            minHeight: 120,
          })}
        >
          <Text
            style={[
              type.button,
              { color: colors.textPrimary, textAlign: "center" },
            ]}
          >
            My Bottle
          </Text>
          <Text
            style={[
              type.microcopyItalic,
              {
                opacity: 0.45,
                marginTop: 2,
                color: colors.textSecondary,
                textAlign: "center",
              },
            ]}
          >
            Logged from your own bottle
          </Text>
        </Pressable>

        <Pressable
          disabled={locked}
          onPress={() => onChangeSourceType("bar")}
          style={({ pressed }) => ({
            flex: 1,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.md,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: sourceType === "bar" ? colors.accent : colors.divider,
            backgroundColor:
              sourceType === "bar" ? colors.highlight : colors.surface,
            opacity: locked ? 0.6 : pressed ? 0.92 : 1,
            alignItems: "center",
            justifyContent: "center",
            minHeight: 120,
          })}
        >
          <Text
            style={[
              type.button,
              { color: colors.textPrimary, textAlign: "center" },
            ]}
          >
            Bar / Restaurant
          </Text>
          <Text
            style={[
              type.microcopyItalic,
              {
                opacity: 0.45,
                marginTop: 2,
                color: colors.textSecondary,
                textAlign: "center",
              },
            ]}
          >
            Logged from a venue
          </Text>
        </Pressable>
      </View>

      {sourceType === "bar" ? (
        <View style={{ marginTop: spacing.xl, gap: 6 }}>
          <Text style={[type.body, { fontWeight: "700", color: colors.textPrimary }]}>
            Venue details
          </Text>

          <TextInput
            value={barName}
            onChangeText={onChangeBarName}
            editable={!locked}
            placeholder="Enter venue name…"
            placeholderTextColor={colors.textSecondary}
            style={{
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.md,
              borderRadius: radii.md,
              borderWidth: 0.8,
              borderColor: barNameMissing ? colors.accent : colors.divider,
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              fontSize: 16,
              fontFamily: type.body.fontFamily,
              opacity: locked ? 0.75 : 1,
            }}
          />

          {barNameMissing ? (
            <Text
              style={[
                type.microcopyItalic,
                {
                  opacity: 0.7,
                  color: colors.accent,
                },
              ]}
            >
              Required for bar tastings
            </Text>
          ) : null}
        </View>
      ) : null}

      {sourceType === "purchased" ? (
        <View style={{ marginTop: spacing.xl }}>
          <Text
            style={[
              type.microcopyItalic,
              {
                opacity: 0.6,
                color: colors.textSecondary,
              },
            ]}
          >
            Logged from your personal bottle
          </Text>
        </View>
      ) : null}
    </View>
  );
}