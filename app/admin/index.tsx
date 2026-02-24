// app/admin/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

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
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.divider,
        ...shadows.card,
        opacity: pressed ? 0.92 : 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.lg,
      })}
    >
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={[type.sectionHeader, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[type.microcopyItalic, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>

      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.divider,
          backgroundColor: colors.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
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
      <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.xl, gap: spacing.md }}>
        <Text style={[type.screenTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[type.body, { color: colors.textSecondary }]}>
          Your account isn’t marked as admin.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.xl, gap: spacing.lg }}>
      <View style={{ gap: 6 }}>
        <Text style={[type.screenTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[type.microcopyItalic, { color: colors.textSecondary }]}>
          Fast tools for catalog + monitoring.
        </Text>
      </View>

      <ActionCard
        title="Inbox"
        subtitle="Approve / reject whiskey submissions."
        icon={<Ionicons name="file-tray-outline" size={20} color={colors.textPrimary} />}
        onPress={() => router.push("/admin/inbox")}
      />

      <ActionCard
        title="Metrics"
        subtitle="Watch activation, engagement, and pipeline health."
        icon={<Ionicons name="stats-chart-outline" size={20} color={colors.textPrimary} />}
        onPress={() => router.push("/admin/metrics")}
      />
    </View>
  );
}