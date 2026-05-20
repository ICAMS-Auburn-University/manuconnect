-- Manufacturer profiles table: stores manufacturing capabilities collected during onboarding
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

CREATE TABLE IF NOT EXISTS manufacturer_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  processes text[] NOT NULL DEFAULT '{}',
  material_categories text[] NOT NULL DEFAULT '{}',
  certifications text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE manufacturer_profiles ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (matches existing pattern)
CREATE POLICY "Service role full access"
  ON manufacturer_profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_manufacturer_profiles_user_id ON manufacturer_profiles(user_id);
