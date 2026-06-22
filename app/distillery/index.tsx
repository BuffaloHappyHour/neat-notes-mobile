import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";
import {
  fetchOwnerBarrels,
  getMyDistilleryAccount,
  insertOwnerBarrel,
  type BarrelDraft,
  type OwnerBarrelItem,
} from "../../lib/barrelApi";
import { BarrelFormModal } from "../../src/events/components/BarrelFormModal";

function ageLabel(months: number): string {
  if (months < 1) return "< 1 mo";
  if (months < 12) return `${months}mo`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y}yr ${m}mo` : `${y}yr`;
}

function BarrelRow({ item }: { item: OwnerBarrelItem }) {
  return (
    <View
      style={{
        backgroundColor: colors.surfaceSunken,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.borderStrong,
        padding: spacing.md,
        gap: 4,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <View
          style={{
            backgroundColor: colors.accentSoft,
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}
        >
          <Text style={[type.labelCaps, { color: colors.accent, fontSize: 9 }]}>
            {item.barrelNumber}
          </Text>
        </View>
        <Text style={[type.body, { color: colors.textPrimary, fontSize: 15, flex: 1 }]} numberOfLines={1}>
          {item.whiskeyType ?? "Unknown Type"}
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
        {item.proof != null ? (
          <Text style={[type.caption, { color: colors.textMuted }]}>{item.proof} pf</Text>
        ) : null}
        {item.ageMonths != null ? (
          <>
            <Text style={[type.caption, { color: colors.textMuted }]}>·</Text>
            <Text style={[type.caption, { color: colors.textMuted }]}>{ageLabel(item.ageMonths)}</Text>
          </>
        ) : null}
        {item.fillDate ? (
          <>
            <Text style={[type.caption, { color: colors.textMuted }]}>·</Text>
            <Text style={[type.caption, { color: colors.textMuted }]}>
              Filled {new Date(item.fillDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </Text>
          </>
        ) : null}
      </View>
      {item.notes ? (
        <Text style={[type.caption, { color: colors.textSecondary, fontStyle: "italic" }]} numberOfLines={2}>
          {item.notes}
        </Text>
      ) : null}
    </View>
  );
}

export default function DistilleryBarrelsScreen() {
  const [distillery, setDistillery] = useState<{ distillery_id: string; distillery_name: string } | null>(null);
  const [barrels, setBarrels] = useState<OwnerBarrelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const accounts = await getMyDistilleryAccount();
      if (!accounts.length) {
        setDistillery(null);
        setBarrels([]);
        return;
      }
      const account = accounts[0];
      setDistillery(account);
      const items = await fetchOwnerBarrels(account.distillery_id);
      setBarrels(items);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function handleAddBarrel(draft: BarrelDraft) {
    if (!distillery) return;
    const item = await insertOwnerBarrel(distillery.distillery_id, draft);
    setBarrels((prev) => [...prev, item]);
    setAddOpen(false);
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", gap: spacing.sm }}>
        <ActivityIndicator color={colors.accent} />
        <Text style={[type.body, { color: colors.textSecondary }]}>Loading…</Text>
      </View>
    );
  }

  if (!distillery) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.xl, gap: spacing.md }}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, marginBottom: spacing.sm })}>
          <Text style={[type.button, { color: colors.accent }]}>← Back</Text>
        </Pressable>
        <Text style={[type.screenTitle, { color: colors.textPrimary }]}>Barrel Management</Text>
        <Text style={[type.body, { color: colors.textSecondary }]}>
          No distillery account found. Contact support to set up your distillery account.
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}
      >
        {/* Header */}
        <Pressable onPress={() => router.back()} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <Text style={[type.button, { color: colors.accent }]}>← Back</Text>
        </Pressable>

        <View style={{ gap: 4 }}>
          <Text style={[type.labelCaps, { color: colors.accent, fontSize: 9 }]}>Barrel Management</Text>
          <Text style={[type.screenTitle, { color: colors.textPrimary }]}>{distillery.distillery_name}</Text>
          <Text style={[type.caption, { color: colors.textMuted }]}>{barrels.length} barrel{barrels.length !== 1 ? "s" : ""}</Text>
        </View>

        {/* Add Barrel button */}
        <Pressable
          onPress={() => setAddOpen(true)}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.sm,
            paddingVertical: spacing.md,
            borderRadius: 999,
            backgroundColor: colors.accent,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Ionicons name="add" size={18} color={colors.background} />
          <Text style={[type.button, { color: colors.background }]}>Add Barrel</Text>
        </Pressable>

        {error ? (
          <Text style={[type.caption, { color: colors.danger }]}>{error}</Text>
        ) : null}

        {/* Barrel list */}
        {barrels.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.borderStrong,
              ...shadows.card,
              padding: spacing.xl,
              alignItems: "center",
              gap: spacing.sm,
            }}
          >
            <Text style={[type.body, { color: colors.textMuted, textAlign: "center" }]}>
              No barrels yet. Tap Add Barrel to create your first one.
            </Text>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.borderStrong,
              ...shadows.card,
              padding: spacing.lg,
              gap: spacing.md,
            }}
          >
            <Text style={[type.sectionHeader, { color: colors.textPrimary }]}>Barrels</Text>
            <View style={{ height: 1, backgroundColor: colors.divider }} />
            <View style={{ gap: spacing.sm }}>
              {barrels.map((b) => (
                <BarrelRow key={b.id} item={b} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <BarrelFormModal
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAddBarrel}
        submitLabel="Save Barrel"
        fixedDistillery={{ id: distillery.distillery_id, name: distillery.distillery_name }}
      />
    </>
  );
}
