import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";

import { isAdmin as checkIsAdmin } from "../../../lib/adminApi";
import { fetchMyProfile } from "../../../lib/cloudProfile";
import { supabase } from "../../../lib/supabase";

import { hapticError, hapticSuccess, hapticTick } from "../../../lib/hapticsPress";

import { type MixRow, type RecentRow, type TopRow } from "../types";
import { MIX_DEFAULT_ALPHAS, safeLabel } from "../utils";

type ClarityInputRow = {
  rating: number | null;
  created_at: string | null;
  category: string | null;
  proof: number | null;
  hasRefinedNotes: boolean;
};

function normId(v: any) {
  return String(v ?? "").trim().toLowerCase();
}

function asFiniteNumber(v: any): number | null {
  const n = typeof v === "number" ? v : v != null ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

export function useProfileData() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [isAuthed, setIsAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [privateName, setPrivateName] = useState("");
  const [username, setUsername] = useState("");

  const [tastingCount, setTastingCount] = useState<number | null>(null);
  const [avgRating, setAvgRating] = useState<number | null>(null);

  const [top5, setTop5] = useState<TopRow[]>([]);
  const [recent, setRecent] = useState<RecentRow[]>([]);
  const [recentError, setRecentError] = useState<string>("");

  const [mix, setMix] = useState<MixRow[]>([]);
  const [mixTotal, setMixTotal] = useState<number>(0);
  const [mixError, setMixError] = useState<string>("");

  const [shareAnon, setShareAnon] = useState<boolean>(true);

  const [actionsOpen, setActionsOpen] = useState(false);
  const [actionsRow, setActionsRow] = useState<{ id: string; whiskey_name: string | null } | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  // ✅ Palate clarity input rows for the palate engine
  const [clarityInput, setClarityInput] = useState<ClarityInputRow[]>([]);

  const loadAll = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = !!opts?.silent;

    if (silent) setRefreshing(true);
    else setLoading(true);

    setRecentError("");
    setMixError("");

    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session?.user) {
      setIsAuthed(false);
      setIsAdmin(false);
      setDisplayName("");
      setPrivateName("");
      setUsername("");
      setTastingCount(null);
      setAvgRating(null);
      setTop5([]);
      setRecent([]);
      setRecentError("");
      setMix([]);
      setMixTotal(0);
      setMixError("");
      setShareAnon(true);
      setClarityInput([]);

      if (silent) setRefreshing(false);
      else setLoading(false);
      return;
    }

    setIsAuthed(true);

    const meta: any = session.user.user_metadata ?? {};
    const metaUsername = String(meta.username ?? meta.user_name ?? meta.name ?? "").trim();
    const emailFallback = session.user.email ? String(session.user.email).split("@")[0] : "";
    setUsername(metaUsername || emailFallback || "");

    const profilePromise = fetchMyProfile();
    const countPromise = supabase.from("tastings").select("id", { count: "exact", head: true });
    const ratingsPromise = supabase.from("tastings").select("rating");

    const top5Promise = supabase
      .from("tastings")
      .select("id, whiskey_name, rating, whiskey_id")
      .order("rating", { ascending: false })
      .limit(5);

    const recentPromise = supabase
      .from("tastings")
      .select("id, whiskey_name, rating, created_at, whiskey_id")
      .order("created_at", { ascending: false })
      .limit(10);

    const mixPromise = supabase.from("tastings").select("whiskey_id").limit(3000);

    // ✅ For palate clarity we only need these fields from tastings
    const clarityPromise = supabase
      .from("tastings")
      .select("rating, created_at, flavor_tags, whiskey_id")
      .order("created_at", { ascending: false })
      .limit(3000);

    const [profileRes, countRes, ratingsRes, top5Res, recentRes, mixRes, clarityRes] =
      await Promise.allSettled([
        profilePromise,
        countPromise,
        ratingsPromise,
        top5Promise,
        recentPromise,
        mixPromise,
        clarityPromise,
      ]);

    // ✅ Profile
    if (profileRes.status === "fulfilled") {
      const p: any = profileRes.value;
      setDisplayName((p?.display_name ?? "").trim());
      setPrivateName((p?.first_name ?? "").trim());

      const sAnon = typeof p?.share_anonymously === "boolean" ? p.share_anonymously : true;
      setShareAnon(sAnon);
    }

    // ✅ Count
    if (countRes.status === "fulfilled") {
      const { count, error } = countRes.value as any;
      if (!error) setTastingCount(typeof count === "number" ? count : 0);
    }

    // ✅ Average rating
    if (ratingsRes.status === "fulfilled") {
      const { data: rows, error } = ratingsRes.value as any;
      if (!error && Array.isArray(rows)) {
        const nums = rows
          .map((r: any) => Number(r.rating))
          .filter((n: number) => Number.isFinite(n));
        if (nums.length) setAvgRating(nums.reduce((a: number, b: number) => a + b, 0) / nums.length);
        else setAvgRating(null);
      }
    }

    // ✅ Top 5
    if (top5Res.status === "fulfilled") {
      const { data: rows, error } = top5Res.value as any;
      if (!error && Array.isArray(rows)) setTop5(rows as any);
      else setTop5([]);
    } else {
      setTop5([]);
    }

    // ✅ Recent
    if (recentRes.status === "fulfilled") {
      const { data: rows, error } = recentRes.value as any;
      if (error) {
        setRecent([]);
        setRecentError(error.message || "Unknown error loading recent entries.");
      } else if (Array.isArray(rows)) {
        setRecent(rows as any);
        setRecentError("");
      } else {
        setRecent([]);
        setRecentError("Recent query returned no array.");
      }
    } else {
      setRecent([]);
      setRecentError("Recent query promise rejected (network/auth).");
    }

    // ✅ Palate clarity input build (category + proof come from whiskeys)
    try {
      if (clarityRes.status !== "fulfilled") throw new Error("Clarity query promise rejected.");

      const { data: rows, error } = clarityRes.value as any;
      if (error) throw new Error(error.message || "Unknown error loading clarity data.");
      if (!Array.isArray(rows)) throw new Error("Clarity query returned no array.");

      const whiskeyIdsRaw = (rows as any[])
        .map((r) => r?.whiskey_id)
        .filter(Boolean);

      const uniqueIds = Array.from(new Set(whiskeyIdsRaw.map((id) => normId(id)).filter(Boolean)));

      const whiskeyToCategory = new Map<string, string>();
      const whiskeyToProof = new Map<string, number | null>();

      if (uniqueIds.length > 0) {
        // IMPORTANT: wRows.id must match tastings.whiskey_id (normalized)
        const { data: wRows, error: wErr } = await supabase
          .from("whiskeys")
          .select("id, category, proof")
          .in("id", uniqueIds)
          .limit(4000);

        if (wErr) throw new Error(wErr.message);

        (wRows as any[]).forEach((w) => {
          const id = normId(w?.id);
          if (!id) return;
          whiskeyToCategory.set(id, safeLabel(w?.category) || "Unknown");
          whiskeyToProof.set(id, asFiniteNumber(w?.proof));
        });
      }

      const mapped: ClarityInputRow[] = (rows as any[]).map((t) => {
        const wid = normId(t?.whiskey_id);
        const cat = wid ? whiskeyToCategory.get(wid) ?? null : null;
        const proof = wid ? whiskeyToProof.get(wid) ?? null : null;

        return {
          rating: asFiniteNumber(t?.rating),
          created_at: t?.created_at ? String(t.created_at) : null,
          category: cat ? safeLabel(cat) : null, // null => custom/unknown
          proof,
          hasRefinedNotes: Array.isArray(t?.flavor_tags) && t.flavor_tags.length > 0,
        };
      });

      setClarityInput(mapped);
    } catch (e: any) {
      console.warn("Clarity input build failed:", String(e?.message ?? e));
      setClarityInput([]);
    }

    // ✅ Category mix
    try {
      if (mixRes.status !== "fulfilled") throw new Error("Mix query promise rejected (network/auth).");

      const { data: rows, error } = mixRes.value as any;
      if (error) throw new Error(error.message || "Unknown error loading breakdown.");
      if (!Array.isArray(rows)) throw new Error("Breakdown query returned no array.");

      const total = rows.length;
      setMixTotal(total);

      const whiskeyIds = (rows as any[])
        .map((r) => (r?.whiskey_id ? String(r.whiskey_id) : ""))
        .filter(Boolean);

      if (whiskeyIds.length === 0) {
        setMix([{ label: "Custom / Unknown", count: total, pct: 1, alpha: 0.85 }]);
        setMixError("");
      } else {
        const uniqueIds = Array.from(new Set(whiskeyIds.map((id) => normId(id)).filter(Boolean)));

        const { data: wRows, error: wErr } = await supabase
          .from("whiskeys")
          .select("id, category")
          .in("id", uniqueIds)
          .limit(4000);

        if (wErr) throw new Error(wErr.message);

        const whiskeyToCategory = new Map<string, string>();
        (wRows as any[]).forEach((w) => {
          const id = normId(w?.id);
          if (!id) return;
          whiskeyToCategory.set(id, safeLabel(w?.category) || "Unknown");
        });

        const counts = new Map<string, number>();
        for (const tRow of rows as any[]) {
          const wid = normId(tRow?.whiskey_id);
          const cat = wid ? whiskeyToCategory.get(wid) : null;
          const label = cat ? safeLabel(cat) : "Custom / Unknown";
          counts.set(label, (counts.get(label) ?? 0) + 1);
        }

        const all = Array.from(counts.entries())
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

        const TOP_N = 6;
        const top = all.slice(0, TOP_N);
        const rest = all.slice(TOP_N);
        const otherCount = rest.reduce((s, r) => s + r.count, 0);

        const final = otherCount > 0 ? [...top, { label: "Other", count: otherCount }] : top;
        const denom = Math.max(1, total);

        setMix(
          final.map((r, i) => ({
            label: r.label,
            count: r.count,
            pct: r.count / denom,
            alpha: MIX_DEFAULT_ALPHAS[Math.min(i, MIX_DEFAULT_ALPHAS.length - 1)],
          }))
        );
        setMixError("");
      }
    } catch (e: any) {
      setMix([]);
      setMixTotal(0);
      setMixError(String(e?.message ?? e));
    }

    if (silent) setRefreshing(false);
    else setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!isAuthed) {
        setIsAdmin(false);
        return;
      }
      try {
        const ok = await checkIsAdmin();
        if (!cancelled) setIsAdmin(ok);
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthed]);

  const greetName = (privateName || username || displayName || "").trim();
  const welcomeTitle = greetName ? `Welcome, ${greetName}` : "Welcome";

  const tastingsText = tastingCount === null ? "—" : String(tastingCount);
  const avgText = avgRating === null ? "—" : `${avgRating.toFixed(1)}`;

  const actionsTitle = useMemo(() => {
    const nm = (actionsRow?.whiskey_name ?? "").trim();
    return nm || "Tasting";
  }, [actionsRow]);

  const closeActions = useCallback(async () => {
    if (deleting) return;
    setActionsOpen(false);
    setTimeout(() => setActionsRow(null), 150);
    await hapticTick();
  }, [deleting]);

  const openActionsForRow = useCallback(
    async (row: { id: string; whiskey_name: string | null }) => {
      if (deleting) return;
      setActionsRow(row);
      setActionsOpen(true);
      await hapticTick();
    },
    [deleting]
  );

  const editFromActions = useCallback(async () => {
    if (!actionsRow) return;
    if (deleting) return;
    setActionsOpen(false);
    setTimeout(() => setActionsRow(null), 150);
    await hapticTick();
    router.push(`/log/cloud-tasting?tastingId=${encodeURIComponent(actionsRow.id)}` as any);
  }, [actionsRow, deleting]);

  const deleteFromActions = useCallback(async () => {
    if (!actionsRow) return;
    if (deleting) return;

    const nm = (actionsRow.whiskey_name ?? "Whiskey").trim() || "Whiskey";
    await hapticTick();

    Alert.alert("Delete tasting?", `This will permanently delete your tasting for “${nm}”.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (deleting) return;
          setDeleting(true);
          try {
            const { error } = await supabase.from("tastings").delete().eq("id", actionsRow.id);
            if (error) throw new Error(error.message);

            setActionsOpen(false);
            setActionsRow(null);
            await loadAll({ silent: true });
            await hapticSuccess();
          } catch (e: any) {
            Alert.alert("Delete failed", String(e?.message ?? e));
            await hapticError();
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }, [actionsRow, deleting, loadAll]);

  return {
    loading,
    refreshing,
    isAuthed,
    isAdmin,
    shareAnon,

    top5,
    recent,
    recentError,

    mix,
    mixTotal,
    mixError,

    welcomeTitle,
    tastingsText,
    avgText,

    actionsOpen,
    actionsTitle,
    deleting,

    // ✅ palate clarity input
    clarityInput,

    loadAll,
    openActionsForRow,
    closeActions,
    editFromActions,
    deleteFromActions,
  };
}