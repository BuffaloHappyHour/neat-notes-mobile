import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { radii } from "../../../lib/radii";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";
import {
  getDistilleryBarrelsForEvent,
  type BarrelDraft,
  type DistilleryBarrelPickerItem,
} from "../../../lib/barrelApi";

type Props = {
  visible: boolean;
  onClose: () => void;
  distilleryId: string;
  distilleryName: string;
  onSelect: (draft: BarrelDraft) => void;
};

function formatAge(ageMonths: number | null): string | null {
  if (ageMonths == null) return null;
  const years = Math.floor(ageMonths / 12);
  const months = ageMonths % 12;
  if (years === 0) return `${months} mo`;
  if (months === 0) return `${years} yr`;
  return `${years} yr ${months} mo`;
}

export function DistilleryBarrelPickerModal({
  visible,
  onClose,
  distilleryId,
  distilleryName,
  onSelect,
}: Props) {
  const [barrels, setBarrels] = useState<DistilleryBarrelPickerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible || !distilleryId) return;
    let alive = true;
    setLoading(true);
    setError("");
    getDistilleryBarrelsForEvent(distilleryId)
      .then((rows) => { if (alive) { setBarrels(rows); setLoading(false); } })
      .catch((e: any) => {
        if (alive) { setError(String(e?.message ?? "Failed to load barrels")); setLoading(false); }
      });
    return () => { alive = false; };
  }, [visible, distilleryId]);

  function handleSelect(barrel: DistilleryBarrelPickerItem) {
    const draft: BarrelDraft = {
      distilleryId,
      distilleryCandidateId: null,
      distilleryName,
      barrelNumber: barrel.barrelNumber,
      whiskeyTypeId: barrel.whiskeyTypeId,
      whiskeyTypeName: barrel.whiskeyType,
      proof: barrel.proof,
      ageMonths: barrel.ageMonths,
      mashBill: barrel.mashBill,
      pairingNote: "",
      existingBarrelId: barrel.id,
    };
    onSelect(draft);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            paddingTop: spacing.xl,
            borderBottomWidth: 1,
            borderBottomColor: colors.divider,
          }}
        >
          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text style={[type.button, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
          <View style={{ alignItems: "center", gap: 2 }}>
            <Text style={[type.sectionHeader, { color: colors.textPrimary }]}>
              Select Barrel
            </Text>
            <Text style={[type.caption, { color: colors.accent }]} numberOfLines={1}>
              {distilleryName}
            </Text>
          </View>
          {/* spacer to centre the title */}
          <View style={{ width: 52 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: spacing.lg,
            gap: spacing.sm,
            paddingBottom: spacing.xl * 4,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <View style={{ paddingVertical: spacing.xl * 2, alignItems: "center", gap: spacing.sm }}>
              <ActivityIndicator color={colors.accent} />
              <Text style={[type.caption, { color: colors.textSecondary }]}>
                Loading barrels…
              </Text>
            </View>
          ) : error ? (
            <View style={{ paddingVertical: spacing.xl, gap: spacing.sm }}>
              <Text style={[type.body, { color: colors.danger }]}>{error}</Text>
              <Pressable
                onPress={() => {
                  setLoading(true);
                  setError("");
                  getDistilleryBarrelsForEvent(distilleryId)
                    .then(setBarrels)
                    .catch((e: any) => setError(String(e?.message ?? "Failed to load barrels")))
                    .finally(() => setLoading(false));
                }}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text style={[type.button, { color: colors.accent }]}>Retry</Text>
              </Pressable>
            </View>
          ) : barrels.length === 0 ? (
            <View style={{ paddingVertical: spacing.xl * 2, alignItems: "center", gap: spacing.sm }}>
              <Ionicons name="cube-outline" size={36} color={colors.textMuted} />
              <Text style={[type.body, { color: colors.textSecondary, textAlign: "center" }]}>
                No active barrels found for {distilleryName}.
              </Text>
              <Text style={[type.caption, { color: colors.textMuted, textAlign: "center" }]}>
                Use "Add custom barrel" to enter barrel details manually.
              </Text>
            </View>
          ) : (
            barrels.map((barrel) => {
              const meta = [
                barrel.whiskeyType,
                barrel.proof != null ? `${barrel.proof} proof` : null,
                formatAge(barrel.ageMonths),
              ]
                .filter(Boolean)
                .join(" · ");

              return (
                <Pressable
                  key={barrel.id}
                  onPress={() => handleSelect(barrel)}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? colors.accentSoft : colors.surface,
                    borderRadius: radii.lg,
                    borderWidth: 1,
                    borderColor: pressed ? colors.accent : colors.borderStrong,
                    padding: spacing.md,
                    gap: spacing.xs,
                    flexDirection: "row",
                    alignItems: "center",
                  })}
                >
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text
                      style={[
                        type.sectionHeader,
                        { color: colors.textPrimary, fontSize: 15, lineHeight: 20 },
                      ]}
                      numberOfLines={1}
                    >
                      Barrel #{barrel.barrelNumber}
                    </Text>
                    <View
                      style={{ flexDirection: "row", gap: spacing.xs, flexWrap: "wrap", alignItems: "center" }}
                    >
                      {barrel.whiskeyType ? (
                        <View
                          style={{
                            backgroundColor: colors.accentSoft,
                            borderRadius: 4,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                          }}
                        >
                          <Text
                            style={[type.labelCaps, { fontSize: 9, color: colors.accent }]}
                          >
                            {barrel.whiskeyType}
                          </Text>
                        </View>
                      ) : null}
                      {barrel.proof != null ? (
                        <Text style={[type.caption, { color: colors.textMuted }]}>
                          {barrel.proof} proof
                        </Text>
                      ) : null}
                      {formatAge(barrel.ageMonths) ? (
                        <Text style={[type.caption, { color: colors.textMuted }]}>
                          {formatAge(barrel.ageMonths)}
                        </Text>
                      ) : null}
                    </View>
                    {barrel.mashBill ? (
                      <Text
                        style={[type.microcopyItalic, { color: colors.textSecondary }]}
                        numberOfLines={1}
                      >
                        {barrel.mashBill}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
