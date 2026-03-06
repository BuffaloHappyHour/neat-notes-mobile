import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { radii } from "../../../lib/radii";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

import { Section } from "./components/Section";

import ClarityDeepDive from "./sections/ClarityDeepDive";
import TasteProfileRadar from "./sections/TasteProfileRadar";
import WhiskeyRange from "./sections/WhiskeyRange";

type InsightsTab = "clarity" | "flavor" | "behavior";

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 44,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? colors.accent : colors.divider,
        backgroundColor: active ? colors.highlight : "transparent",
        opacity: pressed ? 0.92 : 1,
        alignItems: "center",
        justifyContent: "center",
      })}
    >
      <Text
        style={[
          type.body,
          {
            fontWeight: active ? "900" : "800",
            color: active ? colors.textPrimary : colors.textSecondary,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function InsightsScreen() {
  const [tab, setTab] = useState<InsightsTab>("clarity");

  const headerCopy = useMemo(() => {
    if (tab === "clarity") {
      return {
        title: "Palate Clarity",
        subtitle: "How defined and consistent your tasting identity is.",
      };
    }

    if (tab === "flavor") {
      return {
        title: "Flavor Profile",
        subtitle: "A visual summary of your defining flavor tendencies.",
      };
    }

    return {
      title: "Behavior",
      subtitle: "How broadly and deeply you explore different whiskies.",
    };
  }, [tab]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.xl,
        gap: spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ gap: spacing.sm }}>
        <View
          style={{
            flexDirection: "row",
            gap: spacing.sm,
            backgroundColor: colors.glassSurface ?? colors.surface,
            borderRadius: radii.xl,
            borderWidth: 1,
            borderColor: colors.glassBorder ?? colors.divider,
            padding: spacing.xs,
          }}
        >
          <TabButton
            label="Palate Clarity"
            active={tab === "clarity"}
            onPress={() => setTab("clarity")}
          />
          <TabButton
            label="Flavor Profile"
            active={tab === "flavor"}
            onPress={() => setTab("flavor")}
          />
          <TabButton
            label="Behavior"
            active={tab === "behavior"}
            onPress={() => setTab("behavior")}
          />
        </View>
      </View>

      {tab === "clarity" ? (
        <Section title={headerCopy.title} subtitle={headerCopy.subtitle}>
          <ClarityDeepDive />
        </Section>
      ) : null}

      {tab === "flavor" ? (
        <Section title={headerCopy.title} subtitle={headerCopy.subtitle}>
          <TasteProfileRadar />
        </Section>
      ) : null}

      {tab === "behavior" ? (
        <Section title={headerCopy.title} subtitle={headerCopy.subtitle}>
          <WhiskeyRange />
        </Section>
      ) : null}
    </ScrollView>
  );
}