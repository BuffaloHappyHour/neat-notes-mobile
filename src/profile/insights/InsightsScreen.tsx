import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { purchaseCurrentPackage, restoreMyPurchases } from "../../../lib/purchases";
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

function PrimaryButton({
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
        marginTop: spacing.lg,
        minHeight: 52,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: pressed ? "rgba(190,150,99,0.85)" : colors.accent,
        opacity: loading ? 0.7 : 1,
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

export default function InsightsScreen() {
  const [tab, setTab] = useState<InsightsTab>("clarity");
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const { clarityInput, isPremium, loadAll } = useProfileData();
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

  async function handleUnlockInsights() {
    if (purchaseLoading || restoreLoading) return;

    try {
      setPurchaseLoading(true);
      await purchaseCurrentPackage();
      await loadAll({ silent: true });

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
      const restored = await restoreMyPurchases();
      await loadAll({ silent: true });

      if (restored) {
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

  if (!hasPremiumAccess) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: "transparent" }}
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.xl,
          gap: spacing.lg,
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
            Premium Insights
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
            Unlock your taste profile, behavior trends, and advanced palate intelligence.
          </Text>

          <PrimaryButton
            label="Unlock Insights"
            loading={purchaseLoading}
            onPress={handleUnlockInsights}
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