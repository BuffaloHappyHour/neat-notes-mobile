import React, { useEffect } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

import { CategoryMixCard } from "../../src/profile/components/CategoryMixCard";
import { PalateClarityCard } from "../../src/profile/components/PalateClarityCard";
import { ProfileHeader } from "../../src/profile/components/ProfileHeader";
import { RecentEntriesCard } from "../../src/profile/components/RecentEntriesCard";
import { SignInCard } from "../../src/profile/components/SignInCard";
import { TastingActionsSheet } from "../../src/profile/components/TastingActionsSheet";
import { YourStatsCard } from "../../src/profile/components/YourStatsCard";
import { usePalateClarity } from "../../src/profile/hooks/usePalateClarity";
import { useProfileData } from "../../src/profile/hooks/useProfileData";

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

  useEffect(() => {
    if (!isAuthed) return;
    console.log("PALATE CLARITY (Profile):", clarity);
  }, [isAuthed, clarity]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
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
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
        paddingBottom: spacing.xxl,
      }}
    >
      {/* Header */}
      <ProfileHeader
        welcomeTitle={welcomeTitle}
        isAuthed={isAuthed}
        isAdmin={isAdmin}
        refreshing={refreshing}
        onRefresh={() => loadAll({ silent: true })}
      />

      {!isAuthed ? (
        <View style={{ marginTop: spacing.lg }}>
          <SignInCard />
        </View>
      ) : (
        <View style={{ marginTop: spacing.md }}>
          {/* ===== HERO immediately after name ===== */}
          {clarity ? (
            <View style={{ marginTop: spacing.sm, marginBottom: spacing.sectionGap }}>
              <PalateClarityCard
                clarityIndex={clarity.clarityIndex}
                tierLabel={clarity.meta.tierLabel}
                confidenceLevel={clarity.meta.confidenceLevel}
                totalTastings={clarity.meta.totalTastings}
                daysSinceLastTasting={clarity.meta.daysSinceLastTasting}
              />
            </View>
          ) : null}

          {/* ===== JOURNAL INSIGHTS (one intentional frame) ===== */}
          <View
            style={{
              backgroundColor: colors.surface ?? colors.background,
              borderRadius: radii.xxl ?? radii.xl,
              borderWidth: 1,
              borderColor: colors.borderSubtle ?? colors.divider,
              padding: spacing.cardPadding ?? spacing.lg,
              ...shadows.e1,
            }}
          >
            {/* Group title */}
            <View style={{ gap: spacing.xs }}>
              <Text style={type.sectionHeader}>Journal insights</Text>
              <Text style={[type.caption, { color: colors.textSecondary }]}>
                A snapshot of your palate and recent pours.
              </Text>
            </View>

            <View style={{ height: 1, backgroundColor: colors.divider, opacity: 0.65, marginVertical: spacing.lg }} />

            <YourStatsCard
              embedded
              tastingsText={tastingsText}
              avgText={avgText}
              top5={top5}
              onLongPressRow={openActionsForRow}
            />

            <View style={{ height: 1, backgroundColor: colors.divider, opacity: 0.65, marginVertical: spacing.lg }} />

            <CategoryMixCard embedded mixError={mixError} mix={mix} mixTotal={mixTotal} />

            <View style={{ height: 1, backgroundColor: colors.divider, opacity: 0.65, marginVertical: spacing.lg }} />

            <RecentEntriesCard
              embedded
              recentError={recentError}
              recent={recent}
              onLongPressRow={openActionsForRow}
            />
          </View>
        </View>
      )}

      <TastingActionsSheet
        visible={actionsOpen}
        title={actionsTitle}
        deleting={deleting}
        onClose={closeActions}
        onEdit={editFromActions}
        onDelete={deleteFromActions}
      />
    </ScrollView>
  );
}