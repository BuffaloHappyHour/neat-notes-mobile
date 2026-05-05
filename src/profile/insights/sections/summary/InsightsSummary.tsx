import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { radii } from "../../../../../lib/radii";
import { spacing } from "../../../../../lib/spacing";
import { supabase } from "../../../../../lib/supabase";
import { colors } from "../../../../../lib/theme";
import { type } from "../../../../../lib/typography";
import { useHomeStats } from "../../../../home/hooks/useHomeStats";
import { type UserMetrics90dRow } from "../../hooks/useClarityInsightsData";

type InsightsTab = "summary" | "clarity" | "flavor" | "pour";

type InsightsSummaryProps = {
  metrics: UserMetrics90dRow | null;
  onTabChange: (tab: InsightsTab) => void;
};

function buildOpeningLine(topTraits: string[]) {
  const traitText =
    topTraits && topTraits.length
      ? topTraits.slice(0, 2).join(" and ").toLowerCase()
      : "balanced";

  return `Your palate is becoming more ${traitText} with each pour.`;
}

function mapTexture(val: number | null) {
  if (val == null) return "balanced texture";
  if (val <= 2) return "lighter texture";
  if (val <= 3.5) return "medium texture";
  return "richer texture";
}

function mapProof(val: number | null) {
  if (val == null) return "moderate proof";
  if (val <= 2) return "lower proof pours";
  if (val <= 3.5) return "moderate proof pours";
  return "higher proof pours";
}

function mapFlavor(val: number | null) {
  if (val == null) return "balanced intensity";
  if (val <= 2) return "subtle profiles";
  if (val <= 3.5) return "balanced profiles";
  return "bold, expressive profiles";
}

function buildIdealPour(
  flavor: string,
  proof: string,
  texture: string,
  category: string | null
) {
  let style = "a well-balanced whiskey";

  if (category === "bourbon") {
    if (flavor.includes("bold") || proof.includes("higher")) {
      style = "a higher-proof bourbon or barrel strength release";
    } else {
      style = "a classic Kentucky bourbon";
    }
  } else if (category === "scotch") {
    if (flavor.includes("bold")) {
      style = "a peated Islay scotch or a coastal single malt";
    } else {
      style = "a Speyside or Highland single malt";
    }
  } else if (category === "irish") {
    style = "a smooth Irish whiskey with layered fruit and grain notes";
  } else if (category === "rye") {
    style = "a spice-forward rye whiskey";
  } else {
    if (flavor.includes("bold")) {
      style = "a full-bodied, higher-proof whiskey";
    } else if (flavor.includes("subtle")) {
      style = "a lighter, more delicate pour";
    } else {
      style = "a balanced whiskey";
    }
  }

  return `Your ideal pour is likely ${style} — something that delivers ${texture} with ${proof}, and aligns naturally with what your palate responds to most.`;
}

function prettyTraitLabel(value: string) {
  return value.replace(/-/g, " ");
}

function buildExplorationParagraph(args: {
  diversityScore: number | null;
  avoidedTraits: string[];
  biggestRiser: string | null;
  biggestDrop: string | null;
}) {
  const { diversityScore, avoidedTraits, biggestRiser, biggestDrop } = args;

  const avoided = avoidedTraits
    .slice(0, 3)
    .map((t) => prettyTraitLabel(t).toLowerCase());

  const avoidedText =
    avoided.length >= 3
      ? `${avoided[0]}, ${avoided[1]}, and ${avoided[2]}`
      : avoided.length === 2
        ? `${avoided[0]} and ${avoided[1]}`
        : avoided[0] ?? null;

  const riserText = biggestRiser
    ? prettyTraitLabel(biggestRiser).toLowerCase()
    : null;

  const dropText = biggestDrop
    ? prettyTraitLabel(biggestDrop).toLowerCase()
    : null;

  if ((diversityScore ?? 0) < 50) {
    return `To widen your palate, spend the next few pours exploring outside your usual lane. Reach for bottles that introduce contrast rather than familiarity${
      avoidedText ? `, especially around ${avoidedText}` : ""
    }. The goal is not to force a favorite, but to sharpen your sense of what stands apart when those flavors show up.`;
  }

  return `To keep discovering new whiskies, use your current profile as a starting point rather than a limit. Follow the traits that are rising in your palate${
    riserText ? ` — especially ${riserText}` : ""
  } — while deliberately exploring bottles that bring in less familiar territory${
    avoidedText ? ` like ${avoidedText}` : ""
  }. ${
    dropText
      ? `Since ${dropText} is showing up less in your recent signal, trying it in a different style or proof range could reveal contrast you have not noticed yet.`
      : `A little contrast is what keeps your palate growing sharper over time.`
  }`;
}

function toTierLabel(score: number) {
  if (score >= 80) return "Signature";
  if (score >= 65) return "Refining";
  if (score >= 50) return "Defining";
  if (score >= 30) return "Developing";
  return "Emerging";
}

function statusLabel(pct: number) {
  if (pct >= 0.7) return "Strong";
  if (pct >= 0.45) return "Medium";
  return "Building";
}

type RecommendationCardItem = {
  mode: "safe" | "explore";
  title: string;
  whiskeyId: string;
  whiskeyName: string;
  whiskeyType: string;
  reason: string;
};

type RecommendationRuleRow = {
  flavor_slug: string;
  rule_type: "safe" | "explore";
  reason_template: string;
  priority: number;
  target_whiskey_type_id: string;
  whiskey_types:
    | {
        id: string;
        name: string;
      }
    | {
        id: string;
        name: string;
      }[]
    | null;
};

type RecommendedWhiskeyRow = {
  whiskey_id: string;
  display_name: string;
  whiskey_type_id: string;
  tasting_count: number;
  avg_rating: number | null;
};

function RecommendationCard({
  item,
  onPress,
}: {
  item: RecommendationCardItem;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 280,
        borderRadius: 20,
        padding: spacing.md,
        marginRight: spacing.md,
        backgroundColor: pressed
          ? "rgba(255,255,255,0.05)"
          : "rgba(255,255,255,0.03)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        gap: spacing.sm,
      })}
    >
      <Text
        style={[
          type.body,
          {
            color: colors.accent,
            fontWeight: "800",
          },
        ]}
      >
        {item.title}
      </Text>

      <Text
        style={[
          type.sectionHeader,
          {
            color: colors.textPrimary,
            fontSize: 22,
            lineHeight: 28,
            fontWeight: "800",
          },
        ]}
      >
        {item.whiskeyName}
      </Text>

      <Text
        style={[
          type.body,
          {
            color: colors.textSecondary,
            fontWeight: "600",
            opacity: 0.8,
            marginTop: 2,
          },
        ]}
      >
        {item.whiskeyType}
      </Text>

      <Text
        style={[
          type.body,
          {
            color: colors.textSecondary,
            lineHeight: 22,
          },
        ]}
      >
        {item.reason}
      </Text>
    </Pressable>
  );
}

export default function InsightsSummary({ metrics, onTabChange }: InsightsSummaryProps) {
  const { firstName } = useHomeStats();

  const topTraits = metrics?.top_traits_l1 ?? [];
  const avoidedTraits = metrics?.avoided_traits_l1 ?? [];

  const openingLine = buildOpeningLine(topTraits);

  const texture = mapTexture(metrics?.texture_pref ?? null);
  const proof = mapProof(metrics?.proof_pref ?? null);
  const flavor = mapFlavor(metrics?.flavor_pref ?? null);

  const clarityScore = metrics?.palate_clarity_0_100 ?? 0;
  const tierLabel = toTierLabel(clarityScore);

  const idealPour = buildIdealPour(flavor, proof, texture, metrics?.top_category ?? null);

  const explorationParagraph = buildExplorationParagraph({
    diversityScore: metrics?.diversity_0_100 ?? null,
    avoidedTraits,
    biggestRiser: metrics?.biggest_riser_l1 ?? null,
    biggestDrop: metrics?.biggest_drop_l1 ?? null,
  });

  const [recommendationCards, setRecommendationCards] = useState<
    RecommendationCardItem[]
  >([
    {
      mode: "safe",
      title: "Safe Pick",
      whiskeyId: "loading-safe",
      whiskeyName: "Loading recommendation...",
      whiskeyType: "Matching your palate",
      reason:
        "We're pulling a whiskey that best fits your current tasting profile.",
    },
    {
      mode: "explore",
      title: "Explore Something New",
      whiskeyId: "loading-explore",
      whiskeyName: "Loading recommendation...",
      whiskeyType: "Outside your comfort zone",
      reason:
        "We're pulling a whiskey that encourages broader exploration.",
    },
  ]);

  useEffect(() => {
    let isActive = true;

    async function loadRecommendations() {
      const safeFlavor = topTraits[0] ?? null;
      const exploreFlavor = avoidedTraits[0] ?? null;

      console.log("safeFlavor:", safeFlavor);
      console.log("exploreFlavor:", exploreFlavor);

      if (!safeFlavor && !exploreFlavor) return;

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user?.id || !isActive) return;

      const flavorSlugs = [safeFlavor, exploreFlavor].filter(
        (value): value is string => Boolean(value)
      );

      const { data: rules, error: rulesError } = await supabase
        .from("recommendation_rules")
        .select(
          `
          flavor_slug,
          rule_type,
          reason_template,
          priority,
          target_whiskey_type_id,
          whiskey_types:target_whiskey_type_id (
            id,
            name
          )
        `
        )
        .eq("is_active", true)
        .in("rule_type", ["safe", "explore"])
        .in("flavor_slug", flavorSlugs)
        .order("priority", { ascending: true });

      console.log("rulesError:", rulesError);
      console.log("rules:", rules);

      if (rulesError || !rules || !isActive) return;

      const typedRules = (rules as RecommendationRuleRow[]) ?? [];

      const safeRule = typedRules.find(
        (rule) => rule.rule_type === "safe" && rule.flavor_slug === safeFlavor
      );

      const exploreRule = typedRules.find(
        (rule) =>
          rule.rule_type === "explore" && rule.flavor_slug === exploreFlavor
      );

      const nextCards: RecommendationCardItem[] = [];

      if (safeRule?.target_whiskey_type_id) {
        const { data: safeWhiskey, error: safeError } = await supabase.rpc(
          "get_recommended_whiskey_for_type",
          {
            p_user_id: user.id,
            p_whiskey_type_id: safeRule.target_whiskey_type_id,
            p_min_tastings: 3,
          }
        );

        console.log("safeError:", safeError);
        console.log("safeWhiskey:", safeWhiskey);

        const safeItem = (safeWhiskey as RecommendedWhiskeyRow[] | null)?.[0];
        const safeWhiskeyType = Array.isArray(safeRule.whiskey_types)
          ? safeRule.whiskey_types[0]
          : safeRule.whiskey_types;

        if (!safeError && safeItem) {
          nextCards.push({
            mode: "safe",
            title: "Safe Pick",
            whiskeyName: safeItem.display_name,
            whiskeyId: safeItem.whiskey_id,
            whiskeyType:
              safeWhiskeyType?.name ?? "Recommended for your palate",
            reason: safeRule.reason_template,
          });
        }
      }

      if (exploreRule?.target_whiskey_type_id) {
        const { data: exploreWhiskey, error: exploreError } = await supabase.rpc(
          "get_recommended_whiskey_for_type",
          {
            p_user_id: user.id,
            p_whiskey_type_id: exploreRule.target_whiskey_type_id,
            p_min_tastings: 3,
          }
        );

        console.log("exploreError:", exploreError);
        console.log("exploreWhiskey:", exploreWhiskey);

        const exploreItem = (exploreWhiskey as RecommendedWhiskeyRow[] | null)?.[0];
        const exploreWhiskeyType = Array.isArray(exploreRule.whiskey_types)
          ? exploreRule.whiskey_types[0]
          : exploreRule.whiskey_types;

        if (!exploreError && exploreItem) {
          nextCards.push({
            mode: "explore",
            title: "Explore Something New",
            whiskeyName: exploreItem.display_name,
            whiskeyId: exploreItem.whiskey_id,
            whiskeyType:
              exploreWhiskeyType?.name ?? "Outside your comfort zone",
            reason: exploreRule.reason_template,
          });
        }
      }

      if (isActive && nextCards.length > 0) {
        setRecommendationCards(nextCards);
      }
    }

    void loadRecommendations();

    return () => {
      isActive = false;
    };
  }, [topTraits, avoidedTraits]);

  const drivers = [
    { label: "Depth", score: metrics?.depth_0_100 ?? 0 },
    { label: "Diversity", score: metrics?.diversity_0_100 ?? 0 },
    { label: "Consistency", score: metrics?.consistency_0_100 ?? 0 },
    { label: "Confidence", score: metrics?.confidence_0_100 ?? 0 },
  ];

  const pillStyle = {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(190,150,99,0.12)",
    borderWidth: 1,
    borderColor: "rgba(190,150,99,0.3)",
  };

  return (
    <View style={{ gap: spacing.lg }}>

      {/* SECTION 1 — IDENTITY HEADER */}
      <View style={{ gap: spacing.sm }}>
        {firstName ? (
          <Text style={[type.microcopyItalic, { fontSize: 22 }]}>
            {firstName},
          </Text>
        ) : null}

        <Text style={type.microcopyItalic}>{openingLine}</Text>

        <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: 4 }}>
          <View style={pillStyle}>
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                backgroundColor: colors.accent,
              }}
            />
            <Text style={[type.body, { color: colors.accent, fontWeight: "700", fontSize: 13 }]}>
              {clarityScore}/100
            </Text>
          </View>

          <View style={pillStyle}>
            <Text style={[type.body, { color: colors.accent, fontWeight: "700", fontSize: 13 }]}>
              {tierLabel}
            </Text>
          </View>
        </View>
      </View>

      {/* SECTION 2 — WHAT TO TRY NEXT */}
      <View style={{ gap: spacing.xs }}>
        <Text style={[type.sectionHeader, { color: colors.textPrimary }]}>
          What to try next
        </Text>
        <Text style={[type.body, { color: colors.textSecondary }]}>
          Based on your recent tasting profile.
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: spacing.sm,
          paddingRight: spacing.md,
        }}
      >
        {recommendationCards.map((item) => (
          <RecommendationCard
            key={item.mode}
            item={item}
            onPress={() => {
              if (item.whiskeyId.startsWith("loading-")) return;
              router.push({
                pathname: "/whiskey/[id]",
                params: { id: item.whiskeyId },
              });
            }}
          />
        ))}
      </ScrollView>

      {/* SECTION 3 — HERE'S WHY */}
      <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
        <Text style={[type.labelCaps, { color: colors.textSecondary }]}>
          Here's why
        </Text>

        <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
          {(
            [
              { label: "🫙 Pour Profile", tab: "pour" },
              { label: "🗺 Flavor Map", tab: "flavor" },
              { label: "📊 Palate Clarity", tab: "clarity" },
            ] as { label: string; tab: InsightsTab }[]
          ).map(({ label, tab }) => (
            <Pressable
              key={tab}
              onPress={() => onTabChange(tab)}
              style={({ pressed }) => ({
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
                backgroundColor: pressed
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(255,255,255,0.04)",
              })}
            >
              <Text style={[type.body, { color: colors.textPrimary, fontWeight: "600" }]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* SECTION 4 — PALATE SNAPSHOT */}
      <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
        <Text style={[type.labelCaps, { color: colors.textSecondary }]}>
          Palate Snapshot
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {drivers.map(({ label, score }) => {
            const pct = Math.max(0, Math.min(1, score / 100));
            return (
              <View
                key={label}
                style={{
                  flex: 1,
                  minWidth: "45%",
                  margin: spacing.xs,
                  borderRadius: radii.lg,
                  padding: spacing.md,
                  backgroundColor: "rgba(255,255,255,0.03)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.08)",
                  gap: spacing.xs,
                }}
              >
                <Text style={[type.labelCaps, { color: colors.textSecondary }]}>
                  {label}
                </Text>
                <Text style={[type.body, { color: colors.accent, fontWeight: "700" }]}>
                  {statusLabel(pct)}
                </Text>
                <View
                  style={{
                    height: 3,
                    borderRadius: 999,
                    backgroundColor: "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: 3,
                      borderRadius: 999,
                      backgroundColor: colors.accent,
                      width: `${Math.round(pct * 100)}%`,
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* SECTION 5 — FLAVOR FINGERPRINT */}
      <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
        <Text style={[type.labelCaps, { color: colors.textSecondary }]}>
          Flavor Fingerprint
        </Text>

        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text style={[type.body, { color: colors.textSecondary, fontWeight: "600", marginBottom: 2 }]}>
              Top Traits
            </Text>
            <View style={{ gap: 6 }}>
              {topTraits.slice(0, 4).map((trait) => (
                <View
                  key={trait}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: colors.surfaceSunken,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text style={[type.body, { color: colors.textPrimary, fontSize: 13 }]}>
                    {prettyTraitLabel(trait)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text style={[type.body, { color: colors.textSecondary, fontWeight: "600", marginBottom: 2 }]}>
              Avoided
            </Text>
            <View style={{ gap: 6 }}>
              {avoidedTraits.slice(0, 3).map((trait) => (
                <View
                  key={trait}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: colors.surfaceSunken,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text style={[type.body, { color: colors.textPrimary, fontSize: 13 }]}>
                    {prettyTraitLabel(trait)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <Pressable onPress={() => onTabChange("flavor")} style={{ marginTop: spacing.xs }}>
          <Text style={[type.caption, { color: colors.textSecondary, opacity: 0.7 }]}>
            See full flavor map →
          </Text>
        </Pressable>
      </View>

      {/* SECTION 6 — COACH'S NOTE */}
      <View>
        <View
          style={{
            height: 1,
            backgroundColor: colors.divider,
            opacity: 0.4,
            marginVertical: spacing.lg,
          }}
        />

        <Text style={[type.labelCaps, { color: colors.textSecondary, opacity: 0.6, marginBottom: spacing.sm }]}>
          Coach's Note
        </Text>

        <Text style={[type.microcopyItalic, { opacity: 0.75 }]}>
          {explorationParagraph}
        </Text>

        <Text style={[type.microcopyItalic, { opacity: 0.75, marginTop: spacing.sm }]}>
          {idealPour}
        </Text>
      </View>

    </View>
  );
}
