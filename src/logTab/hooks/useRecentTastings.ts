// src/logTab/hooks/useRecentTastings.ts
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";

export type RecentTastingRow = {
  id: string;
  whiskeyId: string | null;
  whiskeyName: string;
  rating: number | null;
  createdAt: string | null;
};

function isFiniteNumber(v: any) {
  const n = Number(v);
  return Number.isFinite(n);
}

export function useRecentTastings({ staleMs = 60_000 }: { staleMs?: number } = {}) {
  const [rows, setRows] = useState<RecentTastingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ prevents “refresh every tab switch”
  const lastFetchedAtRef = useRef<number>(0);
  const inFlightRef = useRef(false);

  const fetchRecent = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      const now = Date.now();
      const isStale = now - lastFetchedAtRef.current > staleMs;

      if (!force && lastFetchedAtRef.current && !isStale) return;
      if (inFlightRef.current) return;

      inFlightRef.current = true;
      setLoading(true);
      setError("");

      try {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth?.user?.id;

        if (!userId) {
          setRows([]);
          lastFetchedAtRef.current = now;
          return;
        }

        const { data, error: qErr } = await supabase
          .from("tastings")
          .select("id, whiskey_id, whiskey_name, rating, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10);

        if (qErr) throw new Error(qErr.message);

        const mapped: RecentTastingRow[] = ((data as any[]) ?? []).map((r) => ({
          id: String(r.id),
          whiskeyId: r.whiskey_id ? String(r.whiskey_id) : null,
          whiskeyName: String(r.whiskey_name ?? "Whiskey"),
          rating: isFiniteNumber(r.rating) ? Number(r.rating) : null,
          createdAt: r.created_at ? String(r.created_at) : null,
        }));

        setRows(mapped);
        lastFetchedAtRef.current = now;
      } catch (e: any) {
        setRows([]);
        setError(String(e?.message ?? e));
      } finally {
        setLoading(false);
        inFlightRef.current = false;
      }
    },
    [staleMs]
  );

  // ✅ load on first focus, but don’t spam reloads
  useFocusEffect(
    useCallback(() => {
      fetchRecent({ force: false });
    }, [fetchRecent])
  );

  const api = useMemo(
    () => ({
      rows,
      loading,
      error,
      refresh: () => fetchRecent({ force: true }), // optional manual refresh
    }),
    [rows, loading, error, fetchRecent]
  );

  return api;
}