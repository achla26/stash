import { pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core";
import { notebooks } from "./notebook";

export const folders = pgTable("folders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  color: text("color").default("#6366f1"),
  icon: text("icon"),
  type: text("type").default("note").notNull(),
  // 'note' | 'link' | 'task'
  parentId: uuid("parent_id"),
  // nested folders ke liye
  notebookId: uuid("notebook_id").references(() => notebooks.id, { onDelete: "cascade" }),
  // notebook ke andar folder = purana "section"
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at").defaultNow().notNull(),
  isPinned: boolean("is_pinned").default(false).notNull(),
  isTrashed: boolean("is_trashed").default(false).notNull(),
});