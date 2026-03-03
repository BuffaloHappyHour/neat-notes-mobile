// src/log/components/refine/components/RefineHeader.tsx
import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { radii } from "../../../../../lib/radii";
import { shadows } from "../../../../../lib/shadows";
import { spacing } from "../../../../../lib/spacing";
import { colors } from "../../../../../lib/theme";
import { type } from "../../../../../lib/typography";
import { PillProps, RefineSortMode } from "../types";

export function RefineHeader(props: {
  mode: "BROWSE" | "REVIEW";
  locked: boolean;

  // top actions
  onClose: () => void;
  onTopDone: () => void;

  // search
  refineSearch: string;
  setRefineSearch: (v: string) => void;
  resetPath: () => void;

  scopedRootIds: string[];
  selectedCountText: string;

  // options
  optionsOpen: boolean;
  setOptionsOpen: (v: boolean) => void;

  refineSort: RefineSortMode;
  setRefineSort: (v: RefineSortMode) => void;

  Pill: (p: PillProps) => React.ReactElement;

  refineBreadcrumb: string;

  // clear
  canClear: boolean;
  onClearAll: () => void;

  // add family
  showAddFamilyBlock: boolean;
  addFamilyOpen: boolean;
  toggleAddFamilyOpen: () => void;
  addableFamilies: string[];
  addFamilyLabel: (lbl: string) => void;
}) {
  const {
    mode,
    locked,

    onClose,
    onTopDone,

    refineSearch,
    setRefineSearch,
    resetPath,

    scopedRootIds,
    selectedCountText,

    optionsOpen,
    setOptionsOpen,

    refineSort,
    setRefineSort,

    Pill,

    refineBreadcrumb,

    canClear,
    onClearAll,

    showAddFamilyBlock,
    addFamilyOpen,
    toggleAddFamilyOpen,
    addableFamilies,
    addFamilyLabel,
  } = props;

  const headerTopPadding = spacing.xl;

  return (
    <View
      style={{
        paddingTop: headerTopPadding,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
        backgroundColor: colors.background,
        gap: spacing.sm,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.sm,
        }}
      >
        <Pressable
          onPress={onClose}
          disabled={locked}
          style={({ pressed }) => ({
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.divider,
            backgroundColor: pressed ? colors.highlight : "transparent",
            opacity: locked ? 0.6 : 1,
          })}
        >
          <Text style={[type.button, { color: colors.textPrimary }]}>Close</Text>
        </Pressable>

        <Text
          style={[
            type.sectionHeader,
            { marginBottom: 0, textAlign: "center", flex: 1 },
          ]}
          numberOfLines={1}
        >
          {mode === "REVIEW" ? "Review notes" : "Refine notes"}
        </Text>

        <Pressable
          onPress={onTopDone}
          disabled={locked}
          style={({ pressed }) => ({
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.divider,
            backgroundColor: pressed ? colors.highlight : "transparent",
            opacity: locked ? 0.6 : 1,
          })}
        >
          <Text style={[type.button, { color: colors.textPrimary }]}>Done</Text>
        </Pressable>
      </View>

      {mode === "BROWSE" ? (
        <>
          <TextInput
            value={refineSearch}
            onChangeText={(t) => {
              setRefineSearch(t);
              resetPath();
            }}
            placeholder={
              scopedRootIds.length
                ? "Search notes"
                : "Search all notes…"
            }
            placeholderTextColor={colors.textSecondary}
            editable={!locked}
            style={{
              paddingVertical: 12,
              paddingHorizontal: spacing.md,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: colors.divider,
              backgroundColor: "transparent",
              color: colors.textPrimary,
              fontSize: 16,
              fontFamily: type.body.fontFamily,
              opacity: locked ? 0.7 : 1,
            }}
          />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: spacing.sm,
            }}
          >
            <Text style={[type.microcopyItalic, { opacity: 0.8 }]}>
              {selectedCountText}
            </Text>

            <Pressable
              disabled={locked}
              onPress={() => setOptionsOpen(!optionsOpen)}
              style={({ pressed }) => ({
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.divider,
                backgroundColor: pressed ? colors.highlight : "transparent",
                opacity: locked ? 0.6 : 1,
              })}
            >
              <Text style={[type.button, { color: colors.textPrimary }]}>
                {optionsOpen ? "Hide" : "Options"}
              </Text>
            </Pressable>
          </View>

          {optionsOpen ? (
            <View style={{ gap: 10, paddingTop: 2 }}>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <Text style={[type.microcopyItalic, { opacity: 0.75 }]}>
                  Sort:
                </Text>
                <Pill
                  label="Default"
                  active={refineSort === "DEFAULT"}
                  onPress={() => setRefineSort("DEFAULT")}
                  disabled={locked}
                />
                <Pill
                  label="Selected"
                  active={refineSort === "SELECTED"}
                  onPress={() => setRefineSort("SELECTED")}
                  disabled={locked}
                />
                <Pill
                  label="A–Z"
                  active={refineSort === "AZ"}
                  onPress={() => setRefineSort("AZ")}
                  disabled={locked}
                />
              </View>

              {refineBreadcrumb ? (
                <Text style={[type.microcopyItalic, { opacity: 0.75 }]}>
                  {refineBreadcrumb}
                </Text>
              ) : null}

              <Pressable
                disabled={locked || !canClear}
                onPress={onClearAll}
                style={({ pressed }) => ({
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: colors.divider,
                  backgroundColor: pressed ? colors.highlight : "transparent",
                  opacity: locked || !canClear ? 0.45 : 1,
                })}
              >
                <Text style={[type.button, { color: colors.textPrimary }]}>
                  Clear refined notes…
                </Text>
                <Text style={[type.microcopyItalic, { opacity: 0.75 }]}>
                  We’ll ask before deleting everything.
                </Text>
              </Pressable>

              {showAddFamilyBlock ? (
                <View style={{ gap: 8 }}>
                  <Pressable
                    disabled={locked}
                    onPress={toggleAddFamilyOpen}
                    style={({ pressed }) => ({
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: colors.divider,
                      backgroundColor: pressed ? colors.highlight : "transparent",
                      opacity: locked ? 0.6 : 1,
                    })}
                  >
                    <Text style={[type.body, { fontWeight: "900" }]}>
                      Not seeing it? Add another top-level note
                    </Text>
                    <Text style={[type.microcopyItalic, { opacity: 0.75 }]}>
                      Example: caramel is usually under Sweet.
                    </Text>
                  </Pressable>

                  {addFamilyOpen ? (
                    <View
                      style={{
                        borderWidth: 1,
                        borderColor: colors.divider,
                        borderRadius: radii.md,
                        padding: spacing.md,
                        gap: 8,
                        backgroundColor: colors.surface,
                        ...shadows.card,
                      }}
                    >
                      <Text style={[type.microcopyItalic, { opacity: 0.75 }]}>
                        Add a family:
                      </Text>

                      <View
                        style={{
                          flexDirection: "row",
                          flexWrap: "wrap",
                          gap: 8,
                        }}
                      >
                        {addableFamilies.map((lbl) => (
                          <Pill
                            key={lbl}
                            label={lbl}
                            active={false}
                            onPress={() => addFamilyLabel(lbl)}
                            disabled={locked}
                          />
                        ))}
                        {!addableFamilies.length ? (
                          <Text style={[type.microcopyItalic, { opacity: 0.75 }]}>
                            You’ve already added all families.
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}