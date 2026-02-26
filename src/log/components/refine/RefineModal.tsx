// app/log/components/refine/RefineModal.tsx
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { radii } from "../../../../lib/radii";
import { shadows } from "../../../../lib/shadows";
import { spacing } from "../../../../lib/spacing";
import { colors } from "../../../../lib/theme";
import { type } from "../../../../lib/typography";

type FlavorNode = {
  id: string;
  parent_id: string | null;
  level: number | null;
  family: string | null;
  label: string;
  sort_order: number | null;
  is_active: boolean | null;
  slug: string | null;
};

type RefineSortMode = "DEFAULT" | "SELECTED" | "AZ";

type PillProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
};

type SectionGroupHeaderProps = {
  title: string;
  onBrowse: () => void;
  disabled?: boolean;
};

export function RefineModal(props: {
  visible: boolean;
  locked: boolean;

  // state
  refineSearch: string;
  setRefineSearch: (v: string) => void;

  refinePath: string[];
  setRefinePath: (updater: (prev: string[]) => string[]) => void;

  refineSort: RefineSortMode;
  setRefineSort: (v: RefineSortMode) => void;

  addFamilyOpen: boolean;
  setAddFamilyOpen: (updater: (prev: boolean) => boolean) => void;

  // derived
  scopedRootIds: string[];
  selectedCountText: string;
  refineBreadcrumb: string;

  // actions
  closeRefine: () => void;
  fetchFlavorNodes: () => void;

  // data for "Not seeing it?"
  addableFamilies: string[];
  addFamilyLabel: (lbl: string) => void;

  // render helpers
  Pill: (p: PillProps) => React.ReactElement;
  SectionGroupHeader: (p: SectionGroupHeaderProps) => React.ReactElement;
  renderNodeRow: (n: FlavorNode, allowMore: boolean) => React.ReactElement;

  // data for lists
  nodesLoading: boolean;
  nodesError: string | null;

  visibleNodes: FlavorNode[];

  // grouped browse
  rootLabelById: Map<string, string>;
  byParent: Map<string, FlavorNode[]>;
  applySort: (list: FlavorNode[]) => FlavorNode[];
  isFinishLabel: (label: string) => boolean;

  // full browse fallback
  topLevelNodes: FlavorNode[];
  normalizeKey: (s: string) => string;
  safeText: (v: any) => string;

  // ✅ Correct signature (engine provides a closure)
  getTopLevelLabelForNode: (nodeId: string) => string | null;

  byId: Map<string, FlavorNode>;

  // selection
  selectedNodeIds: string[];
  setSelectedNodeIds: (ids: string[]) => void;
}) {
  const {
    visible,
    locked,

    refineSearch,
    setRefineSearch,

    refinePath,
    setRefinePath,

    refineSort,
    setRefineSort,

    addFamilyOpen,
    setAddFamilyOpen,

    scopedRootIds,
    selectedCountText,
    refineBreadcrumb,

    closeRefine,
    fetchFlavorNodes,

    addableFamilies,
    addFamilyLabel,

    Pill,
    SectionGroupHeader,
    renderNodeRow,

    nodesLoading,
    nodesError,

    visibleNodes,

    rootLabelById,
    byParent,
    applySort,
    isFinishLabel,

    topLevelNodes,
    normalizeKey,
    safeText,
    getTopLevelLabelForNode,

    selectedNodeIds,
    setSelectedNodeIds,
  } = props;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => closeRefine()}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={{
            paddingTop: spacing.lg,
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.md,
            gap: spacing.xs,
            borderBottomWidth: 1,
            borderBottomColor: colors.divider,
            backgroundColor: colors.background,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={[type.sectionHeader, { marginBottom: 0 }]}>
              Refine flavor notes
            </Text>

            <Pressable
              onPress={() => closeRefine()}
              style={({ pressed }) => ({
                paddingVertical: 20,
                paddingHorizontal: 14,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.divider,
                backgroundColor: pressed ? colors.highlight : "transparent",
              })}
            >
              <Text style={[type.button, { color: colors.textPrimary }]}>
                Done
              </Text>
            </Pressable>
          </View>

          <Text style={[type.microcopyItalic, { opacity: 0.8 }]}>
            Advanced is optional — explore deeper if you’d like.
          </Text>

          <TextInput
            value={refineSearch}
            onChangeText={(t) => {
              setRefineSearch(t);
              setRefinePath(() => []);
            }}
            placeholder={
              scopedRootIds.length
                ? "Search within your selected notes…"
                : "Search notes…"
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

          {/* Controls */}
          <View style={{ gap: 8 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Pressable
                disabled={locked || (!refinePath.length && !refineSearch)}
                onPress={() => {
                  if (refineSearch) {
                    setRefineSearch("");
                    return;
                  }
                  setRefinePath((p) => p.slice(0, -1));
                }}
                style={({ pressed }) => ({
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: colors.divider,
                  backgroundColor: pressed ? colors.highlight : "transparent",
                  opacity:
                    locked || (!refinePath.length && !refineSearch) ? 0.4 : 1,
                })}
              >
                <Text style={[type.button, { color: colors.textPrimary }]}>
                  {refineSearch ? "Clear search" : "Back"}
                </Text>
              </Pressable>

              <Text style={[type.microcopyItalic, { opacity: 0.8 }]}>
                {selectedCountText}
              </Text>
            </View>

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

            <Text style={[type.microcopyItalic, { opacity: 0.75 }]}>
              {refineBreadcrumb}
            </Text>

            {/* Not seeing it? */}
            {scopedRootIds.length > 0 ? (
              <View style={{ gap: 8 }}>
                <Pressable
                  disabled={locked}
                  onPress={() => setAddFamilyOpen((v) => !v)}
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
        </View>

        {/* Body */}
        <View
          style={{
            flex: 1,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
          }}
        >
          {nodesLoading ? (
            <View style={{ paddingVertical: spacing.xl, alignItems: "center" }}>
              <ActivityIndicator />
              <Text style={[type.body, { marginTop: spacing.sm, opacity: 0.7 }]}>
                Loading notes…
              </Text>
            </View>
          ) : nodesError ? (
            <View style={{ gap: spacing.sm }}>
              <Text style={[type.body, { opacity: 0.85 }]}>
                Couldn’t load refined notes.
              </Text>
              <Text style={[type.microcopyItalic, { opacity: 0.75 }]}>
                {nodesError}
              </Text>

              <Pressable
                disabled={locked}
                onPress={() => fetchFlavorNodes()}
                style={({ pressed }) => ({
                  paddingVertical: 11,
                  paddingHorizontal: 12,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: colors.divider,
                  backgroundColor: pressed ? colors.highlight : "transparent",
                  opacity: locked ? 0.6 : 1,
                  alignItems: "center",
                  justifyContent: "center",
                })}
              >
                <Text style={[type.button, { color: colors.textPrimary }]}>
                  Retry
                </Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: spacing.xl * 2 }}
            >
              {refineSearch ? (
                <View style={{ gap: 10 }}>
                  {visibleNodes.map((n) => renderNodeRow(n, true))}
                  {!visibleNodes.length ? (
                    <View
                      style={{
                        gap: 6,
                        alignItems: "center",
                        paddingTop: spacing.md,
                      }}
                    >
                      <Text
                        style={[
                          type.microcopyItalic,
                          { opacity: 0.75, textAlign: "center" },
                        ]}
                      >
                        No matches
                        {scopedRootIds.length ? " in your selected notes" : ""}.
                      </Text>
                      {scopedRootIds.length ? (
                        <Text
                          style={[
                            type.microcopyItalic,
                            { opacity: 0.75, textAlign: "center" },
                          ]}
                        >
                          Try adding another top-level note (e.g., Sweet for
                          caramel).
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ) : (
                <>
                  {refinePath.length ? (
                    <View style={{ gap: 10 }}>
                      {visibleNodes.map((n) => renderNodeRow(n, true))}
                      {!visibleNodes.length ? (
                        <Text
                          style={[
                            type.microcopyItalic,
                            { opacity: 0.75, textAlign: "center" },
                          ]}
                        >
                          Nothing here yet.
                        </Text>
                      ) : null}
                    </View>
                  ) : (
                    <>
                      {scopedRootIds.length ? (
                        <View style={{ gap: spacing.xl }}>
                          {scopedRootIds.map((rootId) => {
                            const title = safeText(rootLabelById.get(rootId) ?? "");
                            const children = (byParent.get(rootId) ?? []).filter(
                              (n) => !isFinishLabel(n.label)
                            );
                            const list = applySort(children);
                            if (!title || !list.length) return null;

                            return (
                              <View key={rootId} style={{ gap: 10 }}>
                                <SectionGroupHeader
                                  title={title}
                                  disabled={locked}
                                  onBrowse={() => setRefinePath(() => [rootId])}
                                />
                                {list.map((n) => (
                                  <React.Fragment key={n.id}>
                                    {renderNodeRow(n, true)}
                                  </React.Fragment>
                                ))}
                              </View>
                            );
                          })}
                        </View>
                      ) : (
                        <View style={{ gap: spacing.xl }}>
                          {applySort(topLevelNodes)
                            .filter(
                              (root) =>
                                !isFinishLabel(root.label) &&
                                normalizeKey(root.label) !== "dislikes"
                            )
                            .map((root) => {
                              const title = safeText(root.label);

                              const children = (byParent.get(root.id) ?? [])
                                .filter((n) => !isFinishLabel(n.label))
                                .filter(
                                  (n) =>
                                    normalizeKey(
                                      safeText(getTopLevelLabelForNode(n.id) ?? "")
                                    ) !== "dislikes"
                                );

                              const list = applySort(children).slice(0, 4);
                              if (!title) return null;

                              return (
                                <View key={root.id} style={{ gap: 10 }}>
                                  <SectionGroupHeader
                                    title={title}
                                    disabled={locked}
                                    onBrowse={() => setRefinePath(() => [root.id])}
                                  />

                                  {list.length ? (
                                    list.map((n) => (
                                      <React.Fragment key={n.id}>
                                        {renderNodeRow(n, true)}
                                      </React.Fragment>
                                    ))
                                  ) : (
                                    <Text
                                      style={[
                                        type.microcopyItalic,
                                        { opacity: 0.7, textAlign: "center" },
                                      ]}
                                    >
                                      Nothing here yet.
                                    </Text>
                                  )}
                                </View>
                              );
                            })}
                        </View>
                      )}
                    </>
                  )}
                </>
              )}
            </ScrollView>
          )}
        </View>

        {/* Footer */}
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: spacing.lg + 40,
            borderTopWidth: 1,
            borderTopColor: colors.divider,
            backgroundColor: colors.background,
          }}
        >
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <Pressable
              disabled={locked || selectedNodeIds.length === 0}
              onPress={() => setSelectedNodeIds([])}
              style={({ pressed }) => ({
                flex: 1,
                borderRadius: radii.md,
                paddingVertical: spacing.lg,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: colors.divider,
                backgroundColor: "transparent",
                opacity:
                  locked || selectedNodeIds.length === 0
                    ? 0.45
                    : pressed
                    ? 0.9
                    : 1,
              })}
            >
              <Text style={[type.button, { color: colors.textPrimary, textAlign: "center" }]}>
                Clear
              </Text>
            </Pressable>

            <Pressable
              disabled={locked}
              onPress={closeRefine}
              style={({ pressed }) => ({
                flex: 1,
                borderRadius: radii.md,
                paddingVertical: spacing.lg,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.accent,
                opacity: locked ? 0.6 : pressed ? 0.92 : 1,
              })}
            >
              <Text style={[type.button, { color: colors.background, textAlign: "center" }]}>
                Done
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}