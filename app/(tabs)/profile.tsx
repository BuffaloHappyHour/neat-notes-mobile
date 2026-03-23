import { router } from "expo-router";
import React from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

import { CategoryMixCard } from "../../src/profile/components/CategoryMixCard";
import { InsightsCTA } from "../../src/profile/components/InsightsCTA";
import { PalateClarityCard } from "../../src/profile/components/PalateClarityCard";
import { ProfileHeader } from "../../src/profile/components/ProfileHeader";
import { RecentEntriesCard } from "../../src/profile/components/RecentEntriesCard";
import { SignInCard } from "../../src/profile/components/SignInCard";
import { TastingActionsSheet } from "../../src/profile/components/TastingActionsSheet";
import { YourStatsCard } from "../../src/profile/components/YourStatsCard";
import { useProfileData } from "../../src/profile/hooks/useProfileData";

function GlassCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.glassSurface ?? colors.surface,
          borderRadius: radii.xxl ?? radii.xl,
          borderWidth: 1,
          borderColor: colors.glassBorder ?? colors.borderSubtle ?? colors.divider,
          ...shadows.card,
          overflow: "hidden",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={{ padding: spacing.md, paddingBottom: spacing.sm }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text style={type.sectionHeader}>{title}</Text>
          {subtitle ? (
            <Text style={[type.caption, { color: colors.textSecondary, marginTop: 4 }]}>
              {subtitle}
            </Text>
          ) : null}

          <View
            style={{
              width: 26,
              height: 2,
              borderRadius: 1,
              backgroundColor: colors.accent,
              opacity: 0.8,
              marginTop: spacing.xs,
            }}
          />
        </View>

        {right ? <View style={{ paddingTop: 2 }}>{right}</View> : null}
      </View>
    </View>
  );
}

function Divider({ tight }: { tight?: boolean }) {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: colors.glassDivider ?? colors.divider,
        opacity: 0.55,
        marginHorizontal: spacing.md,
        marginVertical: tight ? spacing.sm : spacing.md,
      }}
    />
  );
}

function CTAButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.glassBorderStrong ?? colors.borderStrong,
          backgroundColor: pressed ? colors.accentSoft : "transparent",
        },
      ]}
    >
      <Text style={[type.body, { color: colors.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

export default function ProfileTab() {
  const {
    loading,
    refreshing,
    isAuthed,
    isAdmin,
    isPremium,

    welcomeTitle,
    tastingsText,
    avgText,

    tastingCount,

    top5,
    recent,
    recentError,

    mix,
    mixTotal,
    mixError,

    actionsOpen,
    actionsTitle,
    deleting,

    clarityInput,

    loadAll,
    openActionsForRow,
    closeActions,
    editFromActions,
    deleteFromActions,
  } = useProfileData();

  const isEarlyUser = (tastingCount ?? 0) < 3;
  const hasAnyTastings = (tastingCount ?? 0) > 0;

  const lifetimeClarity = clarityInput?.[0] ?? null;

 const confidenceLevel: "high" | "medium" | "low" =
  ((lifetimeClarity as any)?.confidence_0_100 ?? 0) > 70
    ? "high"
    : ((lifetimeClarity as any)?.confidence_0_100 ?? 0) > 40
      ? "medium"
      : "low";

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "transparent",
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.xl,
        }}
      >
        <ActivityIndicator />
        <Text
          style={[
            type.body,
            { marginTop: spacing.sm, opacity: 0.75, color: colors.textPrimary },
          ]}
        >
          Loading…
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: "transparent" }}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl + spacing.lg,
          paddingBottom: spacing.xl * 2,
          gap: spacing.xl,
        }}
      >
        <ProfileHeader
          welcomeTitle={welcomeTitle}
          isAuthed={isAuthed}
          isAdmin={isAdmin}
          refreshing={refreshing}
          onRefresh={() => loadAll({ silent: true })}
        />

        {!isAuthed ? (
          <GlassCard>
            <View style={{ padding: spacing.md }}>
              <SignInCard />
            </View>
          </GlassCard>
        ) : (
          <>
            <View style={{ marginTop: spacing.sm }}>
              {isEarlyUser ? (
                <PalateClarityCard
                  pending
                  totalTastings={tastingCount ?? 0}
                  tastingGoal={3}
                />
              ) : lifetimeClarity ? (
               <PalateClarityCard
  clarityIndex={Number((lifetimeClarity as any)?.palate_clarity_0_100 ?? 0)}
  tierLabel="Lifetime"
  confidenceLevel={confidenceLevel}
  totalTastings={Number((lifetimeClarity as any)?.tasting_count ?? 0)}
  daysSinceLastTasting={0}
/>
              ) : null}
            </View>

            {isEarlyUser ? (
              <InsightsCTA
                compact
                isPremium={isPremium}
                onPress={() => router.push("/insights" as any)}
              />
            ) : (
              <InsightsCTA
                isPremium={isPremium}
                onPress={() => router.push("/insights" as any)}
              />
            )}

            <View style={{ gap: spacing.sm }}>
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 3,
                      backgroundColor: colors.accent,
                      opacity: 0.85,
                    }}
                  />
                  <Text style={[type.sectionHeader, { fontSize: 26 }]}>Journal Snapshot</Text>
                </View>
              </View>

              <View style={{ paddingHorizontal: spacing.xs }}>
                <YourStatsCard
                  embedded
                  tastingsText={tastingsText}
                  avgText={avgText}
                  top5={top5}
                  onLongPressRow={openActionsForRow}
                />
              </View>
            </View>

            {hasAnyTastings ? (
              <View style={{ gap: spacing.sm }}>
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        backgroundColor: colors.accent,
                        opacity: 0.82,
                      }}
                    />
                    <Text style={[type.sectionHeader, { fontSize: 28 }]}>What you drink most</Text>
                  </View>

                  <Text style={[type.caption, { color: colors.textSecondary, opacity: 0.9 }]}>
                    Your category mix, based on logged pours.
                  </Text>
                </View>

                <View style={{ paddingHorizontal: spacing.xs }}>
                  <CategoryMixCard
                    embedded
                    mixError={mixError}
                    mix={mix}
                    mixTotal={mixTotal}
                  />
                </View>
              </View>
            ) : null}

            <GlassCard>
              <View
                style={{
                  paddingHorizontal: spacing.md,
                  paddingTop: spacing.md,
                  paddingBottom: spacing.md,
                }}
              >
                <RecentEntriesCard
                  embedded
                  recentError={recentError}
                  recent={recent}
                  onLongPressRow={openActionsForRow}
                />
              </View>
            </GlassCard>
          </>
        )}
      </ScrollView>

      <TastingActionsSheet
        visible={actionsOpen}
        title={actionsTitle}
        deleting={deleting}
        onClose={closeActions}
        onEdit={editFromActions}
        onDelete={deleteFromActions}
      />
    </>
  );
}