import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { isAdmin } from "../../lib/adminApi";
import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

function ActionCard({
  title,
  subtitle,
  icon,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
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

      {/* Icon */}
      <View
        style={{
          marginLeft: spacing.lg,
          marginVertical: spacing.lg,
          marginRight: spacing.md,
          width: 36,
          height: 36,
          borderRadius: radii.md,
          backgroundColor: colors.accentSoft,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>

      {/* Text */}
      <View style={{ flex: 1, gap: 3, paddingVertical: spacing.lg }}>
        <Text
          style={[
            type.sectionHeader,
            { color: colors.textPrimary, fontSize: 17, lineHeight: 22 },
          ]}
        >
          {title}
        </Text>
        <Text style={[type.caption, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>

      {/* Chevron */}
      <View style={{ paddingRight: spacing.md, paddingLeft: spacing.sm }}>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

export default function AdminHomeScreen() {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const a = await isAdmin();
      setOk(a);
    })();
  }, []);

  const title = useMemo(() => {
    if (ok === null) return "Checking admin…";
    if (ok === false) return "Not authorized";
    return "Admin";
  }, [ok]);

  if (ok === null) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
        }}
      >
        <ActivityIndicator />
        <Text style={[type.body, { color: colors.textSecondary }]}>Loading…</Text>
      </View>
    );
  }

  if (ok === false) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          padding: spacing.xl,
          gap: spacing.md,
        }}
      >
        <Text style={[type.screenTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[type.body, { color: colors.textSecondary }]}>
          Your account isn't marked as admin.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}
    >
      <View style={{ gap: 6 }}>
        <Text style={[type.screenTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[type.caption, { color: colors.textSecondary }]}>
          Fast tools for catalog + monitoring.
        </Text>
      </View>

      <ActionCard
        title="Inbox"
        subtitle="Approve / reject whiskey submissions."
        icon={<Ionicons name="file-tray-outline" size={18} color={colors.accent} />}
        onPress={() => router.push("/admin/inbox")}
      />

      <ActionCard
        title="Metrics"
        subtitle="Watch activation, engagement, and pipeline health."
        icon={<Ionicons name="stats-chart-outline" size={18} color={colors.accent} />}
        onPress={() => router.push("/admin/metrics")}
      />

      <ActionCard
        title="Catalog"
        subtitle="Search, sort, and inspect the whiskey library."
        icon={<Ionicons name="search-outline" size={18} color={colors.accent} />}
        onPress={() => router.push("/admin/catalog")}
      />

      <ActionCard
        title="Featured Bottle"
        subtitle="Choose the bottle, dates, and note shown on Home."
        icon={<Ionicons name="sparkles-outline" size={18} color={colors.accent} />}
        onPress={() => router.push("/admin/featured")}
      />

      <ActionCard
        title="Role Management"
        subtitle="Grant or revoke app roles for any user by email."
        icon={<Ionicons name="shield-checkmark-outline" size={18} color={colors.accent} />}
        onPress={() => router.push("/admin/roles")}
      />

      <ActionCard
        title="Venue Requests"
        subtitle="Review and approve venue applications."
        icon={<Ionicons name="business-outline" size={18} color={colors.accent} />}
        onPress={() => router.push("/admin/venue-requests")}
      />
    </ScrollView>
  );
}
