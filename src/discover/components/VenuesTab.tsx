import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { hapticTick } from "../../../lib/hapticsPress";
import { type ApproximateLocation } from "../../../lib/location";
import { shadows } from "../../../lib/shadows";
import { spacing } from "../../../lib/spacing";
import { supabase } from "../../../lib/supabase";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

// ── Types ─────────────────────────────────────────────────────────

type VenueRow = {
  id: string;
  name: string;
  venue_type: string | null;
  city: string | null;
  state: string | null;
  whiskey_count: number;
};

// ── Sub-components ─────────────────────────────────────────────────

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
      <Text style={[type.caption, { color: colors.textPrimary, fontWeight: "700", fontSize: 15 }]}>
        {value}
      </Text>
      <Text style={[type.caption, { color: colors.textSecondary, fontSize: 11 }]}>{label}</Text>
    </View>
  );
}

function VenueCard({ venue }: { venue: VenueRow }) {
  return (
    <Pressable
      onPress={() => {
        hapticTick();
        router.push(("/venue/" + venue.id) as any);
      }}
      style={({ pressed }) => ({
        marginBottom: 10,
        backgroundColor:
          (colors as any).glassRaised ?? (colors as any).glassSurface ?? colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: (colors as any).glassBorder ?? colors.divider,
        padding: 14,
        opacity: pressed ? 0.88 : 1,
        ...shadows.card,
      })}
    >
      <Text
        style={[type.sectionHeader, { fontSize: 16, color: colors.textPrimary, marginBottom: 3 }]}
        numberOfLines={1}
      >
        {venue.name}
      </Text>
      {venue.venue_type ? (
        <Text style={[type.caption, { color: colors.textSecondary, fontSize: 12, marginBottom: 10 }]}>
          {venue.venue_type}
        </Text>
      ) : null}
      <View
        style={{
          height: 1,
          backgroundColor: (colors as any).glassDivider ?? colors.divider,
          opacity: 0.5,
          marginBottom: 10,
        }}
      />
      <StatCell value={String(venue.whiskey_count)} label="Whiskies on menu" />
    </Pressable>
  );
}

function SkeletonCard() {
  return (
    <View
      style={{
        marginBottom: 10,
        backgroundColor: (colors as any).glassRaised ?? colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: (colors as any).glassBorder ?? colors.divider,
        padding: 14,
        gap: 10,
        ...shadows.card,
      }}
    >
      {[0.6, 0.35, 1, 0.4].map((w, i) => (
        <View
          key={i}
          style={{
            height: i === 2 ? 1 : 14,
            width: `${w * 100}%`,
            borderRadius: 4,
            backgroundColor: (colors as any).glassDivider ?? colors.divider,
            opacity: 0.3,
          }}
        />
      ))}
    </View>
  );
}

// ── Main component ─────────────────────────────────────────────────

export function VenuesTab({ approxLocation }: { approxLocation: ApproximateLocation | null }) {
  const [venues, setVenues] = useState<VenueRow[]>([]);
  const [venueQuery, setVenueQuery] = useState("");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const didInitialLoadRef = useRef(false);
  const locationAppliedRef = useRef(false);

  useEffect(() => {
    if (didInitialLoadRef.current) return;
    didInitialLoadRef.current = true;
    let alive = true;

    (async () => {
      try {
        // Single query — count menu items via foreign table aggregation
        const { data } = await supabase
          .from("venues")
          .select("id, name, display_name, venue_type, city, state, venue_menu_items(count)")
          .eq("is_active", true)
          .order("name");

        if (!alive) return;

        const mapped: VenueRow[] = ((data as any[]) ?? [])
          .map((v: any) => ({
            id: v.id,
            name: v.display_name ?? v.name,
            venue_type: v.venue_type ?? null,
            city: v.city ?? null,
            state: v.state ?? null,
            whiskey_count: v.venue_menu_items?.[0]?.count ?? 0,
          }))
          // Drop venues with no whiskeys on the menu
          .filter((v) => v.whiskey_count > 0);

        if (alive) setVenues(mapped);
      } catch (e) {
        console.log("[VenuesTab] load error:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, []);

  const allStates = useMemo(() => {
    const states = new Set<string>();
    venues.forEach((v) => { if (v.state) states.add(v.state); });
    return Array.from(states).sort();
  }, [venues]);

  useEffect(() => {
    if (locationAppliedRef.current) return;
    if (!approxLocation?.state) return;
    if (allStates.length === 0) return;
    if (allStates.includes(approxLocation.state)) {
      locationAppliedRef.current = true;
      setSelectedState(approxLocation.state);
    }
  }, [allStates, approxLocation]);

  // State filter runs before text search
  const filtered = useMemo(() => {
    let result = venues;
    if (selectedState) result = result.filter((v) => v.state === selectedState);
    const q = venueQuery.trim().toLowerCase();
    if (!q) return result;
    return result.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.city?.toLowerCase().includes(q) ||
        v.state?.toLowerCase().includes(q)
    );
  }, [venues, venueQuery, selectedState]);

  // Group: state → city → venues[]
  const grouped = useMemo(() => {
    const stateMap = new Map<string, Map<string, VenueRow[]>>();
    for (const v of filtered) {
      const state = v.state ?? "Unknown";
      const city = v.city ?? "Unknown";
      if (!stateMap.has(state)) stateMap.set(state, new Map());
      const cityMap = stateMap.get(state)!;
      if (!cityMap.has(city)) cityMap.set(city, []);
      cityMap.get(city)!.push(v);
    }
    // Sort states and cities alphabetically
    return Array.from(stateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([state, cityMap]) => ({
        state,
        cities: Array.from(cityMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([city, items]) => ({ city, items })),
      }));
  }, [filtered]);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingTop: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl * 2,
      }}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
    >
      <TextInput
        value={venueQuery}
        onChangeText={setVenueQuery}
        placeholder="Search venues…"
        placeholderTextColor={colors.textMuted}
        style={[
          type.body,
          {
            marginBottom: spacing.sm,
            paddingVertical: 10,
            paddingHorizontal: 14,
            backgroundColor: colors.surface,
            borderColor: (colors as any).borderSubtle ?? colors.divider,
            borderWidth: 1,
            borderRadius: 8,
            color: colors.textPrimary,
          },
        ]}
        autoCorrect={false}
        autoCapitalize="none"
      />

      {selectedState ? (
        <Pressable
          onPress={() => {
            setSelectedState(null);
            locationAppliedRef.current = false;
          }}
          style={({ pressed }) => ({
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.xs,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.accent,
            backgroundColor: (colors as any).accentFaint ?? "transparent",
            marginBottom: spacing.md,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={[type.caption, { color: colors.accent }]}>{selectedState}</Text>
          <Text style={[type.caption, { color: colors.accent }]}>✕</Text>
        </Pressable>
      ) : (
        <View style={{ marginBottom: spacing.md }} />
      )}

      {loading ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : grouped.length === 0 ? (
        <View style={{ alignItems: "center", paddingTop: spacing.xl }}>
          <Text style={[type.body, { color: colors.textMuted }]}>
            {venueQuery.trim()
              ? `No venues match "${venueQuery}"`
              : selectedState
              ? `No venues in ${selectedState}`
              : "No venues yet"}
          </Text>
        </View>
      ) : (
        grouped.map(({ state, cities }) => (
          <View key={state}>
            {/* State header */}
            <Text
              style={[
                type.labelCaps,
                { color: colors.accent, marginBottom: spacing.xs, marginTop: spacing.sm },
              ]}
            >
              {state}
            </Text>

            {cities.map(({ city, items }) => (
              <View key={city} style={{ marginBottom: spacing.sm }}>
                {/* City header */}
                <Text
                  style={[
                    type.caption,
                    { color: colors.textSecondary, marginBottom: spacing.xs },
                  ]}
                >
                  {city}
                </Text>

                {items.map((venue) => (
                  <VenueCard key={venue.id} venue={venue} />
                ))}
              </View>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}
