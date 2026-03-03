// app/(tabs)/log.tsx
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { supabase } from "../../lib/supabase";

import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

import { SearchSection } from "../../src/logTab/components/SearchSection";
import { useRecentTastings } from "../../src/logTab/hooks/useRecentTastings";

// ✅ HAPTICS
import { withSuccess, withTick } from "../../lib/hapticsPress";

/* ------------------- Helpers ------------------- */

function isUuid(v: string) {
  const s = String(v ?? "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s
  );
}

function formatWhen(v: string | null | undefined) {
  if (!v) return "";
  const t = Date.parse(String(v));
  if (!Number.isFinite(t)) return "";
  const d = new Date(t);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ------------------- Types ------------------- */

type Suggestion = {
  whiskeyId: string;
  whiskeyName: string;
  bhhScore: number | null;
};

/* ------------------- UI ------------------- */

function SoftDivider() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.md }}>
      <View
        style={{
          flex: 1,
          height: 2,
          backgroundColor: colors.accentFaint,
          opacity: 0.15,
          borderRadius: 2,
        }}
      />
      <View
        style={{
          width: 170,
          height: 2,
          backgroundColor: colors.accent,
          opacity: 0.7,
          borderRadius: 2,
          marginHorizontal: spacing.sm,
        }}
      />
      <View
        style={{
          flex: 1,
          height: 2,
          backgroundColor: colors.accentFaint,
          opacity: 0.15,
          borderRadius: 2,
        }}
      />
    </View>
  );
}

function Card({
  title,
  subtitle,
  rightHeader,
  children,
  padV,
  padH,
  gap,
}: {
  title: string;
  subtitle?: string;
  rightHeader?: React.ReactNode;
  children: React.ReactNode;
  padV?: number;
  padH?: number;
  gap?: number;
}) {
  const surface = (colors as any).glassRaised ?? (colors as any).surfaceRaised ?? colors.surface;
  const border = (colors as any).glassBorder ?? colors.divider;

  return (
    <View
      style={{
        backgroundColor: surface,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: border,
        paddingVertical: padV ?? 14,
        paddingHorizontal: padH ?? spacing.lg,
        ...shadows.card,
        gap: gap ?? spacing.md,
      }}
    >
      <View style={{ gap: 6 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: spacing.md,
          }}
        >
          <Text style={[type.sectionHeader, { fontSize: 18 }]}>{title}</Text>
          {rightHeader ? rightHeader : null}
        </View>

        {subtitle ? (
          <Text style={[type.microcopyItalic, { opacity: 0.82, lineHeight: 18 }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {children}
    </View>
  );
}

function SmallLink({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!!disabled}
      style={({ pressed }) => ({
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
      })}
    >
      <Text style={[type.body, { fontWeight: "900", fontSize: 12, color: colors.accent }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function RecentRow({
  row,
  onPress,
}: {
  row: { id: string; whiskeyName: string; rating: number | null; createdAt: string | null };
  onPress: () => void;
}) {
  const when = formatWhen(row.createdAt);
  const ratingText =
    row.rating != null && Number.isFinite(Number(row.rating)) ? `${Math.round(row.rating)}` : "—";

  const surface = (colors as any).glassSurface ?? colors.surface;
  const border = (colors as any).glassBorder ?? colors.divider;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: border,
        borderRadius: radii.md,
        backgroundColor: surface,
        ...shadows.card,
        opacity: pressed ? 0.92 : 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.body, { fontWeight: "900" }]} numberOfLines={1}>
          {row.whiskeyName}
        </Text>
        <Text style={[type.microcopyItalic, { opacity: 0.75 }]} numberOfLines={1}>
          {when ? `Logged ${when}` : "Logged"}
        </Text>
      </View>

      <View style={{ minWidth: 44, alignItems: "flex-end", justifyContent: "center" }}>
        <Text style={[type.body, { fontWeight: "900" }]}>{ratingText}</Text>
      </View>
    </Pressable>
  );
}

/* ------------------- Screen ------------------- */

export default function LogTab() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Suggestion | null>(null);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput | null>(null);

  // ✅ Recent tastings: cached + no refresh on every tab switch
  const recent = useRecentTastings({ staleMs: 60_000 });

  const qTrim = query.trim();
  const hasEnoughQuery = qTrim.length >= 2;

  const helperLine = useMemo(() => {
    if (!hasEnoughQuery) return "Start typing a bottle name to search.";
    if (selected) return "Tap Continue to open the whiskey profile.";
    if (suggestions.length > 0) return "Tap a result, or press Continue to open the top match.";
    return "No matches. Tap Add custom entry to log it anyway.";
  }, [hasEnoughQuery, selected, suggestions.length]);

  const canContinue = useMemo(() => {
    if (!hasEnoughQuery) return false;
    return !!selected || suggestions.length > 0;
  }, [hasEnoughQuery, selected, suggestions.length]);

  function onType(text: string) {
    setQuery(text);
    setSelected(null);
  }

  const clearQuery = withTick(() => {
    setQuery("");
    setSelected(null);
    setSuggestions([]);
    setTimeout(() => inputRef.current?.focus?.(), 50);
  });

  function goToWhiskeyProfile(id: string) {
    const safeId = String(id ?? "").trim();
    if (!isUuid(safeId)) {
      console.log("[LogTab] Not navigating; invalid whiskeyId:", safeId);
      return;
    }
    router.push(`/whiskey/${encodeURIComponent(safeId)}?intent=log`);
  }

  function goToCustomTasting(name: string) {
    const n = String(name ?? "").trim();
    if (n.length < 2) return;

    router.push(`/log/cloud-tasting?whiskeyName=${encodeURIComponent(n)}&lockName=0` as any);
  }

  const onPickSuggestion = withTick((s: Suggestion) => {
    setQuery(s.whiskeyName);
    setSelected(s);
    goToWhiskeyProfile(s.whiskeyId);
  });

  const onUseCustom = withTick(() => {
    if (!hasEnoughQuery) return;
    if (selected) return;
    goToCustomTasting(query.trim());
  });

  const onContinue = withSuccess(() => {
    if (!canContinue) return;

    if (selected) {
      goToWhiskeyProfile(selected.whiskeyId);
      return;
    }

    if (suggestions.length > 0) {
      goToWhiskeyProfile(suggestions[0].whiskeyId);
      return;
    }
  });

  async function fetchSuggestions(term: string) {
    const t = term.trim();
    if (t.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const safe = t.replace(/[%_]/g, "\\$&");

      if (isUuid(t)) {
        const { data: byId, error: byIdErr } = await supabase
          .from("whiskeys")
          .select("id, display_name")
          .eq("id", t)
          .limit(1);

        if (byIdErr) throw new Error(byIdErr.message);

        if (byId && byId.length > 0) {
          const row = byId[0] as any;
          setSuggestions([
            {
              whiskeyId: String(row.id),
              whiskeyName: String(row.display_name ?? "Whiskey"),
              bhhScore: null,
            },
          ]);
          setLoading(false);
          return;
        }
      }

      const { data: wData, error: wErr } = await supabase
        .from("whiskeys")
        .select("id, display_name")
        .ilike("display_name", `%${safe}%`)
        .order("display_name", { ascending: true })
        .limit(20);

      if (wErr) throw new Error(wErr.message);

      const base: Suggestion[] = (wData as any[]).map((w) => ({
        whiskeyId: String(w.id),
        whiskeyName: String(w.display_name ?? "Whiskey"),
        bhhScore: null,
      }));

      const ids = base.map((b) => b.whiskeyId).filter(isUuid);
      if (ids.length > 0) {
        const { data: bData, error: bErr } = await supabase
          .from("bhh_reviews")
          .select("whiskey_id, rating_100")
          .in("whiskey_id", ids)
          .limit(2000);

        if (!bErr && bData) {
          const best = new Map<string, number>();
          (bData as any[]).forEach((r) => {
            const id = r.whiskey_id ? String(r.whiskey_id) : "";
            if (!isUuid(id)) return;
            const score =
              r.rating_100 == null || !Number.isFinite(Number(r.rating_100))
                ? null
                : Number(r.rating_100);
            if (score == null) return;
            const ex = best.get(id);
            if (ex == null || score > ex) best.set(id, score);
          });

          base.forEach((s) => {
            const v = best.get(s.whiskeyId);
            if (v != null) s.bhhScore = v;
          });
        }
      }

      const list = base
        .sort((a, b) => {
          const as = a.bhhScore ?? -Infinity;
          const bs = b.bhhScore ?? -Infinity;
          if (bs !== as) return bs - as;
          return a.whiskeyName.localeCompare(b.whiskeyName);
        })
        .slice(0, 10);

      setSuggestions(list);
    } catch (e: any) {
      console.log("Log suggestion search failed:", e?.message ?? e);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      inputRef.current?.focus?.();
    }, 250);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 220);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function goTasting(tastingId: string) {
    const id = String(tastingId ?? "").trim();
    if (!id) return;

    router.push(`/log/cloud-tasting?tastingId=${encodeURIComponent(id)}&mode=edit&readonly=0` as any);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl + spacing.lg,
          paddingBottom: spacing.xl * 2,
          gap: spacing.md,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled
      >
        {/* Header */}
        <View style={{ gap: spacing.xs }}>
          <Text style={[type.screenTitle, { fontSize: 34, lineHeight: 40 }]}>
            What are you drinking?
          </Text>

          <Text style={[type.microcopyItalic, { fontSize: 16, lineHeight: 22, opacity: 0.86 }]}>
            Search the library, or add a custom bottle.
          </Text>

          <View style={{ height: 1, backgroundColor: colors.divider, marginTop: spacing.md }} />
        </View>

        <SearchSection
          query={query}
          onChangeQuery={onType}
          onClear={clearQuery}
          suggestions={suggestions}
          loading={loading}
          helperLine={helperLine}
          hasEnoughQuery={hasEnoughQuery}
          canContinue={canContinue}
          onPick={onPickSuggestion}
          onCustom={onUseCustom}
          onContinue={onContinue}
        />

        <SoftDivider />

        <Card
          title="Recent tastings"
          subtitle="Your latest entries"
          rightHeader={
            <SmallLink
              label="View All"
              onPress={withTick(() => router.push("/tasting/all" as any))}
              disabled={recent.rows.length === 0}
            />
          }
        >
          {recent.loading ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <ActivityIndicator />
              <Text style={[type.body, { opacity: 0.7 }]}>Loading…</Text>
            </View>
          ) : null}

          {recent.error ? (
            <Text style={[type.body, { opacity: 0.8 }]}>Error: {recent.error}</Text>
          ) : null}

          {!recent.loading && recent.rows.length === 0 ? (
            <Text style={[type.body, { opacity: 0.72 }]}>
              Not seeing anything yet? Sign in and log your first tasting.
            </Text>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {recent.rows.map((r) => (
                <RecentRow
                  key={r.id}
                  row={{ id: r.id, whiskeyName: r.whiskeyName, rating: r.rating, createdAt: r.createdAt }}
                  onPress={withTick(() => goTasting(r.id))}
                />
              ))}
            </View>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}