import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import type { PurchasesPackage } from "react-native-purchases";

import { router } from "expo-router";
import {
  getCurrentOffering,
  purchasePackage,
  restoreMyPurchases,
} from "../../../lib/purchases";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";
import { useProfileData } from "../hooks/useProfileData";

import { Section } from "./components/Section";

import { useClarityInsightsData } from "./hooks/useClarityInsightsData";
import ClarityDeepDive from "./sections/ClarityDeepDive";
import InsightsSummary from "./sections/summary/InsightsSummary";
import TasteProfileRadar from "./sections/TasteProfileRadar";

type InsightsTab = "summary" | "clarity" | "flavor" ;

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

  const { isPremium } = useProfileData();

  const { metrics } = useClarityInsightsData();
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const hasPremiumAccess = isPremium;

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
    title: "Summary",
    subtitle: "A narrative view of your palate.",
  };
}, [tab]);

  const selectedPackage =
    packages.find((pkg) => pkg.identifier === selectedPackageId) ?? null;

  useEffect(() => {
    if (hasPremiumAccess) return;

    let active = true;

    async function loadPackages() {
      try {
        setPackagesLoading(true);

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
          sorted.find((pkg) => pkg.identifier === "$rc_monthly") ??
          sorted.find((pkg) => pkg.identifier === "$rc_annual") ??
          sorted[0] ??
          null;

        setSelectedPackageId(defaultPackage?.identifier ?? null);
      } catch (e: any) {
        if (!active) return;
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
  }, [hasPremiumAccess]);

async function handleUnlockInsights() {
  if (purchaseLoading || restoreLoading || !selectedPackage) return;

  try {
    setPurchaseLoading(true);

    await purchasePackage(selectedPackage); // ✅ REAL CALL

router.replace("/insights");

    Alert.alert(
      "Premium unlocked",
      "Insights are now available on your account."
    );
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

    const restored = await restoreMyPurchases(); // ✅ REAL CALL

router.replace("/insights");

    if (restored) {
      Alert.alert(
        "Purchases restored",
        "Your premium access has been restored."
      );
    } else {
      Alert.alert(
        "Nothing to restore",
        "No active premium purchase was found for this account."
      );
    }
  } catch (e: any) {
    Alert.alert("Restore failed", String(e?.message ?? e));
  } finally {
    setRestoreLoading(false);
  }
}

  if (!hasPremiumAccess) {
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.xl,
          gap: spacing.lg,
        }}
      >
        <View style={{ padding: spacing.lg }}>
          <Text style={type.sectionHeader}>Premium Insights</Text>

          <Text
            style={[
              type.body,
              {
                marginTop: spacing.sm,
                color: colors.textSecondary,
              },
            ]}
          >
            Unlock your advanced whiskey insights with the plan that fits you best.
          </Text>

          {packagesLoading ? (
            <View style={{ marginTop: spacing.lg, paddingVertical: spacing.lg }}>
              <ActivityIndicator color={colors.textPrimary} />
            </View>
          ) : packages.length > 0 ? (
            <>
              {packages.map((pkg) => (
                <PackageOption
                  key={pkg.identifier}
                  pkg={pkg}
                  selected={pkg.identifier === selectedPackageId}
                  onPress={() => setSelectedPackageId(pkg.identifier)}
                />
              ))}
            </>
          ) : (
            <Text
              style={[
                type.body,
                {
                  marginTop: spacing.lg,
                  color: colors.textSecondary,
                },
              ]}
            >
              No subscription options are currently available.
            </Text>
          )}

          <PrimaryButton
            label="Unlock Insights"
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
          <TabButton label="Flavor Profile" active={tab === "flavor"} onPress={() => setTab("flavor")} />
         
        </View>
      </View>

      {tab === "summary" && (
        <Section title="Summary" subtitle="A narrative view of your palate.">
          <InsightsSummary />
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


    </ScrollView>
  );
}