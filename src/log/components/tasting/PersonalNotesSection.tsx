import React from "react";
import { Text, TextInput } from "react-native";

import { Card } from "../../../../components/ui/Card";
import { radii } from "../../../../lib/radii";
import { spacing } from "../../../../lib/spacing";
import { colors } from "../../../../lib/theme";
import { type } from "../../../../lib/typography";

type Props = {
  locked: boolean;
  personalNotes: string;
  setPersonalNotes: (v: string) => void;
};

export function PersonalNotesSection({ locked, personalNotes, setPersonalNotes }: Props) {
  return (
    <Card>
      <Text style={type.sectionHeader}>Personal Notes</Text>
      <Text style={[type.microcopyItalic, { marginTop: spacing.xs, opacity: 0.85 }]}>
        Optional. Any extra flavors or comments? (e.g., grandma’s apple pie, buttery popcorn).
      </Text>

      <TextInput
        value={personalNotes}
        onChangeText={setPersonalNotes}
        editable={!locked}
        placeholder="Add a personal note…"
        placeholderTextColor={colors.textSecondary}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
        style={{
          marginTop: spacing.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: colors.divider,
          backgroundColor: "transparent",
          color: colors.textPrimary,
          fontSize: 16,
          fontFamily: type.body.fontFamily,
          opacity: !locked ? 1 : 0.75,
          minHeight: 120,
        }}
      />
    </Card>
  );
}