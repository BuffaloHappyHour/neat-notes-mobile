// src/discover/components/DiscoverModals.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { radii } from "../../../lib/radii";
import { shadows } from "../../../lib/shadows";
import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

import type { WhiskeyCardRow } from "../services/discover.service";
import { WhiskeyTile } from "./WhiskeyTile";

// ✅ matches your haptics wrappers:
// (fn) => (...args) => Promise<void>
type WrapFn = <T extends any[]>(
  fn: (...args: T) => void | Promise<void>
) => (...args: T) => Promise<void>;

export function DiscoverModals({
  // sizing
  sheetMaxHeight,
  sheetPaddingBottom,
  windowH,

  // view all
  seeAllOpen,
  setSeeAllOpen,
  seeAllTitle,
  seeAllRows,
  seeAllLoading,
  seeAllError,
  onPressSeeAllRow,

  // filters
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

  // haptics wrappers
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
  const sheetStyle = useMemo(() => {
    const warmShadow = {
      ...(shadows.e3 ?? shadows.card),
      shadowColor: (colors as any).shadowWarm ?? (colors as any).shadow ?? "#000",
      shadowOpacity: 0.55,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 12 },
      elevation: 12,
    };

    return {
      backgroundColor: (colors as any).glassRaised ?? (colors as any).glassSurface ?? colors.surface,
      borderTopLeftRadius: (radii as any).xxl ?? 24,
      borderTopRightRadius: (radii as any).xxl ?? 24,

      padding: spacing.lg,
      paddingBottom: sheetPaddingBottom,

      borderWidth: 1,
      borderColor: (colors as any).glassBorderStrong ?? (colors as any).glassBorder ?? colors.divider,

      ...warmShadow,

      gap: spacing.lg as number,

      maxHeight: Math.min(sheetMaxHeight, Math.round(windowH * 0.86)),
    } as const;
  }, [sheetMaxHeight, sheetPaddingBottom, windowH]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          backgroundColor: (colors as any).overlay ?? "rgba(0,0,0,0.55)",
          justifyContent: "flex-end",
        },
        backdropCloser: {
          ...StyleSheet.absoluteFillObject,
        },

        // subtle “glass wash” layer inside the sheet (visual only)
        sheetWash: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: (colors as any).glassSunken ?? "transparent",
          opacity: 0.18,
          borderTopLeftRadius: (radii as any).xxl ?? 24,
          borderTopRightRadius: (radii as any).xxl ?? 24,
        },

        sectionDivider: {
          height: 1,
          backgroundColor: (colors as any).glassDivider ?? colors.divider,
          opacity: 0.85,
        },

        input: {
          borderWidth: 1,
          borderColor: (colors as any).glassBorder ?? colors.divider,
          borderRadius: radii.md,
          padding: 12,
          backgroundColor: "transparent",
          color: colors.textPrimary,
          fontFamily: type.body.fontFamily,
        },
      }),
    []
  );

  // ✅ iOS hardening: only mount modals when open.
  // This prevents “ghost overlays” that can steal touches on iOS.
  return (
    <>
      {/* =======================
          View All Modal
         ======================= */}
      {seeAllOpen ? (
        <Modal
          visible
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
              <View pointerEvents="none" style={styles.sheetWash} />

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: spacing.md,
                }}
              >
                <Text style={type.sectionHeader}>{seeAllTitle}</Text>

                <Pressable
                  onPress={withTick(() => setSeeAllOpen(false))}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Text
                    style={[
                      type.body,
                      { fontWeight: "900", color: colors.accent },
                    ]}
                  >
                    Close
                  </Text>
                </Pressable>
              </View>

              <View style={styles.sectionDivider} />

              {seeAllLoading ? (
                <Text style={[type.microcopyItalic, { opacity: 0.78 }]}>
                  Loading…
                </Text>
              ) : null}

              {seeAllError ? (
                <Text style={[type.caption, { opacity: 0.7 }]}>
                  {seeAllError}
                </Text>
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
                    <Text style={[type.microcopyItalic, { opacity: 0.78 }]}>
                      No results yet.
                    </Text>
                  ) : null}
                </View>
              </ScrollView>
            </Pressable>
          </View>
        </Modal>
      ) : null}

      {/* =======================
          Filters Modal
         ======================= */}
      {filterOpen ? (
        <Modal
          visible
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
              <View pointerEvents="none" style={styles.sheetWash} />

              <Text style={type.sectionHeader}>Filters</Text>
              <View style={styles.sectionDivider} />

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
                      borderColor: (colors as any).glassBorder ?? colors.divider,
                      borderRadius: radii.md,
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      backgroundColor: pressed
                        ? ((colors as any).glassSunken ?? colors.highlight)
                        : "transparent",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    })}
                  >
                    <Text style={[type.body, { opacity: 0.92 }]}>
                      {selectedType ?? "All Types"}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={16}
                      color={colors.textPrimary}
                    />
                  </Pressable>
                </View>

                {/* Proof Range */}
                <View style={{ gap: spacing.sm }}>
                  <Text style={[type.body, { fontWeight: "900" }]}>Proof</Text>

                  <View style={{ flexDirection: "row", gap: spacing.md }}>
                    <View style={{ flex: 1, gap: 6 }}>
                      <Text style={[type.caption, { opacity: 0.85 }]}>Min</Text>
                      <TextInput
                        value={minProofText}
                        onChangeText={(t) =>
                          setMinProofText(t.replace(/[^\d.]/g, ""))
                        }
                        placeholder="e.g. 80"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                        style={styles.input}
                      />
                    </View>

                    <View style={{ flex: 1, gap: 6 }}>
                      <Text style={[type.caption, { opacity: 0.85 }]}>Max</Text>
                      <TextInput
                        value={maxProofText}
                        onChangeText={(t) =>
                          setMaxProofText(t.replace(/[^\d.]/g, ""))
                        }
                        placeholder="e.g. 120"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                        style={styles.input}
                      />
                    </View>
                  </View>

                  <Text style={[type.caption, { opacity: 0.72 }]}>
                    Leave blank for no min/max.
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
                      borderColor: (colors as any).glassBorder ?? colors.divider,
                      backgroundColor: pressed
                        ? ((colors as any).glassSunken ?? colors.highlight)
                        : ((colors as any).glassRaised ??
                            (colors as any).glassSurface ??
                            colors.surface),
                      opacity: pressed ? 0.96 : 1,
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
                      borderColor: (colors as any).glassBorder ?? colors.divider,
                      backgroundColor: colors.accent,
                      opacity: pressed ? 0.92 : 1,
                    })}
                  >
                    <Text style={[type.button, { color: colors.background }]}>
                      Done
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>
            </Pressable>
          </View>
        </Modal>
      ) : null}

      {/* =======================
          Type Picker Modal
         ======================= */}
      {typePickerOpen ? (
        <Modal
          visible
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
              <View pointerEvents="none" style={styles.sheetWash} />

              <Text style={type.sectionHeader}>Select Type</Text>
              <View style={styles.sectionDivider} />

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
                      borderColor: (colors as any).glassBorder ?? colors.divider,
                      backgroundColor: !selectedType
                        ? colors.accent
                        : pressed
                        ? ((colors as any).glassSunken ?? colors.highlight)
                        : "transparent",
                      paddingHorizontal: 12,
                      opacity: pressed ? 0.96 : 1,
                    })}
                  >
                    <Text
                      style={[
                        type.body,
                        {
                          color: !selectedType
                            ? colors.background
                            : colors.textPrimary,
                        },
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
                          borderColor: (colors as any).glassBorder ?? colors.divider,
                          backgroundColor: active
                            ? colors.accent
                            : pressed
                            ? ((colors as any).glassSunken ?? colors.highlight)
                            : "transparent",
                          paddingHorizontal: 12,
                          opacity: pressed ? 0.96 : 1,
                        })}
                      >
                        <Text
                          style={[
                            type.body,
                            {
                              color: active ? colors.background : colors.textPrimary,
                            },
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
      ) : null}
    </>
  );
}