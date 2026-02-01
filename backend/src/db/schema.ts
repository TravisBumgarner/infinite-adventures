import { sql } from "drizzle-orm";
import { primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const notes = sqliteTable("notes", {
  id: text("id").primaryKey(),
  type: text("type", {
    enum: ["pc", "npc", "item", "quest", "location", "goal", "session"],
  }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  canvas_x: real("canvas_x").notNull().default(0),
  canvas_y: real("canvas_y").notNull().default(0),
  created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
  updated_at: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  auth_id: text("auth_id").unique().notNull(),
  email: text("email").unique().notNull(),
  display_name: text("display_name").notNull(),
  created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
  updated_at: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const noteLinks = sqliteTable(
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
