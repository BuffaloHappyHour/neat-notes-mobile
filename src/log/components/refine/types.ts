// src/log/components/refine/types.ts
import React from "react";

export type FlavorNode = {
  id: string;
  parent_id: string | null;
  level: number | null;
  family: string | null;
  label: string;
  sort_order: number | null;
  is_active: boolean | null;
  slug: string | null;
};

export type RefineSortMode = "DEFAULT" | "SELECTED" | "AZ";

export type ReviewSentiment = "LIKE" | "NEUTRAL" | "DISLIKE";

export type PillProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
};

export type SectionGroupHeaderProps = {
  title: string;
  onBrowse: () => void;
  disabled?: boolean;
};

export type RefineModalProps = {
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

  // ✅ NEW (lifted to parent so saveCloudTasting can persist)
  sentimentById: Record<string, ReviewSentiment>;
  setSentimentById: (
    updater: (prev: Record<string, ReviewSentiment>) => Record<string, ReviewSentiment>
  ) => void;

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

  // Correct signature (engine provides a closure)
  getTopLevelLabelForNode: (nodeId: string) => string | null;

  byId: Map<string, FlavorNode>;

  // selection
  selectedNodeIds: string[];
  setSelectedNodeIds: (ids: string[]) => void;
};