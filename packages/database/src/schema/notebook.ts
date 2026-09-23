import { pgTable, uuid, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';

// Notebooks table
export const notebooks = pgTable('notebooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  icon: text('icon').notNull().default('📓'),
  color: text('color').notNull().default('#3b82f6'),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  isPinned: boolean('is_pinned').notNull().default(false),
  isTrashed: boolean('is_trashed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('notebooks_user_id_idx').on(table.userId),
}));

// Sections table
export const sections = pgTable('sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  notebookId: uuid('notebook_id').notNull().references(() => notebooks.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  icon: text('icon').notNull().default('📑'),
  sortOrder: integer('sort_order').notNull().default(0),
  isTrashed: boolean('is_trashed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  notebookIdIdx: index('sections_notebook_id_idx').on(table.notebookId),
  userIdIdx: index('sections_user_id_idx').on(table.userId),
}));

// Pages table
export const pages = pgTable('pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sectionId: uuid('section_id').notNull().references(() => sections.id, { onDelete: 'cascade' }),
  notebookId: uuid('notebook_id').notNull().references(() => notebooks.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  title: text('title').notNull().default('Untitled'),
  content: text('content'),
  sortOrder: integer('sort_order').notNull().default(0),
  isPinned: boolean('is_pinned').notNull().default(false),
  isTrashed: boolean('is_trashed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  sectionIdIdx: index('pages_section_id_idx').on(table.sectionId),
  notebookIdIdx: index('pages_notebook_id_idx').on(table.notebookId),
  userIdIdx: index('pages_user_id_idx').on(table.userId),
}));