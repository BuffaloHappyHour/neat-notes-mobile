import React from "react";
import { Pressable, Text, View } from "react-native";

import { Card } from "../../../../components/ui/Card";
import { radii } from "../../../../lib/radii";
import { spacing } from "../../../../lib/spacing";
import { colors } from "../../../../lib/theme";
import { type } from "../../../../lib/typography";

import { type Reaction } from "../ui/ReactionList";

type Props = {
  locked: boolean;
  nose: Reaction;
  setNose: (v: Reaction) => void;
  taste: Reaction;
  setTaste: (v: Reaction) => void;
};

const REACTIONS: { key: Reaction; label: string }[] = [
  { key: "ENJOYED", label: "Enjoyed" },
  { key: "NEUTRAL", label: "Neutral" },
  { key: "NOT_FOR_ME", label: "Not for me" },
];

function SectionIntro({ title }: { title: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[type.sectionHeader, { fontSize: 26 }]}>{title}</Text>
    </View>
  );
}

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

      <View
        style={{
          marginTop: spacing.xs,
          height: 1,
          width: "70%",
          backgroundColor: colors.divider,
          opacity: 0.7,
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
                paddingVertical: 14,
                paddingHorizontal: 14,
                borderRadius: radii.md,
                borderWidth: active ? 2 : 1,
                borderColor: active ? colors.accent : colors.divider,
                backgroundColor: active ? colors.highlight : "rgba(255,255,255,0.03)",
                opacity: locked ? 0.6 : pressed ? 0.92 : 1,
                alignItems: "center",
                justifyContent: "center",
                minHeight: 52,
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
}: Props) {
  return (
    <View style={{ gap: spacing.sm }}>
      <SectionIntro title="Quick Reactions" />

      <Card style={{ paddingTop: spacing.lg, paddingBottom: spacing.lg }}>
        <View style={{ alignItems: "center" }}>
          <Text style={[type.microcopyItalic, { fontSize: 18, lineHeight: 26, opacity: 0.7 }]}>
            How are you enjoying your first sips?
          </Text>
        </View>

        <View
          style={{
            width: 110,
            height: 4,
            borderRadius: 999,
            backgroundColor: colors.accent,
            opacity: 0.7,
            alignSelf: "center",
            marginTop: spacing.sm,
          }}
        />

        <View style={{ marginTop: spacing.lg }}>
          <View style={{ flexDirection: "row", gap: spacing.lg, alignItems: "flex-start" }}>
            <ReactionColumn title="Nose" value={nose} onChange={setNose} locked={locked} />

            <View
              style={{
                width: 1,
                backgroundColor: colors.divider,
                opacity: 0.7,
                alignSelf: "stretch",
              }}
            />

            <ReactionColumn title="Taste" value={taste} onChange={setTaste} locked={locked} />
          </View>
        </View>
      </Card>
    </View>
  );
}