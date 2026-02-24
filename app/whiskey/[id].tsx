// app/whiskey/[id].tsx
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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

// ✅ Haptics (note: this is a .ts file)
import { hapticError, hapticTick, withSuccess, withTick } from "../../lib/hapticsPress";

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

/**
 * Title-case for whiskey names while preserving acronyms / short all-caps:
 * - Keeps ALL CAPS short words (<=4) like BIB, BHH, USA, BP
 * - Keeps numeric tokens like 12, 114, 12YR
 */
function toDisplayTitleCase(input: string) {
  const s = String(input ?? "").trim();
  if (!s) return "";

  const words = s.split(/\s+/g);

  return words
    .map((w) => {
      if (!w) return w;

      // keep "12", "114", "12YR"
      if (/^\d+([a-zA-Z]{0,3})$/.test(w)) return w;

      // keep acronyms like "BIB", "BP"
      if (/^[A-Z0-9]+$/.test(w) && w.length <= 4) return w;

      // preserve punctuation chunks
      const parts = w.split(/([-/'()])/g);
      return parts
        .map((p) => {
          if (!p) return p;
          if (p === "-" || p === "/" || p === "'" || p === "(" || p === ")") return p;

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

  // allow already-formatted strings
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

  // likely proof
  if (n >= 50) return `${Math.round(n)} proof`;

  // likely ABV
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

/* ---------- UI ATOMS ---------- */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.divider,
        ...shadows.card,
        gap: spacing.md,
      }}
    >
      {children}
    </View>
  );
}

function SoftButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: spacing.md,
        borderRadius: radii.md,
        alignItems: "center",
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.divider,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Text style={[type.button, { color: colors.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: spacing.md,
        borderRadius: radii.md,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.accent,
        borderWidth: 1,
        borderColor: colors.divider,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Text style={[type.button, { color: colors.background }]}>{label}</Text>
    </Pressable>
  );
}

/* ---------- TYPES (Supabase) ---------- */

type WhiskeySupabaseRow = {
  id: string;
  display_name: string | null;
  distillery: string | null;

  // Legacy/secondary (we show as "Style" if present)
  whiskey_type: string | null;

  // New taxonomy
  category: string | null;
  region: string | null;
  sub_region: string | null;

  proof: number | null;
  age: number | null;
  whiskey_canonical: string | null;
};

type BhhReviewSupabaseRow = {
  whiskey_id?: string | null; // uuid
  whiskey_canonical?: string | null; // legacy / optional
  whiskey_name: string | null;
  distillery?: string | null;
  whiskey_type?: string | null;
  proof?: number | string | null;
  rating_100?: number | null;
  youtube_url?: string | null;
  published_at?: string | null;
};

type TastingSupabaseRow = {
  id: string;
  user_id?: string | null;
  whiskey_id?: string | null;
  whiskey_name?: string | null;
  rating?: number | null;
  created_at?: string | null;
};

/* ---------- SCREEN ---------- */

export default function WhiskeyDetailScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    name?: string | string[];
  }>();

  const routeId = (asString(params.id) ?? "").trim(); // could be uuid or legacy canonical
  const typedName = (asString(params.name) ?? "").trim();

  const [loading, setLoading] = useState(true);
  const [statusError, setStatusError] = useState<string>("");

  const [whiskeyId, setWhiskeyId] = useState<string>(""); // always uuid when we can resolve it

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
    style: string | null; // legacy whiskey_type shown as "Style"
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

  const [bhh, setBhh] = useState<{
    score: number | null;
    youtubeUrl: string | null;
  }>({ score: null, youtubeUrl: null });

  const [community, setCommunity] = useState<{ total: number; avg: number | null }>({
    total: 0,
    avg: null,
  });

  const [recent, setRecent] = useState<TastingSupabaseRow[]>([]);

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

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setStatusError("");

      try {
        if (!routeId) throw new Error("Missing whiskey id.");

        // -----------------------------
        // 1) Resolve whiskey record FIRST (authoritative)
        // -----------------------------
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
          // legacy fallback: routeId might be whiskey_canonical
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

        setWhiskeyId(String(w.id));

        const nameFromWhiskeys = w.display_name ? String(w.display_name).trim() : "";
        setHeaderNameRaw(nameFromWhiskeys);

        setDetails({
          distillery: cleanText(w.distillery),
          category: cleanText(w.category),
          region: cleanText(w.region),
          subRegion: cleanText(w.sub_region),
          style: cleanText(w.whiskey_type),
          proofLabel: formatProof(w.proof),
          ageLabel: formatAge(w.age),
        });

        // -----------------------------
        // 2) BHH (optional) by whiskey_id (uuid)
        // -----------------------------
        const { data: bhhRows, error: bhhErr } = await supabase
          .from("bhh_reviews")
          .select(
            "whiskey_id, whiskey_canonical, whiskey_name, distillery, whiskey_type, proof, rating_100, youtube_url, published_at"
          )
          .eq("whiskey_id", w.id)
          .limit(1000);

        if (!alive) return;
        if (bhhErr) throw new Error(bhhErr.message);

        const rows = (((bhhRows as any) ?? []) as BhhReviewSupabaseRow[]) ?? [];

        const bestByScore = [...rows].sort((a, b) => {
          const as = Number(a.rating_100 ?? 0);
          const bs = Number(b.rating_100 ?? 0);
          return bs - as;
        })[0];

        const bestByDate = [...rows].sort((a, b) => {
          const ad = a.published_at ? Date.parse(a.published_at) : 0;
          const bd = b.published_at ? Date.parse(b.published_at) : 0;
          return bd - ad;
        })[0];

        const chosen = bestByScore ?? bestByDate ?? null;

        // If whiskeys.display_name was empty (shouldn't be), allow BHH whiskey_name to fill it.
        const nameFromBhh = (chosen?.whiskey_name && String(chosen.whiskey_name).trim()) || "";
        if (!nameFromWhiskeys && nameFromBhh) setHeaderNameRaw(nameFromBhh);

        setBhh({
          score:
            chosen?.rating_100 != null && Number.isFinite(Number(chosen.rating_100))
              ? Math.round(Number(chosen.rating_100))
              : null,
          youtubeUrl: chosen?.youtube_url ? String(chosen.youtube_url) : null,
        });

        // -----------------------------
        // 3) Community snapshot from view (preferred)
        // -----------------------------
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

        setCommunity({ total, avg });

        // -----------------------------
        // 4) Your recent tastings for this whiskey (uuid)
        // -----------------------------
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;

        if (user?.id) {
          const { data: recentRows, error: recentErr } = await supabase
            .from("tastings")
            .select("id, user_id, whiskey_id, whiskey_name, rating, created_at")
            .eq("user_id", user.id)
            .eq("whiskey_id", w.id)
            .order("created_at", { ascending: false })
            .limit(10);

          if (recentErr) throw new Error(recentErr.message);

          setRecent(((recentRows as any) as TastingSupabaseRow[]) ?? []);
        } else {
          setRecent([]);
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: "Whiskey Profile" }} />

      <View style={{ padding: spacing.xl, gap: spacing.lg }}>
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

        {/* Whiskey Name + Details + Log a Tasting */}
        <Card>
          <Text style={type.screenTitle}>{headerName}</Text>

          <View
            style={{
              marginTop: spacing.md,
              gap: 8,
              paddingTop: spacing.md,
              borderTopWidth: 1,
              borderTopColor: colors.divider,
            }}
          >
            <Text style={[type.body, { opacity: 0.8 }]}>
              Distillery:{" "}
              <Text style={{ fontWeight: "900" }}>{details.distillery ?? "—"}</Text>
            </Text>

            <Text style={[type.body, { opacity: 0.8 }]}>
              Category:{" "}
              <Text style={{ fontWeight: "900" }}>{details.category ?? "—"}</Text>
            </Text>

            <Text style={[type.body, { opacity: 0.8 }]}>
              Region:{" "}
              <Text style={{ fontWeight: "900" }}>{details.region ?? "—"}</Text>
            </Text>

            {details.subRegion ? (
              <Text style={[type.body, { opacity: 0.8 }]}>
                Sub-Region:{" "}
                <Text style={{ fontWeight: "900" }}>{details.subRegion}</Text>
              </Text>
            ) : null}

            {details.style ? (
              <Text style={[type.body, { opacity: 0.8 }]}>
                Style: <Text style={{ fontWeight: "900" }}>{details.style}</Text>
              </Text>
            ) : null}

            <Text style={[type.body, { opacity: 0.8 }]}>
              Proof:{" "}
              <Text style={{ fontWeight: "900" }}>{details.proofLabel ?? "—"}</Text>
            </Text>

            {details.ageLabel ? (
              <Text style={[type.body, { opacity: 0.8 }]}>
                Age: <Text style={{ fontWeight: "900" }}>{details.ageLabel}</Text>
              </Text>
            ) : null}
          </View>

          <View style={{ marginTop: spacing.lg }}>
            <PrimaryButton label="Log a Tasting" onPress={withSuccess(logThisWhiskey)} />
          </View>
        </Card>

        {/* Community Snapshot */}
        <Card>
          <Text style={type.sectionHeader}>Community Snapshot</Text>

          <Text style={[type.body, { opacity: 0.8 }]}>
            Avg:{" "}
            <Text style={{ fontWeight: "900" }}>
              {community.avg != null ? community.avg : "—"}
            </Text>
            {"  •  "}
            Total: <Text style={{ fontWeight: "900" }}>{community.total}</Text>
          </Text>
        </Card>

        {/* Buffalo Happy Hour */}
        <Card>
          <Text style={type.sectionHeader}>Buffalo Happy Hour</Text>

          <Text style={[type.body, { opacity: 0.8 }]}>
            Score: <Text style={{ fontWeight: "900" }}>{bhh.score ?? "—"}</Text>
          </Text>

          {bhh.youtubeUrl ? (
            <SoftButton label="Watch on YouTube" onPress={withTick(openYouTube)} />
          ) : null}
        </Card>

        {/* Recent Tastings */}
        <View style={{ gap: spacing.sm }}>
          <Text style={type.sectionHeader}>Recent Tastings</Text>

          {recent.length === 0 ? (
            <Text style={[type.body, { opacity: 0.7 }]}>
              None yet — log your first tasting.
            </Text>
          ) : (
            recent.map((t, idx) => (
              <Pressable
                key={`${t.id}:${idx}`}
                onPress={withTick(() => editTasting(String(t.id)))}
                style={({ pressed }) => ({
                  backgroundColor: colors.surface,
                  borderRadius: radii.md,
                  padding: spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.divider,
                  ...shadows.card,
                  opacity: pressed ? 0.9 : 1,
                  gap: 6,
                })}
              >
                <Text style={[type.body, { fontWeight: "900" }]}>
                  Rating: {t.rating ?? "—"}
                </Text>

                {t.created_at ? (
                  <Text style={[type.body, { opacity: 0.65, fontSize: 12 }]}>
                    {formatCreatedAt(t.created_at)}
                  </Text>
                ) : null}

                <Text style={[type.body, { opacity: 0.6, fontSize: 12 }]}>Tap to edit</Text>
              </Pressable>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}