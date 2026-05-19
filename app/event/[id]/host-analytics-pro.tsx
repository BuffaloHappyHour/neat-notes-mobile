import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { radii } from "../../../lib/radii";
import { spacing } from "../../../lib/spacing";
import { supabase } from "../../../lib/supabase";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

// ── Types ──────────────────────────────────────────────────────────────────────

type Snapshot = {
  participants: number;
  total_tastings: number;
  unique_whiskies: number;
  avg_rating: number;
  first_tasting: string;
  last_tasting: string;
};

type Bottle = {
  display_name: string;
  whiskey_type: string | null;
  proof: number | null;
  tasting_count: number;
  avg_rating: number;
  avg_texture: number | null;
  avg_proof_intensity: number | null;
  avg_flavor_intensity: number | null;
  nose_enjoyed: number;
  nose_neutral: number;
  nose_not_for_me: number;
  taste_enjoyed: number;
  taste_neutral: number;
  taste_not_for_me: number;
  notes_count: number;
};

type RatingBand = { band: string; count: number };
type Flavor = { label: string; level: number; selections: number };

type Sensory = {
  avg_texture: number | null;
  avg_proof_intensity: number | null;
  avg_flavor_intensity: number | null;
};

type Reactions = {
  nose_enjoyed: number;
  nose_neutral: number;
  nose_not_for_me: number;
  taste_enjoyed: number;
  taste_neutral: number;
  taste_not_for_me: number;
};

type AnalyticsData = {
  event_name: string;
  snapshot: Snapshot;
  bottles: Bottle[];
  rating_bands: RatingBand[];
  flavors: Flavor[];
  sensory: Sensory;
  reactions: Reactions;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m}${ampm}`;
}

function rankLabel(n: number): string {
  if (n === 1) return "🥇";
  if (n === 2) return "🥈";
  if (n === 3) return "🥉";
  return `${n}.`;
}

// ── Primitives ─────────────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <Text style={[type.labelCaps, { color: colors.accent, marginBottom: spacing.xs }]}>
      {text}
    </Text>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.borderStrong,
        backgroundColor: colors.accentFaint,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        alignItems: "center",
        gap: 4,
      }}
    >
      <Text style={[type.caption, { color: colors.textSecondary, textAlign: "center" }]}>
        {label}
      </Text>
      <Text style={[type.sectionHeader, { color: colors.textPrimary, fontSize: 22, lineHeight: 26 }]}>
        {value}
      </Text>
    </View>
  );
}

function DotScale({ value }: { value: number | null }) {
  const filled = value != null ? Math.round(Math.min(5, Math.max(1, value))) : 0;
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: value != null && i <= filled ? colors.accent : colors.borderStrong,
          }}
        />
      ))}
    </View>
  );
}

function ReactionBar({
  enjoyed,
  neutral,
  notForMe,
}: {
  enjoyed: number;
  neutral: number;
  notForMe: number;
}) {
  const segments = [
    { label: "Enjoyed", count: enjoyed, color: colors.success },
    { label: "Neutral", count: neutral, color: colors.borderStrong },
    { label: "Not for me", count: notForMe, color: colors.danger },
  ].filter((s) => s.count > 0);

  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: "row", gap: 2 }}>
        {segments.map((s) => (
          <View
            key={s.label}
            style={{ flex: s.count, height: 8, borderRadius: 2, backgroundColor: s.color }}
          />
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 2 }}>
        {segments.map((s) => (
          <Text
            key={s.label}
            style={[type.caption, { flex: s.count, color: colors.textMuted, fontSize: 10 }]}
          >
            {s.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function EventAnalyticsProScreen() {
  const params = useLocalSearchParams();
  const eventId = typeof params.id === "string" ? params.id : "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    if (!eventId) return;

    async function load() {
      setLoading(true);
      setError(null);
      const { data, error: rpcErr } = await supabase.rpc("get_event_analytics", {
        p_event_id: eventId,
      });
      if (rpcErr) {
        setError(rpcErr.message);
      } else {
        setAnalytics(data as AnalyticsData);
      }
      setLoading(false);
    }

    void load();
  }, [eventId]);

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
            gap: spacing.sm,
          }}
        >
          <ActivityIndicator color={colors.accent} />
          <Text style={[type.microcopyItalic, { color: colors.textPrimary, opacity: 0.8 }]}>
            Loading intelligence...
          </Text>
        </View>
      </>
    );
  }

  if (error) {
    const isAuthError = error.includes("Not authorized");
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: spacing.xl,
            gap: spacing.md,
          }}
        >
          {isAuthError ? (
            <>
              <Ionicons name="lock-closed" size={24} color={colors.textMuted} />
              <Text style={[type.body, { color: colors.textPrimary, textAlign: "center" }]}>
                Event Intelligence requires Host Starter or Host Pro.
              </Text>
            </>
          ) : (
            <Text style={[type.body, { color: colors.accent, textAlign: "center" }]}>
              {error}
            </Text>
          )}
        </View>
      </>
    );
  }

  if (!analytics || !analytics.bottles || analytics.bottles.length === 0) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: spacing.xl,
          }}
        >
          <Text style={[type.body, { color: colors.textSecondary, textAlign: "center" }]}>
            No tasting data yet. Populates as attendees log during the event.
          </Text>
        </View>
      </>
    );
  }

  const { snapshot, bottles, rating_bands, flavors, sensory, reactions } = analytics;

  const sortedBottles = [...bottles].sort((a, b) => b.avg_rating - a.avg_rating);
  const maxBandCount = Math.max(...rating_bands.map((b) => b.count), 1);
  const topFlavors = flavors
    .filter((f) => f.level === 2 || f.level === 3)
    .sort((a, b) => b.selections - a.selections)
    .slice(0, 12);
  const noseTotalRoom = reactions.nose_enjoyed + reactions.nose_neutral + reactions.nose_not_for_me;
  const tasteTotalRoom = reactions.taste_enjoyed + reactions.taste_neutral + reactions.taste_not_for_me;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl * 2.5,
          paddingBottom: spacing.xl * 2,
          gap: spacing.xl,
        }}
      >

        {/* ── 1. HEADER ──────────────────────────────────────────────────── */}
        <View style={{ gap: spacing.xs }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              alignSelf: "flex-start",
              opacity: pressed ? 0.7 : 1,
              marginBottom: spacing.sm,
            })}
          >
            <Ionicons name="chevron-back" size={18} color={colors.accent} />
            <Text style={[type.caption, { color: colors.accent }]}>Back</Text>
          </Pressable>

          <Text style={[type.screenTitle, { color: colors.textPrimary }]}>
            Event Intelligence
          </Text>
          <Text style={[type.microcopyItalic, { color: colors.textSecondary, marginTop: 4 }]}>
            {analytics.event_name}
          </Text>
        </View>

        {/* ── 2. EVENT SNAPSHOT ──────────────────────────────────────────── */}
        <View style={{ gap: spacing.sm }}>
          <SectionLabel text="EVENT SNAPSHOT" />

          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <MetricCard label="Participants" value={String(snapshot.participants)} />
            <MetricCard label="Total Tastings" value={String(snapshot.total_tastings)} />
          </View>

          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <MetricCard label="Unique Whiskies" value={String(snapshot.unique_whiskies)} />
            <MetricCard
              label="Avg Rating"
              value={snapshot.avg_rating != null ? snapshot.avg_rating.toFixed(1) : "—"}
            />
          </View>

          <Text style={[type.microcopyItalic, { color: colors.textSecondary }]}>
            {fmtTime(snapshot.first_tasting)} – {fmtTime(snapshot.last_tasting)}
          </Text>
        </View>

        {/* ── 3. BOTTLE RANKINGS ─────────────────────────────────────────── */}
        <View style={{ gap: spacing.sm }}>
          <SectionLabel text="BOTTLE RANKINGS" />

          {sortedBottles.map((bottle, idx) => {
            const noseTotal = bottle.nose_enjoyed + bottle.nose_neutral + bottle.nose_not_for_me;
            const tasteTotal = bottle.taste_enjoyed + bottle.taste_neutral + bottle.taste_not_for_me;
            const meta = [
              bottle.whiskey_type,
              bottle.proof != null ? `${bottle.proof} proof` : null,
            ]
              .filter(Boolean)
              .join(" • ");

            return (
              <View
                key={`bottle-${idx}`}
                style={{
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: colors.borderStrong,
                  backgroundColor: colors.surface,
                  padding: spacing.md,
                  gap: spacing.sm,
                }}
              >
                {/* a. Rank + name + rating */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: spacing.sm,
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "flex-start",
                      gap: spacing.xs,
                    }}
                  >
                    <Text style={[type.body, { color: colors.textPrimary }]}>
                      {rankLabel(idx + 1)}
                    </Text>
                    <Text
                      style={[
                        type.sectionHeader,
                        { flex: 1, color: colors.textPrimary, fontSize: 17, lineHeight: 22 },
                      ]}
                    >
                      {bottle.display_name}
                    </Text>
                  </View>
                  <Text
                    style={[
                      type.sectionHeader,
                      { color: colors.accent, fontSize: 22, lineHeight: 26 },
                    ]}
                  >
                    {bottle.avg_rating.toFixed(1)}
                  </Text>
                </View>

                {/* b. Type + proof */}
                {meta ? (
                  <Text style={[type.caption, { color: colors.textSecondary }]}>{meta}</Text>
                ) : null}

                {/* c. Tasting count */}
                <Text style={[type.microcopyItalic, { color: colors.textMuted }]}>
                  {bottle.tasting_count}{" "}
                  {bottle.tasting_count === 1 ? "tasting" : "tastings"}
                </Text>

                {/* d. Sensory row */}
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  {(
                    [
                      { label: "Texture", value: bottle.avg_texture },
                      { label: "Proof Intensity", value: bottle.avg_proof_intensity },
                      { label: "Flavor Intensity", value: bottle.avg_flavor_intensity },
                    ] as { label: string; value: number | null }[]
                  ).map((s) => (
                    <View key={s.label} style={{ flex: 1, alignItems: "center", gap: 2 }}>
                      <Text
                        style={[
                          type.caption,
                          { color: colors.textMuted, fontSize: 10, textAlign: "center" },
                        ]}
                      >
                        {s.label}
                      </Text>
                      <Text style={[type.body, { color: colors.textPrimary }]}>
                        {s.value != null ? s.value.toFixed(1) : "—"}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* e. Nose reaction bar */}
                {noseTotal > 0 ? (
                  <View style={{ gap: 4 }}>
                    <Text style={[type.caption, { color: colors.textSecondary }]}>Nose</Text>
                    <ReactionBar
                      enjoyed={bottle.nose_enjoyed}
                      neutral={bottle.nose_neutral}
                      notForMe={bottle.nose_not_for_me}
                    />
                  </View>
                ) : null}

                {/* f. Taste reaction bar */}
                {tasteTotal > 0 ? (
                  <View style={{ gap: 4 }}>
                    <Text style={[type.caption, { color: colors.textSecondary }]}>Taste</Text>
                    <ReactionBar
                      enjoyed={bottle.taste_enjoyed}
                      neutral={bottle.taste_neutral}
                      notForMe={bottle.taste_not_for_me}
                    />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        {/* ── 4. RATING DISTRIBUTION ─────────────────────────────────────── */}
        {rating_bands.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            <SectionLabel text="HOW THE ROOM RATED" />

            {rating_bands.map((band) => (
              <View
                key={band.band}
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
              >
                <Text style={[type.caption, { color: colors.textSecondary, width: 60 }]}>
                  {band.band}
                </Text>
                <View
                  style={{
                    flex: 1,
                    height: 10,
                    borderRadius: 2,
                    backgroundColor: colors.accentFaint,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: `${Math.round((band.count / maxBandCount) * 100)}%` as `${number}%`,
                      height: 10,
                      borderRadius: 2,
                      backgroundColor: colors.accent,
                    }}
                  />
                </View>
                <Text
                  style={[
                    type.caption,
                    { color: colors.textSecondary, width: 24, textAlign: "right" },
                  ]}
                >
                  {band.count}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* ── 5. FLAVOR SIGNAL ───────────────────────────────────────────── */}
        {topFlavors.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            <SectionLabel text="FLAVOR SIGNAL" />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {topFlavors.map((flavor) => (
                <View
                  key={flavor.label}
                  style={{
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 4,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: colors.glassBorderStrong,
                    backgroundColor: colors.accentFaint,
                  }}
                >
                  <Text
                    style={[
                      type.caption,
                      {
                        color: colors.accent,
                        fontStyle: flavor.level === 3 ? "italic" : "normal",
                      },
                    ]}
                  >
                    {flavor.label} {flavor.selections}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* ── 6. ROOM SENSORY PROFILE ────────────────────────────────────── */}
        <View style={{ gap: spacing.sm }}>
          <SectionLabel text="ROOM SENSORY PROFILE" />

          {(
            [
              { label: "Texture", value: sensory.avg_texture },
              { label: "Proof Intensity", value: sensory.avg_proof_intensity },
              { label: "Flavor Intensity", value: sensory.avg_flavor_intensity },
            ] as { label: string; value: number | null }[]
          ).map((row) => (
            <View
              key={row.label}
              style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
            >
              <Text style={[type.caption, { color: colors.textSecondary, width: 112 }]}>
                {row.label}
              </Text>
              <DotScale value={row.value} />
              <View style={{ flex: 1 }} />
              <Text style={[type.caption, { color: colors.textSecondary }]}>
                {row.value != null ? row.value.toFixed(1) : "—"}
              </Text>
            </View>
          ))}
        </View>

        {/* ── 7. ROOM REACTIONS ──────────────────────────────────────────── */}
        {noseTotalRoom > 0 || tasteTotalRoom > 0 ? (
          <View style={{ gap: spacing.sm }}>
            <SectionLabel text="ROOM REACTIONS" />

            {noseTotalRoom > 0 ? (
              <View style={{ gap: 4 }}>
                <Text style={[type.caption, { color: colors.textSecondary }]}>Nose</Text>
                <ReactionBar
                  enjoyed={reactions.nose_enjoyed}
                  neutral={reactions.nose_neutral}
                  notForMe={reactions.nose_not_for_me}
                />
              </View>
            ) : null}

            {tasteTotalRoom > 0 ? (
              <View style={{ gap: 4 }}>
                <Text style={[type.caption, { color: colors.textSecondary }]}>Taste</Text>
                <ReactionBar
                  enjoyed={reactions.taste_enjoyed}
                  neutral={reactions.taste_neutral}
                  notForMe={reactions.taste_not_for_me}
                />
              </View>
            ) : null}
          </View>
        ) : null}

      </ScrollView>
    </>
  );
}
