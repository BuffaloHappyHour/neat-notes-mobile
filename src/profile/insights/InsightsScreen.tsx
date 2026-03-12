import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";
import { usePalateClarity } from "../hooks/usePalateClarity";
import { useProfileData } from "../hooks/useProfileData";

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
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.xs,
        opacity: pressed ? 0.88 : 1,
        alignItems: "center",
        justifyContent: "center",
      })}
    >
      <View style={{ alignItems: "center", gap: 10, width: "100%" }}>
        <Text
          style={[
            type.body,
            {
              fontWeight: active ? "900" : "700",
              fontSize: 14,
              color: active ? colors.textPrimary : colors.textSecondary,
              textAlign: "center",
              letterSpacing: active ? 0.2 : 0,
            },
          ]}
        >
          {label}
        </Text>

        <View
          style={{
            height: 3,
            width: active ? "80%" : "30%",
            borderRadius: 999,
            backgroundColor: active ? colors.accent : "rgba(255,255,255,0.06)",
            opacity: active ? 1 : 0.45,
          }}
        />
      </View>
    </Pressable>
  );
}

export default function InsightsScreen() {
  const [tab, setTab] = useState<InsightsTab>("clarity");

  const { clarityInput, isPremium } = useProfileData();
  const clarity = usePalateClarity(clarityInput);
  const hasPremiumAccess = isPremium === true;

  const headerCopy = useMemo(() => {
    if (tab === "clarity") {
      return {
        title: "Palate Clarity",
        subtitle: "Understand how your tasting identity is forming and evolving.",
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

  if (!hasPremiumAccess) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: "transparent" }}
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            marginTop: spacing.md,
            padding: spacing.lg,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: "rgba(190,150,99,0.34)",
            backgroundColor: "rgba(18,16,14,0.74)",
          }}
        >
          <Text
            style={[
              type.sectionHeader,
              {
                color: colors.textPrimary,
                marginBottom: spacing.sm,
              },
            ]}
          >
            Insights
          </Text>

          <Text
            style={[
              type.body,
              {
                color: colors.textSecondary,
                lineHeight: 24,
              },
            ]}
          >
            Insights will become available as you log more tastings.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "transparent" }}
      contentContainerStyle={{
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.xl,
        gap: spacing.sm,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ gap: spacing.lg }}>
        <View
          style={{
            paddingTop: spacing.xs,
            paddingBottom: spacing.sm,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
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
      </View>

      {tab === "clarity" ? (
        <Section title={headerCopy.title} subtitle={headerCopy.subtitle}>
          <ClarityDeepDive clarity={clarity} />
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