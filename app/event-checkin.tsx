import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { setActiveEventId } from "../lib/eventStorage";
import { radii } from "../lib/radii";
import { shadows } from "../lib/shadows";
import { spacing } from "../lib/spacing";
import { supabase } from "../lib/supabase";
import { colors } from "../lib/theme";
import { type } from "../lib/typography";

type EventRow = {
  id: string;
  name: string;
};

export default function EventCheckinScreen() {
  const { event_id } = useLocalSearchParams<{ event_id?: string }>();

  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventRow | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadEvent() {
      if (!event_id || typeof event_id !== "string") {
        if (mounted) setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("events")
        .select("id, name")
        .eq("id", event_id)
        .maybeSingle();

      if (!mounted) return;

      if (error || !data) {
        setEvent(null);
      } else {
        setEvent(data);
      }

      setLoading(false);
    }

    void loadEvent();

    return () => {
      mounted = false;
    };
  }, [event_id]);

  const handleCheckIn = async () => {
    if (!event?.id) return;

    setBusy(true);
    await setActiveEventId(event.id);
    setBusy(false);

    router.replace({
      pathname: "/event/[id]",
      params: { id: event.id },
    });
  };

  if (loading) {
    return (
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
          Loading event…
        </Text>
      </View>
    );
  }

  if (!event) {
    return (
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
        <Text
          style={[
            type.sectionHeader,
            { fontSize: 26, lineHeight: 30, color: colors.textPrimary, textAlign: "center" },
          ]}
        >
          Event not found
        </Text>

        <Text
          style={[
            type.microcopyItalic,
            { color: colors.textPrimary, opacity: 0.8, textAlign: "center" },
          ]}
        >
          This event link may be invalid or expired.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "transparent",
        justifyContent: "center",
        paddingHorizontal: spacing.lg,
      }}
    >
      <View
        style={{
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: "rgba(190, 150, 99, 0.34)",
          backgroundColor: "rgba(190, 150, 99, 0.05)",
          paddingVertical: spacing.xl,
          paddingHorizontal: spacing.lg,
          gap: spacing.lg,
          ...shadows.card,
        }}
      >
        <View style={{ gap: spacing.xs }}>
          <Text
            style={[
              type.caption,
              {
                color: colors.accent,
                fontWeight: "700",
                letterSpacing: 0.5,
                textTransform: "uppercase",
              },
            ]}
          >
            Event Check-In
          </Text>

          <Text
            style={[
              type.sectionHeader,
              { fontSize: 28, lineHeight: 32, color: colors.textPrimary },
            ]}
          >
            {event.name}
          </Text>

          <Text
            style={[
              type.microcopyItalic,
              {
                fontSize: 16,
                lineHeight: 22,
                opacity: 0.85,
                color: colors.textPrimary,
              },
            ]}
          >
            Check in and your next tastings will be tagged to this event automatically.
          </Text>
        </View>

        <Pressable
          onPress={handleCheckIn}
          disabled={busy}
          style={({ pressed }) => ({
            paddingVertical: 14,
            borderRadius: 999,
            alignItems: "center",
            backgroundColor: pressed
              ? "rgba(190, 150, 99, 0.16)"
              : "rgba(190, 150, 99, 0.10)",
            borderWidth: 1,
            borderColor: "rgba(190, 150, 99, 0.34)",
            opacity: busy ? 0.7 : pressed ? 0.96 : 1,
          })}
        >
          <Text
            style={[
              type.caption,
              {
                color: colors.accent,
                opacity: 0.96,
                letterSpacing: 0.25,
                fontWeight: "700",
              },
            ]}
          >
            {busy ? "Checking In..." : "Check In"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}