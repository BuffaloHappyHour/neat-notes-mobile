import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";

import { supabase } from "../lib/supabase";

import { radii } from "../lib/radii";
import { shadows } from "../lib/shadows";
import { spacing } from "../lib/spacing";
import { colors } from "../lib/theme";
import { type } from "../lib/typography";

import { withTick } from "../lib/hapticsPress";

function Card({
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
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.divider,
        ...shadows.card,
        gap: spacing.md,
      }}
    >
      <View style={{ gap: spacing.xs }}>
        <Text style={type.sectionHeader}>{title}</Text>
        {subtitle ? (
          <Text style={[type.microcopyItalic, { fontSize: 16, lineHeight: 22 }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function NotificationRow({
  title,
  subtitle,
  value,
  onToggle,
  disabled,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
      }}
    >
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text style={type.sectionHeader}>{title}</Text>
        <Text style={[type.caption, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: colors.divider, true: colors.accent }}
        thumbColor={colors.textPrimary}
      />
    </View>
  );
}

export default function NotificationSettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [notifyBehavioral, setNotifyBehavioral] = useState(true);
  const [notifyScheduled, setNotifyScheduled] = useState(true);
  const [notifyPremiumNudge, setNotifyPremiumNudge] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id ?? null;
      setUserId(uid);

      if (!uid) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("notification_preferences")
        .select("notify_behavioral,notify_scheduled,notify_premium_nudge")
        .eq("user_id", uid)
        .maybeSingle();

      if (data) {
        setNotifyBehavioral(data.notify_behavioral ?? true);
        setNotifyScheduled(data.notify_scheduled ?? true);
        setNotifyPremiumNudge(data.notify_premium_nudge ?? true);
      }

      setLoading(false);
    }

    load();
  }, []);

  async function upsert(patch: {
    notify_behavioral?: boolean;
    notify_scheduled?: boolean;
    notify_premium_nudge?: boolean;
  }) {
    if (!userId || saving) return;
    setSaving(true);
    try {
      await supabase.from("notification_preferences").upsert(
        {
          user_id: userId,
          notify_behavioral: notifyBehavioral,
          notify_scheduled: notifyScheduled,
          notify_premium_nudge: notifyPremiumNudge,
          ...patch,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    } catch {
      // non-fatal
    } finally {
      setSaving(false);
    }
  }

  function handleBehavioral(next: boolean) {
    setNotifyBehavioral(next);
    void upsert({ notify_behavioral: next });
  }

  function handleScheduled(next: boolean) {
    setNotifyScheduled(next);
    void upsert({ notify_scheduled: next });
  }

  function handlePremiumNudge(next: boolean) {
    setNotifyPremiumNudge(next);
    void upsert({ notify_premium_nudge: next });
  }

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator />
        <Text style={[type.body, { marginTop: spacing.sm, opacity: 0.7 }]}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: "Notification Settings",
          headerStyle: { backgroundColor: colors.background as any },
          headerTintColor: colors.textPrimary as any,
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable
              onPress={withTick(() => router.back())}
              style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
            >
              <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          gap: spacing.xl,
          paddingBottom: spacing.xl * 3,
        }}
      >
        <Card
          title="Push Notifications"
          subtitle="Control which notifications Neat Notes can send you."
        >
          <NotificationRow
            title="Milestones & Tips"
            subtitle="Notify me when I hit pour milestones and for helpful nudges."
            value={notifyBehavioral}
            onToggle={handleBehavioral}
            disabled={saving || !userId}
          />

          <View style={{ height: 1, backgroundColor: colors.divider, opacity: 0.9 }} />

          <NotificationRow
            title="Weekly Reminders"
            subtitle="A Friday prompt to log what I've been drinking."
            value={notifyScheduled}
            onToggle={handleScheduled}
            disabled={saving || !userId}
          />

          <View style={{ height: 1, backgroundColor: colors.divider, opacity: 0.9 }} />

          <NotificationRow
            title="Premium Features"
            subtitle="Let me know when I have enough data to unlock my full palate profile."
            value={notifyPremiumNudge}
            onToggle={handlePremiumNudge}
            disabled={saving || !userId}
          />
        </Card>
      </ScrollView>
    </View>
  );
}
