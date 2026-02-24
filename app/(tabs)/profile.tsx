// app/(tabs)/profile.tsx
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { isAdmin as checkIsAdmin } from "../../lib/adminApi";
import { fetchMyProfile } from "../../lib/cloudProfile";
import { supabase } from "../../lib/supabase";

import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

// ✅ Haptics (centralized helper)
import {
  hapticError,
  hapticSuccess,
  hapticTick,
  withDanger,
  withSuccess,
  withTick,
} from "../../lib/hapticsPress";

/* ------------------- UI ------------------- */

function Card({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
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
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: spacing.md,
        }}
      >
        <View style={{ gap: spacing.xs, flex: 1 }}>
          <Text style={[type.sectionHeader, { color: colors.textPrimary }]}>{title}</Text>
          {subtitle ? (
            <Text
              style={[
                type.microcopyItalic,
                { fontSize: 16, lineHeight: 22, color: colors.textPrimary },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {right ? <View style={{ paddingTop: 2 }}>{right}</View> : null}
      </View>

      {children}
    </View>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        borderWidth: 1,
        borderColor: colors.divider,
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        ...shadows.card,
        gap: 6,
      }}
    >
      <Text
        style={[
          type.microcopyItalic,
          { opacity: 0.8, textAlign: "center", color: colors.textPrimary },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          type.sectionHeader,
          { fontSize: 22, textAlign: "center", color: colors.textPrimary },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

/* ------------------- Types ------------------- */

type RecentRow = {
  id: string;
  whiskey_name: string | null;
  rating: number | null;
  created_at: string | null;
  whiskey_id?: string | null;
};

type TopRow = {
  id: string;
  whiskey_name: string | null;
  rating: number | null;
  whiskey_id?: string | null;
};

type MixRow = {
  label: string; // category label
  count: number;
  pct: number; // 0..1
  alpha: number;
};

/* ------------------- Helpers ------------------- */

function safeLabel(v: any) {
  const s = String(v ?? "").trim();
  return s || "Unknown";
}

function formatPct(p: number) {
  const v = Math.round(p * 100);
  return `${v}%`;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

/**
 * Convert HEX "#RRGGBB" to rgba(...) with alpha.
 * If hex doesn't parse, fall back to the input string.
 */
function rgba(hex: string, a: number) {
  const h = String(hex ?? "").trim();
  const m = /^#?([0-9a-f]{6})$/i.exec(h);
  if (!m) return h;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const alpha = clamp01(a);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ------------------- Analytical Mix Bar ------------------- */

function MixBar({ rows }: { rows: MixRow[] }) {
  return (
    <View style={{ gap: spacing.md }}>
      <View
        style={{
          height: 16,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.divider,
          backgroundColor: colors.background,
          overflow: "hidden",
          flexDirection: "row",
        }}
      >
        {rows.map((r, idx) => {
          const minPct = r.count > 0 ? 0.03 : 0;
          const widthPct = Math.max(minPct, r.pct);
          const isLast = idx === rows.length - 1;

          return (
            <View
              key={r.label}
              style={{
                width: `${Math.round(widthPct * 100)}%`,
                height: "100%",
                backgroundColor: rgba(colors.accent, r.alpha),
                borderRightWidth: isLast ? 0 : 1,
                borderRightColor: rgba(colors.divider, 0.9),
              }}
            />
          );
        })}
      </View>

      <View style={{ gap: 10 }}>
        {rows.map((r) => (
          <View
            key={r.label}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              borderWidth: 1,
              borderColor: colors.divider,
              borderRadius: radii.md,
              paddingVertical: 10,
              paddingHorizontal: 12,
              backgroundColor: colors.background,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  backgroundColor: rgba(colors.accent, r.alpha),
                  borderWidth: 1,
                  borderColor: colors.divider,
                }}
              />
              <Text
                style={[
                  type.body,
                  { fontWeight: "800", color: colors.textPrimary, flex: 1 },
                ]}
                numberOfLines={1}
              >
                {r.label}
              </Text>
            </View>

            <Text style={[type.body, { color: colors.textPrimary, opacity: 0.9 }]}>
              {r.count} • {formatPct(r.pct)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ------------------- Screen ------------------- */

export default function ProfileTab() {
  const insets = useSafeAreaInsets();

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

  // ✅ Category mix (by whiskeys.category)
  const [mix, setMix] = useState<MixRow[]>([]);
  const [mixTotal, setMixTotal] = useState<number>(0);
  const [mixError, setMixError] = useState<string>("");

  // community sharing state (from profile)
  const [shareAnon, setShareAnon] = useState<boolean>(true);

  // --- Premium long-press action sheet state ---
  const [actionsOpen, setActionsOpen] = useState(false);
  const [actionsRow, setActionsRow] = useState<{ id: string; whiskey_name: string | null } | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

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

    const [profileRes, countRes, ratingsRes, top5Res, recentRes, mixRes] = await Promise.allSettled([
      profilePromise,
      countPromise,
      ratingsPromise,
      top5Promise,
      recentPromise,
      mixPromise,
    ]);

    if (profileRes.status === "fulfilled") {
      const p: any = profileRes.value;
      setDisplayName((p?.display_name ?? "").trim());
      setPrivateName((p?.first_name ?? "").trim());

      const sAnon = typeof p?.share_anonymously === "boolean" ? p.share_anonymously : true;
      setShareAnon(sAnon);
    }

    if (countRes.status === "fulfilled") {
      const { count, error } = countRes.value as any;
      if (!error) setTastingCount(typeof count === "number" ? count : 0);
    }

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

    if (top5Res.status === "fulfilled") {
      const { data: rows, error } = top5Res.value as any;
      if (!error && Array.isArray(rows)) setTop5(rows as any);
      else setTop5([]);
    } else {
      setTop5([]);
    }

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
        const uniqueIds = Array.from(new Set(whiskeyIds));

        const { data: wRows, error: wErr } = await supabase
          .from("whiskeys")
          .select("id, category")
          .in("id", uniqueIds)
          .limit(4000);

        if (wErr) throw new Error(wErr.message);

        const whiskeyToCategory = new Map<string, string>();
        (wRows as any[]).forEach((w) => {
          const id = w?.id ? String(w.id) : "";
          if (!id) return;
          whiskeyToCategory.set(id, safeLabel(w?.category) || "Unknown");
        });

        const counts = new Map<string, number>();
        for (const tRow of rows as any[]) {
          const wid = tRow?.whiskey_id ? String(tRow.whiskey_id) : "";
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

        const alphas = [0.92, 0.78, 0.64, 0.52, 0.42, 0.34, 0.26];

        setMix(
          final.map((r, i) => ({
            label: r.label,
            count: r.count,
            pct: r.count / denom,
            alpha: alphas[Math.min(i, alphas.length - 1)],
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

  const actionsTitle = useMemo(() => {
    const nm = (actionsRow?.whiskey_name ?? "").trim();
    return nm || "Tasting";
  }, [actionsRow]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={[type.body, { marginTop: spacing.sm, opacity: 0.7, color: colors.textPrimary }]}>
          Loading…
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.xl, gap: spacing.xl }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ gap: 6, flex: 1 }}>
            <Text style={[type.screenTitle, { color: colors.textPrimary }]}>{welcomeTitle}</Text>
            <Text style={[type.microcopyItalic, { opacity: 0.85, color: colors.textPrimary }]}>
              Your stats, your palate, your journal.
            </Text>

            {isAuthed ? (
              <Pressable
                onPress={withTick(() => router.push("/account-settings"))}
                style={({ pressed }) => ({
                  marginTop: 8,
                  alignSelf: "flex-start",
                  borderRadius: 999,
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderWidth: 1,
                  borderColor: colors.divider,
                  backgroundColor: pressed ? colors.highlight : colors.surface,
                  opacity: pressed ? 0.92 : 1,
                })}
              >
                <Text style={[type.microcopyItalic, { color: colors.textPrimary, opacity: 0.9 }]}>
                  Community sharing: <Text style={{ fontWeight: "900" }}>{shareAnon ? "On" : "Off"}</Text>
                </Text>
              </Pressable>
            ) : null}
          </View>

          {isAuthed ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
              {isAdmin ? (
                <Pressable
                  onPress={withTick(() => router.push("/admin"))}
                  style={({ pressed }) => ({
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: colors.divider,
                    backgroundColor: colors.surface,
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.textPrimary} />
                </Pressable>
              ) : null}

              <Pressable
                onPress={withTick(() => loadAll({ silent: true }))}
                disabled={refreshing}
                style={({ pressed }) => ({
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: colors.divider,
                  backgroundColor: colors.surface,
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                {refreshing ? <ActivityIndicator size="small" /> : <Ionicons name="refresh" size={18} color={colors.textPrimary} />}
              </Pressable>

              <Pressable
                onPress={withTick(() => router.push("/account-settings"))}
                style={({ pressed }) => ({
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: colors.divider,
                  backgroundColor: colors.surface,
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                <Ionicons name="settings-outline" size={18} color={colors.textPrimary} />
              </Pressable>
            </View>
          ) : null}
        </View>

        {!isAuthed ? (
          <Card title="Sign in" subtitle="Create an account to keep tastings safe across devices.">
            <Pressable
              onPress={withSuccess(() => router.push("/sign-in"))}
              style={({ pressed }) => ({
                borderRadius: radii.md,
                paddingVertical: spacing.lg,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.accent,
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <Text style={[type.button, { color: colors.background }]}>Sign In / Create Account</Text>
            </Pressable>
          </Card>
        ) : (
          <>
            {/* ✅ YOUR STATS (includes Top 5) */}
            <Card title="Your stats" subtitle="Simple now. Powerful later.">
              <View style={{ flexDirection: "row", gap: spacing.md }}>
                <StatPill label="Tastings" value={tastingsText} />
                <StatPill label="Avg. rating" value={avgText} />
              </View>

              <View style={{ height: 1, backgroundColor: colors.divider, marginTop: spacing.md }} />

              <Text style={[type.microcopyItalic, { opacity: 0.9, color: colors.textPrimary }]}>
                Top 5
              </Text>

              {top5.length === 0 ? (
                <Text style={[type.microcopyItalic, { opacity: 0.75, color: colors.textPrimary }]}>—</Text>
              ) : (
                <View style={{ gap: 10 }}>
                  {top5.map((r, idx) => {
                    const nm = (r.whiskey_name ?? "Whiskey").trim() || "Whiskey";
                    const rt =
                      r.rating == null || !Number.isFinite(Number(r.rating))
                        ? "—"
                        : String(Math.round(Number(r.rating)));

                    return (
                      <Pressable
                        key={r.id}
                        onPress={withTick(() =>
                          router.push(`/log/cloud-tasting?tastingId=${encodeURIComponent(r.id)}` as any)
                        )}
                        onLongPress={() =>
                          openActionsForRow({ id: r.id, whiskey_name: r.whiskey_name ?? null })
                        }
                        delayLongPress={260}
                        hitSlop={8}
                        style={({ pressed }) => ({
                          flexDirection: "row",
                          alignItems: "center",
                          gap: spacing.md,
                          paddingVertical: 6,
                          borderRadius: radii.md,
                          backgroundColor: pressed ? colors.highlight : "transparent",
                        })}
                      >
                        <Text style={[type.microcopyItalic, { width: 22, opacity: 0.75, color: colors.textPrimary }]}>
                          {idx + 1}.
                        </Text>
                        <Text
                          style={[type.body, { flex: 1, fontWeight: "800", color: colors.textPrimary }]}
                          numberOfLines={1}
                        >
                          {nm}
                        </Text>
                        <Text
                          style={[type.body, { width: 52, textAlign: "right", fontWeight: "900", color: colors.textPrimary }]}
                        >
                          {rt}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </Card>

            {/* ✅ CATEGORY MIX (your analytical chart) */}
            <Card title="What you drink most" subtitle="Category mix (from whiskeys.category)">
              {mixError ? (
                <Text style={[type.microcopyItalic, { opacity: 0.85, color: colors.accent }]}>
                  Error: {mixError}
                </Text>
              ) : null}

              {mix.length === 0 ? (
                <Text style={[type.microcopyItalic, { opacity: 0.8, color: colors.textPrimary }]}>
                  Log a few tastings to see your breakdown.
                </Text>
              ) : (
                <>
                  <View style={{ gap: 6 }}>
                    <Text style={[type.sectionHeader, { fontSize: 14, color: colors.textPrimary }]}>
                      Distribution
                    </Text>
                    <Text style={[type.microcopyItalic, { opacity: 0.75, color: colors.textPrimary }]}>
                      {mixTotal} tastings analyzed
                    </Text>
                  </View>

                  <MixBar rows={mix} />

                  <Text style={[type.microcopyItalic, { marginTop: 6, opacity: 0.65, color: colors.textPrimary }]}>
                    Premium can add trends over time and palate shifts.
                  </Text>
                </>
              )}
            </Card>

            {/* Recent entries */}
            <Card
              title="Recent entries"
              subtitle="A quick look at your latest pours."
              right={
                <Pressable
                  onPress={withTick(() => router.push("/tasting/all" as any))}
                  style={({ pressed }) => ({
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: colors.divider,
                    backgroundColor: colors.surface,
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <Text style={[type.button, { color: colors.textPrimary }]}>View all</Text>
                </Pressable>
              }
            >
              {recentError ? (
                <Text style={[type.microcopyItalic, { opacity: 0.85, color: colors.accent }]}>
                  Recent error: {recentError}
                </Text>
              ) : null}

              <View style={{ borderWidth: 1, borderColor: colors.divider, borderRadius: radii.md, overflow: "hidden" }}>
                <View
                  style={{
                    flexDirection: "row",
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                    backgroundColor: colors.surface,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.divider,
                    alignItems: "center",
                  }}
                >
                  <Text style={[type.microcopyItalic, { flex: 1, opacity: 0.8, color: colors.textPrimary }]}>
                    Whiskey
                  </Text>
                  <Text style={[type.microcopyItalic, { width: 56, textAlign: "right", opacity: 0.8, color: colors.textPrimary }]}>
                    Rating
                  </Text>
                </View>

                {recent.length === 0 ? (
                  <View style={{ paddingVertical: spacing.lg, paddingHorizontal: spacing.md }}>
                    <Text style={[type.microcopyItalic, { opacity: 0.8, color: colors.textPrimary }]}>No tastings yet.</Text>
                  </View>
                ) : (
                  recent.map((r, idx) => {
                    const nm = (r.whiskey_name ?? "Whiskey").trim() || "Whiskey";
                    const rt =
                      r.rating == null || !Number.isFinite(Number(r.rating))
                        ? "—"
                        : String(Math.round(Number(r.rating)));

                    return (
                      <Pressable
                        key={r.id}
                        onPress={withTick(() =>
                          router.push(`/log/cloud-tasting?tastingId=${encodeURIComponent(r.id)}` as any)
                        )}
                        onLongPress={() => openActionsForRow({ id: r.id, whiskey_name: r.whiskey_name ?? null })}
                        delayLongPress={260}
                        style={({ pressed }) => ({
                          flexDirection: "row",
                          paddingVertical: spacing.md,
                          paddingHorizontal: spacing.md,
                          borderBottomWidth: idx === recent.length - 1 ? 0 : 1,
                          borderBottomColor: colors.divider,
                          backgroundColor: pressed ? colors.highlight : "transparent",
                          alignItems: "center",
                        })}
                      >
                        <Text style={[type.body, { flex: 1, fontWeight: "800", color: colors.textPrimary }]} numberOfLines={1}>
                          {nm}
                        </Text>
                        <Text style={[type.body, { width: 56, textAlign: "right", fontWeight: "900", color: colors.textPrimary }]}>
                          {rt}
                        </Text>
                      </Pressable>
                    );
                  })
                )}
              </View>

              {recent.length > 0 ? (
                <Text style={[type.microcopyItalic, { marginTop: 10, opacity: 0.65, color: colors.textPrimary }]}>
                  Tip: press and hold a tasting to edit or delete.
                </Text>
              ) : null}
            </Card>
          </>
        )}
      </View>

      {/* Premium Actions Bottom Sheet */}
      <Modal visible={actionsOpen} transparent animationType="fade" onRequestClose={closeActions}>
        <Pressable onPress={closeActions} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }}>
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: colors.divider,
              ...shadows.card,
              gap: spacing.md,
              paddingBottom: Math.max(spacing.lg, insets.bottom + spacing.lg),
            }}
          >
            <View style={{ alignItems: "center", marginTop: 2, marginBottom: spacing.sm }}>
              <View style={{ width: 44, height: 5, borderRadius: 999, backgroundColor: colors.divider, opacity: 0.9 }} />
            </View>

            <View style={{ gap: 4 }}>
              <Text style={[type.sectionHeader, { color: colors.textPrimary }]}>Tasting</Text>
              <Text style={[type.body, { opacity: 0.75, color: colors.textPrimary }]} numberOfLines={2}>
                {actionsTitle}
              </Text>
            </View>

            <View style={{ height: 1, backgroundColor: colors.divider, opacity: 0.9 }} />

            <Pressable
              onPress={withTick(editFromActions)}
              disabled={deleting}
              style={({ pressed }) => ({
                borderRadius: radii.md,
                paddingVertical: spacing.lg,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.accent,
                opacity: deleting ? 0.6 : pressed ? 0.92 : 1,
              })}
            >
              <Text style={[type.button, { color: colors.background }]}>Edit</Text>
            </Pressable>

            <Pressable
              onPress={withDanger(deleteFromActions)}
              disabled={deleting}
              style={({ pressed }) => ({
                borderRadius: radii.md,
                paddingVertical: spacing.lg,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: colors.divider,
                backgroundColor: pressed ? colors.highlight : colors.surface,
                opacity: deleting ? 0.6 : 1,
              })}
            >
              <Text style={[type.button, { color: colors.textPrimary }]}>{deleting ? "Deleting…" : "Delete"}</Text>
            </Pressable>

            <Pressable
              onPress={withTick(closeActions)}
              disabled={deleting}
              style={({ pressed }) => ({
                borderRadius: radii.md,
                paddingVertical: spacing.lg,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: colors.divider,
                backgroundColor: pressed ? colors.highlight : "transparent",
                opacity: deleting ? 0.6 : 1,
              })}
            >
              <Text style={[type.button, { color: colors.textPrimary }]}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}