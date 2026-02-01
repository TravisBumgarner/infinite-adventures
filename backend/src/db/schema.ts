import { sql } from "drizzle-orm";
import { customType, doublePrecision, index, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

export const notes = pgTable(
  "notes",
  {
    id: text("id").primaryKey(),
    type: text("type", {
      enum: ["pc", "npc", "item", "quest", "location", "goal", "session"],
    }).notNull(),
    title: text("title").notNull(),
    content: text("content").notNull().default(""),
    canvas_x: doublePrecision("canvas_x").notNull().default(0),
    canvas_y: doublePrecision("canvas_y").notNull().default(0),
    created_at: text("created_at").notNull().default(sql`now()::text`),
    user_id: text("user_id").references(() => users.id),
    updated_at: text("updated_at").notNull().default(sql`now()::text`),
    search_vector: tsvector("search_vector").generatedAlwaysAs(
      sql`setweight(to_tsvector('english', coalesce("title", '')), 'A') || setweight(to_tsvector('english', coalesce("content", '')), 'B')`,
    ),
  },
  (table) => [index("notes_search_vector_idx").using("gin", table.search_vector)],
);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  auth_id: text("auth_id").unique().notNull(),
  email: text("email").unique().notNull(),
  display_name: text("display_name").notNull(),
  created_at: text("created_at").notNull().default(sql`now()::text`),
  updated_at: text("updated_at").notNull().default(sql`now()::text`),
});

export const noteLinks = pgTable(
  "note_links",
  {
    source_note_id: text("source_note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    target_note_id: text("target_note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.source_note_id, table.target_note_id] })],
);

export type Note = typeof notes.$inferSelect;
export type InsertNote = typeof notes.$inferInsert;
export type NoteLink = typeof noteLinks.$inferSelect;
