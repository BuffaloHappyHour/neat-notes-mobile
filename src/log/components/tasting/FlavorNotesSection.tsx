import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { Card } from "../../../../components/ui/Card";
import { radii } from "../../../../lib/radii";
import { spacing } from "../../../../lib/spacing";
import { colors } from "../../../../lib/theme";
import { type } from "../../../../lib/typography";

import { NotesGrid } from "../ui/NotesGrid";

type Props = {
  locked: boolean;
  allTopLevelLabels: string[];
  flavorTags: string[];
  toggleFlavor: (tag: string) => void;
  additionalNotesLine: string;
  openRefine: () => void;
  selectedNodeIds: string[];
  selectedCountText: string;
  selectedNodeLabelsPreview: string;
};

function SectionIntro({ title }: { title: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[type.sectionHeader, { fontSize: 26 }]}>{title}</Text>
    </View>
  );
}

export default function FlavorNotesSection({
  locked,
  allTopLevelLabels,
  flavorTags,
  toggleFlavor,
  additionalNotesLine,
  openRefine,
  selectedNodeIds,
  selectedCountText,
  selectedNodeLabelsPreview,
}: Props) {
  const hasRefined = selectedNodeIds.length > 0;

  const refineSub = useMemo(() => {
    if (!hasRefined) return "Search for flavors that define your palate";
    if (selectedNodeLabelsPreview) return selectedNodeLabelsPreview;
    return selectedCountText;
  }, [hasRefined, selectedNodeLabelsPreview, selectedCountText]);

  return (
    <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
      <SectionIntro title="Flavor Notes" />

      <Card style={{ paddingTop: spacing.md, paddingBottom: spacing.lg }}>
        <View style={{ alignItems: "center" }}>
          <Text style={[type.microcopyItalic, { fontSize: 18, lineHeight: 26, opacity: 0.7 }]}>
            Select everything you smell and taste
          </Text>

          <View
            style={{
              width: 200,
              height: 3,
              borderRadius: 999,
              backgroundColor: colors.accent,
              opacity: 0.55,
              marginTop: spacing.sm,
            }}
          />
        </View>

        <View style={{ marginTop: spacing.xs }}>
          <NotesGrid
            tags={allTopLevelLabels}
            selected={flavorTags}
            onToggle={toggleFlavor}
            disabled={locked}
          />
        </View>

        <View style={{ marginTop: spacing.lg }}>
          <View style={{ height: 1, backgroundColor: colors.divider, opacity: 0.8 }} />

          <Pressable
            disabled={locked}
            onPress={openRefine}
            style={({ pressed }) => ({
              marginTop: spacing.md,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: !hasRefined ? colors.accent : colors.divider,
              backgroundColor: pressed ? colors.highlight : "rgba(255,255,255,0.03)",
              opacity: locked ? 0.6 : 1,
            })}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
            >
              <View style={{ flex: 1, paddingRight: spacing.md }}>
                <Text style={[type.body, { fontWeight: "900", opacity: 0.85 }]}>
                  Refine further {hasRefined ? `(${selectedNodeIds.length})` : "(recommended)"}
                </Text>

                <Text style={[type.microcopyItalic, { marginTop: spacing.xs, opacity: 0.85 }]}>
                  {refineSub}
                </Text>

                {additionalNotesLine ? (
                  <Text style={[type.microcopyItalic, { marginTop: spacing.xs, opacity: 0.75 }]}>
                    {additionalNotesLine}
                  </Text>
                ) : null}
              </View>

              <Ionicons name="chevron-forward" size={18} color={colors.accent} />
            </View>
          </Pressable>
        </View>
      </Card>
    </View>
  );
}