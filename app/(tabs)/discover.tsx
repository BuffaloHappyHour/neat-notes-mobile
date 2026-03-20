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

import { withSuccess, withTick } from "../../lib/hapticsPress";
import { logPressWrap } from "../../lib/pressLog";
import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

import { AtHomeShelf } from "../../src/discover/components/AtHomeShelf";
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

  function goWhiskey(id: string) {
    router.push(`/whiskey/${encodeURIComponent(id)}`);
  }

  const emptyMessage = useMemo(() => {
    return d.libraryEmpty ? "No results." : "No matches for your filters.";
  }, [d.libraryEmpty]);

  const onRefresh = useMemo(
    () =>
      logPressWrap(
        "discover",
        "pull_to_refresh",
        withTick(() => d.refresh({ silent: true }))
      ),
    [d]
  );

  const onOpenFilters = useMemo(
    () =>
      logPressWrap(
        "discover",
        "open_filters",
        withTick(() => d.setFilterOpen(true))
      ),
    [d]
  );

  const onSeeAll = useMemo(
    () => (key: SectionKey) =>
      logPressWrap(
        "discover",
        "see_all",
        withTick(() => d.openSeeAll(key)),
        { key }
      )(),
    [d]
  );

  const onPressRow = useMemo(
    () => (whiskeyId: string, section: string) =>
      logPressWrap(
        "discover",
        "open_whiskey",
        withTick(() => goWhiskey(whiskeyId)),
        { whiskeyId, section }
      )(),
    []
  );

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
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
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
              backgroundColor: colors.glassDivider ?? colors.divider,
              marginTop: spacing.md,
              opacity: 0.55,
            }}
          />
        </View>

        <DiscoverHeaderCard
          onOpenFilters={onOpenFilters}
          filterBadgeActive={!!d.filterBadge}
          filterBadgeText={d.filterBadge}
          loading={d.loading}
          statusError={d.statusError}
        />

        {d.atHome.length > 0 ? (
          <>
            <AtHomeShelf
              rows={d.atHome}
              onPressRow={(row) => onPressRow(row.whiskeyId, "AT_HOME")}
            />
            <SectionDivider />
          </>
        ) : null}

        <SectionRow
          title="Trending"
          subtitle="Most tasted in the last 7 days (community)."
          rows={d.trending}
          onSeeAll={() => onSeeAll("TRENDING" as SectionKey)}
          onPressRow={(r) => onPressRow(r.whiskeyId, "TRENDING")}
          emptyMessage={emptyMessage}
        />

        <SectionDivider />

        <SectionRow
          title="Recently Reviewed"
          subtitle="Latest community tastings (anonymous)."
          rows={d.recent}
          onSeeAll={() => onSeeAll("RECENT" as SectionKey)}
          onPressRow={(r) => onPressRow(r.whiskeyId, "RECENT")}
          emptyMessage={emptyMessage}
        />

        <SectionDivider />

        <SectionRow
          title="Highest Rated"
          subtitle="Top community averages (min review threshold)."
          rows={d.highest}
          onSeeAll={() => onSeeAll("HIGHEST" as SectionKey)}
          onPressRow={(r) => onPressRow(r.whiskeyId, "HIGHEST")}
          emptyMessage={emptyMessage}
        />

        <SectionDivider />

        <SectionRow
          title="Newest Additions"
          subtitle="Fresh additions to the library."
          rows={d.newest}
          onSeeAll={() => onSeeAll("NEWEST" as SectionKey)}
          onPressRow={(r) => onPressRow(r.whiskeyId, "NEWEST")}
          emptyMessage={emptyMessage}
        />

        <View style={{ marginTop: spacing.lg, paddingTop: spacing.md }}>
          <Text
            style={[
              type.caption,
              { opacity: 0.65, fontSize: 12, textAlign: "center" },
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
          logPressWrap("discover", "see_all_open_whiskey", () => {}, {
            whiskeyId: r.whiskeyId,
            from: d.seeAllTitle,
          })();
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