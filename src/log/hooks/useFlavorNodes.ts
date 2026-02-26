// app/log/hooks/useFlavorNodes.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";

/* ------------------- Types ------------------- */

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

type TastingFlavorNodeRow = {
  node_id: string;
  sentiment: string | null;
};

/* ------------------- Helpers ------------------- */

function safeText(v: any) {
  return String(v ?? "").trim();
}

function normalizeKey(s: string) {
  return safeText(s).toLowerCase().replace(/\s+/g, " ");
}

function isUuid(v: string) {
  const s = String(v ?? "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s
  );
}

function uniqStringsKeepOrder(list: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of list) {
    const k = String(s ?? "").trim();
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

function uniqUuidsKeepOrder(list: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of list) {
    const k = safeText(s);
    if (!k) continue;
    if (!isUuid(k)) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

function isFinishLabel(label: string) {
  return safeText(label).toLowerCase() === "finish";
}

function isNegativeSentiment(v: any) {
  const s = safeText(v).toLowerCase();
  return s === "negative" || s === "neg" || s === "-1" || s === "dislike";
}

// IMPORTANT: enum is case-sensitive in Postgres
const POS_SENTIMENT = "positive";

/* ------------------- Tree helpers ------------------- */

function getRootIdForNode(nodeId: string, byId: Map<string, FlavorNode>) {
  let cur = byId.get(nodeId);
  if (!cur) return null;

  let safety = 0;
  while (cur && cur.parent_id && safety < 25) {
    const parent = byId.get(cur.parent_id);
    if (!parent) break;
    cur = parent;
    safety++;
  }
  return cur?.id ?? null;
}

function getTopLevelLabelForNode(nodeId: string, byId: Map<string, FlavorNode>) {
  const rootId = getRootIdForNode(nodeId, byId);
  if (!rootId) return null;
  const root = byId.get(rootId);
  const lbl = safeText(root?.label);
  if (!lbl) return null;

  // exclude finish + dislikes from ever contributing to flavor_tags
  if (isFinishLabel(lbl)) return null;
  if (normalizeKey(lbl) === "dislikes") return null;

  return lbl;
}

function isNodeUnderAnyRoot(nodeId: string, allowedRootIds: Set<string>, byId: Map<string, FlavorNode>) {
  if (allowedRootIds.size === 0) return true; // no scope => all
  const rootId = getRootIdForNode(nodeId, byId);
  if (!rootId) return false;
  return allowedRootIds.has(rootId);
}

/* ------------------- Hook ------------------- */

export function useFlavorNodesEngine(params: {
  // current top-level flavor tags (Nose/Taste/Notes column)
  flavorTags: string[];
  // allows the engine to add a family from "Not seeing it?"
  setFlavorTags: (updater: (prev: string[]) => string[]) => void;

  // optional: fallback dislike tags if Dislikes branch missing
  fallbackDislikeTags?: string[];
  // optional: initial selection when editing an existing tasting
  initialSelectedNodeIds?: string[];
}) {
  const {
    flavorTags,
    setFlavorTags,
    fallbackDislikeTags = [],
    initialSelectedNodeIds = [],
  } = params;

  // Refine modal state
  const [refineOpen, setRefineOpen] = useState(false);
  const [nodesLoading, setNodesLoading] = useState(false);
  const [nodesError, setNodesError] = useState<string | null>(null);
  const [allNodes, setAllNodes] = useState<FlavorNode[]>([]);
  const [refineSearch, setRefineSearch] = useState("");
  const [refinePath, setRefinePath] = useState<string[]>([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>(
    uniqUuidsKeepOrder(initialSelectedNodeIds)
  );
  const [refineSort, setRefineSort] = useState<RefineSortMode>("SELECTED");
  const [addFamilyOpen, setAddFamilyOpen] = useState(false);

  const openRefine = useCallback(() => {
    setRefineOpen(true);
  }, []);

  const closeRefine = useCallback(() => {
    setRefineOpen(false);
    setAddFamilyOpen(false);
    setRefineSearch("");
    setRefinePath([]);
  }, []);

  /* ------------------- Indexes ------------------- */

  const byId = useMemo(() => {
    const m = new Map<string, FlavorNode>();
    for (const n of allNodes) m.set(n.id, n);
    return m;
  }, [allNodes]);

  const byParent = useMemo(() => {
    const m = new Map<string, FlavorNode[]>();
    for (const n of allNodes) {
      const key = n.parent_id ?? "__ROOT__";
      const arr = m.get(key) ?? [];
      arr.push(n);
      m.set(key, arr);
    }

    for (const [k, arr] of m.entries()) {
      arr.sort((a, b) => {
        const fa = safeText(a.family).toLowerCase();
        const fb = safeText(b.family).toLowerCase();
        if (fa !== fb) return fa < fb ? -1 : 1;

        const la = Number(a.level ?? 0);
        const lb = Number(b.level ?? 0);
        if (la !== lb) return la - lb;

        const sa = Number(a.sort_order ?? 999);
        const sb = Number(b.sort_order ?? 999);
        if (sa !== sb) return sa - sb;

        const aa = safeText(a.label).toLowerCase();
        const bb = safeText(b.label).toLowerCase();
        return aa < bb ? -1 : aa > bb ? 1 : 0;
      });

      m.set(k, arr);
    }

    return m;
  }, [allNodes]);

  // root children (top-level families)
  const topLevelNodes = useMemo(() => {
    const root = byParent.get("__ROOT__") ?? [];
    return root
      .filter((n) => !isFinishLabel(n.label))
      .filter((n) => normalizeKey(n.label) !== "dislikes");
  }, [byParent]);

  // label -> rootId
  const rootIdByLabel = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of topLevelNodes) {
      const k = normalizeKey(n.label);
      if (!k) continue;
      m.set(k, n.id);
    }
    // include dislikes root lookup for dislike grid (but NOT in topLevelNodes)
    const rootAll = byParent.get("__ROOT__") ?? [];
    for (const n of rootAll) {
      const k = normalizeKey(n.label);
      if (!k) continue;
      if (!m.has(k)) m.set(k, n.id);
    }
    return m;
  }, [topLevelNodes, byParent]);

  // rootId -> label (for scoped section headers)
  const rootLabelById = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of topLevelNodes) {
      if (isFinishLabel(n.label)) continue;
      if (normalizeKey(n.label) === "dislikes") continue;
      m.set(n.id, safeText(n.label));
    }
    return m;
  }, [topLevelNodes]);

  const ALL_TOP_LEVEL_LABELS = useMemo(() => {
    const fromDb = topLevelNodes.map((n) => safeText(n.label)).filter(Boolean);
    return fromDb.filter((t) => !isFinishLabel(t) && normalizeKey(t) !== "dislikes");
  }, [topLevelNodes]);

  // dislikes from flavor_nodes "Dislikes" branch
  const DISLIKE_TAGS = useMemo(() => {
    const dislikesRootId = rootIdByLabel.get("dislikes");
    if (!dislikesRootId) return fallbackDislikeTags;

    const kids = (byParent.get(dislikesRootId) ?? [])
      .map((n) => safeText(n.label))
      .filter(Boolean);

    return kids.length ? kids : fallbackDislikeTags;
  }, [rootIdByLabel, byParent, fallbackDislikeTags]);

  /* ------------------- Scope refine to selected top-level notes ------------------- */

  const scopedRootIds = useMemo(() => {
    const ids: string[] = [];
    for (const lbl of flavorTags) {
      const id = rootIdByLabel.get(normalizeKey(lbl));
      if (id && !ids.includes(id)) ids.push(id);
    }
    // ensure dislikes never sneaks in
    return ids.filter((id) => normalizeKey(rootLabelById.get(id) ?? "") !== "dislikes");
  }, [flavorTags, rootIdByLabel, rootLabelById]);

  const scopedRootIdSet = useMemo(() => new Set(scopedRootIds), [scopedRootIds]);

  /* ------------------- Drilldown navigation ------------------- */

  const currentParentId = refinePath.length ? refinePath[refinePath.length - 1] : "__ROOT__";

  const currentNodes = useMemo(() => byParent.get(currentParentId) ?? [], [byParent, currentParentId]);

  /* ------------------- Sorting ------------------- */

  function applySort(list: FlavorNode[]) {
    const selectedSet = new Set(selectedNodeIds);

    if (refineSort === "DEFAULT") return list;

    if (refineSort === "AZ") {
      const copy = list.slice();
      copy.sort((a, b) => {
        const aa = safeText(a.label).toLowerCase();
        const bb = safeText(b.label).toLowerCase();
        return aa < bb ? -1 : aa > bb ? 1 : 0;
      });
      return copy;
    }

    // SELECTED first
    const selected: FlavorNode[] = [];
    const rest: FlavorNode[] = [];
    for (const n of list) {
      if (selectedSet.has(n.id)) selected.push(n);
      else rest.push(n);
    }
    return [...selected, ...rest];
  }

  /* ------------------- Visible nodes logic (search + drilldown + scope) ------------------- */

  const visibleNodes = useMemo(() => {
    const q = safeText(refineSearch).toLowerCase();

    // Search mode: show all matches (scoped if scoped roots exist)
    if (q) {
      const all = allNodes
        .filter((n) => !isFinishLabel(n.label))
        .filter((n) => {
          // hard exclude anything under Dislikes root
          if (normalizeKey(safeText(getTopLevelLabelForNode(n.id, byId) ?? "")) === "dislikes") {
            return false;
          }

          if (!isNodeUnderAnyRoot(n.id, scopedRootIdSet, byId)) return false;

          const label = safeText(n.label).toLowerCase();
          const slug = safeText(n.slug).toLowerCase();
          const family = safeText(n.family).toLowerCase();
          return label.includes(q) || slug.includes(q) || family.includes(q);
        });

      all.sort((a, b) => {
        const fa = safeText(a.family).toLowerCase();
        const fb = safeText(b.family).toLowerCase();
        if (fa !== fb) return fa < fb ? -1 : 1;

        const la = Number(a.level ?? 0);
        const lb = Number(b.level ?? 0);
        if (la !== lb) return la - lb;

        const sa = Number(a.sort_order ?? 999);
        const sb = Number(b.sort_order ?? 999);
        if (sa !== sb) return sa - sb;

        const aa = safeText(a.label).toLowerCase();
        const bb = safeText(b.label).toLowerCase();
        return aa < bb ? -1 : aa > bb ? 1 : 0;
      });

      return applySort(all);
    }

    // Drilldown mode
    const levelList = currentNodes.filter((n) => !isFinishLabel(n.label));
    // hide dislikes anywhere
    const filtered = levelList.filter(
      (n) => normalizeKey(safeText(getTopLevelLabelForNode(n.id, byId) ?? "")) !== "dislikes"
    );
    return applySort(filtered);
  }, [refineSearch, allNodes, currentNodes, refineSort, selectedNodeIds, scopedRootIdSet, byId]);

  /* ------------------- “Not seeing it?” add-family helpers ------------------- */

  function addFamilyLabel(label: string) {
    const clean = safeText(label);
    if (!clean) return;

    setFlavorTags((prev) => {
      const next = prev.includes(clean) ? prev : [...prev, clean];
      return next.filter((x) => !isFinishLabel(x) && normalizeKey(x) !== "dislikes");
    });

    setAddFamilyOpen(false);
    setRefineSearch("");
    setRefinePath([]);
  }

  const addableFamilies = useMemo(() => {
    const existing = new Set(flavorTags.map((t) => normalizeKey(t)));
    return ALL_TOP_LEVEL_LABELS.filter((lbl) => !existing.has(normalizeKey(lbl)));
  }, [ALL_TOP_LEVEL_LABELS, flavorTags]);

  /* ------------------- Selection helpers ------------------- */

  function toggleNodeId(id: string) {
    setSelectedNodeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  /* ------------------- Derived UI strings ------------------- */

  const selectedCountText = useMemo(() => {
    const n = selectedNodeIds.length;
    return n === 1 ? "1 refined note selected" : `${n} refined notes selected`;
  }, [selectedNodeIds.length]);

  const selectedNodeLabelsPreview = useMemo(() => {
    if (!selectedNodeIds.length) return "";
    const labels = selectedNodeIds
      .map((id) => safeText(byId.get(id)?.label))
      .filter(Boolean);
    const uniq = uniqStringsKeepOrder(labels);
    return uniq.slice(0, 3).join(", ") + (uniq.length > 3 ? "…" : "");
  }, [selectedNodeIds, byId]);

  const refineBreadcrumb = useMemo(() => {
    if (refineSearch) return "Searching…";
    if (!refinePath.length) {
      return scopedRootIds.length ? "Browsing within your selected notes" : "Browsing all notes";
    }
    const labels = refinePath
      .map((id) => safeText(byId.get(id)?.label))
      .filter(Boolean);
    return labels.length ? labels.join("  ›  ") : "Browsing…";
  }, [refineSearch, refinePath, byId, scopedRootIds.length]);

  const additionalNotesLine = useMemo(() => {
    if (!scopedRootIds.length) return "";
    if (!selectedNodeIds.length) return "Tip: tap “More” to go deeper under any note.";
    return "";
  }, [scopedRootIds.length, selectedNodeIds.length]);

  /* ------------------- Fetch flavor_nodes ------------------- */

  const fetchFlavorNodes = useCallback(async () => {
    setNodesLoading(true);
    setNodesError(null);
    try {
      const { data, error } = await supabase
        .from("flavor_nodes")
        .select("id,parent_id,level,family,label,sort_order,is_active,slug")
        .eq("is_active", true);

      if (error) throw new Error(error.message);

      const rows = Array.isArray(data) ? (data as any[]) : [];
      const cleaned: FlavorNode[] = rows
        .map((r) => ({
          id: safeText(r.id),
          parent_id: r.parent_id ? safeText(r.parent_id) : null,
          level: r.level == null ? null : Number(r.level),
          family: r.family != null ? safeText(r.family) : null,
          label: safeText(r.label),
          sort_order: r.sort_order == null ? null : Number(r.sort_order),
          is_active: r.is_active == null ? true : Boolean(r.is_active),
          slug: r.slug != null ? safeText(r.slug) : null,
        }))
        .filter((n) => isUuid(n.id) && n.label.length > 0)
        .filter((n) => !isFinishLabel(n.label)); // remove finish globally

      setAllNodes(cleaned);
    } catch (e: any) {
      setNodesError(String(e?.message ?? e));
    } finally {
      setNodesLoading(false);
    }
  }, []);

  const didInitFetch = useRef(false);
  useEffect(() => {
    if (didInitFetch.current) return;
    didInitFetch.current = true;
    void fetchFlavorNodes();
  }, [fetchFlavorNodes]);

  /* ------------------- tasting_flavor_nodes load/replace ------------------- */

  async function loadTastingFlavorNodes(tid: string) {
    const { data, error } = await supabase
      .from("tasting_flavor_nodes")
      .select("node_id, sentiment")
      .eq("tasting_id", tid);

    if (error) throw new Error(error.message);

    const rows = Array.isArray(data) ? ((data as any) as TastingFlavorNodeRow[]) : [];
    const positive = rows
      .filter((r) => isUuid(r.node_id) && !isNegativeSentiment(r.sentiment))
      .map((r) => safeText(r.node_id));

    return uniqUuidsKeepOrder(positive);
  }

  async function replaceTastingFlavorNodes(tid: string, nodeIds: string[]) {
    const { error: delErr } = await supabase
      .from("tasting_flavor_nodes")
      .delete()
      .eq("tasting_id", tid);

    if (delErr) throw new Error(delErr.message);

    const clean = uniqUuidsKeepOrder(nodeIds);
    if (!clean.length) return;

    const inserts = clean.map((id) => ({
      tasting_id: tid,
      node_id: id,
      sentiment: POS_SENTIMENT,
    }));

    const { error: insErr } = await supabase.from("tasting_flavor_nodes").insert(inserts);
    if (insErr) throw new Error(insErr.message);
  }

  /* ------------------- Public API ------------------- */

  return {
    // modal open/close
    refineOpen,
    openRefine,
    closeRefine,
    setRefineOpen,

    // refine state
    refineSearch,
    setRefineSearch,
    refinePath,
    setRefinePath,
    refineSort,
    setRefineSort,
    addFamilyOpen,
    setAddFamilyOpen,

    // node state
    allNodes,
    nodesLoading,
    nodesError,
    fetchFlavorNodes,

    // indexes + lists
    byId,
    byParent,
    topLevelNodes,
    rootIdByLabel,
    rootLabelById,
    ALL_TOP_LEVEL_LABELS,
    DISLIKE_TAGS,

    // scope + visible
    scopedRootIds,
    visibleNodes,

    // derived UI
    selectedCountText,
    refineBreadcrumb,
    selectedNodeLabelsPreview,
    additionalNotesLine,

    // selection
    selectedNodeIds,
    setSelectedNodeIds,
    toggleNodeId,

    // helpers you already rely on
    safeText,
    normalizeKey,
    isFinishLabel,
    getTopLevelLabelForNode: (nodeId: string) => getTopLevelLabelForNode(nodeId, byId),
    applySort,

    // add-family
    addableFamilies,
    addFamilyLabel,

    // join table ops
    loadTastingFlavorNodes,
    replaceTastingFlavorNodes,
  };
}