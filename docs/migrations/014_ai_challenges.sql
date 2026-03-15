-- Sprint G/H: AI Challenges
-- AI-generated personal (user_id IS NOT NULL) and community (user_id IS NULL) challenges.

CREATE TABLE IF NOT EXISTS ai_challenges (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text        NOT NULL CHECK (type IN ('personal', 'shared')),
  title       text        NOT NULL,
  description text        NOT NULL,
  metric      text        NOT NULL,   -- 'total_volume'|'sessions_count'|'pr_count'|'consistency'
  target      numeric     NOT NULL,
  unit        text        NOT NULL,
  start_date  date        NOT NULL,
  end_date    date        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_challenges ENABLE ROW LEVEL SECURITY;

-- Users can read their own challenges and shared/community challenges (user_id IS NULL)
CREATE POLICY "Users read own + shared challenges"
  ON ai_challenges
  FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users insert own challenges"
  ON ai_challenges
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      (type = 'personal' AND user_id IS NOT NULL)
      OR (type = 'shared' AND user_id IS NOT NULL)
    )
  );

CREATE INDEX IF NOT EXISTS ai_challenges_user_idx ON ai_challenges(user_id);
CREATE INDEX IF NOT EXISTS ai_challenges_shared_idx ON ai_challenges(type, start_date)
  WHERE user_id IS NULL;
