// src/discover/hooks/useDiscover.ts
import { useEffect, useMemo, useRef, useState } from "react";

import type { SectionKey, WhiskeyCardRow } from "../services/discover.service";
import {
    fetchHighestBhhIds,
    fetchHighestCommunityIds,
    fetchNewestIds,
    fetchRecentIds,
    fetchTrendingIds,
    fetchWhiskeyCardsByIds,
    isViableCard,
} from "../services/discover.service";

function parseMaybeNumber(v: string) {
  const t = String(v ?? "").trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function useDiscover() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusError, setStatusError] = useState<string>("");

  // Filter state
  const [filterOpen, setFilterOpen] = useState(false);
  const [typePickerOpen, setTypePickerOpen] = useState(false);

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [minProofText, setMinProofText] = useState("");
  const [maxProofText, setMaxProofText] = useState("");

  const minProof = useMemo(() => parseMaybeNumber(minProofText), [minProofText]);
  const maxProof = useMemo(() => parseMaybeNumber(maxProofText), [maxProofText]);

  const [allTypes, setAllTypes] = useState<string[]>([]);

  // Pools (raw)
  const [trendingPool, setTrendingPool] = useState<WhiskeyCardRow[]>([]);
  const [recentPool, setRecentPool] = useState<WhiskeyCardRow[]>([]);
  const [highestPool, setHighestPool] = useState<WhiskeyCardRow[]>([]);
  const [newestPool, setNewestPool] = useState<WhiskeyCardRow[]>([]);

  // Display (filtered)
  const [trending, setTrending] = useState<WhiskeyCardRow[]>([]);
  const [recent, setRecent] = useState<WhiskeyCardRow[]>([]);
  const [highest, setHighest] = useState<WhiskeyCardRow[]>([]);
  const [newest, setNewest] = useState<WhiskeyCardRow[]>([]);

  // View All modal
  const [seeAllOpen, setSeeAllOpen] = useState(false);
  const [seeAllTitle, setSeeAllTitle] = useState("");
  const [seeAllRows, setSeeAllRows] = useState<WhiskeyCardRow[]>([]);
  const [seeAllLoading, setSeeAllLoading] = useState(false);
  const [seeAllError, setSeeAllError] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filterBadge = useMemo(() => {
    const parts: string[] = [];
    if (selectedType) parts.push(selectedType);
    if (minProof != null || maxProof != null) {
      const a = minProof != null ? `${Math.round(minProof)}` : "—";
      const b = maxProof != null ? `${Math.round(maxProof)}` : "—";
      parts.push(`Proof ${a}-${b}`);
    }
    return parts.join(" • ");
  }, [selectedType, minProof, maxProof]);

  function applyFilters(rows: WhiskeyCardRow[]) {
    let out = [...rows];

    // 1) Beta “no filler” rule (keep for sections where it matters)
    out = out.filter(isViableCard);

    // 2) Type filter
    if (selectedType) out = out.filter((r) => r.whiskeyType === selectedType);

    // 3) Proof range filter
    if (minProof != null || maxProof != null) {
      out = out.filter((r) => {
        const p = r.proof;
        if (p == null || !Number.isFinite(Number(p))) return false;
        const pv = Number(p);
        if (minProof != null && pv < minProof) return false;
        if (maxProof != null && pv > maxProof) return false;
        return true;
      });
    }

    return out;
  }

  async function loadTypes() {
    try {
      const { data, error } = await (await import("../../../lib/supabase")).supabase
        .from("whiskeys")
        .select("whiskey_type")
        .limit(3000);

      if (error) throw new Error(error.message);

      const set = new Set<string>();
      (data as any[]).forEach((r) => {
        const t = r.whiskey_type ? String(r.whiskey_type).trim() : "";
        if (t) set.add(t);
      });

      setAllTypes(Array.from(set).sort((a, b) => a.localeCompare(b)));
    } catch {
      setAllTypes([]);
    }
  }

  useEffect(() => {
    loadTypes();
  }, []);

  async function loadSectionPools(opts?: { silent?: boolean }) {
    const silent = !!opts?.silent;

    if (silent) setRefreshing(true);
    else setLoading(true);

    setStatusError("");

    try {
      const POOL = 30;

      const [trendIds, recentIds, newestIdsRaw] = await Promise.all([
        fetchTrendingIds(POOL),
        fetchRecentIds(POOL),
        fetchNewestIds(POOL),
      ]);

      // HIGHEST (keep your current threshold logic for now)
      const strictHigh = await fetchHighestCommunityIds(POOL, 5);

      let finalHighIds: string[] = [];
      if (strictHigh.length >= 10) {
        finalHighIds = strictHigh;
      } else {
        const relaxedHigh = await fetchHighestCommunityIds(POOL, 1);
        if (relaxedHigh.length > 0) finalHighIds = relaxedHigh;
        else finalHighIds = await fetchHighestBhhIds(POOL);
      }

      const [trendCards, recentCards, highCards, newestCards] = await Promise.all([
        fetchWhiskeyCardsByIds(trendIds),
        fetchWhiskeyCardsByIds(recentIds),
        fetchWhiskeyCardsByIds(finalHighIds),
        fetchWhiskeyCardsByIds(newestIdsRaw),
      ]);

      setTrendingPool(trendCards);
      setRecentPool(recentCards);
      setHighestPool(highCards);

      // ✅ NEWEST should show “new”, even if unrated.
      // Filters (type/proof) will still apply later, but do NOT delete unrated items here.
      setNewestPool(newestCards);
    } catch (e: any) {
      setTrendingPool([]);
      setRecentPool([]);
      setHighestPool([]);
      setNewestPool([]);
      setStatusError(String(e?.message ?? e));
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }

  useEffect(() => {
    loadSectionPools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType, minProofText, maxProofText]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      // Trending/Recent/Highest keep “no filler”
      setTrending(applyFilters(trendingPool).slice(0, 5));
      setRecent(applyFilters(recentPool).slice(0, 5));
      setHighest(applyFilters(highestPool).slice(0, 5));

      // ✅ NEWEST: apply only type/proof filters, NOT isViableCard
      let newestOut = [...newestPool];

      if (selectedType) newestOut = newestOut.filter((r) => r.whiskeyType === selectedType);

      if (minProof != null || maxProof != null) {
        newestOut = newestOut.filter((r) => {
          const p = r.proof;
          if (p == null || !Number.isFinite(Number(p))) return false;
          const pv = Number(p);
          if (minProof != null && pv < minProof) return false;
          if (maxProof != null && pv > maxProof) return false;
          return true;
        });
      }

      setNewest(newestOut.slice(0, 5));
    }, 120);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendingPool, recentPool, highestPool, newestPool, selectedType, minProofText, maxProofText]);

  const libraryEmpty = useMemo(() => {
    return (
      trendingPool.length === 0 &&
      recentPool.length === 0 &&
      highestPool.length === 0 &&
      newestPool.length === 0
    );
  }, [trendingPool, recentPool, highestPool, newestPool]);

  function resetFilters() {
    setSelectedType(null);
    setMinProofText("");
    setMaxProofText("");
  }

  function normalizeProofBoundsAndCloseFilters() {
    const mn = parseMaybeNumber(minProofText);
    const mx = parseMaybeNumber(maxProofText);
    if (mn != null && mx != null && mn > mx) {
      setMinProofText(String(mx));
      setMaxProofText(String(mn));
    }
    setFilterOpen(false);
  }

  async function openSeeAll(section: SectionKey) {
    setSeeAllOpen(true);
    setSeeAllError("");
    setSeeAllRows([]);
    setSeeAllLoading(true);

    const title =
      section === "TRENDING"
        ? "Trending"
        : section === "RECENT"
        ? "Recently Reviewed"
        : section === "HIGHEST"
        ? "Highest Rated"
        : "Newest Additions";
    setSeeAllTitle(title);

    try {
      const LIMIT = 60;

      let ids: string[] = [];

      if (section === "TRENDING") ids = await fetchTrendingIds(LIMIT);
      else if (section === "RECENT") ids = await fetchRecentIds(LIMIT);
      else if (section === "NEWEST") ids = await fetchNewestIds(LIMIT);
      else {
        const strict = await fetchHighestCommunityIds(LIMIT, 5);
        if (strict.length >= 10) ids = strict;
        else {
          const relaxed = await fetchHighestCommunityIds(LIMIT, 1);
          ids = relaxed.length ? relaxed : await fetchHighestBhhIds(LIMIT);
        }
      }

      const cards = await fetchWhiskeyCardsByIds(ids);

      if (section === "NEWEST") {
        // ✅ Newest: only type/proof filtering, not viability
        let newestOut = [...cards];

        if (selectedType) newestOut = newestOut.filter((r) => r.whiskeyType === selectedType);

        if (minProof != null || maxProof != null) {
          newestOut = newestOut.filter((r) => {
            const p = r.proof;
            if (p == null || !Number.isFinite(Number(p))) return false;
            const pv = Number(p);
            if (minProof != null && pv < minProof) return false;
            if (maxProof != null && pv > maxProof) return false;
            return true;
          });
        }

        setSeeAllRows(newestOut);
      } else {
        setSeeAllRows(applyFilters(cards));
      }
    } catch (e: any) {
      setSeeAllError(String(e?.message ?? e));
      setSeeAllRows([]);
    } finally {
      setSeeAllLoading(false);
    }
  }

  function refresh(opts?: { silent?: boolean }) {
    return loadSectionPools(opts);
  }

  return {
    loading,
    refreshing,
    statusError,

    filterOpen,
    setFilterOpen,
    typePickerOpen,
    setTypePickerOpen,
    selectedType,
    setSelectedType,
    minProofText,
    setMinProofText,
    maxProofText,
    setMaxProofText,
    filterBadge,
    allTypes,
    resetFilters,
    normalizeProofBoundsAndCloseFilters,

    trending,
    recent,
    highest,
    newest,
    libraryEmpty,

    seeAllOpen,
    setSeeAllOpen,
    seeAllTitle,
    seeAllRows,
    seeAllLoading,
    seeAllError,
    openSeeAll,

    refresh,
  };
}