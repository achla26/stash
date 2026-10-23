-- Stash Phase 1: quotas + pro plan
-- 1) ai_usage: per-user daily AI chat counter
CREATE TABLE IF NOT EXISTS ai_usage (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day     date NOT NULL,
  count   integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
-- 2) users.plan (should already exist; safe no-op if present)
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free';

-- 3) password_resets: SMTP-based password reset tokens
CREATE TABLE IF NOT EXISTS password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS password_resets_hash_idx ON password_resets(token_hash);

-- 4) AI auto-organize
ALTER TABLE notes ADD COLUMN IF NOT EXISTS ai_last_run timestamptz;
CREATE TABLE IF NOT EXISTS ai_tag_usage (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day     date NOT NULL,
  count   integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
