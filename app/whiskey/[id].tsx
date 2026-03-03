// app/whiskey/[id].tsx
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

import {
  hapticError,
  hapticTick,
  withSuccess,
  withTick,
} from "../../lib/hapticsPress";

/* ---------- CACHE ---------- */

// Simple in-memory cache so opening the same whiskey feels instant.
type WhiskeyProfileCacheEntry = {
  whiskeyId: string;
  headerNameRaw: string;
  details: {
    distillery: string | null;
    category: string | null;
    region: string | null;
    subRegion: string | null;
    style: string | null;
    proofLabel: string | null;
    ageLabel: string | null;
  };
  bhh: { score: number | null; youtubeUrl: string | null };
  community: { total: number; avg: number | null };
  recent: TastingSupabaseRow[];
  cachedAt: number;
};

// module-level cache (persists while app is running)
const whiskeyProfileCache = new Map<string, WhiskeyProfileCacheEntry>();

/* ---------- HELPERS ---------- */

function asString(v: string | string[] | undefined) {
  if (Array.isArray(v)) return v[0];
  return v;
}

function isUuidLike(id: string) {
  return typeof id === "string" && id.length === 36 && id.includes("-");
}

function formatCreatedAt(v: string | number | null | undefined) {
  if (v == null) return "";
  const d = typeof v === "number" ? new Date(v) : new Date(String(v));
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function toDisplayTitleCase(input: string) {
  const s = String(input ?? "").trim();
  if (!s) return "";

  const words = s.split(/\s+/g);

  return words
    .map((w) => {
      if (!w) return w;

      if (/^\d+([a-zA-Z]{0,3})$/.test(w)) return w;
      if (/^[A-Z0-9]+$/.test(w) && w.length <= 4) return w;

      const parts = w.split(/([-/'()])/g);
      return parts
        .map((p) => {
          if (!p) return p;
          if (p === "-" || p === "/" || p === "'" || p === "(" || p === ")")
            return p;

          if (/^\d+([a-zA-Z]{0,3})$/.test(p)) return p;
          if (/^[A-Z0-9]+$/.test(p) && p.length <= 4) return p;

          const lower = p.toLowerCase();
          return lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join("");
    })
    .join(" ");
}

function formatProof(v: any): string | null {
  if (v == null) return null;

  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;
    if (/proof/i.test(s) || /%/.test(s)) return s;
    const n = Number(s);
    if (Number.isFinite(n)) return formatProof(n);
    return s;
  }

  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;

  if (n >= 50) return `${Math.round(n)} proof`;
  if (n > 0 && n < 50) return `${Math.round(n * 2)} proof`;

  return null;
}

function formatAge(v: any): string | null {
  if (v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `${Math.round(n)} year`;
}

function cleanText(v: any): string | null {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

/* ---------- THEME TOKENS ---------- */

// Use your new “glass” tokens if present, but make cards more opaque/clean.
const surface =
  (colors as any).glassRaised ?? (colors as any).surfaceRaised ?? colors.surface;
const sunken = (colors as any).glassSunken ?? colors.highlight;

const border = (colors as any).glassBorder ?? colors.divider;
const divider = (colors as any).glassDivider ?? colors.divider;

/* ---------- UI ATOMS ---------- */

function SectionDivider() {
  return <View style={{ height: 1, backgroundColor: divider, opacity: 0.65 }} />;
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: spacing.lg,
        paddingVertical: 7, // tighter
      }}
    >
      <Text style={[type.caption, { opacity: 0.7 }]}>{label}</Text>
      <Text
        style={[type.body, { fontWeight: "900", opacity: 0.96 }]}
        numberOfLines={1}
      >
        {value ?? "—"}
      </Text>
    </View>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 14,
        borderRadius: radii.md,
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: colors.accent,
        borderWidth: 1,
        borderColor: border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text style={[type.button, { color: colors.background }]}>{label}</Text>
    </Pressable>
  );
}

function FlatCard({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flex: 1, // 👈 important for equal height
        backgroundColor: surface,
        borderRadius: (radii as any).xl ?? radii.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: border,
        ...shadows.card,
        gap: spacing.md,
      }}
    >
      {children}
    </View>
  );
}

function SummaryCard({
  title,
  bigValue,
  bigLabel,
  rightBadge,
  footnote,
  onFootnotePress,
}: {
  title: string;
  bigValue: string;
  bigLabel: string;
  rightBadge?: string | null;
  footnote?: string | null;
  onFootnotePress?: (() => void) | undefined;
}) {
  return (
    <FlatCard>
      <View
        style={{
          flex: 1,
          gap: 10,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Header */}
        <View style={{ width: "100%", gap: 8, alignItems: "center" }}>
          <Text
            style={[type.sectionHeader, { fontSize: 16, textAlign: "center" }]}
            numberOfLines={1}
          >
            {title}
          </Text>

          {rightBadge ? (
            <View
              style={{
                paddingVertical: 5,
                paddingHorizontal: 10,
                borderRadius: 999,
                backgroundColor: sunken,
                borderWidth: 1,
                borderColor: border,
                maxWidth: "100%",
              }}
            >
              <Text
                style={[type.caption, { fontWeight: "800", opacity: 0.9 }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {rightBadge}
              </Text>
            </View>
          ) : null}

          {/* Short centered divider */}
          <View
            style={{
              width: 70,
              height: 1,
              backgroundColor: divider,
              opacity: 0.55,
            }}
          />
        </View>

        {/* Main stat */}
        <View style={{ alignItems: "center", gap: 6 }}>
          <Text style={[type.caption, { opacity: 0.72, textAlign: "center" }]}>
            {bigLabel}
          </Text>

          <Text
            style={[
              type.screenTitle,
              { fontSize: 40, lineHeight: 44, textAlign: "center" },
            ]}
          >
            {bigValue}
          </Text>
        </View>

        {/* Footnote pill (same size across both cards) */}
        {footnote ? (
          <Pressable
            onPress={onFootnotePress}
            disabled={!onFootnotePress}
            hitSlop={10}
            style={({ pressed }) => ({
              width: "100%",
              alignSelf: "center",
              opacity: onFootnotePress ? (pressed ? 0.7 : 0.95) : 0.85,
              paddingVertical: 10,
              paddingHorizontal: 10,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: border,
              backgroundColor: onFootnotePress ? sunken : "transparent",
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <Text
              style={[
                type.caption,
                { fontWeight: "700", textAlign: "center", opacity: 0.95 },
              ]}
              numberOfLines={1}
            >
              {footnote}
            </Text>
          </Pressable>
        ) : (
          <View style={{ height: 40 }} />
        )}
      </View>
    </FlatCard>
  );
}

/* ---------- TYPES ---------- */

type WhiskeySupabaseRow = {
  id: string;
  display_name: string | null;
  distillery: string | null;
  whiskey_type: string | null;

  category: string | null;
  region: string | null;
  sub_region: string | null;

  proof: number | null;
  age: number | null;
  whiskey_canonical: string | null;
};

type BhhReviewSupabaseRow = {
  whiskey_id?: string | null;
  whiskey_name: string | null;
  rating_100?: number | null;
  youtube_url?: string | null;
  published_at?: string | null;
};

type TastingSupabaseRow = {
  id: string;
  user_id?: string | null;
  whiskey_id?: string | null;
  rating?: number | null;
  created_at?: string | null;
};

/* ---------- SCREEN ---------- */

export default function WhiskeyDetailScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    name?: string | string[];
  }>();

  const routeId = (asString(params.id) ?? "").trim();
  const typedName = (asString(params.name) ?? "").trim();

  const [loading, setLoading] = useState(true);
  const [statusError, setStatusError] = useState<string>("");

  const [whiskeyId, setWhiskeyId] = useState<string>("");

  const [headerNameRaw, setHeaderNameRaw] = useState<string>("");
  const headerName = useMemo(() => {
    const fallback =
      headerNameRaw ||
      typedName ||
      (isUuidLike(routeId) ? "" : routeId.replace(/-/g, " ")) ||
      "Whiskey";
    return toDisplayTitleCase(fallback);
  }, [headerNameRaw, typedName, routeId]);

  const [details, setDetails] = useState<{
    distillery: string | null;
    category: string | null;
    region: string | null;
    subRegion: string | null;
    style: string | null;
    proofLabel: string | null;
    ageLabel: string | null;
  }>({
    distillery: null,
    category: null,
    region: null,
    subRegion: null,
    style: null,
    proofLabel: null,
    ageLabel: null,
  });

  const [bhh, setBhh] = useState<{ score: number | null; youtubeUrl: string | null }>({
    score: null,
    youtubeUrl: null,
  });

  const [community, setCommunity] = useState<{ total: number; avg: number | null }>({
    total: 0,
    avg: null,
  });

  const [recent, setRecent] = useState<TastingSupabaseRow[]>([]);

  // dev strict-mode + navigation remount guard (once per routeId)
  const fetchedOnceRef = useRef<Set<string>>(new Set());

  const logThisWhiskey = async () => {
    await hapticTick();
    router.push(
      `/log/cloud-tasting?whiskeyName=${encodeURIComponent(
        headerName
      )}&whiskeyId=${encodeURIComponent(whiskeyId || routeId)}&lockName=1`
    );
  };

  const editTasting = async (tastingId: string) => {
    await hapticTick();
    router.push(`/log/cloud-tasting?tastingId=${encodeURIComponent(tastingId)}`);
  };

  const openYouTube = async () => {
    if (!bhh.youtubeUrl) return;
    await hapticTick();
    try {
      await Linking.openURL(bhh.youtubeUrl);
    } catch {
      await hapticError();
    }
  };

  const metaLine = useMemo(() => {
    const parts: string[] = [];
    if (details.style) parts.push(details.style);
    if (details.region) parts.push(details.region);
    return parts.join(" • ");
  }, [details.region, details.style]);

  useEffect(() => {
    let alive = true;

    // 1) Hydrate instantly from cache if we have it
    const cached = routeId ? whiskeyProfileCache.get(routeId) : null;
    if (cached) {
      setWhiskeyId(cached.whiskeyId);
      setHeaderNameRaw(cached.headerNameRaw);
      setDetails(cached.details);
      setBhh(cached.bhh);
      setCommunity(cached.community);
      setRecent(cached.recent);
      setStatusError("");
      setLoading(false);
    }

    // 2) Prevent duplicate fetches in dev StrictMode (and quick back/forth)
    if (routeId && fetchedOnceRef.current.has(routeId) && cached) {
      return () => {
        alive = false;
      };
    }
    if (routeId) fetchedOnceRef.current.add(routeId);

    (async () => {
      // If we don't have cache, show loader; if we do, keep UI stable while refreshing quietly.
      if (!cached) setLoading(true);
      setStatusError("");

      try {
        if (!routeId) throw new Error("Missing whiskey id.");

        let w: WhiskeySupabaseRow | null = null;

        const whiskeySelect =
          "id, display_name, distillery, whiskey_type, category, region, sub_region, proof, age, whiskey_canonical";

        if (isUuidLike(routeId)) {
          const { data, error } = await supabase
            .from("whiskeys")
            .select(whiskeySelect)
            .eq("id", routeId)
            .maybeSingle();
          if (error) throw new Error(error.message);
          w = (data as any) as WhiskeySupabaseRow | null;
        } else {
          const { data, error } = await supabase
            .from("whiskeys")
            .select(whiskeySelect)
            .eq("whiskey_canonical", routeId)
            .maybeSingle();
          if (error) throw new Error(error.message);
          w = (data as any) as WhiskeySupabaseRow | null;
        }

        if (!alive) return;
        if (!w?.id) throw new Error("Whiskey not found in whiskeys table.");

        const nextWhiskeyId = String(w.id);

        const nameFromWhiskeys = w.display_name ? String(w.display_name).trim() : "";
        const nextHeaderNameRaw = nameFromWhiskeys;

        const nextDetails = {
          distillery: cleanText(w.distillery),
          category: cleanText(w.category),
          region: cleanText(w.region),
          subRegion: cleanText(w.sub_region),
          style: cleanText(w.whiskey_type),
          proofLabel: formatProof(w.proof),
          ageLabel: formatAge(w.age),
        };

        setWhiskeyId(nextWhiskeyId);
        setHeaderNameRaw(nextHeaderNameRaw);
        setDetails(nextDetails);

        const { data: bhhRows, error: bhhErr } = await supabase
          .from("bhh_reviews")
          .select("whiskey_id, whiskey_name, rating_100, youtube_url, published_at")
          .eq("whiskey_id", w.id)
          .limit(1000);

        if (!alive) return;
        if (bhhErr) throw new Error(bhhErr.message);

        const rows = (((bhhRows as any) ?? []) as BhhReviewSupabaseRow[]) ?? [];

        const bestByScore = [...rows].sort(
          (a, b) => Number(b.rating_100 ?? 0) - Number(a.rating_100 ?? 0)
        )[0];

        const bestByDate = [...rows].sort((a, b) => {
          const ad = a.published_at ? Date.parse(a.published_at) : 0;
          const bd = b.published_at ? Date.parse(b.published_at) : 0;
          return bd - ad;
        })[0];

        const chosen = bestByScore ?? bestByDate ?? null;

        const nextBhh = {
          score:
            chosen?.rating_100 != null && Number.isFinite(Number(chosen.rating_100))
              ? Math.round(Number(chosen.rating_100))
              : null,
          youtubeUrl: chosen?.youtube_url ? String(chosen.youtube_url) : null,
        };

        setBhh(nextBhh);

        const { data: cs, error: csErr } = await supabase
          .from("whiskey_community_stats")
          .select("community_avg, community_count")
          .eq("whiskey_id", w.id)
          .maybeSingle();

        if (csErr) throw new Error(csErr.message);

        const total =
          cs?.community_count == null || !Number.isFinite(Number(cs.community_count))
            ? 0
            : Number(cs.community_count);

        const avg =
          cs?.community_avg == null || !Number.isFinite(Number(cs.community_avg))
            ? null
            : Math.round(Number(cs.community_avg) * 10) / 10;

        const nextCommunity = { total, avg };
        setCommunity(nextCommunity);

        let nextRecent: TastingSupabaseRow[] = [];
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;

        if (user?.id) {
          const { data: recentRows, error: recentErr } = await supabase
            .from("tastings")
            .select("id, user_id, whiskey_id, rating, created_at")
            .eq("user_id", user.id)
            .eq("whiskey_id", w.id)
            .order("created_at", { ascending: false })
            .limit(10);

          if (recentErr) throw new Error(recentErr.message);
          nextRecent = (((recentRows as any) as TastingSupabaseRow[]) ?? []) as TastingSupabaseRow[];
          setRecent(nextRecent);
        } else {
          setRecent([]);
        }

        // Cache computed snapshot (so next open is instant)
        whiskeyProfileCache.set(routeId, {
          whiskeyId: nextWhiskeyId,
          headerNameRaw: nextHeaderNameRaw,
          details: nextDetails,
          bhh: nextBhh,
          community: nextCommunity,
          recent: nextRecent,
          cachedAt: Date.now(),
        });
      } catch (e: any) {
        console.log("Whiskey profile load failed:", e?.message ?? e);
        if (alive) setStatusError(String(e?.message ?? e));
        await hapticError();
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [routeId]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "transparent" }}>
      <Stack.Screen options={{ title: "Whiskey Profile" }} />

      <View
        style={{
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
          paddingBottom: spacing.xl,
          gap: spacing.md,
        }}
      >
        {loading ? (
          <View style={{ paddingVertical: spacing.lg }}>
            <ActivityIndicator />
            <Text style={[type.body, { marginTop: spacing.sm, opacity: 0.7 }]}>
              Loading whiskey…
            </Text>
          </View>
        ) : null}

        {statusError ? (
          <Text style={[type.body, { opacity: 0.75 }]}>Error: {statusError}</Text>
        ) : null}

        {/* HERO */}
        <View style={{ alignItems: "center", paddingTop: 6 }}>
          <Text style={[type.screenTitle, { textAlign: "center" }]}>
            {headerName}
          </Text>

          <View
            style={{
              width: 220,
              height: 4,
              borderRadius: 999,
              backgroundColor: colors.accent,
              opacity: 0.65,
              marginTop: 10,
            }}
          />

          {metaLine ? (
            <Text
              style={[
                type.microcopyItalic,
                { opacity: 0.74, marginTop: 10, textAlign: "center" },
              ]}
            >
              {metaLine}
            </Text>
          ) : null}
        </View>

        {/* CTA */}
        <View style={{ marginTop: 6 }}>
          <PrimaryButton
            label="Log a Tasting"
            onPress={withSuccess(logThisWhiskey)}
          />
        </View>

        {/* Bottle details */}
        <View style={{ gap: 5, marginTop: 4 }}>
          <Text style={[type.sectionHeader, { fontSize: 20 }]}>
            Bottle details
          </Text>
          <SectionDivider />
          <Row label="Distillery" value={details.distillery} />
          <Row label="Category" value={details.category} />
          <Row label="Region" value={details.region} />
          <Row label="Sub-Region" value={details.subRegion} />
          <Row label="Style" value={details.style} />
          <Row label="Proof" value={details.proofLabel} />
          <Row label="Age" value={details.ageLabel} />
        </View>

        {/* Accent divider */}
        <View style={{ marginTop: spacing.sm }}>
          <View
            style={{
              height: 2,
              marginTop: 8,
              alignSelf: "center",
              width: "92%",
              backgroundColor: "rgba(190, 150, 99, 0.14)",
              borderRadius: 999,
              opacity: 0.55,
            }}
          />
          <View
            style={{
              height: 2,
              marginTop: -2,
              alignSelf: "center",
              width: "44%",
              backgroundColor: "rgba(190, 150, 99, 0.38)",
              borderRadius: 999,
              opacity: 0.65,
            }}
          />
        </View>

        {/* Community + BHH */}
        <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <SummaryCard
              title="Community"
              bigLabel="Average"
              bigValue={community.avg != null ? String(community.avg) : "—"}
              footnote={`Reviews: ${community.total}`}
            />
          </View>

          <View style={{ flex: 1 }}>
            <SummaryCard
              title="Buffalo Happy Hour"
              bigLabel="Score"
              bigValue={bhh.score != null ? String(bhh.score) : "—"}
              footnote={bhh.youtubeUrl ? "Watch Review" : "No video yet"}
              onFootnotePress={bhh.youtubeUrl ? withTick(openYouTube) : undefined}
            />
          </View>
        </View>

        {/* Recent Tastings */}
        <View style={{ gap: 8, marginTop: spacing.md }}>
          <Text style={[type.sectionHeader, { fontSize: 20 }]}>Recent Tastings</Text>

          {recent.length === 0 ? (
            <Text style={[type.body, { opacity: 0.7 }]}>
              None yet — log your first tasting.
            </Text>
          ) : (
            <View style={{ gap: spacing.md }}>
              {recent.map((t, idx) => (
                <Pressable
                  key={`${t.id}:${idx}`}
                  onPress={withTick(() => editTasting(String(t.id)))}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? sunken : surface,
                    borderRadius: radii.md,
                    padding: spacing.lg,
                    borderWidth: 1,
                    borderColor: border,
                    ...shadows.card,
                    opacity: pressed ? 0.98 : 1,
                    gap: 6,
                  })}
                >
                  <Text style={[type.body, { fontWeight: "900" }]}>
                    Rating: {t.rating ?? "—"}
                  </Text>

                  {t.created_at ? (
                    <Text style={[type.caption, { opacity: 0.72 }]}>
                      {formatCreatedAt(t.created_at)}
                    </Text>
                  ) : null}

                  <Text style={[type.caption, { opacity: 0.6 }]}>Tap to edit</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}