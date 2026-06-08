ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS app_version text,
  ADD COLUMN IF NOT EXISTS app_version_updated_at timestamptz;
