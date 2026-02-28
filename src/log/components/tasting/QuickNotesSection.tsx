// src/log/components/tasting/QuickNotesSection.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { Card } from "../../../../components/ui/Card";
import { radii } from "../../../../lib/radii";
import { spacing } from "../../../../lib/spacing";
import { colors } from "../../../../lib/theme";
import { type } from "../../../../lib/typography";

import { NotesGrid } from "../ui/NotesGrid";
import { type Reaction } from "../ui/ReactionList";

type Props = {
  locked: boolean;

  nose: Reaction;
  setNose: (v: Reaction) => void;

  taste: Reaction;
  setTaste: (v: Reaction) => void;

  allTopLevelLabels: string[];
  flavorTags: string[];
  toggleFlavor: (tag: string) => void;

  // refine CTA
  additionalNotesLine: string;
  openRefine: () => void;
  selectedNodeIds: string[];
  selectedCountText: string;
  selectedNodeLabelsPreview: string;
  scopedRootIds: string[]; // kept for compatibility (not used in this component right now)
};

const REACTIONS: { key: Reaction; label: string }[] = [
  { key: "ENJOYED", label: "Enjoyed" },
  { key: "NEUTRAL", label: "Neutral" },
  { key: "NOT_FOR_ME", label: "Not for me" },
];

function ReactionColumn({
  title,
  value,
  onChange,
  locked,
}: {
  title: string;
  value: Reaction;
  onChange: (v: Reaction) => void;
  locked: boolean;
}) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={[type.body, { fontWeight: "900", opacity: 0.95 }]}>{title}</Text>

      {/* subtle header divider (adds hierarchy without a nested card) */}
      <View
        style={{
          marginTop: spacing.xs,
          height: 1,
          width: "70%",
          backgroundColor: colors.divider,
          opacity: 0.65,
        }}
      />

      <View style={{ width: "100%", gap: spacing.sm, marginTop: spacing.md }}>
        {REACTIONS.map((r) => {
          const active = value === r.key;

          return (
            <Pressable
              key={String(r.key)}
              disabled={locked}
              onPress={() => onChange(r.key)}
              style={({ pressed }) => ({
                paddingVertical: 14, // ✅ slightly taller = more premium + better tap target
                paddingHorizontal: 14,
                borderRadius: radii.md,
                borderWidth: active ? 2 : 1,
                borderColor: active ? colors.accent : colors.divider,
                backgroundColor: active ? colors.highlight : "rgba(255,255,255,0.03)",
                opacity: locked ? 0.6 : pressed ? 0.92 : 1,
                alignItems: "center",
                justifyContent: "center",
                minHeight: 52, // ✅ consistent tap target
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
                numberOfLines={1}
              >
                {r.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

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
}: Props) {
  const hasRefined = selectedNodeIds.length > 0;

  const refineSub = useMemo(() => {
    if (!hasRefined) return "Explore more specific flavors";
    if (selectedNodeLabelsPreview) return selectedNodeLabelsPreview;
    return selectedCountText;
  }, [hasRefined, selectedNodeLabelsPreview, selectedCountText]);

  return (
    <View style={{ gap: spacing.lg }}>
      {/* =======================
          Card 1: Quick Reactions
          ======================= */}
      <Card>
        <Text style={type.sectionHeader}>Quick Reactions</Text>
        <Text style={[type.microcopyItalic, { marginTop: spacing.xs, opacity: 0.9 }]}>
          How are you enjoying the first sips?
        </Text>

        {/* Accent underline */}
        <View
          style={{
            width: 100,
            height: 4,
            borderRadius: 999,
            backgroundColor: colors.accent,
            opacity: 0.9,
            alignSelf: "center",
            marginTop: spacing.sm,
          }}
        />

        {/* Nose / Taste columns (no nested card; use dividers + spacing) */}
        <View style={{ marginTop: spacing.lg }}>
          <View style={{ flexDirection: "row", gap: spacing.lg, alignItems: "flex-start" }}>
            <ReactionColumn title="Nose" value={nose} onChange={setNose} locked={locked} />

            {/* vertical divider */}
            <View style={{ width: 1, backgroundColor: colors.divider, opacity: 0.7, alignSelf: "stretch" }} />

            <ReactionColumn title="Taste" value={taste} onChange={setTaste} locked={locked} />
          </View>
        </View>
      </Card>

      {/* =======================
          Card 2: Notes (deliberate)
          ======================= */}
      <Card>
        <Text style={type.sectionHeader}>Notes</Text>
        <Text style={[type.microcopyItalic, { marginTop: spacing.xs, opacity: 0.9 }]}>
          Select everything you smell and taste
        </Text>

        {/* subtle accent for “sit down & think” vibe */}
        <View
          style={{
            marginTop: spacing.sm,
            width: 86,
            height: 3,
            borderRadius: 999,
            backgroundColor: colors.accent,
            opacity: 0.65,
            alignSelf: "center",
          }}
        />

        <View style={{ marginTop: spacing.lg }}>
          <NotesGrid tags={allTopLevelLabels} selected={flavorTags} onToggle={toggleFlavor} disabled={locked} />
        </View>
      </Card>

      {/* =======================
          Card 3: Refine notes CTA
          ======================= */}
      <Pressable
        disabled={locked}
        onPress={openRefine}
        style={({ pressed }) => ({
          opacity: locked ? 0.6 : pressed ? 0.92 : 1,
        })}
      >
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text style={[type.body, { fontWeight: "900", opacity: 0.96 }]}>Refine notes (optional)</Text>

              <Text style={[type.microcopyItalic, { marginTop: spacing.xs, opacity: 0.85 }]}>{refineSub}</Text>

              {additionalNotesLine ? (
                <Text style={[type.microcopyItalic, { marginTop: spacing.xs, opacity: 0.75 }]}>
                  {additionalNotesLine}
                </Text>
              ) : null}
            </View>

            <Ionicons name="chevron-forward" size={18} color={colors.accent} />
          </View>
        </Card>
      </Pressable>
    </View>
  );
}