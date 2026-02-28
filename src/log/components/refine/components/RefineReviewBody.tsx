// src/log/components/refine/components/RefineReviewBody.tsx
import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

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

export function RefineReviewBody(props: {
  locked: boolean;
  selectedNodes: FlavorNode[];
  safeText: (v: any) => string;
  sentimentById: Record<string, ReviewSentiment> | undefined;
  setSentiment: (id: string, s: ReviewSentiment) => void;
  byId: Map<string, FlavorNode>;
  onSkip: () => void;
}) {
  const {
    locked,
    selectedNodes,
    safeText,
    sentimentById,
    setSentiment,
    byId,
    onSkip,
  } = props;

  const safeSentiments: Record<string, ReviewSentiment> = sentimentById ?? {};

  const rows = useMemo(() => {
    const list = Array.isArray(selectedNodes) ? selectedNodes : [];
    // stable alphabetical just for review readability
    return list
      .slice()
      .sort((a, b) => safeText(a?.label).toLowerCase().localeCompare(safeText(b?.label).toLowerCase()));
  }, [selectedNodes, safeText]);

  function breadcrumbForNode(node: FlavorNode) {
    // Build "Top -> Mid -> Leaf" but keep it short
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
    return rev.slice(0, 3).join(" \u2192 "); // →
  }

  const Pill = (p: {
    label: string;
    active: boolean;
    onPress: () => void;
    danger?: boolean;
  }) => {
    return (
      <Pressable
        disabled={locked}
        onPress={p.onPress}
        style={({ pressed }) => ({
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: p.active ? colors.accent : colors.divider,
          backgroundColor: p.active ? colors.accent : "transparent",
          opacity: locked ? 0.55 : pressed ? 0.9 : 1,
          minWidth: 88,
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
            },
          ]}
        >
          {p.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Intro */}
      <Text style={[type.microcopyItalic, { opacity: 0.8, marginBottom: spacing.md }]}>
        Mark each note as liked or disliked (optional). This helps your palate learn.
      </Text>

      {/* Skip */}
      <View style={{ alignItems: "flex-end", marginBottom: spacing.md }}>
        <Pressable
          disabled={locked}
          onPress={onSkip}
          style={({ pressed }) => ({
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.divider,
            backgroundColor: pressed ? colors.highlight : "transparent",
            opacity: locked ? 0.55 : 1,
          })}
        >
          <Text style={[type.button, { color: colors.textPrimary }]}>Skip for now</Text>
        </Pressable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: spacing.xl * 2 }}
      >
        {rows.length === 0 ? (
          <View style={{ paddingVertical: spacing.xl, alignItems: "center" }}>
            <Text style={[type.microcopyItalic, { opacity: 0.75, textAlign: "center" }]}>
              No refined notes selected yet.
            </Text>
          </View>
        ) : (
          <View style={{ gap: spacing.lg }}>
            {rows.map((n) => {
              const id = safeText(n?.id);
              const label = safeText(n?.label);
              if (!id || !label) return null;

              const current: ReviewSentiment = safeSentiments[id] ?? "NEUTRAL";
              const crumb = breadcrumbForNode(n);

              return (
                <View
                  key={id}
                  style={{
                    borderRadius: radii.lg,
                    borderWidth: 1,
                    borderColor: colors.divider,
                    backgroundColor: colors.surface,
                    padding: spacing.lg,
                    gap: spacing.sm,
                    ...shadows.card,
                  }}
                >
                  <Text style={[type.body, { fontSize: 20, fontWeight: "900" }]}>{label}</Text>

                  {!!crumb ? (
                    <Text style={[type.microcopyItalic, { opacity: 0.7 }]}>{crumb}</Text>
                  ) : null}

                  <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
                    <Pill
                      label="Liked"
                      active={current === "LIKE"}
                      onPress={() => setSentiment(id, "LIKE")}
                    />
                    <Pill
                      label="Neutral"
                      active={current === "NEUTRAL"}
                      onPress={() => setSentiment(id, "NEUTRAL")}
                    />
                    <Pill
                      label="Disliked"
                      active={current === "DISLIKE"}
                      onPress={() => setSentiment(id, "DISLIKE")}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}