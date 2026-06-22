import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

import { getMyDistilleryAccount } from "../../lib/barrelApi";
import { CategoryMixCard } from "../../src/profile/components/CategoryMixCard";
import { WeeklyPulseBanner } from "../../src/profile/components/WeeklyPulseBanner";
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

function HostEventCTA({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        backgroundColor: colors.glassSurface,
        overflow: "hidden",
        ...shadows.card,
        flexDirection: "row",
        alignItems: "center",
        opacity: pressed ? 0.88 : 1,
      })}
    >
      {/* Left amber accent bar */}
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 2,
          backgroundColor: colors.accent,
        }}
      />

      {/* Icon */}
      <View
        style={{
          marginLeft: spacing.md,
          marginVertical: spacing.md,
          marginRight: spacing.md,
          width: 36,
          height: 36,
          borderRadius: radii.md,
          backgroundColor: colors.accentSoft,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="calendar-outline" size={18} color={colors.accent} />
      </View>

      {/* Text */}
      <View style={{ flex: 1, gap: 3, paddingVertical: spacing.md }}>
        <Text
          style={[
            type.sectionHeader,
            { color: colors.textPrimary, fontSize: 20, lineHeight: 26 },
          ]}
        >
          Host an Event
        </Text>
        <Text style={[type.caption, { color: colors.textSecondary }]}>
          Create and manage your whiskey tastings
        </Text>
      </View>

      {/* Chevron */}
      <View style={{ paddingRight: spacing.md, paddingLeft: spacing.sm }}>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

function DistilleryCTA({ name, onPress }: { name: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        backgroundColor: colors.glassSurface,
        overflow: "hidden",
        ...shadows.card,
        flexDirection: "row",
        alignItems: "center",
        opacity: pressed ? 0.88 : 1,
      })}
    >
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 2,
          backgroundColor: colors.accent,
        }}
      />
      <View
        style={{
          marginLeft: spacing.md,
          marginVertical: spacing.md,
          marginRight: spacing.md,
          width: 36,
          height: 36,
          borderRadius: radii.md,
          backgroundColor: colors.accentSoft,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="wine-outline" size={18} color={colors.accent} />
      </View>
      <View style={{ flex: 1, gap: 3, paddingVertical: spacing.md }}>
        <Text style={[type.sectionHeader, { color: colors.textPrimary, fontSize: 20, lineHeight: 26 }]}>
          Barrel Management
        </Text>
        <Text style={[type.caption, { color: colors.textSecondary }]}>{name}</Text>
      </View>
      <View style={{ paddingRight: spacing.md, paddingLeft: spacing.sm }}>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
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

    privateName,
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
    weeklyTrend,

    loadAll,
    openActionsForRow,
    closeActions,
    editFromActions,
    deleteFromActions,
  } = useProfileData();

  const [myDistillery, setMyDistillery] = useState<{ distillery_id: string; distillery_name: string } | null>(null);

  useEffect(() => {
    getMyDistilleryAccount()
      .then((accounts) => setMyDistillery(accounts[0] ?? null))
      .catch(() => {});
  }, []);

  const isEarlyUser = (tastingCount ?? 0) < 3;
  const hasAnyTastings = (tastingCount ?? 0) > 0;

  const lifetimeClarity = clarityInput?.[0] ?? null;

  const confidenceLevel: "high" | "medium" | "low" =
    ((lifetimeClarity as any)?.confidence_0_100 ?? 0) > 70
      ? "high"
      : ((lifetimeClarity as any)?.confidence_0_100 ?? 0) > 40
      ? "medium"
      : "low";

  // ✅ NEW — backend-driven freshness
  const lifetimeLastTastingAt = (lifetimeClarity as any)?.last_tasting_at ?? null;

  const lifetimeDaysSinceLastTasting = useMemo(() => {
    if (!lifetimeLastTastingAt) return null;

    return Math.max(
      0,
      Math.floor(
        (Date.now() - new Date(lifetimeLastTastingAt).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
  }, [lifetimeLastTastingAt]);

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
                  clarityIndex={Number(
                    (lifetimeClarity as any)?.palate_clarity_0_100 ?? 0
                  )}
                  tierLabel="Lifetime"
                  confidenceLevel={confidenceLevel}
                  totalTastings={Number(
                    (lifetimeClarity as any)?.tasting_count ?? 0
                  )}
                  daysSinceLastTasting={lifetimeDaysSinceLastTasting} // ✅ FIXED
                  weeklyDelta={weeklyTrend?.palate_clarity_delta ?? null}
                  weeklyStatus={weeklyTrend?.weekly_movement_status ?? null}
                />
              ) : null}
            </View>

            {!isEarlyUser && (
              <WeeklyPulseBanner
                trend={weeklyTrend}
                firstName={privateName || null}
                isPremium={isPremium}
              />
            )}

            <View style={{ gap: spacing.sm }}>
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

              <HostEventCTA onPress={() => router.push("/host-events" as any)} />
              {myDistillery ? (
                <DistilleryCTA
                  name={myDistillery.distillery_name}
                  onPress={() => router.push("/distillery" as any)}
                />
              ) : null}
            </View>

            <View style={{ gap: spacing.sm }}>
              <View style={{ gap: 8 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.sm,
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 3,
                      backgroundColor: colors.accent,
                      opacity: 0.85,
                    }}
                  />
                  <Text style={[type.sectionHeader, { fontSize: 26 }]}>
                    Journal Snapshot
                  </Text>
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
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.sm,
                    }}
                  >
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        backgroundColor: colors.accent,
                        opacity: 0.82,
                      }}
                    />
                    <Text style={[type.sectionHeader, { fontSize: 28 }]}>
                      What you drink most
                    </Text>
                  </View>

                  <Text
                    style={[
                      type.caption,
                      { color: colors.textSecondary, opacity: 0.9 },
                    ]}
                  >
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