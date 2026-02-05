import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  doublePrecision,
  index,
  pgTable,
  primaryKey,
  text,
} from "drizzle-orm/pg-core";

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

// Canvas item type enum values
export const canvasItemTypes = ["person", "place", "thing", "session", "event"] as const;
export type CanvasItemType = (typeof canvasItemTypes)[number];

export const canvases = pgTable("canvases", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  created_at: text("created_at").notNull().default(sql`now()::text`),
  updated_at: text("updated_at").notNull().default(sql`now()::text`),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  auth_id: text("auth_id").unique().notNull(),
  email: text("email").unique().notNull(),
  display_name: text("display_name").notNull(),
  created_at: text("created_at").notNull().default(sql`now()::text`),
  updated_at: text("updated_at").notNull().default(sql`now()::text`),
});

export const canvasUsers = pgTable(
  "canvas_users",
  {
    canvas_id: text("canvas_id")
      .notNull()
      .references(() => canvases.id, { onDelete: "cascade" }),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.canvas_id, table.user_id] })],
);

// ============================================
// Content Tables (type-specific)
// ============================================

export const people = pgTable("people", {
  id: text("id").primaryKey(),
  notes: text("notes").notNull().default(""),
  created_at: text("created_at").notNull().default(sql`now()::text`),
  updated_at: text("updated_at").notNull().default(sql`now()::text`),
});

export const places = pgTable("places", {
  id: text("id").primaryKey(),
  notes: text("notes").notNull().default(""),
  created_at: text("created_at").notNull().default(sql`now()::text`),
  updated_at: text("updated_at").notNull().default(sql`now()::text`),
});

export const things = pgTable("things", {
  id: text("id").primaryKey(),
  notes: text("notes").notNull().default(""),
  created_at: text("created_at").notNull().default(sql`now()::text`),
  updated_at: text("updated_at").notNull().default(sql`now()::text`),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  notes: text("notes").notNull().default(""),
  created_at: text("created_at").notNull().default(sql`now()::text`),
  updated_at: text("updated_at").notNull().default(sql`now()::text`),
});

export const events = pgTable("events", {
  id: text("id").primaryKey(),
  notes: text("notes").notNull().default(""),
  created_at: text("created_at").notNull().default(sql`now()::text`),
  updated_at: text("updated_at").notNull().default(sql`now()::text`),
});

// ============================================
// Canvas Items (base table)
// ============================================

export const canvasItems = pgTable(
  "canvas_items",
  {
    id: text("id").primaryKey(),
    type: text("type", {
      enum: canvasItemTypes,
    }).notNull(),
    title: text("title").notNull(),
    canvas_x: doublePrecision("canvas_x").notNull().default(0),
    canvas_y: doublePrecision("canvas_y").notNull().default(0),
    canvas_id: text("canvas_id")
      .notNull()
      .references(() => canvases.id, { onDelete: "cascade" }),
    user_id: text("user_id").references(() => users.id),
    content_id: text("content_id").notNull(),
    created_at: text("created_at").notNull().default(sql`now()::text`),
    updated_at: text("updated_at").notNull().default(sql`now()::text`),
    search_vector: tsvector("search_vector").generatedAlwaysAs(
      sql`to_tsvector('english', coalesce("title", ''))`,
    ),
  },
  (table) => [
    index("canvas_items_search_vector_idx").using("gin", table.search_vector),
    index("canvas_items_canvas_id_idx").on(table.canvas_id),
    index("canvas_items_user_id_idx").on(table.user_id),
    index("canvas_items_content_id_idx").on(table.content_id),
  ],
);

// ============================================
// Photos
// ============================================

export const photos = pgTable(
  "photos",
  {
    id: text("id").primaryKey(),
    content_type: text("content_type", {
      enum: canvasItemTypes,
    }).notNull(),
    content_id: text("content_id").notNull(),
    filename: text("filename").notNull(),
    original_name: text("original_name").notNull(),
    mime_type: text("mime_type").notNull(),
    is_selected: boolean("is_selected").notNull().default(false),
    created_at: text("created_at").notNull().default(sql`now()::text`),
  },
  (table) => [index("photos_content_idx").on(table.content_type, table.content_id)],
);

// ============================================
// Canvas Item Links (renamed from note_links)
// ============================================

export const canvasItemLinks = pgTable(
  "canvas_item_links",
  {
    source_item_id: text("source_item_id")
      .notNull()
      .references(() => canvasItems.id, { onDelete: "cascade" }),
    target_item_id: text("target_item_id")
      .notNull()
      .references(() => canvasItems.id, { onDelete: "cascade" }),
    snippet: text("snippet"),
    created_at: text("created_at").notNull().default(sql`now()::text`),
  },
  (table) => [primaryKey({ columns: [table.source_item_id, table.target_item_id] })],
);

// ============================================
// Type exports
// ============================================

export type Canvas = typeof canvases.$inferSelect;
export type InsertCanvas = typeof canvases.$inferInsert;

export type Person = typeof people.$inferSelect;
export type InsertPerson = typeof people.$inferInsert;
export type Place = typeof places.$inferSelect;
export type InsertPlace = typeof places.$inferInsert;
export type Thing = typeof things.$inferSelect;
export type InsertThing = typeof things.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;
export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
export type CanvasItem = typeof canvasItems.$inferSelect;
export type InsertCanvasItem = typeof canvasItems.$inferInsert;
export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = typeof photos.$inferInsert;
export type CanvasItemLink = typeof canvasItemLinks.$inferSelect;
export type InsertCanvasItemLink = typeof canvasItemLinks.$inferInsert;
