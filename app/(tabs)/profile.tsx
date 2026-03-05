import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { fetchMyProfile } from "../../lib/cloudProfile";
import { supabase } from "../../lib/supabase";

import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

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

export default function ProfileTab() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [isAuthed, setIsAuthed] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [privateName, setPrivateName] = useState("");
  const [username, setUsername] = useState("");

  const [tastingCount, setTastingCount] = useState<number | null>(null);
  const [avgRating, setAvgRating] = useState<number | null>(null);

  const [top5, setTop5] = useState<TopRow[]>([]);
  const [recent, setRecent] = useState<RecentRow[]>([]);
  const [recentError, setRecentError] = useState<string>("");

  const loadAll = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = !!opts?.silent;

    if (silent) setRefreshing(true);
    else setLoading(true);

    setRecentError("");

    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session?.user) {
      setIsAuthed(false);
      setDisplayName("");
      setPrivateName("");
      setUsername("");
      setTastingCount(null);
      setAvgRating(null);
      setTop5([]);
      setRecent([]);
      setRecentError("");
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

    const [profileRes, countRes, ratingsRes, top5Res, recentRes] = await Promise.allSettled([
      profilePromise,
      countPromise,
      ratingsPromise,
      top5Promise,
      recentPromise,
    ]);

    if (profileRes.status === "fulfilled") {
      const p: any = profileRes.value;
      setDisplayName((p?.display_name ?? "").trim());
      setPrivateName((p?.first_name ?? "").trim());
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

    if (silent) setRefreshing(false);
    else setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const greetName = (privateName || username || displayName || "").trim();
  const welcomeTitle = greetName ? `Welcome, ${greetName}` : "Welcome";

  const tastingsText = tastingCount === null ? "—" : String(tastingCount);
  const avgText = avgRating === null ? "—" : `${avgRating.toFixed(1)}`;

  const showActionsForRow = useCallback(
    (row: { id: string; whiskey_name: string | null }) => {
      const nm = (row.whiskey_name ?? "Whiskey").trim() || "Whiskey";

      Alert.alert(nm, "Choose an action", [
        {
          text: "Edit",
          onPress: () => router.push(`/log/cloud-tasting?tastingId=${encodeURIComponent(row.id)}`),
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Delete tasting?",
              `This will permanently delete your tasting for “${nm}”.`,
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      const { error } = await supabase.from("tastings").delete().eq("id", row.id);
                      if (error) throw new Error(error.message);
                      await loadAll({ silent: true });
                    } catch (e: any) {
                      Alert.alert("Delete failed", String(e?.message ?? e));
                    }
                  },
                },
              ]
            );
          },
        },
        { text: "Cancel", style: "cancel" },
      ]);
    },
    [loadAll]
  );

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
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
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ gap: 6 }}>
            <Text style={[type.screenTitle, { color: colors.textPrimary }]}>{welcomeTitle}</Text>
            <Text style={[type.microcopyItalic, { opacity: 0.85, color: colors.textPrimary }]}>
              Your stats, your palate, your journal.
            </Text>
          </View>

          {isAuthed ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Pressable
                onPress={() => loadAll({ silent: true })}
                disabled={refreshing}
                style={({ pressed }) => ({
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: colors.divider,
                  backgroundColor: colors.surface,
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                {refreshing ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <Ionicons name="refresh" size={20} color={colors.textPrimary} />
                )}
              </Pressable>

              <Pressable
                onPress={() => router.push("/account-settings")}
                style={({ pressed }) => ({
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: colors.divider,
                  backgroundColor: colors.surface,
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
              </Pressable>
            </View>
          ) : null}
        </View>

        {!isAuthed ? (
          <Card title="Sign in" subtitle="Create an account to keep tastings safe across devices.">
            <Pressable
              onPress={() => router.push("/sign-in")}
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
            <Card title="Your stats" subtitle="Simple now. Powerful later.">
              <View style={{ flexDirection: "row", gap: spacing.md }}>
                <StatPill label="Tastings" value={tastingsText} />
                <StatPill label="Avg. rating" value={avgText} />
              </View>

              <View style={{ height: 1, backgroundColor: colors.divider, marginTop: spacing.md }} />

              <Text style={[type.microcopyItalic, { opacity: 0.9, color: colors.textPrimary }]}>Top 5</Text>

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
                        onPress={() =>
                          router.push(`/log/cloud-tasting?tastingId=${encodeURIComponent(r.id)}`)
                        }
                        onLongPress={() => showActionsForRow({ id: r.id, whiskey_name: r.whiskey_name ?? null })}
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
                        <Text
                          style={[
                            type.microcopyItalic,
                            { width: 22, opacity: 0.75, color: colors.textPrimary },
                          ]}
                        >
                          {idx + 1}.
                        </Text>
                        <Text
                          style={[type.body, { flex: 1, fontWeight: "800", color: colors.textPrimary }]}
                          numberOfLines={1}
                        >
                          {nm}
                        </Text>
                        <Text
                          style={[
                            type.body,
                            { width: 52, textAlign: "right", fontWeight: "900", color: colors.textPrimary },
                          ]}
                        >
                          {rt}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </Card>

            <Card
              title="Recent entries"
              subtitle="A quick look at your latest pours."
              right={
                <Pressable
                  onPress={() => router.push("/tasting/all")}
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

              <View
                style={{
                  borderWidth: 1,
                  borderColor: colors.divider,
                  borderRadius: radii.md,
                  overflow: "hidden",
                }}
              >
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
                  <Text
                    style={[
                      type.microcopyItalic,
                      { width: 56, textAlign: "right", opacity: 0.8, color: colors.textPrimary },
                    ]}
                  >
                    Rating
                  </Text>
                </View>

                {recent.length === 0 ? (
                  <View style={{ paddingVertical: spacing.lg, paddingHorizontal: spacing.md }}>
                    <Text style={[type.microcopyItalic, { opacity: 0.8, color: colors.textPrimary }]}>
                      No tastings yet.
                    </Text>
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
                        onPress={() => router.push(`/log/cloud-tasting?tastingId=${encodeURIComponent(r.id)}`)}
                        onLongPress={() => showActionsForRow({ id: r.id, whiskey_name: r.whiskey_name ?? null })}
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
                        <Text
                          style={[type.body, { flex: 1, fontWeight: "800", color: colors.textPrimary }]}
                          numberOfLines={1}
                        >
                          {nm}
                        </Text>
                        <Text
                          style={[
                            type.body,
                            { width: 56, textAlign: "right", fontWeight: "900", color: colors.textPrimary },
                          ]}
                        >
                          {rt}
                        </Text>
                      </Pressable>
                    );
                  })
                )}
              </View>

              {recent.length > 0 ? (
                <Text style={[type.microcopyItalic, { marginTop: 10, opacity: 0.65, color: colors.textPrimary }]}>
                  Tip: press and hold a tasting for options.
                </Text>
              ) : null}
            </Card>
          </>
        )}
      </View>
    </ScrollView>
  );
}