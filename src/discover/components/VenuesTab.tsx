import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { hapticTick } from "../../../lib/hapticsPress";
import { radii } from "../../../lib/radii";
import { shadows } from "../../../lib/shadows";
import { spacing } from "../../../lib/spacing";
import { supabase } from "../../../lib/supabase";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";


function TagBadge({ tag }: { tag: string }) {
  if (tag === "palate_match") {
    return (
      <View
        style={{
          paddingVertical: 3,
          paddingHorizontal: 8,
          borderRadius: 999,
          backgroundColor: (colors as any).accentSoft ?? "rgba(200,150,80,0.15)",
        }}
      >
        <Text style={[type.caption, { color: colors.accent, fontSize: 10, fontWeight: "700" }]}>
          MATCH
        </Text>
      </View>
    );
  }
  if (tag === "new_arrivals") {
    return (
      <View
        style={{
          paddingVertical: 3,
          paddingHorizontal: 8,
          borderRadius: 999,
          backgroundColor: "rgba(121,181,139,0.12)",
        }}
      >
        <Text style={[type.caption, { color: colors.success, fontSize: 10, fontWeight: "700" }]}>
          NEW
        </Text>
      </View>
    );
  }
  if (tag === "events") {
    return (
      <View
        style={{
          paddingVertical: 3,
          paddingHorizontal: 8,
          borderRadius: 999,
          backgroundColor: "rgba(100,149,237,0.12)",
        }}
      >
        <Text style={[type.caption, { color: "#6495ED", fontSize: 10, fontWeight: "700" }]}>
          EVENT
        </Text>
      </View>
    );
  }
  return null;
}

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

function VerticalDivider() {
  return (
    <View
      style={{
        width: 1,
        alignSelf: "stretch",
        backgroundColor: (colors as any).glassDivider ?? colors.divider,
        opacity: 0.5,
        marginVertical: 2,
      }}
    />
  );
}

function TagValueRow({ venue, isPremium }: { venue: any; isPremium: boolean }) {
  if (venue.tag === "palate_match") {
    if (isPremium) {
      return (
        <Text style={[type.caption, { color: colors.accent, fontSize: 12 }]}>
          {venue.tag_value}
        </Text>
      );
    }
    return (
      <Text style={[type.caption, { color: colors.textMuted, fontSize: 12 }]}>
        Upgrade to see your palate match
      </Text>
    );
  }
  if (venue.tag === "new_arrivals") {
    return (
      <Text style={[type.caption, { color: colors.success, fontSize: 12 }]}>
        {venue.tag_value}
      </Text>
    );
  }
  if (venue.tag === "events") {
    return (
      <Text style={[type.caption, { color: "#6495ED", fontSize: 12 }]}>{venue.tag_value}</Text>
    );
  }
  return null;
}

function VenueCard({ venue, isPremium }: { venue: any; isPremium: boolean }) {
  return (
    <Pressable
      onPress={() => {
        hapticTick();
        router.push(("/venue/" + venue.id) as any);
      }}
      style={({ pressed }) => ({
        marginHorizontal: spacing.lg,
        marginBottom: 12,
        backgroundColor:
          (colors as any).glassRaised ?? (colors as any).glassSurface ?? colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: (colors as any).glassBorder ?? colors.divider,
        padding: 16,
        opacity: pressed ? 0.88 : 1,
        ...shadows.card,
      })}
    >
      {/* Row 1: name + badge */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: 4 }}>
        <Text
          style={[type.sectionHeader, { flex: 1, fontSize: 17, color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {venue.name}
        </Text>
        <TagBadge tag={venue.tag} />
      </View>

      {/* Row 2: type · address */}
      <Text style={[type.caption, { color: colors.textSecondary, fontSize: 12, marginBottom: 12 }]}>
        {venue.venue_type} · {venue.address}
      </Text>

      {/* Divider */}
      <View
        style={{
          height: 1,
          backgroundColor: (colors as any).glassDivider ?? colors.divider,
          opacity: 0.5,
          marginBottom: 12,
        }}
      />

      {/* Row 3: two stats */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
        <StatCell value={String(venue.whiskey_count)} label="Whiskies" />
        <VerticalDivider />
        <StatCell value={String(venue.tastings_logged)} label="Tastings" />
      </View>

      {/* Row 4: tag value */}
      <TagValueRow venue={venue} isPremium={isPremium} />
    </Pressable>
  );
}

function SkeletonVenueCard() {
  return (
    <View
      style={{
        marginHorizontal: spacing.lg,
        marginBottom: 12,
        backgroundColor:
          (colors as any).glassRaised ?? (colors as any).glassSurface ?? colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: (colors as any).glassBorder ?? colors.divider,
        padding: 16,
        gap: 10,
        ...shadows.card,
      }}
    >
      <View
        style={{
          height: 18,
          width: "60%",
          borderRadius: 6,
          backgroundColor: (colors as any).glassDivider ?? colors.divider,
          opacity: 0.4,
        }}
      />
      <View
        style={{
          height: 13,
          width: "40%",
          borderRadius: 4,
          backgroundColor: (colors as any).glassDivider ?? colors.divider,
          opacity: 0.3,
        }}
      />
      <View
        style={{
          height: 1,
          backgroundColor: (colors as any).glassDivider ?? colors.divider,
          opacity: 0.3,
        }}
      />
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 34,
              borderRadius: 4,
              backgroundColor: (colors as any).glassDivider ?? colors.divider,
              opacity: 0.25,
            }}
          />
        ))}
      </View>
    </View>
  );
}

export function VenuesTab() {
  const [venues, setVenues] = useState<any[]>([]);
  const [venueQuery, setVenueQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const didInitialLoadRef = useRef(false);

  useEffect(() => {
    if (didInitialLoadRef.current) return;
    didInitialLoadRef.current = true;
    let alive = true;

    (async () => {
      try {
        const { data: authData } = await supabase.auth.getSession();
        const userId = authData.session?.user?.id;
        if (userId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("is_premium")
            .eq("id", userId)
            .maybeSingle();
          if (alive) setIsPremium((profile as any)?.is_premium === true);
        }

        const { data: venuesData } = await supabase
          .from("venues")
          .select("id, name, display_name, venue_type, address, city, state")
          .eq("is_active", true)
          .order("name");

        const rawVenues = ((venuesData as any) ?? []) as any[];

        const counts = await Promise.all(
          rawVenues.map((venue: any) =>
            supabase
              .from("venue_menu_items")
              .select("id", { count: "exact", head: true })
              .eq("venue_id", venue.id)
              .then(({ count }) => count ?? 0)
          )
        );

        const mappedVenues = rawVenues.map((venue: any, i: number) => ({
          id: venue.id,
          name: (venue as any).display_name ?? (venue as any).name,
          venue_type: (venue as any).venue_type,
          address: [(venue as any).city, (venue as any).state].filter(Boolean).join(", "),
          whiskey_count: counts[i],
          tastings_logged: 0,
          tag: "new_arrivals",
          tag_value: "Now on Neat Notes",
        }));

        if (alive) setVenues(mappedVenues);
      } catch (e) {
        console.log("[VenuesTab] load error:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, []);

  const filteredVenues = venueQuery.trim()
    ? venues.filter(v =>
        String(v.name ?? "").toLowerCase().includes(venueQuery.toLowerCase())
      )
    : venues;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingTop: spacing.md,
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
            marginHorizontal: spacing.lg,
            marginBottom: spacing.md,
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
      {loading ? (
        <>
          <SkeletonVenueCard />
          <SkeletonVenueCard />
        </>
      ) : filteredVenues.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
          <Text style={[type.body, { color: colors.textMuted }]}>
            {venueQuery.trim() ? `No venues match "${venueQuery}"` : "No venues yet"}
          </Text>
        </View>
      ) : (
        filteredVenues.map((venue) => (
          <VenueCard key={venue.id} venue={venue} isPremium={isPremium} />
        ))
      )}
    </ScrollView>
  );
}
