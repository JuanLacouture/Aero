-- =============================================
-- AERO — Privacy Consent Migration
-- Adds privacy policy acceptance tracking to profiles
-- =============================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS privacy_accepted      BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_policy_version VARCHAR(10) DEFAULT '1.0';

-- Index for fast middleware lookups (auth users who haven't accepted yet)
CREATE INDEX IF NOT EXISTS idx_profiles_privacy_accepted
  ON profiles(id, privacy_accepted)
  WHERE privacy_accepted = FALSE;
