// src/log/components/refine/components/RefineBrowseBody.tsx
import React from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";

import { radii } from "../../../../../lib/radii";
import { spacing } from "../../../../../lib/spacing";
import { colors } from "../../../../../lib/theme";
import { type } from "../../../../../lib/typography";
import { FlavorNode, SectionGroupHeaderProps } from "../types";

export function RefineBrowseBody(props: {
  locked: boolean;

  nodesLoading: boolean;
  nodesError: string | null;
  fetchFlavorNodes: () => void;

  refineSearch: string;
  refinePath: string[];

  visibleNodes: FlavorNode[];
  renderNodeRow: (n: FlavorNode, allowMore: boolean) => React.ReactElement;

  // scoped groups
  scopedRootIds: string[];
  rootLabelById: Map<string, string>;
  byParent: Map<string, FlavorNode[]>;
  applySort: (list: FlavorNode[]) => FlavorNode[];
  isFinishLabel: (label: string) => boolean;

  // top-level groups
  topLevelNodes: FlavorNode[];
  normalizeKey: (s: string) => string;
  safeText: (v: any) => string;
  getTopLevelLabelForNode: (nodeId: string) => string | null;

  SectionGroupHeader: (p: SectionGroupHeaderProps) => React.ReactElement;
  setRefinePath: (updater: (prev: string[]) => string[]) => void;
}) {
  const {
    locked,

    nodesLoading,
    nodesError,
    fetchFlavorNodes,

    refineSearch,
    refinePath,

    visibleNodes,
    renderNodeRow,

    scopedRootIds,
    rootLabelById,
    byParent,
    applySort,
    isFinishLabel,

    topLevelNodes,
    normalizeKey,
    safeText,
    getTopLevelLabelForNode,

    SectionGroupHeader,
    setRefinePath,
  } = props;

  if (nodesLoading) {
    return (
      <View style={{ paddingVertical: spacing.xl, alignItems: "center" }}>
        <ActivityIndicator />
        <Text style={[type.body, { marginTop: spacing.sm, opacity: 0.7 }]}>
          Loading notes…
        </Text>
      </View>
    );
  }

  if (nodesError) {
    return (
      <View style={{ gap: spacing.sm }}>
        <Text style={[type.body, { opacity: 0.85 }]}>
          Couldn’t load refined notes.
        </Text>
        <Text style={[type.microcopyItalic, { opacity: 0.75 }]}>{nodesError}</Text>

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
          <Text style={[type.button, { color: colors.textPrimary }]}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: spacing.xl * 2 + 90 }}
    >
      {refineSearch ? (
        <View style={{ gap: 10 }}>
          {visibleNodes.map((n) => renderNodeRow(n, true))}
          {!visibleNodes.length ? (
            <View style={{ gap: 6, alignItems: "center", paddingTop: spacing.md }}>
              <Text
                style={[
                  type.microcopyItalic,
                  { opacity: 0.75, textAlign: "center" },
                ]}
              >
                No matches.
              </Text>
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
  );
}