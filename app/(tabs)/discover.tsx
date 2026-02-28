// app/(tabs)/discover.tsx
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

// ✅ HAPTICS
import { withSuccess, withTick } from "../../lib/hapticsPress";

import { useDiscover } from "../../src/discover/hooks/useDiscover";
import type { SectionKey } from "../../src/discover/services/discover.service";

import { DiscoverHeaderCard } from "../../src/discover/components/DiscoverHeaderCard";
import { DiscoverModals } from "../../src/discover/components/DiscoverModals";
import { SectionDivider } from "../../src/discover/components/SectionDivider";
import { SectionRow } from "../../src/discover/components/SectionRow";

export default function DiscoverTab() {
  const insets = useSafeAreaInsets();
  const { height: windowH } = useWindowDimensions();

  const sheetMaxHeight = useMemo(() => {
    return Math.max(
      320,
      Math.round(windowH - insets.top - insets.bottom - spacing.xl)
    );
  }, [windowH, insets.top, insets.bottom]);

  const sheetPaddingBottom = insets.bottom + spacing.lg;

  const d = useDiscover();

  function goWhiskey(id: string) {
    router.push(`/whiskey/${encodeURIComponent(id)}`);
  }

  const emptyMessage = useMemo(() => {
    return d.libraryEmpty ? "No results." : "No matches for your filters.";
  }, [d.libraryEmpty]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          // ✅ Match Home: wider feel
          paddingHorizontal: spacing.lg,

          // ✅ Match Home: headroom
          paddingTop: spacing.xl + spacing.lg,

          paddingBottom: spacing.xl * 2,

          // ✅ tighter rhythm (Home-like)
          gap: spacing.md,
        }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        refreshControl={
          <RefreshControl
            refreshing={d.refreshing}
            onRefresh={withTick(() => d.refresh({ silent: true }))}
            tintColor={colors.accent}
          />
        }
      >
        {/* Header (Home style) */}
        <View style={{ gap: spacing.xs }}>
          <Text style={[type.screenTitle, { fontSize: 34, lineHeight: 40 }]}>
            Discover
          </Text>

          <Text
            style={[
              type.microcopyItalic,
              { fontSize: 16, lineHeight: 22, opacity: 0.86 },
            ]}
          >
            See what the community is tasting
          </Text>

          {/* ✅ keep it simple (no leather / no gradients here) */}
          <View
            style={{
              height: 1,
              backgroundColor: colors.divider,
              marginTop: spacing.md,
            }}
          />
        </View>

        {/* Header Card (now calmer / less redundant via component changes) */}
        <DiscoverHeaderCard
          onOpenFilters={withTick(() => d.setFilterOpen(true))}
          filterBadgeActive={!!d.filterBadge}
          filterBadgeText={d.filterBadge}
          loading={d.loading}
          statusError={d.statusError}
        />
        {/* Sections */}
        <SectionRow
          title="Trending"
          subtitle="Most tasted in the last 7 days (community)."
          rows={d.trending}
          onSeeAll={withTick(() => d.openSeeAll("TRENDING" as SectionKey))}
          onPressRow={(r) => withTick(() => goWhiskey(r.whiskeyId))()}
          emptyMessage={emptyMessage}
        />

        <SectionDivider />

        <SectionRow
          title="Recently Reviewed"
          subtitle="Latest community tastings (anonymous)."
          rows={d.recent}
          onSeeAll={withTick(() => d.openSeeAll("RECENT" as SectionKey))}
          onPressRow={(r) => withTick(() => goWhiskey(r.whiskeyId))()}
          emptyMessage={emptyMessage}
        />

        <SectionDivider />

        <SectionRow
          title="Highest Rated"
          subtitle="Top community averages (min review threshold)."
          rows={d.highest}
          onSeeAll={withTick(() => d.openSeeAll("HIGHEST" as SectionKey))}
          onPressRow={(r) => withTick(() => goWhiskey(r.whiskeyId))()}
          emptyMessage={emptyMessage}
        />

        <SectionDivider />

        <SectionRow
          title="Newest Additions"
          subtitle="Fresh additions to the library."
          rows={d.newest}
          onSeeAll={withTick(() => d.openSeeAll("NEWEST" as SectionKey))}
          onPressRow={(r) => withTick(() => goWhiskey(r.whiskeyId))()}
          emptyMessage={emptyMessage}
        />

        {/* Footer */}
        <View style={{ marginTop: spacing.lg, paddingTop: spacing.md }}>
          <Text
            style={[
              type.caption,
              { opacity: 0.7, fontSize: 12, textAlign: "center" },
            ]}
          >
            Powered by anonymous community tastings and Buffalo Happy Hour reviews
          </Text>
        </View>
      </ScrollView>

      <DiscoverModals
        sheetMaxHeight={sheetMaxHeight}
        sheetPaddingBottom={sheetPaddingBottom}
        windowH={windowH}
        seeAllOpen={d.seeAllOpen}
        setSeeAllOpen={d.setSeeAllOpen}
        seeAllTitle={d.seeAllTitle}
        seeAllRows={d.seeAllRows}
        seeAllLoading={d.seeAllLoading}
        seeAllError={d.seeAllError}
        onPressSeeAllRow={(r) => {
          d.setSeeAllOpen(false);
          goWhiskey(r.whiskeyId);
        }}
        filterOpen={d.filterOpen}
        setFilterOpen={d.setFilterOpen}
        typePickerOpen={d.typePickerOpen}
        setTypePickerOpen={d.setTypePickerOpen}
        selectedType={d.selectedType}
        setSelectedType={d.setSelectedType}
        allTypes={d.allTypes}
        minProofText={d.minProofText}
        setMinProofText={d.setMinProofText}
        maxProofText={d.maxProofText}
        setMaxProofText={d.setMaxProofText}
        resetFilters={d.resetFilters}
        normalizeProofBoundsAndCloseFilters={d.normalizeProofBoundsAndCloseFilters}
        withTick={withTick}
        withSuccess={withSuccess}
      />
    </View>
  );
}