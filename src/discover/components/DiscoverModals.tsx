// src/discover/components/DiscoverModals.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  AppState,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { radii } from "../../../lib/radii";
import { shadows } from "../../../lib/shadows";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

import type { WhiskeyCardRow } from "../services/discover.service";
import { WhiskeyTile } from "./WhiskeyTile";

type WrapFn = <T extends any[]>(
  fn: (...args: T) => void | Promise<void>
) => (...args: T) => Promise<void>;

export function DiscoverModals({
  sheetMaxHeight,
  sheetPaddingBottom,
  windowH,

  seeAllOpen,
  setSeeAllOpen,
  seeAllTitle,
  seeAllRows,
  seeAllLoading,
  seeAllError,
  onPressSeeAllRow,

  filterOpen,
  setFilterOpen,
  typePickerOpen,
  setTypePickerOpen,

  selectedType,
  setSelectedType,
  allTypes,

  minProofText,
  setMinProofText,
  maxProofText,
  setMaxProofText,

  resetFilters,
  normalizeProofBoundsAndCloseFilters,

  withTick,
  withSuccess,
}: {
  sheetMaxHeight: number;
  sheetPaddingBottom: number;
  windowH: number;

  seeAllOpen: boolean;
  setSeeAllOpen: (v: boolean) => void;
  seeAllTitle: string;
  seeAllRows: WhiskeyCardRow[];
  seeAllLoading: boolean;
  seeAllError: string;
  onPressSeeAllRow: (r: WhiskeyCardRow) => void;

  filterOpen: boolean;
  setFilterOpen: (v: boolean) => void;

  typePickerOpen: boolean;
  setTypePickerOpen: (v: boolean) => void;

  selectedType: string | null;
  setSelectedType: (v: string | null) => void;
  allTypes: string[];

  minProofText: string;
  setMinProofText: (v: string) => void;
  maxProofText: string;
  setMaxProofText: (v: string) => void;

  resetFilters: () => void;
  normalizeProofBoundsAndCloseFilters: () => void;

  withTick: WrapFn;
  withSuccess: WrapFn;
}) {
  const sheetStyle = {
    backgroundColor: colors.glassSurface ?? colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: spacing.lg,
    paddingBottom: sheetPaddingBottom,
    borderWidth: 1,
    borderColor: colors.glassBorder ?? colors.divider,
    ...shadows.card,
    gap: spacing.lg as number,
    maxHeight: Math.min(sheetMaxHeight, Math.round(windowH * 0.86)),
  } as const;

  const styles = StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.overlay ?? "rgba(0,0,0,0.55)",
      justifyContent: "flex-end",
    },
    backdropCloser: {
      ...StyleSheet.absoluteFillObject,
    },
  });

  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.glassBorder ?? colors.divider,
    borderRadius: radii.md,
    padding: 12,
    backgroundColor: "transparent",
    color: colors.textPrimary,
    fontFamily: type.body.fontFamily,
  } as const;

  React.useEffect(() => {
  const sub = AppState.addEventListener("change", (s) => {
    if (s === "active") {
      setSeeAllOpen(false);
      setFilterOpen(false);
      setTypePickerOpen(false);
    }
  });
  return () => sub.remove();
}, [setSeeAllOpen, setFilterOpen, setTypePickerOpen]);

  return (
    <>
      {/* =======================
          View All Modal
         ======================= */}
      <Modal
        visible={seeAllOpen}
        transparent
        presentationStyle="overFullScreen"
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setSeeAllOpen(false)}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={styles.backdropCloser}
            onPress={withTick(() => setSeeAllOpen(false))}
          />

          <Pressable onPress={() => {}} style={sheetStyle}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={type.sectionHeader}>{seeAllTitle}</Text>

              <Pressable
                onPress={withTick(() => setSeeAllOpen(false))}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text style={[type.body, { fontWeight: "900", color: colors.accent }]}>
                  Close
                </Text>
              </Pressable>
            </View>

            {seeAllLoading ? (
              <Text style={[type.body, { opacity: 0.75 }]}>Loading…</Text>
            ) : null}

            {seeAllError ? (
              <Text style={[type.body, { opacity: 0.82 }]}>Error: {seeAllError}</Text>
            ) : null}

            <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
              <View style={{ gap: spacing.md }}>
                {seeAllRows.map((r) => (
                  <WhiskeyTile
                    key={`seeall:${r.whiskeyId}`}
                    row={r}
                    onPress={withTick(() => onPressSeeAllRow(r))}
                  />
                ))}

                {!seeAllLoading && seeAllRows.length === 0 && !seeAllError ? (
                  <Text style={[type.body, { opacity: 0.75 }]}>No results yet.</Text>
                ) : null}
              </View>
            </ScrollView>
          </Pressable>
        </View>
      </Modal>

      {/* =======================
          Filters Modal
         ======================= */}
      <Modal
        visible={filterOpen}
        transparent
        presentationStyle="overFullScreen"
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setFilterOpen(false)}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={styles.backdropCloser}
            onPress={withTick(() => setFilterOpen(false))}
          />

          <Pressable onPress={() => {}} style={sheetStyle}>
            <Text style={type.sectionHeader}>Filters</Text>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: spacing.lg }}
              showsVerticalScrollIndicator={false}
            >
              {/* Type dropdown */}
              <View style={{ gap: spacing.sm }}>
                <Text style={[type.body, { fontWeight: "900" }]}>Type</Text>

                <Pressable
                  onPress={withTick(() => setTypePickerOpen(true))}
                  style={({ pressed }) => ({
                    borderWidth: 1,
                    borderColor: pressed
                      ? colors.glassBorderStrong ?? colors.divider
                      : colors.glassBorder ?? colors.divider,
                    borderRadius: radii.md,
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    backgroundColor: pressed ? (colors.highlight ?? "rgba(255,255,255,0.06)") : "transparent",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  })}
                >
                  <Text style={[type.body, { opacity: 0.92 }]}>
                    {selectedType ?? "All Types"}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={colors.textPrimary} />
                </Pressable>
              </View>

              {/* Proof Range */}
              <View style={{ gap: spacing.sm }}>
                <Text style={[type.body, { fontWeight: "900" }]}>Proof</Text>

                <View style={{ flexDirection: "row", gap: spacing.md }}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={[type.body, { opacity: 0.74, fontSize: 12 }]}>Min</Text>
                    <TextInput
                      value={minProofText}
                      onChangeText={(t) => setMinProofText(t.replace(/[^\d.]/g, ""))}
                      placeholder="e.g. 80"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                      style={inputStyle}
                    />
                  </View>

                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={[type.body, { opacity: 0.74, fontSize: 12 }]}>Max</Text>
                    <TextInput
                      value={maxProofText}
                      onChangeText={(t) => setMaxProofText(t.replace(/[^\d.]/g, ""))}
                      placeholder="e.g. 120"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                      style={inputStyle}
                    />
                  </View>
                </View>

                <Text style={[type.body, { opacity: 0.68, fontSize: 12 }]}>
                  Tip: Leave blank for no min/max.
                </Text>
              </View>

              {/* Actions */}
              <View style={{ flexDirection: "row", gap: spacing.md }}>
                <Pressable
                  onPress={withTick(() => resetFilters())}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: spacing.lg,
                    borderRadius: radii.md,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: colors.glassBorder ?? colors.divider,
                    backgroundColor: pressed ? (colors.highlight ?? "rgba(255,255,255,0.06)") : (colors.glassSurface ?? colors.surface),
                  })}
                >
                  <Text style={type.button}>Reset</Text>
                </Pressable>

                <Pressable
                  onPress={withSuccess(() => normalizeProofBoundsAndCloseFilters())}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: spacing.lg,
                    borderRadius: radii.md,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: colors.glassBorder ?? colors.divider,
                    backgroundColor: pressed ? (colors.accentPressed ?? colors.accent) : colors.accent,
                  })}
                >
                  <Text style={[type.button, { color: colors.background }]}>Done</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </View>
      </Modal>

      {/* =======================
          Type Picker Modal
         ======================= */}
      <Modal
        visible={typePickerOpen}
        transparent
        presentationStyle="overFullScreen"
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setTypePickerOpen(false)}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={styles.backdropCloser}
            onPress={withTick(() => setTypePickerOpen(false))}
          />

          <Pressable
            onPress={() => {}}
            style={{
              ...sheetStyle,
              maxHeight: Math.min(sheetMaxHeight, Math.round(windowH * 0.78)),
            }}
          >
            <Text style={type.sectionHeader}>Select Type</Text>

            <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
              <View style={{ gap: 10 }}>
                <Pressable
                  onPress={withTick(() => {
                    setSelectedType(null);
                    setTypePickerOpen(false);
                  })}
                  style={({ pressed }) => ({
                    paddingVertical: 12,
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: colors.glassBorder ?? colors.divider,
                    backgroundColor: !selectedType
                      ? colors.accent
                      : pressed
                      ? (colors.highlight ?? "rgba(255,255,255,0.06)")
                      : "transparent",
                    paddingHorizontal: 12,
                  })}
                >
                  <Text
                    style={[
                      type.body,
                      { color: !selectedType ? colors.background : colors.textPrimary },
                    ]}
                  >
                    All Types
                  </Text>
                </Pressable>

                {allTypes.map((t) => {
                  const active = selectedType === t;
                  return (
                    <Pressable
                      key={t}
                      onPress={withTick(() => {
                        setSelectedType(t);
                        setTypePickerOpen(false);
                      })}
                      style={({ pressed }) => ({
                        paddingVertical: 12,
                        borderRadius: radii.md,
                        borderWidth: 1,
                        borderColor: colors.glassBorder ?? colors.divider,
                        backgroundColor: active
                          ? colors.accent
                          : pressed
                          ? (colors.highlight ?? "rgba(255,255,255,0.06)")
                          : "transparent",
                        paddingHorizontal: 12,
                      })}
                    >
                      <Text
                        style={[
                          type.body,
                          { color: active ? colors.background : colors.textPrimary },
                        ]}
                      >
                        {t}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}