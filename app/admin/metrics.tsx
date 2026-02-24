// app/admin/metrics.tsx
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { supabase } from "../../lib/supabase";

import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

type TrendsBlock = {
  activation?: {
    activated_7?: number | null;
    activated_prev7?: number | null;
    activated_30avg7?: number | null;
    pct_vs_prev7?: number | null;
    pct_vs_30avg7?: number | null;
  } | null;

  tastings?: {
    tastings_7?: number | null;
    tastings_prev7?: number | null;
    tastings_30avg7?: number | null;
    pct_vs_prev7?: number | null;
    pct_vs_30avg7?: number | null;
  } | null;
};

type Snapshot = {
  generated_at?: string;

  trends?: TrendsBlock | null;

  activation?: {
    signup_to_first_tasting_pct?: number | null;
    time_to_first_tasting_median_minutes?: number | null;
    tasting_completion_rate_pct?: number | null;
    note?: string | null;
  } | null;

  engagement?: {
    weekly_active_tasters?: number | null;
    monthly_active_tasters?: number | null;
    tastings_last_7d?: number | null;
    tastings_last_30d?: number | null;
    tastings_per_active_user_7d?: number | null;
    note?: string | null;
  } | null;

  data_quality?: {
    pct_tastings_with_notes?: number | null;
    avg_note_length?: number | null;
    pct_with_type_populated?: number | null;
    edit_rate_24h?: number | null;
    note?: string | null;
  } | null;

  catalog_pipeline?: {
    candidates_created_7d?: number | null;
    promoted_7d?: number | null;
    rejected_7d?: number | null;
    median_hours_to_promotion_30d?: number | null;
  } | null;

  monetization_readiness?: {
    users_10plus_tastings?: number | null;
    users_25plus_tastings?: number | null;
    users_50plus_tastings?: number | null;
    users_100plus_tastings?: number | null;
    note?: string | null;
  } | null;

  reliability?: {
    auth_success_rate?: number | null;
    sync_error_rate?: number | null;
    crash_free_sessions?: number | null;
    note?: string | null;
  } | null;
};

function fmt(v: any) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return String(v);
}

function fmtPct(v: any) {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(2)}%`;
}

function fmtPct1(v: any) {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}%`;
}

function fmtNum2(v: any) {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(2);
}

function fmtDateTime(s?: string) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString();
}

function trendArrow(pct: any) {
  const n = Number(pct);
  if (!Number.isFinite(n)) return "→";
  if (n > 0) return "↑";
  if (n < 0) return "↓";
  return "→";
}

function trendTone(pct: any) {
  const n = Number(pct);
  if (!Number.isFinite(n)) return colors.textSecondary;
  if (n > 0) return colors.textPrimary;
  if (n < 0) return colors.accent;
  return colors.textSecondary;
}

function Card({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
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
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.md,
        }}
      >
        <Text style={[type.sectionHeader, { color: colors.textPrimary }]}>{title}</Text>
        {right ? right : null}
      </View>
      {children}
    </View>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: spacing.md,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
      }}
    >
      <Text
        style={[
          type.body,
          {
            flex: 1,
            color: colors.textSecondary,
            fontSize: 14,
            lineHeight: 18,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>

      <Text
        style={[
          type.body,
          {
            color: colors.textPrimary,
            fontSize: 14,
            lineHeight: 18,
            fontWeight: "900",
          },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function MetricRowNoDivider({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: spacing.md,
        paddingVertical: 6,
      }}
    >
      <Text
        style={[
          type.body,
          {
            flex: 1,
            color: colors.textSecondary,
            fontSize: 14,
            lineHeight: 18,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>

      <Text
        style={[
          type.body,
          {
            color: colors.textPrimary,
            fontSize: 14,
            lineHeight: 18,
            fontWeight: "900",
          },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function NoteText({ text }: { text?: string | null }) {
  if (!text) return null;
  return (
    <Text style={[type.microcopyItalic, { color: colors.textSecondary, opacity: 0.9 }]}>
      {text}
    </Text>
  );
}

function TrendLine({
  title,
  value,
  pctPrev7,
  pct30Avg,
}: {
  title: string;
  value: any;
  pctPrev7: any;
  pct30Avg: any;
}) {
  const arrow = trendArrow(pctPrev7);
  const tone = trendTone(pctPrev7);

  return (
    <View style={{ gap: 6, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: spacing.md }}>
        <Text style={[type.body, { color: colors.textSecondary, fontSize: 14 }]} numberOfLines={1}>
          {title}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10 }}>
          <Text style={[type.body, { color: tone, fontWeight: "900", fontSize: 14 }]} numberOfLines={1}>
            {arrow} {fmt(value)}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.md }}>
        <Text style={[type.microcopyItalic, { color: colors.textSecondary, opacity: 0.9 }]}>
          vs prev 7d: {fmtPct(pctPrev7)}
        </Text>
        <Text style={[type.microcopyItalic, { color: colors.textSecondary, opacity: 0.9 }]}>
          vs 30d avg: {fmtPct(pct30Avg)}
        </Text>
      </View>
    </View>
  );
}

export default function AdminMetricsScreen() {
  const [loading, setLoading] = useState(true);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string>("");

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("admin_metrics_snapshot");
      if (error) throw error;
      setSnap((data ?? null) as any);
    } catch (e: any) {
      setError(String(e?.message ?? e));
      setSnap(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updatedAt = useMemo(() => fmtDateTime(snap?.generated_at), [snap?.generated_at]);

  const trendsActivation = snap?.trends?.activation ?? null;
  const trendsTastings = snap?.trends?.tastings ?? null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.xl, gap: spacing.lg }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md }}>
          <View style={{ gap: 6, flex: 1 }}>
            <Text style={[type.screenTitle, { color: colors.textPrimary }]}>Metrics</Text>
            <Text style={[type.microcopyItalic, { color: colors.textSecondary }]}>Updated: {updatedAt}</Text>
          </View>

          <View style={{ flexDirection: "row", gap: spacing.xs }}>
            <Pressable
              onPress={load}
              disabled={loading}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: colors.divider,
                backgroundColor: colors.surface,
                opacity: loading ? 0.6 : pressed ? 0.9 : 1,
              })}
            >
              {loading ? (
                <ActivityIndicator size="small" />
              ) : (
                <Ionicons name="refresh" size={18} color={colors.textPrimary} />
              )}
            </Pressable>

            <Pressable
              onPress={() => router.push("/admin")}
              style={({ pressed }) => ({
                height: 40,
                paddingHorizontal: 12,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: colors.divider,
                backgroundColor: colors.surface,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={[type.button, { fontSize: 13, lineHeight: 16, color: colors.textPrimary }]}>Back</Text>
            </Pressable>
          </View>
        </View>

        {error ? (
          <Card title="Error">
            <Text style={[type.body, { color: colors.accent }]}>{error}</Text>
          </Card>
        ) : null}

        {loading && !snap ? (
          <View style={{ paddingVertical: spacing.xl }}>
            <ActivityIndicator />
          </View>
        ) : null}

        {/* Trends */}
        <Card title="Trends">
          <TrendLine
            title="Activated users (last 7d)"
            value={trendsActivation?.activated_7}
            pctPrev7={trendsActivation?.pct_vs_prev7}
            pct30Avg={trendsActivation?.pct_vs_30avg7}
          />
          <TrendLine
            title="Tastings (last 7d)"
            value={trendsTastings?.tastings_7}
            pctPrev7={trendsTastings?.pct_vs_prev7}
            pct30Avg={trendsTastings?.pct_vs_30avg7}
          />
          <MetricRowNoDivider
            label="Note"
            value="Early beta = big % swings (low baseline)."
          />
        </Card>

        <Card title="Activation">
          <MetricRow label="Signup → first tasting" value={fmtPct1(snap?.activation?.signup_to_first_tasting_pct)} />
          <MetricRow
            label="Time to first tasting (median)"
            value={
              snap?.activation?.time_to_first_tasting_median_minutes == null
                ? "—"
                : `${fmt(snap.activation.time_to_first_tasting_median_minutes)} min`
            }
          />
          <MetricRow label="Tasting completion rate" value={fmtPct1(snap?.activation?.tasting_completion_rate_pct)} />
          <NoteText text={snap?.activation?.note ?? null} />
        </Card>

        <Card title="Engagement">
          <MetricRow label="Weekly active tasters" value={fmt(snap?.engagement?.weekly_active_tasters)} />
          <MetricRow label="Monthly active tasters" value={fmt(snap?.engagement?.monthly_active_tasters)} />
          <MetricRow label="Tastings (last 7d)" value={fmt(snap?.engagement?.tastings_last_7d)} />
          <MetricRow label="Tastings (last 30d)" value={fmt(snap?.engagement?.tastings_last_30d)} />
          <MetricRow
            label="Tastings per active user (7d)"
            value={fmtNum2(snap?.engagement?.tastings_per_active_user_7d)}
          />
          <NoteText text={snap?.engagement?.note ?? null} />
        </Card>

        <Card title="Data quality">
          <MetricRow label="% tastings with notes" value={fmtPct(snap?.data_quality?.pct_tastings_with_notes)} />
          <MetricRow label="Avg note length" value={fmtNum2(snap?.data_quality?.avg_note_length)} />
          <MetricRow label="% with type populated" value={fmtPct(snap?.data_quality?.pct_with_type_populated)} />
          <MetricRow label="Edit rate (24h)" value={fmtPct(snap?.data_quality?.edit_rate_24h)} />
          <NoteText text={snap?.data_quality?.note ?? null} />
        </Card>

        <Card title="Catalog pipeline">
          <MetricRow label="Candidates created (7d)" value={fmt(snap?.catalog_pipeline?.candidates_created_7d)} />
          <MetricRow label="Promoted (7d)" value={fmt(snap?.catalog_pipeline?.promoted_7d)} />
          <MetricRow label="Rejected (7d)" value={fmt(snap?.catalog_pipeline?.rejected_7d)} />
          <MetricRow
            label="Median hours to promotion (30d)"
            value={fmtNum2(snap?.catalog_pipeline?.median_hours_to_promotion_30d)}
          />
        </Card>

        <Card title="Monetization readiness">
          <MetricRow label="Users with 10+ tastings" value={fmt(snap?.monetization_readiness?.users_10plus_tastings)} />
          <MetricRow label="Users with 25+ tastings" value={fmt(snap?.monetization_readiness?.users_25plus_tastings)} />
          <MetricRow label="Users with 50+ tastings" value={fmt(snap?.monetization_readiness?.users_50plus_tastings)} />
          <MetricRow label="Users with 100+ tastings" value={fmt(snap?.monetization_readiness?.users_100plus_tastings)} />
          <NoteText text={snap?.monetization_readiness?.note ?? null} />
        </Card>

        <Card title="Reliability">
          <MetricRow label="Auth success rate" value={fmtPct(snap?.reliability?.auth_success_rate)} />
          <MetricRow label="Sync error rate" value={fmtPct(snap?.reliability?.sync_error_rate)} />
          <MetricRow label="Crash-free sessions" value={fmtPct(snap?.reliability?.crash_free_sessions)} />
          <NoteText text={snap?.reliability?.note ?? null} />
        </Card>

        <Text style={[type.microcopyItalic, { color: colors.textSecondary, opacity: 0.85 }]}>
          Tip: Trends will stabilize as the beta pool grows.
        </Text>
      </View>
    </ScrollView>
  );
}