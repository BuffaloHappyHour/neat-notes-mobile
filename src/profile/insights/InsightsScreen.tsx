import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Purchases, { type PurchasesPackage } from "react-native-purchases";
import Svg, { Circle, Line as SvgLine, Polygon, Text as SvgText } from "react-native-svg";

import { BlurView } from "expo-blur";

import { trackInsightsScreenViewed, trackPurchaseCompleted, trackPurchaseTapped, trackRestoreCompleted } from "../../../lib/analytics";
import { syncPremiumStatusFromRevenueCat } from "../../../lib/premiumSync";
import {
  getCurrentOffering,
  purchasePackage,
  restoreMyPurchases,
} from "../../../lib/purchases";
import { radii } from "../../../lib/radii";
import { spacing } from "../../../lib/spacing";
import { supabase } from "../../../lib/supabase";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";
import { useProfileData } from "../hooks/useProfileData";

import { Section } from "./components/Section";

import { useClarityInsightsData } from "./hooks/useClarityInsightsData";
import ClarityDeepDive from "./sections/ClarityDeepDive";
import PourPreferences from "./sections/PourPreferences";
import InsightsSummary from "./sections/summary/InsightsSummary";
import TasteProfileRadar from "./sections/TasteProfileRadar";

type InsightsTab = "summary" | "clarity" | "flavor" | "pour";

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

function PrimaryButton({
  label,
  loading,
  onPress,
  disabled = false,
}: {
  label: string;
  loading: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      style={({ pressed }) => ({
        marginTop: spacing.lg,
        minHeight: 52,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: pressed ? "rgba(190,150,99,0.85)" : colors.accent,
        opacity: loading || disabled ? 0.7 : 1,
        paddingHorizontal: spacing.lg,
      })}
    >
      {loading ? (
        <ActivityIndicator color={colors.background} />
      ) : (
        <Text
          style={[
            type.body,
            {
              color: colors.background,
              fontWeight: "800",
            },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function SecondaryButton({
  label,
  loading,
  onPress,
}: {
  label: string;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => ({
        marginTop: spacing.sm,
        minHeight: 48,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(190,150,99,0.34)",
        backgroundColor: pressed ? "rgba(190,150,99,0.10)" : "transparent",
        opacity: loading ? 0.7 : 1,
        paddingHorizontal: spacing.lg,
      })}
    >
      {loading ? (
        <ActivityIndicator color={colors.textPrimary} />
      ) : (
        <Text
          style={[
            type.body,
            {
              color: colors.textPrimary,
              fontWeight: "700",
            },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function PackageOption({
  pkg,
  selected,
  onPress,
}: {
  pkg: PurchasesPackage;
  selected: boolean;
  onPress: () => void;
}) {
  const isAnnual = pkg.identifier === "$rc_annual";
  const title = isAnnual ? "Annual" : "Monthly";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        marginTop: spacing.md,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: selected ? colors.accent : "rgba(255,255,255,0.08)",
        backgroundColor: selected
          ? "rgba(190,150,99,0.10)"
          : pressed
            ? "rgba(255,255,255,0.03)"
            : "rgba(255,255,255,0.02)",
        padding: spacing.md,
      })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.md,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={[
              type.sectionHeader,
              {
                fontSize: 18,
                color: colors.textPrimary,
              },
            ]}
          >
            {title}
          </Text>

          <Text
            style={[
              type.body,
              {
                marginTop: 4,
                color: colors.textSecondary,
              },
            ]}
          >
            {pkg.product.priceString}
            {isAnnual ? " / year" : " / month"}
          </Text>
        </View>

        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            borderWidth: 2,
            borderColor: selected ? colors.accent : "rgba(255,255,255,0.25)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {selected ? (
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                backgroundColor: colors.accent,
              }}
            />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

type LifetimeMetrics = {
  tasting_count: number;
  top_traits_l1: string[] | null;
  avoided_traits_l1: string[] | null;
  proof_pref: number | null;
  texture_pref: number | null;
  flavor_pref: number | null;
  palate_clarity_0_100: number | null;
  whiskey_type_affinity: Record<string, { name: string; count: number; avg_rating: number | null }> | null;
};

export default function InsightsScreen() {
  const [tab, setTab] = useState<InsightsTab>("summary");

  const { isPremium, loading: profileLoading } = useProfileData();

  const { metrics } = useClarityInsightsData();
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const hasPremiumAccess = isPremium;
  const insightsViewedRef = React.useRef(false);

  const [lifetimeMetrics, setLifetimeMetrics] = useState<LifetimeMetrics | null>(null);
  const [expandedFeatureIndex, setExpandedFeatureIndex] = useState<number | null>(null);

  const headerCopy = useMemo(() => {
    if (tab === "clarity") {
      return {
        title: "Palate Clarity",
        subtitle: "Understand how your tasting identity is forming and evolving.",
      };
    }

    if (tab === "flavor") {
      return {
        title: "Flavor Map",
        subtitle: "A visual summary of your defining flavor tendencies.",
      };
    }

    return {
      title: "Summary",
      subtitle: "A narrative view of your palate.",
    };
  }, [tab]);

  const selectedPackage =
    packages.find((pkg) => pkg.identifier === selectedPackageId) ?? null;

  useEffect(() => {
    if (profileLoading) return;
    if (hasPremiumAccess) return;
    if (insightsViewedRef.current) return;
    insightsViewedRef.current = true;
    void trackInsightsScreenViewed();

    let active = true;

    async function loadPackages() {
      try {
        setPackagesLoading(true);

        const configured = await Purchases.isConfigured();
        if (!configured) return;

        const offering = await getCurrentOffering();
        if (!active) return;

        const available = offering?.availablePackages ?? [];

        const sorted = [...available].sort((a, b) => {
          const order: Record<string, number> = {
            $rc_monthly: 0,
            $rc_annual: 1,
          };

          return (order[a.identifier] ?? 99) - (order[b.identifier] ?? 99);
        });

        setPackages(sorted);

        const defaultPackage =
          sorted.find((pkg) => pkg.identifier === "$rc_annual") ??
          sorted.find((pkg) => pkg.identifier === "$rc_monthly") ??
          sorted[0] ??
          null;

        setSelectedPackageId(defaultPackage?.identifier ?? null);
      } catch (e: any) {
        if (!active) return;
        const msg = String(e?.message ?? e ?? "");
        if (msg.includes("PRODUCT_NOT_FOUND") || msg.includes("ConfigurationError") || e?.code === 9 || e?.code === 30) {
          if (__DEV__) console.warn("[RC] Products unavailable in dev build — expected behavior");
          return;
        }
        Alert.alert(
          "Subscriptions unavailable",
          String(e?.message ?? e ?? "Unable to load subscription options."),
        );
      } finally {
        if (active) {
          setPackagesLoading(false);
        }
      }
    }

    void loadPackages();

    return () => {
      active = false;
    };
  }, [hasPremiumAccess, profileLoading]);

  useEffect(() => {
    if (hasPremiumAccess || profileLoading) return;
    let active = true;

    async function loadLifetimeMetrics() {
      setLifetimeMetrics(null);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;
        if (!user?.id || !active) return;

        const { data, error } = await supabase
          .from("user_metrics_lifetime_current")
          .select(
            "tasting_count,top_traits_l1,avoided_traits_l1,proof_pref,texture_pref,flavor_pref,palate_clarity_0_100,whiskey_type_affinity"
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (!active) return;
        if (error) {
          console.warn("[Insights] lifetime metrics fetch failed:", error.message);
          return;
        }
        if (data) setLifetimeMetrics(data as LifetimeMetrics);
      } catch (e) {
        if (active) console.warn("[Insights] lifetime metrics error:", e);
      }
    }

    void loadLifetimeMetrics();
    return () => {
      active = false;
    };
  }, [hasPremiumAccess, profileLoading]);

  async function handleUnlockInsights() {
    if (purchaseLoading || restoreLoading || !selectedPackage) return;
    void trackPurchaseTapped(selectedPackage.identifier);
    try {
      setPurchaseLoading(true);
      const configured = await Purchases.isConfigured();
      if (!configured) {
        Alert.alert("Not ready", "Please wait a moment and try again.");
        return;
      }
      await purchasePackage(selectedPackage);
      await syncPremiumStatusFromRevenueCat();
      void trackPurchaseCompleted(selectedPackage.identifier);
      Alert.alert("Premium unlocked", "Insights are now available on your account.");
    } catch (e: any) {
      Alert.alert("Purchase not completed", String(e?.message ?? e));
    } finally {
      setPurchaseLoading(false);
    }
  }

  async function handleRestorePurchases() {
    if (purchaseLoading || restoreLoading) return;
    try {
      setRestoreLoading(true);
      const configured = await Purchases.isConfigured();
      if (!configured) {
        Alert.alert("Not ready", "Please wait a moment and try again.");
        return;
      }
      const restored = await restoreMyPurchases();
      await syncPremiumStatusFromRevenueCat();
      if (restored) {
        void trackRestoreCompleted();
        Alert.alert("Purchases restored", "Your premium access has been restored.");
      } else {
        Alert.alert("Nothing to restore", "No active premium purchase was found for this account.");
      }
    } catch (e: any) {
      Alert.alert("Restore failed", String(e?.message ?? e));
    } finally {
      setRestoreLoading(false);
    }
  }

  if (profileLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!hasPremiumAccess) {
    const tastingCount = metrics?.tasting_count ?? 0;

    const formatTrait = (t: string) =>
      t.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

    const displayCount = lifetimeMetrics?.tasting_count ?? tastingCount;

    const goToStyle = lifetimeMetrics?.whiskey_type_affinity
      ? (() => {
          const entries = Object.entries(lifetimeMetrics.whiskey_type_affinity);
          if (!entries.length) return null;
          const top = entries.sort((a, b) => b[1].count - a[1].count)[0];
          return top[1].name || null;
        })()
      : null;

    const seekParts = (lifetimeMetrics?.top_traits_l1 ?? []).slice(0, 2).map(formatTrait);
    const seekTraits = seekParts.length > 0 ? seekParts.join(", ") : null;

    const avoidTrait = lifetimeMetrics?.avoided_traits_l1?.[0]
      ? formatTrait(lifetimeMetrics.avoided_traits_l1[0])
      : null;

    const proofLabel = (() => {
      const p = lifetimeMetrics?.proof_pref ?? null;
      if (p === null) return null;
      const tier = p <= 2.5 ? "Low proof" : p <= 3.5 ? "Mid proof" : "High proof";
      return `${tier} pours rate better for you`;
    })();

    const clarityValue =
      lifetimeMetrics?.palate_clarity_0_100 != null
        ? `${Math.round(lifetimeMetrics.palate_clarity_0_100)} / 100`
        : null;

    const monthlyPkg = packages.find((p) => p.identifier === "$rc_monthly");
    const annualPkg = packages.find((p) => p.identifier === "$rc_annual");
    const annualSavingsPct =
      monthlyPkg && annualPkg
        ? Math.round(
            ((monthlyPkg.product.price * 12) - annualPkg.product.price) /
              (monthlyPkg.product.price * 12) *
              100
          )
        : null;

    const features = [
      {
        title: "Tailored bottle recommendations",
        subtitle: "Matched to your actual flavor preferences",
      },
      {
        title: "Top traits + avoided notes",
        subtitle: "What your palate seeks and rejects",
      },
      {
        title: "Texture, proof & flavor intensity",
        subtitle: "What you reach for vs. what you actually love",
      },
      {
        title: "Proof point analysis",
        subtitle: "The proof range where your ratings peak",
      },
      {
        title: "Depth, diversity, consistency & confidence",
        subtitle: "How your palate is maturing over time",
      },
      {
        title: "Palate narrative",
        subtitle: "Who you are as a whiskey drinker",
      },
    ];

    // Decorative radar SVG — shown when tasting_count < 3
    const radarCx = 150;
    const radarCy = 150;
    const radarOuterR = 120;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const radarFlavors = [
      { label: "Sweet",      angle: 270, fraction: 0.85 },
      { label: "Spicy",      angle: 297, fraction: 0.70 },
      { label: "Smoke Peat", angle: 324, fraction: 0.30 },
      { label: "Grainy",     angle: 351, fraction: 0.25 },
      { label: "Nutty",      angle: 18,  fraction: 0.40 },
      { label: "Herbal",     angle: 45,  fraction: 0.35 },
      { label: "Off-Notes",  angle: 72,  fraction: 0.20 },
      { label: "Fruity",     angle: 99,  fraction: 0.75 },
      { label: "Floral",     angle: 126, fraction: 0.30 },
      { label: "Woody",      angle: 153, fraction: 0.80 },
      { label: "Earthy",     angle: 207, fraction: 0.60 },
    ];
    const radarAxisPts = radarFlavors.map(({ angle }) => ({
      x: radarCx + radarOuterR * Math.cos(toRad(angle)),
      y: radarCy + radarOuterR * Math.sin(toRad(angle)),
    }));
    const radarLabelPts = radarFlavors.map(({ angle, label }) => ({
      x: radarCx + radarOuterR * 1.35 * Math.cos(toRad(angle)),
      y: radarCy + radarOuterR * 1.35 * Math.sin(toRad(angle)),
      label,
    }));
    const radarDataPoints = radarFlavors
      .map(({ angle, fraction }) => {
        const a = toRad(angle);
        return `${radarCx + radarOuterR * fraction * Math.cos(a)},${radarCy + radarOuterR * fraction * Math.sin(a)}`;
      })
      .join(" ");

    function buildSommelierBlurb(): string {
      // Sentence 1 — style + flavor personality
      let s1: string;
      if (displayCount === 0) {
        s1 = "You haven't logged any pours yet — start tasting and we'll build your profile.";
      } else if (goToStyle && seekTraits) {
        s1 = `${goToStyle} is where you've spent your time, and your palate keeps coming back to ${seekTraits} notes.`;
      } else if (goToStyle) {
        s1 = `You've been spending time with ${goToStyle}, and a preference is starting to take shape.`;
      } else {
        s1 = `You're ${displayCount} ${displayCount === 1 ? "pour" : "pours"} in and your palate profile is starting to form.`;
      }

      // Sentence 2 — proof preference + avoided notes, or clarity fallback
      const proofTier = proofLabel ? proofLabel.split(" ")[0] : null;

      let s2: string;
      if (proofTier && avoidTrait) {
        s2 = `You tend to rate ${proofTier} proof pours higher, and ${avoidTrait} notes don't seem to be your thing.`;
      } else if (proofTier) {
        s2 = `Your ratings trend toward ${proofTier} proof pours.`;
      } else if (avoidTrait) {
        s2 = `${avoidTrait} notes tend to score lower for you.`;
      } else if (clarityValue) {
        s2 = `Your palate clarity is at ${clarityValue} — keep logging to sharpen it.`;
      } else {
        s2 = "Log a few more pours and the picture will get sharper.";
      }

      return `${s1} ${s2}`;
    }

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.xxl,
          gap: spacing.xs,
        }}
      >
        {/* ── Hero ── */}
        <View style={{ position: "relative", height: 220, overflow: "hidden" }}>
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 280,
              opacity: 0.2,
              overflow: "hidden",
            }}
          >
            {(metrics?.tasting_count ?? 0) >= 3 ? (
              <TasteProfileRadar />
            ) : (
              <Svg width="100%" height={280} viewBox="0 0 300 300">
                {/* 4 concentric rings at r=30,60,90,120 */}
                {[30, 60, 90, 120].map((r) => (
                  <Circle
                    key={r}
                    cx={radarCx}
                    cy={radarCy}
                    r={r}
                    stroke={colors.accent}
                    strokeOpacity={0.4}
                    strokeWidth={0.5}
                    fill="none"
                  />
                ))}
                {/* 11 axis lines */}
                {radarAxisPts.map(({ x, y }, i) => (
                  <SvgLine
                    key={i}
                    x1={radarCx}
                    y1={radarCy}
                    x2={x}
                    y2={y}
                    stroke={colors.accent}
                    strokeOpacity={0.45}
                    strokeWidth={0.5}
                  />
                ))}
                {/* Irregular data polygon */}
                <Polygon
                  points={radarDataPoints}
                  stroke={colors.accent}
                  strokeOpacity={0.8}
                  strokeWidth={1}
                  fill={colors.accent}
                  fillOpacity={0.2}
                />
                {/* Flavor axis labels */}
                {radarLabelPts.map(({ x, y, label }) => (
                  <SvgText
                    key={label}
                    x={x}
                    y={y}
                    fontSize={8}
                    fill={colors.accent}
                    fillOpacity={0.7}
                    textAnchor="middle"
                  >
                    {label}
                  </SvgText>
                ))}
              </Svg>
            )}
          </View>
          <BlurView
            intensity={18}
            tint="dark"
            style={{ position: "absolute", top: 0, left: 0, right: 0, height: 280 }}
          />

          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: spacing.md,
              gap: spacing.xs,
            }}
          >
            <Text style={[type.labelCaps, { color: colors.accent, textAlign: "center" }]}>
              Neat Notes Premium
            </Text>
            <Text
              style={[
                type.screenTitle,
                {
                  fontSize: type.heroMetric.fontSize,
                  lineHeight: type.heroMetric.lineHeight,
                  textAlign: "center",
                },
              ]}
            >
              Understand Your Palate
            </Text>
            <Text
              style={[
                type.microcopyItalic,
                { color: colors.textSecondary, textAlign: "center" },
              ]}
            >
              {tastingCount > 0
                ? `You've logged ${tastingCount} tastings. Here's what we're learning.`
                : "Start logging to build your palate profile."}
            </Text>
          </View>
        </View>

        {/* ── What we know about you so far ── */}
        <View style={{ marginTop: spacing.sm }}>
          <Text style={[type.labelCaps, { color: colors.accent, marginBottom: spacing.xs }]}>
            WHAT WE KNOW ABOUT YOU SO FAR
          </Text>
          {lifetimeMetrics !== null && (
            <View
              style={{
                backgroundColor: colors.surfaceRaised,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.borderStrong,
                padding: spacing.sm,
              }}
            >
              <Text style={[type.microcopyItalic, { color: colors.textSecondary }]}>
                {buildSommelierBlurb()}
              </Text>
            </View>
          )}
        </View>

        {/* ── Features ── */}
        <View style={{ gap: spacing.sm }}>
          <Text style={[type.labelCaps, { color: colors.accent }]}>What unlocks</Text>
          <View>
            {features.map((feature, index) => {
              const isExpanded = expandedFeatureIndex === index;
              return (
                <TouchableOpacity
                  key={feature.title}
                  activeOpacity={0.7}
                  onPress={() => setExpandedFeatureIndex(isExpanded ? null : index)}
                >
                  <View style={{ paddingVertical: spacing.xs, gap: spacing.xs }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                      <View style={{ transform: [{ rotate: isExpanded ? "90deg" : "0deg" }] }}>
                        <Ionicons name="chevron-forward" size={14} color={colors.accent} />
                      </View>
                      <Text style={[type.sectionHeader, { flex: 1 }]}>{feature.title}</Text>
                    </View>
                    {isExpanded && (
                      <Text style={[type.caption, { paddingLeft: 14 + spacing.xs }]}>{feature.subtitle}</Text>
                    )}
                  </View>
                  {index < features.length - 1 && (
                    <View style={{ height: 1, backgroundColor: colors.divider }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Pricing + CTA card ── */}
        <View
          style={{
            borderRadius: radii.xxl,
            overflow: "hidden",
            backgroundColor: colors.surfaceRaised,
            borderWidth: 1,
            borderColor: colors.borderStrong,
            padding: spacing.md,
            gap: spacing.sm,
          }}
        >
          <Text style={[type.labelCaps, { color: colors.accent, textAlign: "center" }]}>Choose a plan</Text>

          {packagesLoading ? (
            <View style={{ paddingVertical: spacing.md, alignItems: "center" }}>
              <ActivityIndicator color={colors.textPrimary} />
            </View>
          ) : (
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              {/* Monthly pill */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => monthlyPkg && setSelectedPackageId("$rc_monthly")}
                style={{
                  flex: 1,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.sm,
                  borderRadius: radii.sm,
                  borderWidth: 1,
                  backgroundColor: selectedPackageId === "$rc_monthly" ? colors.surfaceRaised : "transparent",
                  borderColor: selectedPackageId === "$rc_monthly" ? colors.accent : colors.borderStrong,
                }}
              >
                <Text style={[type.caption, { color: colors.textPrimary }]}>Monthly</Text>
                <Text style={[type.labelCaps, { color: colors.textSecondary }]}>
                  {monthlyPkg ? `${monthlyPkg.product.priceString}/mo` : "—"}
                </Text>
              </TouchableOpacity>

              {/* Annual pill */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => annualPkg && setSelectedPackageId("$rc_annual")}
                style={{
                  flex: 1,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.sm,
                  borderRadius: radii.sm,
                  borderWidth: 1,
                  backgroundColor: selectedPackageId === "$rc_annual" ? colors.surfaceRaised : "transparent",
                  borderColor: selectedPackageId === "$rc_annual" ? colors.accent : colors.borderStrong,
                }}
              >
                <Text style={[type.caption, { color: colors.textPrimary }]}>Annual</Text>
                <Text style={[type.labelCaps, { color: colors.textSecondary }]}>
                  {annualPkg ? `${annualPkg.product.priceString}/yr` : "—"}
                </Text>
                <View
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: "rgba(190,150,99,0.15)",
                    borderRadius: 999,
                    paddingHorizontal: spacing.xs,
                    paddingVertical: 2,
                    marginTop: 3,
                  }}
                >
                  <Text style={[type.labelCaps, { fontSize: 9, color: colors.accent }]}>BEST VALUE</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Unlock button */}
          <Pressable
            onPress={handleUnlockInsights}
            disabled={purchaseLoading || restoreLoading || !selectedPackage || packagesLoading || packages.length === 0}
            style={({ pressed }) => ({
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pressed ? "rgba(190,150,99,0.85)" : colors.accent,
              opacity: (purchaseLoading || restoreLoading || !selectedPackage || packagesLoading || packages.length === 0) ? 0.7 : 1,
              paddingHorizontal: spacing.lg,
              paddingVertical: 11,
            })}
          >
            {purchaseLoading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={[type.body, { color: colors.background, fontWeight: "800" }]}>
                Unlock My Insights
              </Text>
            )}
          </Pressable>

          {/* Restore purchases */}
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={handleRestorePurchases}
            disabled={purchaseLoading || restoreLoading}
            style={{ alignItems: "center" }}
          >
            {restoreLoading ? (
              <ActivityIndicator color={colors.textMuted} size="small" />
            ) : (
              <Text style={[type.caption, { color: colors.textMuted }]}>Restore Purchases</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.xl,
        gap: spacing.sm,
      }}
    >
      <View>
        <View style={{ flexDirection: "row" }}>
          <TabButton label="Summary" active={tab === "summary"} onPress={() => setTab("summary")} />
          <TabButton label="Palate Clarity" active={tab === "clarity"} onPress={() => setTab("clarity")} />
          <TabButton label="Flavor Map" active={tab === "flavor"} onPress={() => setTab("flavor")} />
          <TabButton label="Pour Profile" active={tab === "pour"} onPress={() => setTab("pour")} />

        </View>
      </View>

      {tab === "summary" && (
        <Section title="Summary" subtitle="A narrative view of your palate.">
          <InsightsSummary metrics={metrics} onTabChange={setTab} />
        </Section>
      )}

      {tab === "clarity" && (
        <Section title={headerCopy.title} subtitle={headerCopy.subtitle}>
<ClarityDeepDive clarity={metrics as any} />
        </Section>
      )}

      {tab === "flavor" && (
        <Section title={headerCopy.title} subtitle={headerCopy.subtitle}>
          <TasteProfileRadar />
        </Section>
      )}

      {tab === "pour" && (
        <Section title="Pour Profile" subtitle="What your ratings reveal about your palate.">
          <PourPreferences />
        </Section>
      )}

    </ScrollView>
  );
}
