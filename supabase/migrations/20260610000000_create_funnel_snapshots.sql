CREATE TABLE funnel_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL UNIQUE,
  total_accounts INTEGER,
  first_tasting INTEGER,
  second_tasting INTEGER,
  insights_viewed INTEGER,
  upgrade_tapped INTEGER,
  premium INTEGER,
  new_accounts_30d INTEGER,
  new_first_tastings_30d INTEGER,
  new_second_tastings_30d INTEGER,
  new_insights_viewed_30d INTEGER,
  new_upgrade_tapped_30d INTEGER,
  new_premium_30d INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX funnel_snapshots_date_idx ON funnel_snapshots(snapshot_date);
