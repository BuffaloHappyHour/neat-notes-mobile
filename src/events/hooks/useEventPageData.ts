import { useEffect, useMemo, useState } from "react";

import { supabase } from "../../../lib/supabase";

export type EventHeader = {
  id: string;
  name: string;
  starts_at: string | null;
  ends_at: string | null;
};

export type RecentTastingRow = {
  id: string;
  user_id: string | null;
  whiskey_name: string | null;
  rating: number | null;
  created_at: string;
};

export type TopWhiskeyRow = {
  whiskey_name: string;
  avg_rating: number | null;
  tasting_count: number;
};

export type MostRatedWhiskeyRow = {
  whiskey_name: string;
  tasting_count: number;
  avg_rating: number | null;
};

type EventPageSummary = {
  tastingCount: number;
  uniqueNames: number;
  uniqueUsers: number;
  averageRating: number | null;
};

type UseEventPageDataResult = {
  loading: boolean;
  error: string | null;
  event: EventHeader | null;
  recent: RecentTastingRow[];
  topWhiskies: TopWhiskeyRow[];
  mostRatedWhiskies: MostRatedWhiskeyRow[];
  canViewHostAnalytics: boolean;
  summary: EventPageSummary;
};

function buildMostRatedRows(
  rows: { whiskey_name: string | null; rating: number | null }[] | null
): MostRatedWhiskeyRow[] {
  const mostRatedMap = new Map<
    string,
    {
      whiskey_name: string;
      tasting_count: number;
      rating_sum: number;
      rating_count: number;
    }
  >();

  (rows ?? []).forEach((row) => {
    const whiskeyName = row.whiskey_name?.trim();
    if (!whiskeyName) return;

    const existing = mostRatedMap.get(whiskeyName) ?? {
      whiskey_name: whiskeyName,
      tasting_count: 0,
      rating_sum: 0,
      rating_count: 0,
    };

    existing.tasting_count += 1;

    if (row.rating != null) {
      existing.rating_sum += Number(row.rating);
      existing.rating_count += 1;
    }

    mostRatedMap.set(whiskeyName, existing);
  });

  return Array.from(mostRatedMap.values())
    .map((row) => ({
      whiskey_name: row.whiskey_name,
      tasting_count: row.tasting_count,
      avg_rating: row.rating_count > 0 ? row.rating_sum / row.rating_count : null,
    }))
    .sort((a, b) => {
      if (b.tasting_count !== a.tasting_count) {
        return b.tasting_count - a.tasting_count;
      }

      return (b.avg_rating ?? 0) - (a.avg_rating ?? 0);
    })
    .slice(0, 5);
}

export function useEventPageData(eventId: string): UseEventPageDataResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<EventHeader | null>(null);
  const [recent, setRecent] = useState<RecentTastingRow[]>([]);
  const [topWhiskies, setTopWhiskies] = useState<TopWhiskeyRow[]>([]);
  const [mostRatedWhiskies, setMostRatedWhiskies] = useState<MostRatedWhiskeyRow[]>([]);
  const [canViewHostAnalytics, setCanViewHostAnalytics] = useState(false);
  const [allTastings, setAllTastings] = useState<
    { whiskey_name: string | null; rating: number | null; user_id: string | null }[]
  >([]);

  useEffect(() => {
    let mounted = true;

    async function loadEventPage() {
      if (!eventId) {
        if (mounted) {
          setLoading(false);
          setError(null);
          setEvent(null);
          setRecent([]);
          setTopWhiskies([]);
          setMostRatedWhiskies([]);
          setAllTastings([]);
          setCanViewHostAnalytics(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const [
        { data: eventData, error: eventError },
        { data: recentData, error: recentError },
        { data: topData, error: topError },
        { data: mostRatedData, error: mostRatedError },
      ] = await Promise.all([
        supabase
          .from("events")
          .select("id, name, starts_at, ends_at")
          .eq("id", eventId)
          .maybeSingle(),
        supabase
          .from("tastings")
          .select("id, user_id, whiskey_name, rating, created_at")
          .eq("event_id", eventId)
          .order("created_at", { ascending: false })
          .limit(12),
        supabase.rpc("event_top_whiskies", {
          p_event_id: eventId,
          p_limit: 10,
        }),
        supabase
          .from("tastings")
          .select("whiskey_name, rating, user_id")
          .eq("event_id", eventId),
      ]);

      if (eventError || recentError || topError || mostRatedError) {
        if (mounted) {
          setError("Failed to load event data. Please try again.");
          setLoading(false);
        }
        return;
      }

      let hasAccess = false;

      if (user) {
        const [
          { data: roles, error: rolesError },
          { data: adminRow, error: adminError },
        ] = await Promise.all([
          supabase
            .from("event_user_roles")
            .select("role")
            .eq("event_id", eventId)
            .eq("user_id", user.id),
          supabase
            .from("admin_users")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

        if (!rolesError && !adminError && (roles?.some((r) => r.role === "host") || adminRow)) {
          hasAccess = true;
        }
      }

      if (!mounted) return;

      setEvent((eventData as EventHeader | null) ?? null);
      setRecent(
        ((recentData as any[] | null) ?? []).map((r) => ({
          id: r.id,
          user_id: r.user_id,
          whiskey_name: r.whiskey_name,
          rating: r.rating,
          created_at: r.created_at,
        }))
      );
      setTopWhiskies((topData as TopWhiskeyRow[] | null) ?? []);
      const rawAllTastings =
        (mostRatedData as {
          whiskey_name: string | null;
          rating: number | null;
          user_id: string | null;
        }[] | null) ?? [];
      setAllTastings(rawAllTastings);
      setMostRatedWhiskies(buildMostRatedRows(rawAllTastings));
      setCanViewHostAnalytics(hasAccess);
      setLoading(false);
    }

    void loadEventPage();

    return () => {
      mounted = false;
    };
  }, [eventId]);

  const summary = useMemo(() => {
    const tastingCount = allTastings.length;
    const uniqueNames = new Set(
      allTastings.map((r) => (r.whiskey_name ?? "").trim()).filter(Boolean)
    ).size;
    const uniqueUsers = new Set(
      allTastings.map((r) => r.user_id).filter((id): id is string => Boolean(id))
    ).size;
    const ratedRows = allTastings.filter(
      (r): r is { whiskey_name: string | null; rating: number; user_id: string | null } =>
        r.rating != null
    );
    const averageRating =
      ratedRows.length > 0
        ? ratedRows.reduce((sum, r) => sum + r.rating, 0) / ratedRows.length
        : null;

    return {
      tastingCount,
      uniqueNames,
      uniqueUsers,
      averageRating,
    };
  }, [allTastings]);

  return {
    loading,
    error,
    event,
    recent,
    topWhiskies,
    mostRatedWhiskies,
    canViewHostAnalytics,
    summary,
  };
}