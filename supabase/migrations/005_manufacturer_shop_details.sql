-- Shop details shown to creators alongside a manufacturer's offers.
-- Run in the Supabase SQL Editor (Dashboard → SQL Editor → New Query).
-- All columns are nullable so existing profiles keep working untouched.

ALTER TABLE manufacturer_profiles
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS typical_lead_time_weeks integer
    CHECK (typical_lead_time_weeks IS NULL OR typical_lead_time_weeks BETWEEN 0 AND 520),
  ADD COLUMN IF NOT EXISTS min_order_quantity integer
    CHECK (min_order_quantity IS NULL OR min_order_quantity >= 1);

-- Make PostgREST pick up the new columns immediately.
NOTIFY pgrst, 'reload schema';
