import {
    pgTable,
    text,
    timestamp,
    uuid,
    boolean,
    pgEnum,
} from "drizzle-orm/pg-core";

export const padVisibilityEnum = pgEnum("pad_visibility", [
    "public",    // Anyone can read and edit
    "private",   // Only owner can see (logged in users only)
    "password",  // Anyone with correct password can read and edit
]);

export const pads = pgTable("pads", {
    id: uuid("id").primaryKey().defaultRandom(),

    // Custom slug ya random
    slug: text("slug").notNull().unique(),

    // Optional title — shown in browser tab
    title: text("title"),

    // Content
    content: text("content").default(""),

    // Owner (null = anonymous)
    userId: uuid("user_id"),

    // Visibility
    isPublic: boolean("is_public").default(true).notNull(),

    visibility: padVisibilityEnum("visibility")
        .notNull()
        .default("public"),

    // Password (null = no password)
    password: text("password"),
    ownerToken: text("owner_token"),

    expiresAt: timestamp("expires_at", { withTimezone: true }),
    allowEdit: boolean("allow_edit").default(true).notNull(), 
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    lastEditedAt: timestamp("last_edited_at", { withTimezone: true }).defaultNow()
});