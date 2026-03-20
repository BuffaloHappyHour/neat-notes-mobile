import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import {
  type AdminDashboardMetrics,
  fetchAdminMetrics,
} from "../../lib/adminMetrics";

import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

import {
  HeroStat,
  MetricRow,
  MetricRowNoDivider,
  MetricsCard,
  OverviewStat,
  TabPill,
} from "../../components/admin/metrics/MetricsPrimitives";
import {
  fmtCount,
  fmtDateTime,
  fmtNum2,
  fmtPct,
  statusActivation,
  statusCatalogCompletion,
  statusCoverage,
  statusLowEffort,
  statusNotes,
  statusRetention,
} from "../../components/admin/metrics/formatters";

type MetricsTab =
  | "overview"
  | "engagement"
  | "pipeline"
  | "catalog"
  | "quality"
  | "insights"
  | "retention";

export default function AdminMetricsScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminDashboardMetrics | null>(null);
  const [error, setError] = useState<string>("");
  const [tab, setTab] = useState<MetricsTab>("overview");
  const insights = data?.insights;

  const load = useCallback(async () => {
    setError("");
    setLoading(true);

    try {
      const next = await fetchAdminMetrics();
      setData(next);
    } catch (e: any) {
      setError(String(e?.message ?? e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updatedAt = useMemo(() => fmtDateTime(new Date().toISOString()), [data]);

  const totals = data?.totals;
  const overview = data?.overview;
  const engagement = data?.engagement;
  const powerUsers = data?.power_users;
  const pipeline = data?.pipeline;
  const catalog = data?.catalog;
  const quality = data?.quality;
  const retention = data?.retention;

  const wauMauRatio =
    overview?.wau != null && overview?.mau
      ? overview.wau / overview.mau
      : null;

  const usersWith2Plus =
    engagement && powerUsers
      ? Math.max(0, engagement.users_with_tastings - powerUsers.users_5_plus)
      : null;

  function renderOverviewTab() {
    return (
      <>
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <OverviewStat label="Total Users" value={fmtCount(totals?.total_users)} />
          <OverviewStat label="Total Whiskies" value={fmtCount(totals?.total_whiskeys)} />
          <OverviewStat label="Total Tastings" value={fmtCount(totals?.total_tastings)} />
        </View>

        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <HeroStat
              label="Activation Rate"
              value={fmtPct(
                overview?.activation_rate != null ? overview.activation_rate * 100 : null
              )}
              subtitle="Users with at least one tasting"
              status={statusActivation(overview?.activation_rate)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <HeroStat
              label="WAU / MAU"
              value={fmtPct(wauMauRatio != null ? wauMauRatio * 100 : null)}
              subtitle={`${fmtCount(overview?.wau)} weekly / ${fmtCount(overview?.mau)} monthly`}
              status={statusRetention(wauMauRatio)}
            />
          </View>
        </View>

                <MetricsCard
          title="Growth Snapshot"
          insight="Growth is strong post-launch. This card shows whether usage is expanding or flattening."
          thresholdTitle="Growth Snapshot thresholds"
          thresholdDescription="These are reference ranges for reading the growth snapshot during the early app phase."
          thresholdItems={[
            { label: "New users (7d) — green", value: "Strong upward trend vs your recent baseline", tone: "good" },
            { label: "New users (7d) — amber", value: "Flat to modest growth", tone: "warn" },
            { label: "New users (7d) — red", value: "Sustained decline vs recent baseline", tone: "bad" },

            { label: "Tastings (7d) — green", value: "Meaningful week-over-week increase", tone: "good" },
            { label: "Tastings (7d) — amber", value: "Stable / normal variance", tone: "warn" },
            { label: "Tastings (7d) — red", value: "Sustained drop vs recent baseline", tone: "bad" },

            { label: "Tastings (30d)", value: "Context metric, not directly color-scored yet", tone: "neutral" },
          ]}
        >
          <MetricRow label="New users (7d)" value={fmtCount(overview?.new_users_7d)} />
          <MetricRow label="Tastings (7d)" value={fmtCount(overview?.tastings_7d)} />
          <MetricRowNoDivider label="Tastings (30d)" value={fmtCount(overview?.tastings_30d)} />
        </MetricsCard>
        
               <MetricsCard
          title="Power Users"
          insight="These are your highest-intent users and the clearest monetization signal in the product."
          thresholdTitle="Power User thresholds"
          thresholdDescription="These ranges are directional. The more users that reach 5+ and 10+ tastings, the stronger the product habit and monetization signal."
          thresholdItems={[
            { label: "Users with 5+ tastings", value: "High-intent cohort", tone: "good" },
            { label: "Users with 10+ tastings", value: "Very high-intent cohort", tone: "good" },
            { label: "Interpretation", value: "More users crossing these thresholds is better", tone: "neutral" },
          ]}
        >
          <MetricRow label="Users with 5+ tastings" value={fmtCount(powerUsers?.users_5_plus)} />
          <MetricRowNoDivider
            label="Users with 10+ tastings"
            value={fmtCount(powerUsers?.users_10_plus)}
          />
        </MetricsCard>
      </>
    );
  }

  function renderEngagementTab() {
    return (
      <>
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <HeroStat
              label="Users With Tastings"
              value={fmtCount(engagement?.users_with_tastings)}
              subtitle="Activated users"
              status={statusActivation(overview?.activation_rate)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <HeroStat
              label="Total Tastings"
              value={fmtCount(engagement?.total_tastings)}
              subtitle="All tasting logs"
            />
          </View>
        </View>

                <MetricsCard
          title="Depth of Use"
          insight="The goal is not just activation. It is getting users beyond their first few logs and into habit."
          thresholdTitle="Depth of Use thresholds"
          thresholdDescription="These thresholds describe progression depth, not failure states. More users moving into higher buckets is the goal."
          thresholdItems={[
            { label: "Users with 5+ tastings", value: "Strong engagement milestone", tone: "good" },
            { label: "Users with 10+ tastings", value: "Habit / enthusiast milestone", tone: "good" },
            { label: "Activated but under 5 tastings", value: "Opportunity pool for deeper engagement", tone: "warn" },
          ]}
        >
          <MetricRow label="Users with 5+ tastings" value={fmtCount(powerUsers?.users_5_plus)} />
          <MetricRow label="Users with 10+ tastings" value={fmtCount(powerUsers?.users_10_plus)} />
          <MetricRowNoDivider
            label="Activated but under 5 tastings"
            value={fmtCount(usersWith2Plus)}
          />
        </MetricsCard>
      </>
    );
  }

  function renderPipelineTab() {
    return (
      <>
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <HeroStat
              label="Pending Queue"
              value={fmtCount(pipeline?.pending_candidates)}
              subtitle="Needs admin review"
              status={
                pipeline?.avg_pending_age_hours != null && pipeline.avg_pending_age_hours <= 6
                  ? "good"
                  : pipeline?.avg_pending_age_hours != null && pipeline.avg_pending_age_hours <= 24
                  ? "warn"
                  : "bad"
              }
            />
          </View>
          <View style={{ flex: 1 }}>
            <HeroStat
              label="Median Review"
              value={fmtNum2(pipeline?.median_review_minutes)}
              subtitle="Minutes to decision"
              status={
                pipeline?.median_review_minutes != null && pipeline.median_review_minutes <= 10
                  ? "good"
                  : pipeline?.median_review_minutes != null && pipeline.median_review_minutes <= 60
                  ? "warn"
                  : "bad"
              }
            />
          </View>
        </View>

                <MetricsCard
          title="Queue Health"
          insight="You are reviewing quickly, but this is the section to watch as submissions scale and merge workflows are added."
          thresholdTitle="Queue Health thresholds"
          thresholdDescription="These are the current operational thresholds used to color the pipeline KPIs."
          thresholdItems={[
            { label: "Avg pending age — green", value: "6 hours or less", tone: "good" },
            { label: "Avg pending age — amber", value: "More than 6 and up to 24 hours", tone: "warn" },
            { label: "Avg pending age — red", value: "More than 24 hours", tone: "bad" },

            { label: "Review rate (7d) — green", value: "100% or higher", tone: "good" },
            { label: "Review rate (7d) — amber", value: "80% to 99.9%", tone: "warn" },
            { label: "Review rate (7d) — red", value: "Below 80%", tone: "bad" },

            { label: "Rejected candidates", value: "Currently informational only", tone: "neutral" },
          ]}
        >
          <MetricRow label="Total candidates" value={fmtCount(pipeline?.total_candidates)} />
          <MetricRow label="Approved candidates" value={fmtCount(pipeline?.approved_candidates)} />
          <MetricRow label="Rejected candidates" value={fmtCount(pipeline?.rejected_candidates)} />
          <MetricRow
            label="Avg pending age (hrs)"
            value={fmtNum2(pipeline?.avg_pending_age_hours)}
            status={
              pipeline?.avg_pending_age_hours != null && pipeline.avg_pending_age_hours <= 6
                ? "good"
                : pipeline?.avg_pending_age_hours != null && pipeline.avg_pending_age_hours <= 24
                ? "warn"
                : "bad"
            }
          />
          <MetricRowNoDivider
            label="Review rate (7d)"
            value={fmtPct(
              pipeline?.review_rate_7d != null ? pipeline.review_rate_7d * 100 : null
            )}
            status={
              pipeline?.review_rate_7d != null && pipeline.review_rate_7d >= 1
                ? "good"
                : pipeline?.review_rate_7d != null && pipeline.review_rate_7d >= 0.8
                ? "warn"
                : "bad"
            }
          />
        </MetricsCard>

                <MetricsCard
          title="Throughput"
          insight="This shows whether the inbox is being kept under control week over week."
          thresholdTitle="Throughput thresholds"
          thresholdDescription="Throughput is read comparatively. Reviewed volume should generally keep pace with or exceed created volume."
          thresholdItems={[
            { label: "Healthy throughput", value: "Reviewed ≈ Created or higher", tone: "good" },
            { label: "Watch area", value: "Reviewed slightly below Created", tone: "warn" },
            { label: "Backlog risk", value: "Reviewed consistently well below Created", tone: "bad" },
          ]}
        >
          <MetricRow label="Created (7d)" value={fmtCount(pipeline?.created_7d)} />
          <MetricRowNoDivider label="Reviewed (7d)" value={fmtCount(pipeline?.reviewed_7d)} />
        </MetricsCard>
      </>
    );
  }

  function renderCatalogTab() {
    return (
      <>
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <HeroStat
              label="Fully Enriched"
              value={fmtCount(catalog?.fully_enriched_count)}
              subtitle={fmtPct(
                catalog?.fully_enriched_pct != null ? catalog.fully_enriched_pct * 100 : null
              )}
              status={statusCatalogCompletion(catalog?.fully_enriched_pct)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <HeroStat
              label="With Proof"
              value={fmtPct(
                catalog?.with_proof_pct != null ? catalog.with_proof_pct * 100 : null
              )}
              subtitle="Coverage rate"
              status={statusCoverage(catalog?.with_proof_pct)}
            />
          </View>
        </View>

                <MetricsCard
          title="Coverage"
          insight="Catalog enrichment is your biggest product leverage point right now. Proof and distillery coverage are the highest-value cleanup targets."
          thresholdTitle="Coverage thresholds"
          thresholdDescription="These are the current coverage thresholds used to interpret catalog completeness metrics."
          thresholdItems={[
            { label: "Coverage — green", value: "70%+", tone: "good" },
            { label: "Coverage — amber", value: "40% to 69.9%", tone: "warn" },
            { label: "Coverage — red", value: "Below 40%", tone: "bad" },

            { label: "Missing proof", value: "Higher counts are worse", tone: "warn" },
            { label: "Missing distillery", value: "Higher counts are worse", tone: "bad" },
            { label: "Missing age", value: "Tracked, but lower priority today", tone: "neutral" },
          ]}
        >
          <MetricRow
            label="With distillery"
            value={fmtPct(
              catalog?.with_distillery_pct != null ? catalog.with_distillery_pct * 100 : null
            )}
            status={statusCoverage(catalog?.with_distillery_pct)}
          />
          <MetricRow
            label="With type"
            value={fmtPct(
              catalog?.with_type_pct != null ? catalog.with_type_pct * 100 : null
            )}
          />
          <MetricRow label="Missing proof" value={fmtCount(catalog?.missing_proof)} status="warn" />
          <MetricRow
            label="Missing distillery"
            value={fmtCount(catalog?.missing_distillery)}
            status="bad"
          />
          <MetricRowNoDivider label="Missing age" value={fmtCount(catalog?.missing_age)} status="bad" />
        </MetricsCard>

                <MetricsCard
          title='"Other" Cleanup'
          insight='This is where weak metadata silently hurts search, filtering, and future recommendations.'
          thresholdTitle='"Other" Cleanup thresholds'
          thresholdDescription='Lower "Other" counts are better. This card is meant to expose metadata buckets that still need cleanup.'
          thresholdItems={[
            { label: 'Type = Other', value: "Lower is better", tone: "warn" },
            { label: 'Category = Other', value: "Lower is better", tone: "warn" },
            { label: 'Region = Other', value: "Lower is better; highest priority here", tone: "bad" },
          ]}
        >
          <MetricRow label="Type = Other" value={fmtCount(catalog?.type_other)} status="warn" />
          <MetricRow
            label="Category = Other"
            value={fmtCount(catalog?.category_other)}
            status="warn"
          />
          <MetricRowNoDivider
            label="Region = Other"
            value={fmtCount(catalog?.region_other)}
            status="bad"
          />
        </MetricsCard>
      </>
    );
  }

  function renderQualityTab() {
    return (
      <>
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <HeroStat
              label="Flavor Tag Usage"
              value={fmtPct(
                quality?.pct_with_flavor_tags != null ? quality.pct_with_flavor_tags * 100 : null
              )}
              subtitle="Tastings with flavor tags"
              status={statusCoverage(quality?.pct_with_flavor_tags)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <HeroStat
              label="Low-Effort Logs"
              value={fmtPct(
                quality?.pct_low_effort_tastings != null
                  ? quality.pct_low_effort_tastings * 100
                  : null
              )}
              subtitle="No tags and no notes"
              status={statusLowEffort(quality?.pct_low_effort_tastings)}
            />
          </View>
        </View>

                <MetricsCard
          title="Tasting Quality"
          insight="Users are heavily engaging with structured flavor inputs. Written notes are optional depth, not the primary success metric."
          thresholdTitle="Tasting Quality thresholds"
          thresholdDescription="These thresholds explain how the dashboard colors and interprets the main tasting quality KPIs."
          thresholdItems={[
            { label: "Flavor tag usage — green", value: "70%+", tone: "good" },
            { label: "Flavor tag usage — amber", value: "40% to 69.9%", tone: "warn" },
            { label: "Flavor tag usage — red", value: "Below 40%", tone: "bad" },

            { label: "Avg flavor tags / tasting — green", value: "3.0+", tone: "good" },
            { label: "Avg flavor tags / tasting — amber", value: "2.0 to 2.99", tone: "warn" },
            { label: "Avg flavor tags / tasting — red", value: "Below 2.0", tone: "bad" },

            { label: "Written notes", value: "Currently treated as optional depth", tone: "neutral" },
            { label: "Low-effort logs — green", value: "5% or lower", tone: "good" },
            { label: "Low-effort logs — amber", value: "5.1% to 15%", tone: "warn" },
            { label: "Low-effort logs — red", value: "Above 15%", tone: "bad" },
          ]}
        >
          <MetricRow
            label="Tastings with flavor tags"
            value={fmtCount(quality?.tastings_with_flavor_tags)}
            status={statusCoverage(quality?.pct_with_flavor_tags)}
          />
          <MetricRow
            label="Avg flavor tags / tasting"
            value={fmtNum2(quality?.avg_flavor_tags_per_tasting)}
            status={
              quality?.avg_flavor_tags_per_tasting != null &&
              quality.avg_flavor_tags_per_tasting >= 3
                ? "good"
                : quality?.avg_flavor_tags_per_tasting != null &&
                  quality.avg_flavor_tags_per_tasting >= 2
                ? "warn"
                : "bad"
            }
          />
          <MetricRow
            label="Tastings with written notes"
            value={fmtCount(quality?.tastings_with_written_notes)}
            status={statusNotes(quality?.pct_with_written_notes)}
          />
          <MetricRowNoDivider
            label="% with written notes"
            value={fmtPct(
              quality?.pct_with_written_notes != null
                ? quality.pct_with_written_notes * 100
                : null
            )}
            status={statusNotes(quality?.pct_with_written_notes)}
          />
        </MetricsCard>
      </>
    );
  }

  function renderRetentionTab() {
    return (
      <>
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <HeroStat
              label="7d Retention"
              value={fmtPct(
                retention?.retention_7d != null ? retention.retention_7d * 100 : null
              )}
              subtitle="Eligible users only"
              status={statusRetention(retention?.retention_7d)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <HeroStat
              label="Eligible Users"
              value={fmtCount(retention?.eligible_users_7d)}
              subtitle="Users with full 7-day window"
            />
          </View>
        </View>

                <MetricsCard
          title="Retention Detail"
          insight="This metric is still early-stage and sample-size limited, but it will become one of the most important health signals over time."
          thresholdTitle="Retention thresholds"
          thresholdDescription="These are the current retention thresholds used by the dashboard. Retention is only measured on users with a full 7-day eligibility window."
          thresholdItems={[
            { label: "7d retention — green", value: "25%+", tone: "good" },
            { label: "7d retention — amber", value: "15% to 24.9%", tone: "warn" },
            { label: "7d retention — red", value: "Below 15%", tone: "bad" },

            { label: "Eligible users", value: "Sample-size context only", tone: "neutral" },
            { label: "Retained users", value: "Raw count context only", tone: "neutral" },
          ]}
        >
          <MetricRow
            label="Eligible users (7d)"
            value={fmtCount(retention?.eligible_users_7d)}
          />
          <MetricRowNoDivider
            label="Retained users (7d)"
            value={fmtCount(retention?.retained_users_7d)}
          />
        </MetricsCard>
      </>
    );
  }
function renderInsightsTab() {
  return (
    <>
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <HeroStat
            label="5+ Tastings"
            value={fmtPct(
              insights?.whiskies_with_5_plus_tastings_pct != null
                ? insights.whiskies_with_5_plus_tastings_pct * 100
                : null
            )}
            subtitle={`${fmtCount(insights?.whiskies_with_5_plus_tastings)} whiskies`}
            status={
              insights?.whiskies_with_5_plus_tastings_pct != null &&
              insights.whiskies_with_5_plus_tastings_pct >= 0.3
                ? "good"
                : insights?.whiskies_with_5_plus_tastings_pct != null &&
                  insights.whiskies_with_5_plus_tastings_pct >= 0.1
                ? "warn"
                : "bad"
            }
          />
        </View>

        <View style={{ flex: 1 }}>
          <HeroStat
            label="Radar Ready"
            value={fmtPct(
              insights?.flavor_radar_ready_pct != null
                ? insights.flavor_radar_ready_pct * 100
                : null
            )}
            subtitle={`${fmtCount(insights?.flavor_radar_ready_count)} whiskies`}
            status={
              insights?.flavor_radar_ready_pct != null &&
              insights.flavor_radar_ready_pct >= 0.2
                ? "good"
                : insights?.flavor_radar_ready_pct != null &&
                  insights.flavor_radar_ready_pct >= 0.05
                ? "warn"
                : "bad"
            }
          />
        </View>
      </View>

      <MetricsCard
        title="Insight Readiness"
        insight="This shows how much of your catalog can actually power product features like flavor radar and top tasting notes."
        thresholdTitle="Insight thresholds"
        thresholdDescription="These thresholds help you understand when features are worth shipping based on data density."
        thresholdItems={[
          { label: "5+ tastings", value: "Minimum for basic insights", tone: "warn" },
          { label: "10+ tastings", value: "Stronger signal for features", tone: "good" },
          { label: "Radar Ready", value: "10+ tastings with notes", tone: "good" },
        ]}
      >
        <MetricRow
          label="1+ tasting"
          value={fmtCount(insights?.whiskies_with_1_plus_tasting)}
        />
        <MetricRow
          label="5+ tastings"
          value={fmtCount(insights?.whiskies_with_5_plus_tastings)}
        />
        <MetricRow
          label="10+ tastings"
          value={fmtCount(insights?.whiskies_with_10_plus_tastings)}
        />
        <MetricRow
          label="5+ with notes"
          value={fmtCount(insights?.whiskies_with_5_plus_note_tastings)}
        />
        <MetricRow
          label="10+ with notes"
          value={fmtCount(insights?.whiskies_with_10_plus_note_tastings)}
        />
        <MetricRowNoDivider
          label="Flavor radar ready"
          value={fmtCount(insights?.flavor_radar_ready_count)}
        />
      </MetricsCard>
    </>
  );
}
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.xl, gap: spacing.lg }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.md,
          }}
        >
          <View style={{ gap: 6, flex: 1 }}>
            <Text style={[type.screenTitle, { color: colors.textPrimary }]}>Metrics</Text>
            <Text style={[type.microcopyItalic, { color: colors.textSecondary }]}>
              Updated: {updatedAt}
            </Text>
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
              <Text
                style={[
                  type.button,
                  { fontSize: 13, lineHeight: 16, color: colors.textPrimary },
                ]}
              >
                Back
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
          <TabPill label="Overview" active={tab === "overview"} onPress={() => setTab("overview")} />
          <TabPill
            label="Engagement"
            active={tab === "engagement"}
            onPress={() => setTab("engagement")}
          />
          <TabPill label="Pipeline" active={tab === "pipeline"} onPress={() => setTab("pipeline")} />
          <TabPill label="Catalog" active={tab === "catalog"} onPress={() => setTab("catalog")} />
          <TabPill
            label="Tasting Quality"
            active={tab === "quality"}
            onPress={() => setTab("quality")}
          />
          <TabPill
            label="Retention"
            active={tab === "retention"}
            onPress={() => setTab("retention")}
          />
          <TabPill
  label="Insights"
  active={tab === "insights"}
  onPress={() => setTab("insights")}
/>
        </View>

        {error ? (
          <MetricsCard title="Error">
            <Text style={[type.body, { color: colors.accent }]}>{error}</Text>
          </MetricsCard>
        ) : null}

        {loading && !data ? (
          <View style={{ paddingVertical: spacing.xl }}>
            <ActivityIndicator />
          </View>
        ) : null}

        {!loading && data ? (
          <>
            {tab === "overview" ? renderOverviewTab() : null}
            {tab === "engagement" ? renderEngagementTab() : null}
            {tab === "pipeline" ? renderPipelineTab() : null}
            {tab === "catalog" ? renderCatalogTab() : null}
            {tab === "quality" ? renderQualityTab() : null}
            {tab === "retention" ? renderRetentionTab() : null}
            {tab === "insights" ? renderInsightsTab() : null}
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}