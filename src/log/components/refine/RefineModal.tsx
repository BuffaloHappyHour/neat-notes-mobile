// src/log/components/refine/RefineModal.tsx
import React, { useMemo, useState } from "react";
import { Alert, Modal, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { spacing } from "../../../../lib/spacing";
import { RefineModalProps, ReviewSentiment } from "./types";

import { RefineBottomNav } from "./components/RefineBottomNav";
import { RefineBrowseBody } from "./components/RefineBrowseBody";
import { RefineHeader } from "./components/RefineHeader";
import { RefineReviewBody } from "./components/RefineReviewBody";

export function RefineModal(props: RefineModalProps) {
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

    byId,

    selectedNodeIds,
    setSelectedNodeIds,

    sentimentById: sentimentByIdFromProps,
    setSentimentById: setSentimentByIdFromProps,
  } = props as any;

  const [mode, setMode] = useState<"BROWSE" | "REVIEW">("BROWSE");
  const [optionsOpen, setOptionsOpen] = useState(false);

  const [localSentiments, setLocalSentiments] = useState<Record<string, ReviewSentiment>>({});
  const sentimentById: Record<string, ReviewSentiment> = sentimentByIdFromProps ?? localSentiments;
  const setSentimentById: React.Dispatch<React.SetStateAction<Record<string, ReviewSentiment>>> =
    setSentimentByIdFromProps ?? setLocalSentiments;

  const isSearching = !!refineSearch?.trim();
  const isDeep = refinePath.length > 0;
  const showAddFamilyBlock = scopedRootIds.length > 0;

  const selectedNodesForReview = useMemo(() => {
    return selectedNodeIds.map((id: string) => byId.get(id)).filter(Boolean);
  }, [selectedNodeIds, byId]);

  const confirmClearAll = () => {
    if (locked) return;
    if (selectedNodeIds.length === 0) return;

    Alert.alert("Clear refined notes?", "This will remove all refined notes you selected for this tasting.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          setSelectedNodeIds([]);
          setSentimentById({});
          setMode("BROWSE");
        },
      },
    ]);
  };

  const handleBottomBack = () => {
    if (locked) return;

    if (mode === "REVIEW") {
      setMode("BROWSE");
      return;
    }

    if (isSearching) {
      setRefineSearch("");
      setRefinePath(() => []);
      return;
    }

    if (isDeep) {
      setRefinePath((p: string[]) => p.slice(0, -1));
      return;
    }
  };

  const handleBottomDone = () => {
    if (locked) return;

    if (mode === "BROWSE") {
      setOptionsOpen(false);
      setMode("REVIEW");
      return;
    }

    closeRefine();
  };

  const bottomBackEnabled = useMemo(() => {
    if (locked) return false;
    if (mode === "REVIEW") return true;
    if (isSearching) return true;
    if (isDeep) return true;
    return false;
  }, [locked, mode, isSearching, isDeep]);

  const bottomBackLabel = useMemo(() => {
    if (mode === "REVIEW") return "Back";
    if (isSearching) return "Clear search";
    return "Back";
  }, [mode, isSearching]);

  const doneLabel = useMemo(() => (mode === "BROWSE" ? "Review" : "Apply"), [mode]);

  const setSentiment = (id: string, s: ReviewSentiment) => {
    setSentimentById((prev) => ({ ...(prev ?? {}), [id]: s }));
  };

  const handleSkipReview = () => {
    if (locked) return;
    closeRefine();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => closeRefine()}>
      {/* ✅ TOP safe-area only; bottom is handled by RefineBottomNav */}
      <SafeAreaView style={{ flex: 1, backgroundColor: "rgba(255,165,0,0.85)" }} edges={["top"]}>
        <RefineHeader
          mode={mode}
          locked={locked}
          onClose={() => closeRefine()}
          onTopDone={() => closeRefine()}
          refineSearch={refineSearch}
          setRefineSearch={setRefineSearch}
          resetPath={() => setRefinePath(() => [])}
          scopedRootIds={scopedRootIds}
          selectedCountText={selectedCountText}
          optionsOpen={optionsOpen}
          setOptionsOpen={setOptionsOpen}
          refineSort={refineSort}
          setRefineSort={setRefineSort}
          Pill={Pill}
          refineBreadcrumb={refineBreadcrumb}
          canClear={selectedNodeIds.length > 0}
          onClearAll={confirmClearAll}
          showAddFamilyBlock={showAddFamilyBlock}
          addFamilyOpen={addFamilyOpen}
          toggleAddFamilyOpen={() => setAddFamilyOpen((v: boolean) => !v)}
          addableFamilies={addableFamilies}
          addFamilyLabel={addFamilyLabel}
        />

        <View style={{ flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
          {mode === "REVIEW" ? (
            <RefineReviewBody
              locked={locked}
              selectedNodes={selectedNodesForReview as any}
              safeText={safeText}
              sentimentById={sentimentById}
              setSentiment={setSentiment}
              byId={byId}
              onSkip={handleSkipReview}
            />
          ) : (
            <RefineBrowseBody
              locked={locked}
              nodesLoading={nodesLoading}
              nodesError={nodesError}
              fetchFlavorNodes={fetchFlavorNodes}
              refineSearch={refineSearch}
              refinePath={refinePath}
              visibleNodes={visibleNodes}
              renderNodeRow={renderNodeRow}
              scopedRootIds={scopedRootIds}
              rootLabelById={rootLabelById}
              byParent={byParent}
              applySort={applySort}
              isFinishLabel={isFinishLabel}
              topLevelNodes={topLevelNodes}
              normalizeKey={normalizeKey}
              safeText={safeText}
              getTopLevelLabelForNode={getTopLevelLabelForNode}
              SectionGroupHeader={SectionGroupHeader}
              setRefinePath={setRefinePath}
            />
          )}
        </View>

        <RefineBottomNav
          locked={locked}
          bottomBackEnabled={bottomBackEnabled}
          bottomBackLabel={bottomBackLabel}
          doneLabel={doneLabel}
          onBack={handleBottomBack}
          onDone={handleBottomDone}
        />
      </SafeAreaView>
    </Modal>
  );
}