import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

export const words = pgTable("words", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  word: text("word").notNull(),
  meaning: text("meaning").notNull().default(""),
  pronunciation: text("pronunciation").notNull().default(""),
  partOfSpeech: text("part_of_speech").notNull().default(""),
  example: text("example").notNull().default(""),
  synonyms: text("synonyms")
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
  book: text("book"),
  page: integer("page"),
  note: text("note").notNull().default(""),
  mastered: boolean("mastered").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
