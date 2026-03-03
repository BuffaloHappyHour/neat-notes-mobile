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
import { usePalateClarity } from "../../src/profile/hooks/usePalateClarity";
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

    welcomeTitle,
    tastingsText,
    avgText,

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

  const clarity = usePalateClarity(clarityInput);

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
          gap: spacing.lg,
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
            {clarity ? (
  <View style={{ marginTop: spacing.sm }}>
    <PalateClarityCard
      clarityIndex={clarity.clarityIndex}
      tierLabel={clarity.meta.tierLabel}
      confidenceLevel={clarity.meta.confidenceLevel}
      totalTastings={clarity.meta.totalTastings}
      daysSinceLastTasting={clarity.meta.daysSinceLastTasting}
    />
  </View>
) : null}

{/* Quick stats (tastings + avg rating) */}
<GlassCard>
  <SectionHeader
    title="Quick stats"
    subtitle="A snapshot of your journal so far."
  />
  <Divider tight />
  <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md }}>
    <YourStatsCard
      embedded
      tastingsText={tastingsText}
      avgText={avgText}
      top5={[]}                // 👈 hides Top 5 for now
      onLongPressRow={openActionsForRow}
    />
  </View>
</GlassCard>

<InsightsCTA
  isPremium={false}
  onPress={() => router.push("/insights" as any)}
/>

            <GlassCard>
              <SectionHeader
                title="Journal snapshot"
                subtitle="A quick pulse of your journal so far."
              />
              <Divider />
              <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md }}>
                <YourStatsCard
                  embedded
                  tastingsText={tastingsText}
                  avgText={avgText}
                  top5={top5}
                  onLongPressRow={openActionsForRow}
                />
              </View>
            </GlassCard>

            <GlassCard>
              <SectionHeader
                title="What you drink most"
                subtitle="Your category mix, based on logged pours."
              />
              <Divider />
              <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md }}>
                <CategoryMixCard embedded mixError={mixError} mix={mix} mixTotal={mixTotal} />
              </View>
            </GlassCard>

            <GlassCard>
              <SectionHeader
                title="Recent entries"
                subtitle="A look back at your latest pours."
                right={
                  <CTAButton
                    label="Insights"
                    onPress={() => router.push("/insights" as any)}
                  />
                }
              />
              <Divider />
              <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md }}>
                <RecentEntriesCard
                  embedded
                  recentError={recentError}
                  recent={recent}
                  onLongPressRow={openActionsForRow}
                />
              </View>

              <Text
                style={[
                  type.caption,
                  {
                    color: colors.textMuted ?? colors.textTertiary,
                    paddingHorizontal: spacing.md,
                    paddingBottom: spacing.md,
                    marginTop: -6,
                  },
                ]}
              >
                Tip: press and hold a tasting to edit or delete.
              </Text>
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