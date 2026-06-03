ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_seen_at timestamptz DEFAULT NULL;
