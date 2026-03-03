import React from "react";
import { ScrollView } from "react-native";

import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";

import { Section } from "./components/Section";

import ClarityDeepDive from "./sections/ClarityDeepDive";
import TasteProfileRadar from "./sections/TasteProfileRadar";
import WhiskeyRange from "./sections/WhiskeyRange";

export default function InsightsScreen() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* 1️⃣ Palate Clarity Deep Dive */}
      <Section
        title="Palate Clarity"
        subtitle="How defined and consistent your tasting identity is."
      >
        <ClarityDeepDive />
      </Section>

      {/* 2️⃣ Taste Profile Radar */}
      <Section
        title="Your Taste Profile"
        subtitle="A visual summary of your defining flavor tendencies."
      >
        <TasteProfileRadar />
      </Section>

      {/* 6️⃣ Whiskey Range */}
      <Section
        title="Your Whiskey Range"
        subtitle="How diverse your logged whiskey types are."
      >
        <WhiskeyRange />
      </Section>
    </ScrollView>
  );
}