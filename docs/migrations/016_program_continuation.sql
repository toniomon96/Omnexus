-- Sprint H: Program Continuation + Training DNA
-- Extends programs table with chaining columns and creates progression_reports table.

-- ─── programs table extensions ────────────────────────────────────────────────
ALTER TABLE programs ADD COLUMN IF NOT EXISTS predecessor_program_id UUID REFERENCES programs(id);
ALTER TABLE programs ADD COLUMN IF NOT EXISTS block_type TEXT NOT NULL DEFAULT 'standard'
  CHECK (block_type IN ('standard', 'intensification', 'deload', 'custom'));
ALTER TABLE programs ADD COLUMN IF NOT EXISTS continuation_option TEXT
  CHECK (continuation_option IN ('build-on', 'change-focus', 'deload', NULL));

-- ─── progression_reports table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS progression_reports (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES auth.users ON DELETE CASCADE,
  program_id           UUID,  -- references programs(id) — soft reference to support custom programs
  generated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consistency_percent  NUMERIC(5,2),
  total_workouts       INTEGER,
  planned_workouts     INTEGER,
  top_prs              JSONB,
  volume_by_muscle     JSONB,
  omni_narrative       TEXT,
  viewed_at            TIMESTAMPTZ
);

-- RLS
ALTER TABLE progression_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own progression reports"
  ON progression_reports
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── program_chains view ──────────────────────────────────────────────────────
CREATE OR REPLACE VIEW program_chains AS
SELECT
  p.id,
  p.user_id,
  p.name,
  p.block_type,
  p.continuation_option,
  p.predecessor_program_id,
  p.created_at,
  p.completed_at,
  predecessor.name AS predecessor_name,
  predecessor.completed_at AS predecessor_completed_at
FROM programs p
LEFT JOIN programs predecessor ON p.predecessor_program_id = predecessor.id;
