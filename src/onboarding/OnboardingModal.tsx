import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";
import { withTick } from "../../lib/hapticsPress";

import { SLIDES } from "./slides";
import { ClarityVisual, GlassVisual, PicksVisual, RadarVisual } from "./OnboardingVisuals";

function renderVisual(visual: typeof SLIDES[number]["visual"]) {
  switch (visual) {
    case "glass":   return <GlassVisual />;
    case "clarity": return <ClarityVisual />;
    case "radar":   return <RadarVisual />;
    case "picks":   return <PicksVisual />;
  }
}

export default function OnboardingModal({
  visible,
  onDismiss,
}: {
  visible: boolean;
  onDismiss: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (visible) setCurrentIndex(0);
  }, [visible]);

  const markSeen = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (user) {
        await supabase
          .from("profiles")
          .update({ onboarding_seen_at: new Date().toISOString() })
          .eq("id", user.id);
      }
    } catch {}
    onDismiss();
  };

  const slide = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.88)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderWidth: 1,
            borderColor: colors.borderStrong,
            paddingTop: spacing.xl,
            paddingBottom: spacing.xl * 2 + insets.bottom + spacing.lg,
            paddingHorizontal: spacing.lg,
            minHeight: "82%",
            gap: spacing.lg,
            ...shadows.card,
          }}
        >
          {/* ── Header row: dots + skip ─────────────────────────────── */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", gap: 6 }}>
              {SLIDES.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: i <= currentIndex ? colors.accent : "transparent",
                    borderWidth: 1,
                    borderColor: colors.borderStrong,
                  }}
                />
              ))}
            </View>

            {!isLast ? (
              <Pressable
                onPress={withTick(async () => {
                  await markSeen();
                })}
              >
                <Text style={[type.caption, { color: colors.textMuted }]}>Skip</Text>
              </Pressable>
            ) : (
              <View />
            )}
          </View>

          {/* ── Intro text ──────────────────────────────────────────── */}
          <Text
            style={[
              type.sectionHeader,
              {
                fontSize: 20,
                lineHeight: 26,
                color: colors.textPrimary,
                opacity: 1,
                textAlign: "center",
                paddingHorizontal: spacing.md,
                marginBottom: spacing.md,
              },
            ]}
          >
            {slide.introText}
          </Text>

          {/* ── Visual area ─────────────────────────────────────────── */}
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              minHeight: 220,
              maxHeight: 220,
            }}
          >
            {renderVisual(slide.visual)}
          </View>

          {/* ── Text area ───────────────────────────────────────────── */}
          <View>
            <Text style={[type.labelCaps, { color: colors.accent, marginBottom: 6 }]}>
              {slide.eyebrow}
            </Text>
            <Text
              style={[
                type.screenTitle,
                { fontSize: 28, lineHeight: 34, color: colors.textPrimary },
              ]}
            >
              {slide.headline}
            </Text>
            <Text
              style={[
                type.microcopyItalic,
                {
                  fontSize: 14,
                  lineHeight: 20,
                  color: colors.textSecondary,
                  marginTop: spacing.sm,
                  opacity: 0.75,
                },
              ]}
            >
              {slide.body}
            </Text>
          </View>

          {/* ── Navigation ──────────────────────────────────────────── */}
          {!isLast ? (
            <Pressable
              onPress={withTick(() => setCurrentIndex(currentIndex + 1))}
              style={({ pressed }) => ({
                paddingVertical: 14,
                borderRadius: 999,
                backgroundColor: colors.accent,
                alignItems: "center",
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={[type.button, { color: colors.background }]}>Next →</Text>
            </Pressable>
          ) : (
            <View style={{ gap: spacing.sm }}>
              <Pressable
                onPress={withTick(async () => {
                  await markSeen();
                  router.push("/(tabs)/log");
                })}
                style={({ pressed }) => ({
                  paddingVertical: 14,
                  borderRadius: 999,
                  backgroundColor: colors.accent,
                  alignItems: "center",
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={[type.button, { color: colors.background }]}>
                  {slide.cta ?? "Log your first pour"}
                </Text>
              </Pressable>

              <Pressable
                onPress={withTick(async () => {
                  await markSeen();
                  router.push("/(tabs)/home");
                })}
                style={({ pressed }) => ({
                  paddingVertical: 12,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: colors.borderStrong,
                  alignItems: "center",
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={[type.button, { color: colors.textPrimary }]}>
                  {slide.ctaSecondary ?? "Take me home"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
