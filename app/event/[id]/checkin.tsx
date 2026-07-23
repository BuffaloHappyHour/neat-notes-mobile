// app/event/[id]/checkin.tsx
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";

import { radii } from "../../../lib/radii";
import { shadows } from "../../../lib/shadows";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";
import { supabase } from "../../../lib/supabase";

const warmCardShadow = {
  ...shadows.card,
  shadowColor: colors.shadowWarm,
  shadowOpacity: 0.42,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
};

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        backgroundColor: colors.glassSurface,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.lg,
        ...warmCardShadow,
      }}
    >
      <View style={{ marginBottom: spacing.sm }}>
        <Text
          style={[
            type.sectionHeader,
            { fontSize: 23, lineHeight: 28, color: colors.textPrimary },
          ]}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={[
              type.microcopyItalic,
              {
                marginTop: 4,
                fontSize: 14.5,
                lineHeight: 20,
                color: colors.textPrimary,
                opacity: 0.8,
              },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {children}
    </View>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: 72,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.glassBorderStrong,
        backgroundColor: colors.accentFaint,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: spacing.sm,
      }}
    >
      <Text
        style={[
          type.caption,
          {
            fontSize: 11.5,
            lineHeight: 16,
            letterSpacing: 1.1,
            textTransform: "uppercase",
            color: colors.textSecondary,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          type.sectionHeader,
          {
            marginTop: 4,
            fontSize: 22,
            lineHeight: 26,
            color: colors.textPrimary,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

type Attendee = {
  id: string;
  user_id: string;
  joined_at: string;
  displayName: string;
};

export default function EventCheckinPage() {
  const params = useLocalSearchParams();
  const eventId = useMemo(() => {
    return typeof params.id === "string" ? params.id : "";
  }, [params.id]);

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [eventName, setEventName] = useState<string>("");
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [totalScans, setTotalScans] = useState(0);
  const [repeatScans, setRepeatScans] = useState(0);

  const profileCache = useRef<Map<string, string>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const resolveDisplayName = useCallback(async (userId: string) => {
    const cached = profileCache.current.get(userId);
    if (cached) return cached;

    const { data } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .maybeSingle();

    const name = data?.display_name ?? "Unknown taster";
    profileCache.current.set(userId, name);
    return name;
  }, []);

  const loadAll = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);

    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes?.user?.id;

    const { data: eventRow } = await supabase
      .from("events")
      .select("name, host_user_id")
      .eq("id", eventId)
      .maybeSingle();

    if (!eventRow || !userId) {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    setEventName(eventRow.name ?? "");

    let isHost = eventRow.host_user_id === userId;

    if (!isHost) {
      const { data: hostRow } = await supabase
        .from("event_hosts")
        .select("role")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .in("role", ["primary", "co_host"])
        .maybeSingle();
      isHost = !!hostRow;
    }

    setAuthorized(isHost);

    if (!isHost) {
      setLoading(false);
      return;
    }

    const { data: attendeeRows } = await supabase
      .from("event_attendees")
      .select("id, user_id, joined_at")
      .eq("event_id", eventId)
      .order("joined_at", { ascending: true });

    const rows = attendeeRows ?? [];
    const withNames: Attendee[] = await Promise.all(
      rows.map(async (row) => ({
        id: row.id,
        user_id: row.user_id,
        joined_at: row.joined_at,
        displayName: await resolveDisplayName(row.user_id),
      }))
    );
    setAttendees(withNames);

    const { count: totalCount } = await supabase
      .from("event_checkin_scans")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId);

    const { count: repeatCount } = await supabase
      .from("event_checkin_scans")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("was_new_attendee", false);

    setTotalScans(totalCount ?? 0);
    setRepeatScans(repeatCount ?? 0);

    setLoading(false);
  }, [eventId, resolveDisplayName]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  useFocusEffect(
    useCallback(() => {
      if (!eventId || !authorized) return;

      const channel = supabase
        .channel(`event-checkin-${eventId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "event_attendees",
            filter: `event_id=eq.${eventId}`,
          },
          async (payload) => {
            const row = payload.new as { id: string; user_id: string; joined_at: string };
            const displayName = await resolveDisplayName(row.user_id);
            setAttendees((prev) => {
              if (prev.some((a) => a.id === row.id)) return prev;
              return [...prev, { id: row.id, user_id: row.user_id, joined_at: row.joined_at, displayName }];
            });
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "event_attendees",
            filter: `event_id=eq.${eventId}`,
          },
          (payload) => {
            const oldRow = payload.old as { id: string };
            setAttendees((prev) => prev.filter((a) => a.id !== oldRow.id));
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "event_checkin_scans",
            filter: `event_id=eq.${eventId}`,
          },
          (payload) => {
            const row = payload.new as { was_new_attendee: boolean };
            setTotalScans((prev) => prev + 1);
            if (!row.was_new_attendee) {
              setRepeatScans((prev) => prev + 1);
            }
          }
        )
        .subscribe();

      channelRef.current = channel;

      return () => {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
      };
    }, [eventId, authorized, resolveDisplayName])
  );

  const handleRemove = useCallback(
    (attendee: Attendee) => {
      Alert.alert(
        "Remove check-in?",
        `This removes ${attendee.displayName} from the attendee list. They can scan back in if needed.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              const { error } = await supabase
                .from("event_attendees")
                .delete()
                .eq("id", attendee.id);

              if (error) {
                Alert.alert("Couldn't remove attendee", error.message);
                return;
              }
              setAttendees((prev) => prev.filter((a) => a.id !== attendee.id));
            },
          },
        ]
      );
    },
    []
  );

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{ title: "", headerTransparent: true, headerShadowVisible: false }}
        />
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator color={colors.accent} />
          <Text
            style={[
              type.microcopyItalic,
              { marginTop: spacing.sm, color: colors.textPrimary, opacity: 0.8 },
            ]}
          >
            Loading check-ins…
          </Text>
        </View>
      </>
    );
  }

  if (!authorized) {
    return (
      <>
        <Stack.Screen
          options={{ title: "", headerTransparent: true, headerShadowVisible: false }}
        />
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: spacing.xl,
          }}
        >
          <Text
            style={[
              type.sectionHeader,
              { fontSize: 26, lineHeight: 30, color: colors.textPrimary, textAlign: "center" },
            ]}
          >
            Host access only
          </Text>

          <Text
            style={[
              type.microcopyItalic,
              {
                marginTop: spacing.sm,
                fontSize: 15,
                lineHeight: 21,
                color: colors.textPrimary,
                opacity: 0.8,
                textAlign: "center",
              },
            ]}
          >
            This page is only available to assigned event hosts and co-hosts.
          </Text>

          <Pressable
            onPress={() => router.replace(`/event/${eventId}` as any)}
            style={{
              marginTop: spacing.lg,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.glassBorderStrong,
              backgroundColor: colors.accentFaint,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
            }}
          >
            <Text style={[type.body, { color: colors.textPrimary }]}>Back to Event</Text>
          </Pressable>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{ title: "", headerTransparent: true, headerShadowVisible: false }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: "transparent" }}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl * 2.1,
          paddingBottom: spacing.xl * 2,
          gap: spacing.sm,
        }}
      >
        <View style={{ marginBottom: spacing.sm }}>
          <Text
            style={[
              type.screenTitle,
              { fontSize: 31, lineHeight: 36, color: colors.textPrimary, textAlign: "center" },
            ]}
          >
            Live Check-Ins
          </Text>

          <Text
            style={[
              type.microcopyItalic,
              {
                marginTop: 6,
                fontSize: 16,
                lineHeight: 21,
                color: colors.textPrimary,
                opacity: 0.82,
                textAlign: "center",
              },
            ]}
          >
            {eventName}
          </Text>

          <View
            style={{
              height: 1,
              backgroundColor: colors.glassDivider,
              marginTop: spacing.sm,
              opacity: 0.5,
            }}
          />
        </View>

        <SectionCard title="Snapshot" subtitle="Updates live as people scan in.">
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <MetricPill label="Checked In" value={String(attendees.length)} />
            <MetricPill label="Total Scans" value={String(totalScans)} />
            <MetricPill label="Repeat Scans" value={String(repeatScans)} />
          </View>
        </SectionCard>

        <SectionCard
          title="Attendees"
          subtitle={attendees.length > 0 ? "Tap Remove to undo a check-in." : undefined}
        >
          {attendees.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              {attendees.map((attendee) => (
                <View
                  key={attendee.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderRadius: radii.lg,
                    borderWidth: 1,
                    borderColor: colors.glassBorder,
                    backgroundColor: colors.glassRaised,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.md,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        type.body,
                        { fontSize: 16.5, lineHeight: 21, color: colors.textPrimary },
                      ]}
                    >
                      {attendee.displayName}
                    </Text>
                    <Text
                      style={[
                        type.microcopyItalic,
                        {
                          marginTop: 3,
                          fontSize: 13.5,
                          lineHeight: 18,
                          color: colors.textPrimary,
                          opacity: 0.78,
                        },
                      ]}
                    >
                      Checked in {new Date(attendee.joined_at).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => handleRemove(attendee)}
                    style={({ pressed }) => ({
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 6,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: colors.danger,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Text style={[type.caption, { color: colors.danger }]}>Remove</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <Text
              style={[
                type.microcopyItalic,
                { fontSize: 14.5, lineHeight: 20, color: colors.textPrimary, opacity: 0.78 },
              ]}
            >
              No one has checked in yet.
            </Text>
          )}
        </SectionCard>
      </ScrollView>
    </>
  );
}
