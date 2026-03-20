import { supabase } from "./supabase";

export type AdminDashboardMetrics = {
  totals: {
    total_users: number;
    total_tastings: number;
    total_whiskeys: number;
  };
  overview: {
    new_users_7d: number;
    tastings_7d: number;
    tastings_30d: number;
    wau: number;
    mau: number;
    activation_rate: number | null;
  };
  engagement: {
    total_tastings: number;
    users_with_tastings: number;
  };
  power_users: {
    users_5_plus: number;
    users_10_plus: number;
  };
  pipeline: {
    total_candidates: number;
    pending_candidates: number;
    approved_candidates: number;
    rejected_candidates: number;
    created_7d: number;
    reviewed_7d: number;
    median_review_minutes: number | null;
    avg_pending_age_hours: number | null;
    review_rate_7d: number | null;
  };
  catalog: {
    total_whiskeys: number;
    with_proof_count: number;
    with_proof_pct: number | null;
    with_distillery_count: number;
    with_distillery_pct: number | null;
    with_type_count: number;
    with_type_pct: number | null;
    missing_proof: number;
    missing_distillery: number;
    missing_age: number;
    type_other: number;
    category_other: number;
    region_other: number;
    fully_enriched_count: number;
    fully_enriched_pct: number | null;
  };
  quality: {
    total_tastings: number;
    tastings_with_flavor_tags: number;
    pct_with_flavor_tags: number | null;
    avg_flavor_tags_per_tasting: number | null;
    tastings_with_written_notes: number;
    pct_with_written_notes: number | null;
    low_effort_tastings: number;
    pct_low_effort_tastings: number | null;
  };
  insights: {
    total_whiskeys: number;

    whiskies_with_1_plus_tasting: number;
    whiskies_with_1_plus_tasting_pct: number | null;

    whiskies_with_5_plus_tastings: number;
    whiskies_with_5_plus_tastings_pct: number | null;

    whiskies_with_10_plus_tastings: number;
    whiskies_with_10_plus_tastings_pct: number | null;

    whiskies_with_5_plus_note_tastings: number;
    whiskies_with_5_plus_note_tastings_pct: number | null;

    whiskies_with_10_plus_note_tastings: number;
    whiskies_with_10_plus_note_tastings_pct: number | null;

    flavor_radar_ready_count: number;
    flavor_radar_ready_pct: number | null;
  };
  retention: {
    eligible_users_7d: number;
    retained_users_7d: number;
    retention_7d: number | null;
  };
};

export async function fetchAdminMetrics(): Promise<AdminDashboardMetrics> {
  const { data, error } = await supabase.rpc("admin_dashboard_metrics");

  if (error) throw error;
  if (!data) throw new Error("Admin dashboard metrics returned no data.");

  return data as AdminDashboardMetrics;
}