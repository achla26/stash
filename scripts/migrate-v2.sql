-- Stash v2 migration: sections -> folders, pages -> notes
-- Run BEFORE installing the v2 build on a DB that has old data.
-- Fresh DB pe ye no-op hai (safe).
-- psql "$DATABASE_URL" -f scripts/migrate-v2.sql

BEGIN;

DO $do$
BEGIN
  IF to_regclass('public.sections') IS NOT NULL THEN
    INSERT INTO folders (id, user_id, name, color, icon, type, parent_id, notebook_id, sort_order, created_at, updated_at, deleted_at, is_pinned, is_trashed)
    SELECT s.id, s.user_id::uuid, s.name, '#6366f1', s.icon, 'note', NULL, s.notebook_id,
           s.sort_order, s.created_at, s.updated_at, now(), false, s.is_trashed
    FROM sections s
    ON CONFLICT (id) DO NOTHING;
  END IF;

  IF to_regclass('public.pages') IS NOT NULL THEN
    INSERT INTO notes (id, user_id, title, content, folder_id, notebook_id, sort_order, tags, is_pinned, is_trashed, created_at, updated_at)
    SELECT p.id, p.user_id::uuid, p.title,
           CASE WHEN p.content IS NULL OR p.content = '' THEN NULL
                ELSE jsonb_build_object(
                  'type', 'doc',
                  'content', jsonb_build_array(
                    jsonb_build_object('type', 'paragraph',
                      'content', jsonb_build_array(
                        jsonb_build_object('type', 'text', 'text', p.content)))))
              END,
           NULL, p.notebook_id, p.sort_order, ARRAY[]::text[], p.is_pinned, p.is_trashed,
           p.created_at, p.updated_at
    FROM pages p
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $do$;

DROP TABLE IF EXISTS pages;
DROP TABLE IF EXISTS sections;

COMMIT;
