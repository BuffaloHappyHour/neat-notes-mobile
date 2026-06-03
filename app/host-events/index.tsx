import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

type HostEventRow = {
  id: string;
  name: string;
  starts_at: string | null;
  ends_at: string | null;
  max_attendees: number | null;
  is_blind: boolean;
  is_active: boolean;
  status: string | null;
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusStyle(isActive: boolean, startsAt: string | null, endsAt: string | null): {
  label: string;
  textColor: string;
  borderColor: string;
  backgroundColor: string;
} {
  if (!isActive || (endsAt != null && new Date(endsAt) < new Date())) {
    return {
      label: "Ended",
      textColor: colors.textMuted,
      borderColor: "rgba(244,241,234,0.12)",
      backgroundColor: "rgba(244,241,234,0.06)",
    };
  }
  if (startsAt && new Date(startsAt) > new Date()) {
    return {
      label: "Upcoming",
      textColor: colors.accent,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.accentFaint,
    };
  }
  return {
    label: "Active",
    textColor: colors.success,
    borderColor: "rgba(121,181,139,0.30)",
    backgroundColor: "rgba(121,181,139,0.12)",
  };
}

function Badge({
  label,
  textColor,
  borderColor,
  backgroundColor,
}: {
  label: string;
  textColor: string;
  borderColor: string;
  backgroundColor: string;
}) {
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
        borderWidth: 1,
        borderColor,
        backgroundColor,
      }}
    >
      <Text style={[type.labelCaps, { color: textColor, fontSize: 9 }]}>
        {label}
      </Text>
    </View>
  );
}

function EventCard({ event }: { event: HostEventRow }) {
  const status = getStatusStyle(event.is_active, event.starts_at, event.ends_at);

  return (
    <Pressable
      onPress={() => router.push(`/host-events/${event.id}` as any)}
      style={({ pressed }) => ({
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.borderStrong,
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
          width: 3,
          backgroundColor: colors.accent,
        }}
      />

      {/* Main content */}
      <View
        style={{
          flex: 1,
          paddingLeft: spacing.lg,
          paddingVertical: spacing.md,
          paddingRight: spacing.sm,
          gap: 4,
        }}
      >
        <Text
          style={[
            type.sectionHeader,
            { color: colors.textPrimary, fontSize: 17, lineHeight: 22 },
          ]}
          numberOfLines={1}
        >
          {event.name}
        </Text>

        <Text style={[type.caption, { color: colors.textSecondary }]}>
          {fmtDate(event.starts_at)}
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: spacing.xs,
            marginTop: 2,
          }}
        >
          <Badge
            label={status.label}
            textColor={status.textColor}
            borderColor={status.borderColor}
            backgroundColor={status.backgroundColor}
          />

          {event.is_blind ? (
            <Badge
              label="BLIND"
              textColor={colors.accent}
              borderColor={colors.borderSubtle}
              backgroundColor={colors.accentFaint}
            />
          ) : null}

          {event.max_attendees != null ? (
            <Badge
              label={`${event.max_attendees} cap`}
              textColor={colors.textMuted}
              borderColor={colors.divider}
              backgroundColor="transparent"
            />
          ) : null}
        </View>
      </View>

      {/* Chevron */}
      <View style={{ paddingRight: spacing.md, paddingLeft: spacing.xs }}>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

export default function HostEventsScreen() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<HostEventRow[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setEvents([]);
        return;
      }

      const { data, error: qErr } = await supabase
        .from("event_hosts")
        .select("events(id, name, starts_at, ends_at, max_attendees, is_blind, is_active, status)")
        .eq("user_id", user.id)
        .order("events(starts_at)", { ascending: false });

      if (qErr) throw qErr;
      const rows = (data ?? []) as unknown as Array<{ events: HostEventRow | null }>;
      setEvents(rows.map((r) => r.events).filter((e): e is HostEventRow => e !== null));
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.md,
        }}
      >
        <Text style={[type.screenTitle, { color: colors.textPrimary }]}>
          My Events
        </Text>

        <Pressable
          onPress={() => router.push("/host-events/create" as any)}
          style={({ pressed }) => ({
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.borderStrong,
            backgroundColor: pressed ? colors.accentSoft : "transparent",
          })}
        >
          <Text style={[type.button, { color: colors.accent }]}>+ New Event</Text>
        </Pressable>
      </View>

      {/* Error */}
      {error ? (
        <Text style={[type.body, { color: colors.danger }]}>{error}</Text>
      ) : null}

      {/* Loading */}
      {loading ? (
        <View style={{ paddingVertical: spacing.xl, alignItems: "center" }}>
          <ActivityIndicator />
        </View>
      ) : null}

      {/* Empty state */}
      {!loading && !error && events.length === 0 ? (
        <View
          style={{
            alignItems: "center",
            paddingVertical: spacing.xl * 2,
            gap: spacing.md,
          }}
        >
          <View style={{ opacity: 0.6 }}>
            <Ionicons name="calendar-outline" size={48} color={colors.accent} />
          </View>

          <Text style={[type.sectionHeader, { color: colors.textPrimary }]}>
            No events yet
          </Text>

          <Text
            style={[
              type.caption,
              { color: colors.textSecondary, textAlign: "center" },
            ]}
          >
            Create your first whiskey tasting event
          </Text>

          <Pressable
            onPress={() => router.push("/host-events/create" as any)}
            style={({ pressed }) => ({
              marginTop: spacing.sm,
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.md,
              borderRadius: 999,
              backgroundColor: pressed ? colors.accentPressed : colors.accent,
            })}
          >
            <Text style={[type.button, { color: colors.background }]}>
              Create Event
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* Event list */}
      {!loading && events.length > 0 ? (
        <View style={{ gap: spacing.md }}>
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
