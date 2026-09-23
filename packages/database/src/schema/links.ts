import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm/sql";

export const links = pgTable("links", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  url: text("url").notNull(),
  title: text("title"),
  description: text("description"),
  image: text("image"),
  // OG image URL
  favicon: text("favicon"),
  folderId: uuid("folder_id"),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  // Tags as a simple text array — e.g. ["work", "important"]
  tags: text("tags")
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
  isTrashed: boolean("is_trashed").default(false).notNull(),
  isPinned: boolean("is_pinned").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

});