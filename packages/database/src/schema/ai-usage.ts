import { pgTable, uuid, date, integer, primaryKey } from "drizzle-orm/pg-core";

export const aiUsage = pgTable(
  "ai_usage",
  {
    userId: uuid("user_id").notNull(),
    day: date("day").notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.day] }) })
);
