-- Migration 012: Daily Check-Ins (Sprint G — Omni AI Coach)
-- Run in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS daily_checkins (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users ON DELETE CASCADE,
  checkin_date    DATE NOT NULL,
  energy_level    INTEGER NOT NULL CHECK (energy_level BETWEEN 1 AND 10),
  sleep_quality   INTEGER NOT NULL CHECK (sleep_quality BETWEEN 1 AND 10),
  soreness_level  INTEGER NOT NULL CHECK (soreness_level BETWEEN 1 AND 5),
  pain_flag       BOOLEAN NOT NULL DEFAULT FALSE,
  pain_location   TEXT,
  notes           TEXT,
  omni_response   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, checkin_date)
);

-- Row Level Security
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own check-ins"
  ON daily_checkins FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select own check-ins"
  ON daily_checkins FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own check-ins"
  ON daily_checkins FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own check-ins"
  ON daily_checkins FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Index for fast today-lookups
CREATE INDEX IF NOT EXISTS daily_checkins_user_date_idx
  ON daily_checkins (user_id, checkin_date DESC);
