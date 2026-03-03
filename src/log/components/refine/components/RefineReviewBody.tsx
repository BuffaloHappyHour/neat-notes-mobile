// src/log/components/refine/components/RefineReviewBody.tsx
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { radii } from "../../../../../lib/radii";
import { shadows } from "../../../../../lib/shadows";
import { spacing } from "../../../../../lib/spacing";
import { colors } from "../../../../../lib/theme";
import { type } from "../../../../../lib/typography";
import { ReviewSentiment } from "../types";

type FlavorNode = {
  id: string;
  label: string;
  parent_id: string | null;
};

type Group = {
  l1Id: string;
  l1Label: string;
  nodes: FlavorNode[]; // includes L1 + its selected descendants (L2/L3) that are in review
  selectedCount: number; // count excluding the L1 itself (helps copy)
};

export function RefineReviewBody(props: {
  locked: boolean;
  selectedNodes: FlavorNode[];
  safeText: (v: any) => string;
  sentimentById: Record<string, ReviewSentiment> | undefined;
  setSentiment: (id: string, s: ReviewSentiment) => void;
  byId: Map<string, FlavorNode>;
  onSkip: () => void;
}) {
  const { locked, selectedNodes, safeText, sentimentById, setSentiment, byId, onSkip } = props;

  const safeSentiments: Record<string, ReviewSentiment> = sentimentById ?? {};

  const currentFor = (id: string): ReviewSentiment => safeSentiments[id] ?? "NEUTRAL";

  // Build short breadcrumb "Top → Mid → Leaf"
  function breadcrumbForNode(node: FlavorNode) {
    const parts: string[] = [];
    let cur: FlavorNode | undefined = node;
    let safety = 0;

    while (cur && safety < 10) {
      const lbl = safeText(cur.label);
      if (lbl) parts.push(lbl);
      if (!cur.parent_id) break;
      cur = byId.get(cur.parent_id) as any;
      safety++;
    }

    const rev = parts.reverse();
    if (rev.length <= 1) return "";
    return rev.slice(0, 3).join(" \u2192 ");
  }

  // Find the top-level (L1) ancestor for any node
  function getTopAncestor(n: FlavorNode): FlavorNode | null {
    let cur: FlavorNode | undefined = n;
    let safety = 0;

    while (cur && safety < 10) {
      if (!cur.parent_id) return cur;
      const parent = byId.get(cur.parent_id);
      if (!parent) return cur; // best effort
      cur = parent as any;
      safety++;
    }

    return cur ?? null;
  }

  // Expand upward so L1/L2/L3 can be rated
  const rows = useMemo(() => {
    const list = Array.isArray(selectedNodes) ? selectedNodes : [];
    const out = new Map<string, FlavorNode>();

    const addWithParents = (n: FlavorNode) => {
      let cur: FlavorNode | undefined = n;
      let safety = 0;

      while (cur && safety < 10) {
        const id = safeText(cur.id);
        const label = safeText(cur.label);
        if (!id || !label) break;

        if (!out.has(id)) out.set(id, cur);

        if (!cur.parent_id) break;
        cur = byId.get(cur.parent_id) as any;
        safety++;
      }
    };

    for (const n of list) addWithParents(n);

    const arr = Array.from(out.values());

    const depth = (n: FlavorNode) => {
      let d = 0;
      let cur: FlavorNode | undefined = n;
      let safety = 0;
      while (cur?.parent_id && safety < 10) {
        const parent = byId.get(cur.parent_id);
        if (!parent) break;
        d++;
        cur = parent as any;
        safety++;
      }
      return d;
    };

    return arr.sort((a, b) => {
      const da = depth(a);
      const db = depth(b);
      if (da !== db) return da - db; // L1 first
      return safeText(a.label).toLowerCase().localeCompare(safeText(b.label).toLowerCase());
    });
  }, [selectedNodes, byId, safeText]);

  // Group by L1 (so users can collapse/focus by family)
  const groups = useMemo<Group[]>(() => {
    const byL1 = new Map<string, { l1: FlavorNode; nodes: FlavorNode[]; selectedCount: number }>();

    // Count "original selections" (before parent expansion) per L1 (for copy)
    const selectedCountByL1 = new Map<string, number>();
    for (const n of Array.isArray(selectedNodes) ? selectedNodes : []) {
      const top = getTopAncestor(n);
      const l1Id = top ? safeText(top.id) : "";
      if (!l1Id) continue;
      selectedCountByL1.set(l1Id, (selectedCountByL1.get(l1Id) ?? 0) + 1);
    }

    for (const n of rows) {
      const top = getTopAncestor(n);
      const l1Id = top ? safeText(top.id) : "";
      const l1Label = top ? safeText(top.label) : "";
      if (!l1Id || !l1Label) continue;

      if (!byL1.has(l1Id)) {
        byL1.set(l1Id, {
          l1: top!,
          nodes: [],
          selectedCount: selectedCountByL1.get(l1Id) ?? 0,
        });
      }
      byL1.get(l1Id)!.nodes.push(n);
    }

    // Sort groups by label
    const list = Array.from(byL1.values())
      .map((g) => ({
        l1Id: safeText(g.l1.id),
        l1Label: safeText(g.l1.label),
        nodes: g.nodes,
        selectedCount: g.selectedCount,
      }))
      .filter((g) => g.l1Id && g.l1Label);

    list.sort((a, b) => a.l1Label.toLowerCase().localeCompare(b.l1Label.toLowerCase()));

    // Inside each group: keep L1 first, then alpha
    const isL1 = (g: Group, n: FlavorNode) => safeText(n.id) === g.l1Id;
    for (const g of list) {
      g.nodes = g.nodes
        .slice()
        .sort((a, b) => {
          const aIs = isL1(g, a);
          const bIs = isL1(g, b);
          if (aIs !== bIs) return aIs ? -1 : 1;
          return safeText(a.label).toLowerCase().localeCompare(safeText(b.label).toLowerCase());
        });
    }

    return list;
  }, [rows, selectedNodes, byId, safeText]);

  // Default: expand the first group (or none)
    const [openByL1, setOpenByL1] = useState<Record<string, boolean>>(() => {
    const all: Record<string, boolean> = {};
    for (const g of groups) all[g.l1Id] = true;
    return all;
  });

  const toggleGroup = (l1Id: string) => {
    setOpenByL1((prev) => ({ ...prev, [l1Id]: !prev[l1Id] }));
  };

  const applyAll = (s: ReviewSentiment) => {
    for (const n of rows) {
      const id = safeText(n.id);
      if (!id) continue;
      setSentiment(id, s);
    }
  };

  const BulkPill = (p: { label: string; onPress: () => void }) => {
    return (
      <Pressable
        disabled={locked}
        onPress={p.onPress}
        style={({ pressed }) => ({
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.divider,
          backgroundColor: pressed ? colors.highlight : "transparent",
          opacity: locked ? 0.55 : 1,
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <Text style={[type.button, { color: colors.textPrimary, fontWeight: "800" }]}>{p.label}</Text>
      </Pressable>
    );
  };

  const ChoicePill = (p: { label: string; active: boolean; onPress: () => void; compact?: boolean }) => {
    const padV = p.compact ? 8 : 10;
    const padH = p.compact ? 12 : 14;
    const minW = p.compact ? 76 : 86;

    return (
      <Pressable
        disabled={locked}
        onPress={p.onPress}
        style={({ pressed }) => ({
          paddingVertical: padV,
          paddingHorizontal: padH,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: p.active ? colors.accent : colors.divider,
          backgroundColor: p.active ? colors.accent : "transparent",
          opacity: locked ? 0.55 : pressed ? 0.9 : 1,
          minWidth: minW,
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <Text
          style={[
            type.button,
            {
              color: p.active ? colors.background : colors.textPrimary,
              fontWeight: "800",
              fontSize: p.compact ? 13 : (type.button as any)?.fontSize ?? 14,
            },
          ]}
          numberOfLines={1}
        >
          {p.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* ONE clean intro (no repetition) */}
      <View style={{ marginBottom: spacing.lg }}>
        <Text style={[type.sectionHeader, { fontSize: 26 }]}>Review notes</Text>
        <Text style={[type.microcopyItalic, { opacity: 0.8, marginTop: spacing.xs }]}>
          Mark each as Liked, Neutral, or Disliked (optional).
        </Text>

        {/* Tan underline */}
        <View
          style={{
            width: 140,
            height: 4,
            borderRadius: 999,
            backgroundColor: colors.accent,
            opacity: 0.55,
            marginTop: spacing.sm,
          }}
        />
      </View>

      {/* Bulk actions row */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing.sm,
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: spacing.lg,
        }}
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, alignItems: "center" }}>
          <BulkPill label="Like all" onPress={() => applyAll("LIKE")} />
          <BulkPill label="Neutral all" onPress={() => applyAll("NEUTRAL")} />
          <BulkPill label="Dislike all" onPress={() => applyAll("DISLIKE")} />
        </View>
      </View>

      {/* ✅ Fix “Apply” being cut off */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: spacing.xl * 3 + 140,
        }}
      >
        {rows.length === 0 ? (
          <View style={{ paddingVertical: spacing.xl, alignItems: "center" }}>
            <Text style={[type.microcopyItalic, { opacity: 0.75, textAlign: "center" }]}>
              No refined notes selected yet.
            </Text>
          </View>
        ) : (
          <View style={{ gap: spacing.lg }}>
            {groups.map((g) => {
              const open = !!openByL1[g.l1Id];
              const l1Current = currentFor(g.l1Id);

              return (
                <View key={g.l1Id} style={{ gap: spacing.sm }}>
                  {/* Group header (collapsible) + ✅ L1 rating happens here */}
                  <Pressable
                    disabled={locked}
                    onPress={() => toggleGroup(g.l1Id)}
                    style={({ pressed }) => ({
                      borderRadius: radii.lg,
                      borderWidth: 1,
                      borderColor: colors.divider,
                      backgroundColor: colors.surface,
                      paddingVertical: spacing.md,
                      paddingHorizontal: spacing.md,
                      opacity: locked ? 0.6 : pressed ? 0.92 : 1,
                      ...shadows.card,
                    })}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                        <Ionicons name={open ? "chevron-down" : "chevron-forward"} size={18} color={colors.accent} />
                        <Text style={[type.body, { fontSize: 20, fontWeight: "900" }]} numberOfLines={1}>
                          {g.l1Label}
                        </Text>
                      </View>
                    </View>

                    {/* subtle underline */}
                    <View
                      style={{
                        marginTop: spacing.sm,
                        width: 160,
                        height: 3,
                        borderRadius: 999,
                        backgroundColor: colors.accent,
                        opacity: 0.18,
                      }}
                    />

                    {/* ✅ L1 sentiment controls live on the header (compact) */}
                    <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
                      <ChoicePill
                        label="Liked"
                        active={l1Current === "LIKE"}
                        onPress={() => setSentiment(g.l1Id, "LIKE")}
                        compact
                      />
                      <ChoicePill
                        label="Neutral"
                        active={l1Current === "NEUTRAL"}
                        onPress={() => setSentiment(g.l1Id, "NEUTRAL")}
                        compact
                      />
                      <ChoicePill
                        label="Disliked"
                        active={l1Current === "DISLIKE"}
                        onPress={() => setSentiment(g.l1Id, "DISLIKE")}
                        compact
                      />
                    </View>
                  </Pressable>

                  {open ? (
                    <View style={{ gap: spacing.md }}>
                      {/* ✅ Render ONLY children so L1 doesn’t duplicate as a sub-card */}
                      {g.nodes
                        .filter((n) => safeText(n?.id) !== g.l1Id)
                        .map((n) => {
                          const id = safeText(n?.id);
                          const label = safeText(n?.label);
                          if (!id || !label) return null;

                          const current: ReviewSentiment = safeSentiments[id] ?? "NEUTRAL";
                          const crumb = breadcrumbForNode(n);

                          return (
                            <View
                              key={id}
                              style={{
                                marginLeft: 18,
                                borderRadius: radii.md,
                                borderWidth: 1,
                                borderColor: "rgba(255,255,255,0.06)",
                                backgroundColor: "rgba(255,255,255,0.02)",
                                padding: spacing.sm,
                                gap: 6,
                              }}
                            >
                              {/* left rail */}
                              <View
                                style={{
                                  position: "absolute",
                                  left: 8,
                                  top: 10,
                                  bottom: 10,
                                  width: 2,
                                  borderRadius: 999,
                                  backgroundColor: colors.accent,
                                  opacity: 0.12,
                                }}
                              />

                              <Text style={[type.body, { fontSize: 18, fontWeight: "900", paddingLeft: 12 }]}>
                                {label}
                              </Text>

                              {!!crumb ? (
                                <Text style={[type.microcopyItalic, { opacity: 0.6, paddingLeft: 12 }]}>{crumb}</Text>
                              ) : null}

                              <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm, paddingLeft: 12 }}>
                                <ChoicePill
                                  label="Liked"
                                  active={current === "LIKE"}
                                  onPress={() => setSentiment(id, "LIKE")}
                                  compact
                                />
                                <ChoicePill
                                  label="Neutral"
                                  active={current === "NEUTRAL"}
                                  onPress={() => setSentiment(id, "NEUTRAL")}
                                  compact
                                />
                                <ChoicePill
                                  label="Disliked"
                                  active={current === "DISLIKE"}
                                  onPress={() => setSentiment(id, "DISLIKE")}
                                  compact
                                />
                              </View>
                            </View>
                          );
                        })}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}