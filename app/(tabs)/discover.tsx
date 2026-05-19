import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { withSuccess, withTick } from "../../lib/hapticsPress";
import { logPressWrap } from "../../lib/pressLog";
import { radii } from "../../lib/radii";
import { spacing } from "../../lib/spacing";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

import { AtHomeShelf } from "../../src/discover/components/AtHomeShelf";
import { DiscoverHeaderCard } from "../../src/discover/components/DiscoverHeaderCard";
import { DiscoverModals } from "../../src/discover/components/DiscoverModals";
import { SectionDivider } from "../../src/discover/components/SectionDivider";
import { SectionRow } from "../../src/discover/components/SectionRow";
import { VenuesTab } from "../../src/discover/components/VenuesTab";
import { useDiscover } from "../../src/discover/hooks/useDiscover";
import type { SectionKey } from "../../src/discover/services/discover.service";

type DiscoverTabKey = "forYou" | "venues" | "trending";

const DISCOVER_TABS: { key: DiscoverTabKey; label: string }[] = [
  { key: "forYou", label: "For You" },
  { key: "venues", label: "Venues" },
  { key: "trending", label: "Events" },
];

type EventRow = {
  id: string;
  name: string;
  starts_at: string | null;
  ends_at: string | null;
  status: string | null;
  event_type: string | null;
  venue_name_free: string | null;
  venue_city: string | null;
  venue_state: string | null;
  is_public: boolean;
  max_attendees: number | null;
  join_code: string | null;
};

function fmtEventDate(iso: string): string {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const timePart = d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase()
    .replace(" ", "");
  return `${datePart} · ${timePart}`;
}

function EventsTab() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [statePickerOpen, setStatePickerOpen] = useState(false);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("events")
      .select(
        "id, name, starts_at, ends_at, status, event_type, venue_name_free, venue_city, venue_state, is_public, max_attendees, join_code"
      )
      .eq("is_active", true)
      .order("starts_at", { ascending: true })
      .then(({ data }) => {
        setEvents((data as EventRow[] | null) ?? []);
        setLoading(false);
      });
  }, []);

  const isPast = useCallback((event: EventRow): boolean => {
    return event.starts_at != null && new Date(event.starts_at) < new Date();
  }, []);

  const allStates = useMemo(() => {
    const states = new Set<string>();
    events.forEach((e) => {
      if (e.venue_state) states.add(e.venue_state);
    });
    return Array.from(states).sort();
  }, [events]);

  const citiesForState = useMemo(() => {
    const cities = new Set<string>();
    events
      .filter((e) => e.venue_state === selectedState)
      .forEach((e) => {
        if (e.venue_city) cities.add(e.venue_city);
      });
    return Array.from(cities).sort();
  }, [events, selectedState]);

  const filteredEvents = useMemo(() => {
    let result = events;
    if (selectedState) result = result.filter((e) => e.venue_state === selectedState);
    if (selectedCity) result = result.filter((e) => e.venue_city === selectedCity);
    const upcoming = result
      .filter((e) => !isPast(e))
      .sort((a, b) => {
        if (!a.starts_at) return 1;
        if (!b.starts_at) return -1;
        return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
      });
    const past = result
      .filter((e) => isPast(e))
      .sort((a, b) => {
        if (!a.starts_at) return 1;
        if (!b.starts_at) return -1;
        return new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime();
      });
    return [...upcoming, ...past];
  }, [events, selectedState, selectedCity, isPast]);

  const grouped = useMemo(() => {
    const stateMap = new Map<string, Map<string, EventRow[]>>();
    filteredEvents.forEach((event) => {
      const state = event.venue_state ?? "Unknown";
      const city = event.venue_city ?? "Unknown";
      if (!stateMap.has(state)) stateMap.set(state, new Map());
      const cityMap = stateMap.get(state)!;
      if (!cityMap.has(city)) cityMap.set(city, []);
      cityMap.get(city)!.push(event);
    });
    return stateMap;
  }, [filteredEvents]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <>
      {/* State picker modal */}
      <Modal
        visible={statePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setStatePickerOpen(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.55)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setStatePickerOpen(false)}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              width: "80%",
              maxHeight: 360,
              overflow: "hidden",
            }}
          >
            <FlatList
              data={["__all__", ...allStates]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setSelectedState(item === "__all__" ? null : item);
                    setSelectedCity(null);
                    setStatePickerOpen(false);
                  }}
                  style={({ pressed }) => ({
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.md,
                    backgroundColor: pressed ? colors.accentFaint : "transparent",
                  })}
                >
                  <Text
                    style={[
                      type.body,
                      {
                        color:
                          (item === "__all__" ? null : item) === selectedState
                            ? colors.accent
                            : colors.textPrimary,
                      },
                    ]}
                  >
                    {item === "__all__" ? "All States" : item}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>

      {/* City picker modal */}
      <Modal
        visible={cityPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCityPickerOpen(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.55)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setCityPickerOpen(false)}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              width: "80%",
              maxHeight: 360,
              overflow: "hidden",
            }}
          >
            <FlatList
              data={["__all__", ...citiesForState]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setSelectedCity(item === "__all__" ? null : item);
                    setCityPickerOpen(false);
                  }}
                  style={({ pressed }) => ({
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.md,
                    backgroundColor: pressed ? colors.accentFaint : "transparent",
                  })}
                >
                  <Text
                    style={[
                      type.body,
                      {
                        color:
                          (item === "__all__" ? null : item) === selectedCity
                            ? colors.accent
                            : colors.textPrimary,
                      },
                    ]}
                  >
                    {item === "__all__" ? "All Cities" : item}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: spacing.xl * 2,
          gap: spacing.md,
        }}
      >
        {/* Filter row */}
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Pressable
            onPress={() => setStatePickerOpen(true)}
            style={({ pressed }) => ({
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: selectedState ? colors.accent : colors.borderStrong,
              backgroundColor: colors.accentFaint,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text
              style={[
                type.caption,
                { color: selectedState ? colors.accent : colors.textSecondary },
              ]}
            >
              {selectedState ?? "All States"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              if (selectedState) setCityPickerOpen(true);
            }}
            style={({ pressed }) => ({
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: selectedCity ? colors.accent : colors.borderStrong,
              backgroundColor: colors.accentFaint,
              opacity: !selectedState ? 0.45 : pressed ? 0.8 : 1,
            })}
          >
            <Text
              style={[
                type.caption,
                { color: selectedCity ? colors.accent : colors.textSecondary },
              ]}
            >
              {selectedCity ?? "All Cities"}
            </Text>
          </Pressable>
        </View>

        {/* Events grouped by state → city */}
        {filteredEvents.length === 0 ? (
          <Text
            style={[
              type.microcopyItalic,
              { color: colors.textMuted, textAlign: "center", marginTop: spacing.xl },
            ]}
          >
            No events found.
          </Text>
        ) : (
          Array.from(grouped.entries()).map(([state, cityMap]) => (
            <View key={state}>
              <Text
                style={[
                  type.labelCaps,
                  { color: colors.accent, marginBottom: spacing.xs },
                ]}
              >
                {state}
              </Text>
              {Array.from(cityMap.entries()).map(([city, cityEvents]) => (
                <View key={city} style={{ marginBottom: spacing.sm }}>
                  <Text
                    style={[
                      type.caption,
                      { color: colors.textSecondary, marginBottom: spacing.xs },
                    ]}
                  >
                    {city}
                  </Text>
                  <View style={{ gap: spacing.sm }}>
                    {cityEvents.map((event) => {
                      const past = isPast(event);
                      return (
                        <Pressable
                          key={event.id}
                          onPress={() => router.push(`/event/${event.id}` as any)}
                          style={({ pressed }) => ({
                            borderRadius: radii.lg,
                            borderWidth: 1,
                            borderColor: past ? colors.borderSubtle : colors.borderStrong,
                            backgroundColor: colors.glassSurface,
                            paddingVertical: spacing.md,
                            paddingHorizontal: spacing.md,
                            opacity: past ? (pressed ? 0.4 : 0.5) : pressed ? 0.85 : 1,
                            gap: spacing.xs,
                          })}
                        >
                          {/* Name + event_type pill */}
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "flex-start",
                              gap: spacing.sm,
                            }}
                          >
                            <Text
                              style={[
                                type.sectionHeader,
                                {
                                  flex: 1,
                                  fontSize: 16,
                                  lineHeight: 21,
                                  color: colors.textPrimary,
                                },
                              ]}
                              numberOfLines={2}
                            >
                              {event.name}
                            </Text>
                            {event.event_type ? (
                              <View
                                style={{
                                  paddingHorizontal: 7,
                                  paddingVertical: 3,
                                  borderRadius: 4,
                                  borderWidth: 1,
                                  borderColor: colors.borderStrong,
                                  backgroundColor: colors.accentFaint,
                                }}
                              >
                                <Text
                                  style={[
                                    type.labelCaps,
                                    { fontSize: 9, color: colors.accent },
                                  ]}
                                >
                                  {event.event_type}
                                </Text>
                              </View>
                            ) : null}
                          </View>

                          {/* Venue */}
                          {event.venue_name_free ? (
                            <Text
                              style={[
                                type.microcopyItalic,
                                { fontSize: 13, color: colors.textSecondary },
                              ]}
                            >
                              {event.venue_name_free}
                            </Text>
                          ) : null}

                          {/* Date */}
                          {event.starts_at ? (
                            <Text
                              style={[
                                type.caption,
                                {
                                  color: past ? colors.textMuted : colors.textSecondary,
                                },
                              ]}
                            >
                              {fmtEventDate(event.starts_at)}
                              {past ? " · Ended" : ""}
                            </Text>
                          ) : null}

                          {/* Capacity */}
                          {event.max_attendees != null ? (
                            <Text style={[type.caption, { color: colors.textMuted }]}>
                              Up to {event.max_attendees} attendees
                            </Text>
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </>
  );
}

export default function DiscoverTab() {
  const insets = useSafeAreaInsets();
  const { height: windowH } = useWindowDimensions();

  const [activeDiscoverTab, setActiveDiscoverTab] = useState<DiscoverTabKey>("forYou");

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
      {/* ── Title block ────────────────────────────────────────── */}
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl + spacing.lg,
          gap: spacing.xs,
        }}
      >
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
            backgroundColor: (colors as any).glassDivider ?? colors.divider,
            marginTop: spacing.md,
            opacity: 0.55,
          }}
        />
      </View>

      {/* ── Top tab bar ────────────────────────────────────────── */}
      <View
        style={{
          flexDirection: "row",
          borderBottomWidth: 1,
          borderBottomColor: colors.divider,
        }}
      >
        {DISCOVER_TABS.map((tab) => {
          const isActive = activeDiscoverTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={logPressWrap(
                "discover",
                "tab_switch",
                withTick(() => setActiveDiscoverTab(tab.key)),
                { tab: tab.key }
              )}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 12,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={[
                  type.labelCaps,
                  { color: isActive ? colors.textPrimary : colors.textMuted },
                ]}
              >
                {tab.label}
              </Text>
              {isActive && (
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    backgroundColor: colors.accent,
                  }}
                />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* ── For You tab ────────────────────────────────────────── */}
      {activeDiscoverTab === "forYou" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
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
      )}

      {/* ── Venues tab ─────────────────────────────────────────── */}
      {activeDiscoverTab === "venues" && <VenuesTab />}

      {/* ── Events tab ─────────────────────────────────────────── */}
      {activeDiscoverTab === "trending" && <EventsTab />}

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
