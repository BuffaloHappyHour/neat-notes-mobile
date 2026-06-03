import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Purchases, { type PurchasesPackage } from "react-native-purchases";
import Svg, { Circle, Line as SvgLine, Polygon, Text as SvgText } from "react-native-svg";

import { trackInsightsScreenViewed, trackPurchaseCompleted, trackPurchaseTapped, trackRestoreCompleted } from "../../../lib/analytics";
import { syncPremiumStatusFromRevenueCat } from "../../../lib/premiumSync";
import {
  getCurrentOffering,
  purchasePackage,
  restoreMyPurchases,
} from "../../../lib/purchases";
import { radii } from "../../../lib/radii";
import { spacing } from "../../../lib/spacing";
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
              opacity: 0.35,
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
              gap: spacing.sm,
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

        {/* ── Features ── */}
        <View style={{ gap: spacing.md }}>
          <Text style={[type.labelCaps, { color: colors.accent }]}>What unlocks</Text>
          <View>
            {features.map((feature, index) => (
              <View key={feature.title}>
                <View style={{ paddingVertical: spacing.xs, gap: spacing.xs }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                    <Ionicons name="chevron-forward" size={14} color={colors.accent} />
                    <Text style={[type.sectionHeader, { flex: 1 }]}>{feature.title}</Text>
                  </View>
                  <Text style={[type.caption, { paddingLeft: 14 + spacing.xs }]} numberOfLines={1} ellipsizeMode="tail">{feature.subtitle}</Text>
                </View>
                {index < features.length - 1 && (
                  <View style={{ height: 1, backgroundColor: colors.divider }} />
                )}
              </View>
            ))}
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
            padding: spacing.heroPadding,
            gap: spacing.md,
          }}
        >
          <Text style={[type.labelCaps, { color: colors.accent, textAlign: "center" }]}>Choose a plan</Text>
          {packagesLoading ? (
            <View style={{ paddingVertical: spacing.lg }}>
              <ActivityIndicator color={colors.textPrimary} />
            </View>
          ) : packages.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              {packages.map((pkg) => {
                const isAnnual = pkg.identifier === "$rc_annual";
                const isSelected = pkg.identifier === selectedPackageId;
                return (
                  <View key={pkg.identifier}>
                    {isAnnual && (
                      <View
                        style={{
                          alignSelf: "flex-start",
                          paddingHorizontal: spacing.sm,
                          paddingVertical: spacing.xs,
                          borderRadius: 999,
                          backgroundColor: colors.accentSoft,
                          borderWidth: 1,
                          borderColor: colors.borderStrong,
                          marginBottom: spacing.xs,
                        }}
                      >
                        <Text style={[type.labelCaps, { color: colors.accent }]}>Best value</Text>
                      </View>
                    )}
                    <Pressable
                      onPress={() => setSelectedPackageId(pkg.identifier)}
                      style={({ pressed }) => ({
                        borderRadius: 20,
                        borderWidth: 1.5,
                        borderColor: isSelected ? colors.accent : colors.divider,
                        backgroundColor: isSelected
                          ? colors.accentSoft
                          : pressed
                            ? colors.surfaceRaised
                            : colors.surfaceSunken,
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
                        <View style={{ flex: 1, gap: spacing.xs }}>
                          <Text style={type.sectionHeader}>
                            {isAnnual ? "Annual" : "Monthly"}
                          </Text>
                          <Text style={[type.body, { color: colors.textSecondary }]}>
                            {pkg.product.priceString}
                            {isAnnual ? " / year" : " / month"}
                          </Text>
                          {isAnnual && annualSavingsPct ? (
                            <Text style={[type.caption, { color: colors.accent }]}>
                              Save {annualSavingsPct}% vs monthly
                            </Text>
                          ) : null}
                        </View>
                        <View
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 999,
                            borderWidth: 2,
                            borderColor: isSelected ? colors.accent : colors.divider,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {isSelected ? (
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
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={[type.body, { color: colors.textSecondary }]}>
              No subscription options are currently available.
            </Text>
          )}
          <PrimaryButton
            label="Unlock My Insights"
            loading={purchaseLoading}
            onPress={handleUnlockInsights}
            disabled={!selectedPackage || packagesLoading || packages.length === 0}
          />
          <SecondaryButton
            label="Restore Purchases"
            loading={restoreLoading}
            onPress={handleRestorePurchases}
          />
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