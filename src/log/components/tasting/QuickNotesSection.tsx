// src/log/components/tasting/QuickNotesSection.tsx
import React from "react";
import { Pressable, Text, View } from "react-native";

import { Card } from "../../../../components/ui/Card";

import { radii } from "../../../../lib/radii";
import { spacing } from "../../../../lib/spacing";
import { colors } from "../../../../lib/theme";
import { type } from "../../../../lib/typography";

import { ColumnHeader } from "../ui/ColumnHeader";
import { NotesList } from "../ui/NotesList";
import { ReactionList, type Reaction } from "../ui/ReactionList";

type Props = {
  locked: boolean;

  nose: Reaction;
  setNose: (v: Reaction) => void;

  taste: Reaction;
  setTaste: (v: Reaction) => void;

  allTopLevelLabels: string[];
  flavorTags: string[];
  toggleFlavor: (tag: string) => void;

  additionalNotesLine: string;

  openRefine: () => void;

  selectedNodeIds: string[];
  selectedCountText: string;
  selectedNodeLabelsPreview: string;
  scopedRootIds: string[];
};

export function QuickNotesSection({
  locked,
  nose,
  setNose,
  taste,
  setTaste,
  allTopLevelLabels,
  flavorTags,
  toggleFlavor,
  additionalNotesLine,
  openRefine,
  selectedNodeIds,
  selectedCountText,
  selectedNodeLabelsPreview,
  scopedRootIds,
}: Props) {
  return (
    <Card>
      <Text style={type.sectionHeader}>What do you smell or taste?</Text>
      <Text style={[type.microcopyItalic, { marginTop: spacing.xs, opacity: 0.85 }]}>
        Top-level notes are perfect. Refining is optional.
      </Text>

      <View style={{ marginTop: spacing.md, flexDirection: "row" }}>
        <View style={{ flex: 1 }}>
          <View style={{ gap: spacing.sm }}>
            <ColumnHeader title="Nose" />
            <ReactionList value={nose} onChange={setNose} disabled={locked} />
          </View>

          <View style={{ height: spacing.xl }} />

          <View style={{ gap: spacing.sm }}>
            <ColumnHeader title="Taste" />
            <ReactionList value={taste} onChange={setTaste} disabled={locked} />
          </View>
        </View>

        <View style={{ width: spacing.lg, alignItems: "center" }}>
          <View
            style={{
              width: 2,
              height: 14,
              borderRadius: 999,
              backgroundColor: colors.accent,
              marginTop: 6,
              marginBottom: 6,
              opacity: 0.95,
            }}
          />
          <View
            style={{
              width: 2,
              flex: 1,
              borderRadius: 999,
              backgroundColor: colors.divider,
              opacity: 0.9,
            }}
          />
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ gap: spacing.sm }}>
            <ColumnHeader title="Notes" />
            <NotesList
              tags={allTopLevelLabels}
              selected={flavorTags}
              onToggle={toggleFlavor}
              disabled={locked}
            />
          </View>
        </View>
      </View>

      {additionalNotesLine ? (
        <Text style={[type.microcopyItalic, { marginTop: spacing.md, opacity: 0.85 }]}>
          {additionalNotesLine}
        </Text>
      ) : null}

      <Pressable
        disabled={locked}
        onPress={openRefine}
        style={({ pressed }) => ({
          marginTop: spacing.md,
          width: "100%",
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.lg,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: colors.divider,
          backgroundColor: pressed ? colors.highlight : "transparent",
          opacity: locked ? 0.6 : 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        })}
      >
        <Text style={[type.body, { fontWeight: "900" }]}>Refine notes (optional)</Text>

        <Text style={[type.microcopyItalic, { opacity: 0.8, textAlign: "center" }]}>
          {selectedNodeIds.length
            ? `${selectedCountText} • ${selectedNodeLabelsPreview}`
            : scopedRootIds.length
            ? "Explore deeper under your selected notes"
            : "Explore more specific flavors"}
        </Text>
      </Pressable>
    </Card>
  );
}