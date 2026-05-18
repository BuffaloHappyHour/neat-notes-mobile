import { Stack } from "expo-router";
import React from "react";
import { ScrollView, Text, View } from "react-native";

import { radii } from "../lib/radii";
import { spacing } from "../lib/spacing";
import { colors } from "../lib/theme";
import { type } from "../lib/typography";

import { SLIDES } from "../src/onboarding/slides";
import {
  ClarityVisual,
  GlassVisual,
  IconsVisual,
  RadarVisual,
} from "../src/onboarding/OnboardingVisuals";

function renderVisual(visual: typeof SLIDES[number]["visual"]) {
  switch (visual) {
    case "glass":   return <GlassVisual />;
    case "clarity": return <ClarityVisual />;
    case "radar":   return <RadarVisual />;
    case "icons":   return <IconsVisual />;
  }
}

export default function OnboardingGuideScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "App Guide",
          headerStyle: { backgroundColor: colors.background as any },
          headerTintColor: colors.textPrimary as any,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{
          padding: spacing.lg,
          gap: spacing.lg,
          paddingBottom: spacing.xl * 2,
        }}
      >
        {SLIDES.map((slide) => (
          <View
            key={slide.id}
            style={{
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.borderStrong,
              backgroundColor: colors.glassSurface,
              padding: spacing.lg,
              gap: spacing.lg,
            }}
          >
            {/* Visual */}
            <View style={{ alignItems: "center", justifyContent: "center", minHeight: 180 }}>
              {renderVisual(slide.visual)}
            </View>

            {/* Text */}
            <View>
              <Text style={[type.labelCaps, { color: colors.accent, marginBottom: 6 }]}>
                {slide.eyebrow}
              </Text>
              <Text
                style={[
                  type.screenTitle,
                  { fontSize: 24, lineHeight: 30, color: colors.textPrimary },
                ]}
              >
                {slide.headline}
              </Text>
              <Text
                style={[
                  type.microcopyItalic,
                  {
                    fontSize: 16,
                    lineHeight: 24,
                    color: colors.textSecondary,
                    marginTop: spacing.sm,
                    opacity: 0.88,
                  },
                ]}
              >
                {slide.body}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </>
  );
}
