console.log("✅ discover.service.ts LOADED (community-only highest)");
// src/discover/services/discover.service.ts
import { supabase } from "../../../lib/supabase";
import { isUuidLike } from "../utils/discover.utils";

/** ---------- Types ---------- */

export type WhiskeyCardRow = {
  whiskeyId: string;
  whiskeyName: string;
  whiskeyType: string | null;
  proof: number | null;

  communityAvg: number | null;
  communityCount: number;

  bhhScore: number | null;

  // Personal / optional
  userTastingCount?: number;
  userLastTastedAt?: string | null;
};

export type SectionKey = "TRENDING" | "RECENT" | "HIGHEST" | "NEWEST";

/** ---------- Small helpers ---------- */

function asNumberOrNull(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function asNumberOrZero(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * “Viable” in beta means: not dead / not filler.
 * We consider a whiskey viable if it has *any* useful detail:
 * - community stats OR BHH score
 */
export function isViableCard(r: WhiskeyCardRow) {
  const hasCommunity = r.communityAvg != null && r.communityCount > 0;
  const hasBhh = r.bhhScore != null && Number.isFinite(Number(r.bhhScore));
  return hasCommunity || hasBhh;
}

/** ---------- Core fetch: cards ---------- */

export async function fetchWhiskeyCardsByIds(idsInOrder: string[]): Promise<WhiskeyCardRow[]> {
  const ids = idsInOrder.filter(isUuidLike);
  if (ids.length === 0) return [];

  // 1) whiskey base data
  const { data: wData, error: wErr } = await supabase
    .from("whiskeys")
    .select("id, display_name, whiskey_type, proof")
    .in("id", ids);

  if (wErr) throw new Error(wErr.message);

  const whiskeyMap = new Map<string, { name: string; wType: string | null; proof: number | null }>();

  (wData as any[]).forEach((w) => {
    const id = String(w.id);
    whiskeyMap.set(id, {
      name: String(w.display_name ?? "Whiskey"),
      wType: w.whiskey_type ? String(w.whiskey_type) : null,
      proof: w.proof == null || !Number.isFinite(Number(w.proof)) ? null : Number(w.proof),
    });
  });

  // 2) community stats (may have NO ROW → that’s fine)
  const { data: cData, error: cErr } = await supabase
    .from("whiskey_community_stats")
    .select("whiskey_id, community_avg, community_count")
    .in("whiskey_id", ids);

  if (cErr) throw new Error(cErr.message);

  const communityMap = new Map<string, { avg: number | null; count: number }>();
  (cData as any[]).forEach((c) => {
    const id = String(c.whiskey_id);
    communityMap.set(id, {
      avg: asNumberOrNull(c.community_avg),
      count: asNumberOrZero(c.community_count),
    });
  });

  // 3) BHH scores
  const { data: bData, error: bErr } = await supabase
    .from("bhh_reviews")
    .select("whiskey_id, rating_100, published_at")
    .in("whiskey_id", ids)
    .limit(2000);

  if (bErr) throw new Error(bErr.message);

  // Keep the “best” BHH score per whiskey, tie-breaker: most recent published_at
  const bhhMap = new Map<string, { score: number | null; publishedAt: number }>();
  (bData as any[]).forEach((b) => {
    const id = b.whiskey_id ? String(b.whiskey_id) : "";
    if (!isUuidLike(id)) return;

    const score = asNumberOrNull(b.rating_100);
    const pub = b.published_at ? Date.parse(String(b.published_at)) : 0;

    const existing = bhhMap.get(id);
    if (!existing) {
      bhhMap.set(id, { score, publishedAt: pub });
      return;
    }

    const exScore = existing.score ?? -Infinity;
    const newScore = score ?? -Infinity;

    if (newScore > exScore) {
      bhhMap.set(id, { score, publishedAt: pub });
      return;
    }
    if (newScore === exScore && pub > existing.publishedAt) {
      bhhMap.set(id, { score, publishedAt: pub });
    }
  });

  // 4) Build output in requested order
  const out: WhiskeyCardRow[] = [];
  idsInOrder.forEach((id) => {
    if (!isUuidLike(id)) return;

    const w = whiskeyMap.get(id);
    if (!w) return;

    const c = communityMap.get(id);
    const b = bhhMap.get(id);

    out.push({
      whiskeyId: id,
      whiskeyName: w.name,
      whiskeyType: w.wType,
      proof: w.proof,
      communityAvg: c?.avg ?? null,
      communityCount: c?.count ?? 0,
      bhhScore: b?.score ?? null,
    });
  });

  return out;
}

/** ---------- Personal cards ---------- */

export async function fetchYourRecentPourCards(
  userId: string,
  limit: number
): Promise<WhiskeyCardRow[]> {
  if (!isUuidLike(userId)) return [];

  const { data, error } = await supabase
    .from("tastings")
    .select("whiskey_id, created_at")
    .eq("user_id", userId)
    .not("whiskey_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);

  const rollup = new Map<string, { count: number; lastTastedAt: string | null }>();

  (data as any[]).forEach((row) => {
    const whiskeyId = row.whiskey_id ? String(row.whiskey_id) : "";
    if (!isUuidLike(whiskeyId)) return;

    const createdAt = row.created_at ? String(row.created_at) : null;
    const existing = rollup.get(whiskeyId);

    if (!existing) {
      rollup.set(whiskeyId, {
        count: 1,
        lastTastedAt: createdAt,
      });
      return;
    }

    existing.count += 1;

    if (
      createdAt &&
      (!existing.lastTastedAt || Date.parse(createdAt) > Date.parse(existing.lastTastedAt))
    ) {
      existing.lastTastedAt = createdAt;
    }
  });

  const orderedIds = Array.from(rollup.entries())
    .sort((a, b) => {
      const aTime = a[1].lastTastedAt ? Date.parse(a[1].lastTastedAt) : 0;
      const bTime = b[1].lastTastedAt ? Date.parse(b[1].lastTastedAt) : 0;
      return bTime - aTime;
    })
    .slice(0, limit)
    .map(([id]) => id);

  const baseCards = await fetchWhiskeyCardsByIds(orderedIds);

  return baseCards.map((card) => {
    const personal = rollup.get(card.whiskeyId);

    return {
      ...card,
      userTastingCount: personal?.count ?? 0,
      userLastTastedAt: personal?.lastTastedAt ?? null,
    };
  });
}
export type AtHomeRow = {
  whiskeyId: string;
  whiskeyName: string;
  whiskeyType: string | null;
  proof: number | null;
  rating: number | null;
  lastTastedAt: string | null;
};

export async function fetchAtHomeRows(limit: number): Promise<AtHomeRow[]> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return [];

  const { data, error } = await supabase
    .from("tastings")
    .select("whiskey_id, rating, created_at, purchase_type")
    .eq("user_id", user.id)
    .eq("purchase_type", "retail_bottle")
    .not("whiskey_id", "is", null)
    .limit(1000);

  if (error) throw new Error(error.message);

  const rollup = new Map<
    string,
    { count: number; lastTastedAt: string | null; rating: number | null }
  >();

  (data as any[]).forEach((row) => {
    const whiskeyId = row.whiskey_id ? String(row.whiskey_id) : "";
    if (!isUuidLike(whiskeyId)) return;

    const createdAt = row.created_at ? String(row.created_at) : null;
    const rating =
      row.rating == null || !Number.isFinite(Number(row.rating))
        ? null
        : Number(row.rating);

    const existing = rollup.get(whiskeyId);

    if (!existing) {
      rollup.set(whiskeyId, {
        count: 1,
        lastTastedAt: createdAt,
        rating,
      });
      return;
    }

    existing.count += 1;

    if (
      createdAt &&
      (!existing.lastTastedAt || Date.parse(createdAt) > Date.parse(existing.lastTastedAt))
    ) {
      existing.lastTastedAt = createdAt;
      existing.rating = rating ?? existing.rating;
    }
  });

  const orderedIds = Array.from(rollup.entries())
    .filter(([, v]) => v.count === 1)
    .sort((a, b) => {
      const aTime = a[1].lastTastedAt ? Date.parse(a[1].lastTastedAt) : 0;
      const bTime = b[1].lastTastedAt ? Date.parse(b[1].lastTastedAt) : 0;
      return aTime - bTime; // oldest first
    })
    .slice(0, limit)
    .map(([id]) => id);

  if (orderedIds.length === 0) return [];

  const baseCards = await fetchWhiskeyCardsByIds(orderedIds);
  const metaMap = new Map(rollup);

  return baseCards.map((card) => {
    const meta = metaMap.get(card.whiskeyId);

    return {
      whiskeyId: card.whiskeyId,
      whiskeyName: card.whiskeyName,
      whiskeyType: card.whiskeyType,
      proof: card.proof,
      rating: meta?.rating ?? null,
      lastTastedAt: meta?.lastTastedAt ?? null,
    };
  });
}
/** ---------- Fetch section IDs ---------- */

export async function fetchTrendingIds(limit: number): Promise<string[]> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("public_tastings")
    .select("whiskey_id, created_at")
    .gte("created_at", since)
    .limit(5000);

  if (error) throw new Error(error.message);

  const counts = new Map<string, number>();
  (data as any[]).forEach((t) => {
    const id = t.whiskey_id ? String(t.whiskey_id) : "";
    if (!isUuidLike(id)) return;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
}

export async function fetchRecentIds(limit: number): Promise<string[]> {
  const { data, error } = await supabase
    .from("public_tastings")
    .select("whiskey_id, created_at")
    .order("created_at", { ascending: false })
    .limit(Math.max(300, limit * 20));

  if (error) throw new Error(error.message);

  const ids: string[] = [];
  const seen = new Set<string>();

  (data as any[]).forEach((t) => {
    const id = t.whiskey_id ? String(t.whiskey_id) : "";
    if (!isUuidLike(id)) return;
    if (seen.has(id)) return;
    seen.add(id);
    ids.push(id);
  });

  return ids.slice(0, limit);
}

export async function fetchNewestIds(limit: number): Promise<string[]> {
  const { data, error } = await supabase
    .from("whiskeys")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data as any[]).map((w) => String(w.id)).filter(isUuidLike);
}

/**
 * Community “Highest” IDs only.
 * NOTE: This will return nothing for whiskies that do not have a stats row.
 */
export async function fetchHighestCommunityIds(limit: number, minCount: number): Promise<string[]> {
  const { data, error } = await supabase
    .from("whiskey_community_stats")
    .select("whiskey_id, community_avg, community_count")
    .gte("community_count", minCount)
    .not("community_avg", "is", null)
    .order("community_avg", { ascending: false })
    .limit(limit);
  console.log("✅ fetchHighestCommunityIds called");

  if (error) throw new Error(error.message);

  return (data as any[]).map((r) => String(r.whiskey_id)).filter(isUuidLike);
}

/**
 * BHH fallback: top reviewed by rating_100 (ignore nulls).
 */
export async function fetchHighestBhhIds(limit: number): Promise<string[]> {
  const { data, error } = await supabase
    .from("bhh_reviews")
    .select("whiskey_id, rating_100")
    .not("rating_100", "is", null)
    .order("rating_100", { ascending: false })
    .limit(Math.max(limit * 3, 200)); // grab extra and dedupe

  if (error) throw new Error(error.message);

  const ids: string[] = [];
  const seen = new Set<string>();

  (data as any[]).forEach((r) => {
    const id = r.whiskey_id ? String(r.whiskey_id) : "";
    if (!isUuidLike(id)) return;
    if (seen.has(id)) return;
    seen.add(id);
    ids.push(id);
  });

  return ids.slice(0, limit);
}

/**
 * Beta rule:
 * - If 10+ whiskies have community_count >= 5, enforce minCount=5
 * - Otherwise relax to minCount=1 so "Highest Rated" isn't dead
 */
async function pickCommunityMinCount(): Promise<number> {
  const STRICT = 5;
  const RELAXED = 1;
  const NEED_AT_LEAST = 10;

  const { count, error } = await supabase
    .from("whiskey_community_stats")
    .select("whiskey_id", { count: "exact", head: true })
    .gte("community_count", STRICT)
    .not("community_avg", "is", null);

  if (error) return RELAXED;

  return (count ?? 0) >= NEED_AT_LEAST ? STRICT : RELAXED;
}

/**
 * THE one function you should use for Highest Rated.
 * Community-first, fill remainder with BHH (deduped).
 */
export async function fetchHighestIds(limit: number): Promise<string[]> {
  const minCount = await pickCommunityMinCount();

  // 1) Community-first
  const communityIds = await fetchHighestCommunityIds(limit, minCount);
  if (communityIds.length >= limit) return communityIds.slice(0, limit);

  // 2) Fill remainder with BHH (dedupe)
  const need = limit - communityIds.length;
  const bhhIds = await fetchHighestBhhIds(Math.max(need * 2, need));
  const seen = new Set(communityIds);

  const merged: string[] = [...communityIds];
  for (const id of bhhIds) {
    if (merged.length >= limit) break;
    if (seen.has(id)) continue;
    seen.add(id);
    merged.push(id);
  }

  return merged.slice(0, limit);
}