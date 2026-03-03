// app/(tabs)/discover.tsx
import { router } from "expo-router";
import React, { useMemo, useRef } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ✅ HAPTICS
import { withSuccess, withTick } from "../../lib/hapticsPress";
import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

import { DiscoverHeaderCard } from "../../src/discover/components/DiscoverHeaderCard";
import { DiscoverModals } from "../../src/discover/components/DiscoverModals";
import { SectionDivider } from "../../src/discover/components/SectionDivider";
import { SectionRow } from "../../src/discover/components/SectionRow";
import { useDiscover } from "../../src/discover/hooks/useDiscover";
import type { SectionKey } from "../../src/discover/services/discover.service";

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

  // ✅ Prevent that “dead” flash: only show empty text AFTER we’ve loaded once.
  const hasEverLoadedRef = useRef(false);
  if (!hasEverLoadedRef.current && !d.loading && !d.refreshing && !d.statusError) {
    // once initial load finishes successfully
    hasEverLoadedRef.current = true;
  }

  const showSkeletons = useMemo(() => {
    // If we haven’t loaded once yet, show skeletons instead of “No data”.
    if (!hasEverLoadedRef.current) return true;

    // If we HAVE loaded once, keep showing cached rows while refreshing.
    // (SectionRow will only skeleton if rows.length===0 and loading===true)
    return false;
  }, []);

  function goWhiskey(id: string) {
    router.push(`/whiskey/${encodeURIComponent(id)}`);
  }

  const emptyMessage = useMemo(() => {
    // ✅ Never show “No results” while we’re still loading the first time.
    if (!hasEverLoadedRef.current) return "";
    return d.libraryEmpty ? "No results." : "No matches for your filters.";
  }, [d.libraryEmpty]);

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl + spacing.lg,
          paddingBottom: spacing.xl * 2,
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
        {/* Header */}
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

          <View
            style={{
              height: 1,
              backgroundColor: colors.divider,
              marginTop: spacing.md,
            }}
          />
        </View>

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
          loading={showSkeletons && (d.loading || d.refreshing)}
          onSeeAll={withTick(() => d.openSeeAll("TRENDING" as SectionKey))}
          onPressRow={(r) => withTick(() => goWhiskey(r.whiskeyId))()}
          emptyMessage={emptyMessage}
        />

        <SectionDivider />

        <SectionRow
          title="Recently Reviewed"
          subtitle="Latest community tastings (anonymous)."
          rows={d.recent}
          loading={showSkeletons && (d.loading || d.refreshing)}
          onSeeAll={withTick(() => d.openSeeAll("RECENT" as SectionKey))}
          onPressRow={(r) => withTick(() => goWhiskey(r.whiskeyId))()}
          emptyMessage={emptyMessage}
        />

        <SectionDivider />

        <SectionRow
          title="Highest Rated"
          subtitle="Top community averages (min review threshold)."
          rows={d.highest}
          loading={showSkeletons && (d.loading || d.refreshing)}
          onSeeAll={withTick(() => d.openSeeAll("HIGHEST" as SectionKey))}
          onPressRow={(r) => withTick(() => goWhiskey(r.whiskeyId))()}
          emptyMessage={emptyMessage}
        />

        <SectionDivider />

        <SectionRow
          title="Newest Additions"
          subtitle="Fresh additions to the library."
          rows={d.newest}
          loading={showSkeletons && (d.loading || d.refreshing)}
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