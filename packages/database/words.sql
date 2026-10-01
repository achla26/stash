-- Words (vocabulary notebook) — Supabase SQL editor me chalao
CREATE TABLE IF NOT EXISTS words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  word text NOT NULL,
  meaning text NOT NULL DEFAULT '',
  pronunciation text NOT NULL DEFAULT '',
  part_of_speech text NOT NULL DEFAULT '',
  example text NOT NULL DEFAULT '',
  synonyms text[] NOT NULL DEFAULT ARRAY[]::text[],
  book text,
  page integer,
  note text NOT NULL DEFAULT '',
  mastered boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS words_user_idx ON words (user_id);
CREATE INDEX IF NOT EXISTS words_user_created_idx ON words (user_id, created_at DESC);
