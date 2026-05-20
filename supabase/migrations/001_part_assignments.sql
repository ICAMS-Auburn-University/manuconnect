-- Part assignments table: tracks per-part status and manufacturer assignment
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

CREATE TABLE IF NOT EXISTS part_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  part_id uuid NOT NULL REFERENCES split_parts(id) ON DELETE CASCADE,
  assembly_id uuid REFERENCES assemblies(id) ON DELETE SET NULL,
  assigned_manufacturer uuid,
  manufacturer_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Not Started',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(order_id, part_id)
);

-- Enable RLS
ALTER TABLE part_assignments ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (matches your existing pattern)
CREATE POLICY "Service role full access"
  ON part_assignments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for fast lookups by order
CREATE INDEX IF NOT EXISTS idx_part_assignments_order_id ON part_assignments(order_id);
