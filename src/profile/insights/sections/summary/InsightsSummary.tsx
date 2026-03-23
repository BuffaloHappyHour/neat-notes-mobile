import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";


import { spacing } from "../../../../../lib/spacing";
import { supabase } from "../../../../../lib/supabase";
import { colors } from "../../../../../lib/theme";
import { type } from "../../../../../lib/typography";
import { useHomeStats } from "../../../../home/hooks/useHomeStats";
import { useClarityInsightsData } from "../../hooks/useClarityInsightsData";

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

export default function InsightsSummary() {
  const { firstName } = useHomeStats();
  const clarityData = useClarityInsightsData();

  const metrics = clarityData.metrics;

  const topTraits = metrics?.top_traits_l1 ?? [];
  const avoidedTraits = metrics?.avoided_traits_l1 ?? [];

  const openingLine = buildOpeningLine(topTraits);

  const texture = mapTexture(metrics?.texture_pref ?? null);
  const proof = mapProof(metrics?.proof_pref ?? null);
  const flavor = mapFlavor(metrics?.flavor_pref ?? null);

  const traitText =
    topTraits.length >= 2
      ? `${topTraits[0]} and ${topTraits[1]}`
      : topTraits[0] ?? "balanced flavors";

  const avoidedText =
    avoidedTraits.length > 0
      ? avoidedTraits.slice(0, 2).join(" and ")
      : null;

  const bodyParagraph = `You tend to gravitate toward ${flavor}, often favoring ${texture} with ${proof}. Your palate is shaped by ${traitText.toLowerCase()} profiles${
    avoidedText
      ? `, while ${avoidedText.toLowerCase()} notes appear less often in your selections`
      : ""
  }.`;

  const idealPour = buildIdealPour(
    flavor,
    proof,
    texture,
    metrics?.top_category ?? null
  );

  const explorationParagraph = buildExplorationParagraph({
    diversityScore: metrics?.diversity_0_100 ?? null,
    avoidedTraits,
    biggestRiser: metrics?.biggest_riser_l1 ?? null,
    biggestDrop: metrics?.biggest_drop_l1 ?? null,
  });

  const recommendationLead =
    "The recommendations below are designed to give you one whiskey that naturally fits your palate today, and one that invites you to explore beyond it.";

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
      "We’re pulling a whiskey that best fits your current tasting profile.",
  },
  {
    mode: "explore",
    title: "Explore Something New",
    whiskeyId: "loading-explore",
    whiskeyName: "Loading recommendation...",
    whiskeyType: "Outside your comfort zone",
    reason:
      "We’re pulling a whiskey that encourages broader exploration.",
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

  return (
    <View style={{ gap: spacing.lg }}>
      {firstName ? (
        <Text
          style={[
            type.microcopyItalic,
            {
              fontSize: 22,
            },
          ]}
        >
          {firstName},
        </Text>
      ) : null}

      <Text style={type.microcopyItalic}>{openingLine}</Text>

      <Text style={type.microcopyItalic}>{bodyParagraph}</Text>

      <Text style={[type.microcopyItalic, { opacity: 0.9 }]}>
        {idealPour}
      </Text>

      <Text style={type.microcopyItalic}>{explorationParagraph}</Text>

      <Text style={[type.microcopyItalic, { opacity: 0.92 }]}>
        {recommendationLead}
      </Text>

      <View
        style={{
          marginTop: spacing.xs,
          marginBottom: spacing.sm,
          height: 1,
          backgroundColor: colors.divider,
          opacity: 0.4,
        }}
      />

      <View style={{ gap: spacing.xs }}>
        <Text
          style={[
            type.sectionHeader,
            {
              color: colors.textPrimary,
            },
          ]}
        >
          What to try next
        </Text>

        <Text
          style={[
            type.body,
            {
              color: colors.textSecondary,
            },
          ]}
        >
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
    </View>
  );
}