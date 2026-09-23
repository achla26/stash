import { pgTable, uuid, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';

// Notebooks table — sections/pages v2 me khatam:
// sections -> folders(notebookId), pages -> notes(notebookId)
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
