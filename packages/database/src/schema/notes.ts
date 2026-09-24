import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  // user ka id - RLS ke liye zaroori
  title: text("title").default("Untitled").notNull(),
  content: jsonb("content"),
  // Tiptap ka JSON yahan store hoga
  folderId: uuid("folder_id"),
  notebookId: uuid("notebook_id"),
  // notebook ke andar note = purana "page"
  sortOrder: integer("sort_order").notNull().default(0),
  tags: text("tags")
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
  isPinned: boolean("is_pinned").default(false).notNull(),
  isTrashed: boolean("is_trashed").default(false).notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  publicSlug: text("public_slug").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});