-- Add part_ids column to Offers table for part-level offers
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

ALTER TABLE "Offers"
  ADD COLUMN IF NOT EXISTS part_ids text[] DEFAULT '{}';

COMMENT ON COLUMN "Offers".part_ids IS 'Optional: IDs of specific split_parts this offer covers. Empty = whole order offer.';
