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
  createdAt: text("created_at").notNull().default(sql`now()::text`),
  updatedAt: text("updated_at").notNull().default(sql`now()::text`),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  authId: text("auth_id").unique().notNull(),
  email: text("email").unique().notNull(),
  displayName: text("display_name").notNull(),
  createdAt: text("created_at").notNull().default(sql`now()::text`),
  updatedAt: text("updated_at").notNull().default(sql`now()::text`),
});

export const canvasUsers = pgTable(
  "canvas_users",
  {
    canvasId: text("canvas_id")
      .notNull()
      .references(() => canvases.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.canvasId, table.userId] })],
);

// ============================================
// Content Tables (type-specific, minimal)
// ============================================

export const people = pgTable("people", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull().default(sql`now()::text`),
  updatedAt: text("updated_at").notNull().default(sql`now()::text`),
});

export const places = pgTable("places", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull().default(sql`now()::text`),
  updatedAt: text("updated_at").notNull().default(sql`now()::text`),
});

export const things = pgTable("things", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull().default(sql`now()::text`),
  updatedAt: text("updated_at").notNull().default(sql`now()::text`),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  sessionDate: text("session_date").notNull(),
  createdAt: text("created_at").notNull().default(sql`now()::text`),
  updatedAt: text("updated_at").notNull().default(sql`now()::text`),
});

export const events = pgTable("events", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull().default(sql`now()::text`),
  updatedAt: text("updated_at").notNull().default(sql`now()::text`),
});

// ============================================
// Notes (attached to canvas items)
// ============================================

export const notes = pgTable(
  "notes",
  {
    id: text("id").primaryKey(),
    canvasItemId: text("canvas_item_id")
      .notNull()
      .references(() => canvasItems.id, { onDelete: "cascade" }),
    content: text("content").notNull().default(""),
    plainContent: text("plain_content").notNull().default(""),
    isImportant: boolean("is_important").notNull().default(false),
    createdAt: text("created_at").notNull().default(sql`now()::text`),
    updatedAt: text("updated_at").notNull().default(sql`now()::text`),
  },
  (table) => [index("notes_canvas_item_id_idx").on(table.canvasItemId)],
);

// ============================================
// Note History (snapshots of note content)
// ============================================

export const noteHistory = pgTable(
  "note_history",
  {
    id: text("id").primaryKey(),
    noteId: text("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    snapshotAt: text("snapshot_at").notNull(),
  },
  (table) => [index("note_history_note_id_idx").on(table.noteId)],
);

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
    summary: text("summary").notNull().default(""),
    canvasX: doublePrecision("canvas_x").notNull().default(0),
    canvasY: doublePrecision("canvas_y").notNull().default(0),
    canvasId: text("canvas_id")
      .notNull()
      .references(() => canvases.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id),
    contentId: text("content_id").notNull(),
    createdAt: text("created_at").notNull().default(sql`now()::text`),
    updatedAt: text("updated_at").notNull().default(sql`now()::text`),
    searchVector: tsvector("search_vector").generatedAlwaysAs(
      sql`to_tsvector('english', coalesce("title", '') || ' ' || coalesce("summary", ''))`,
    ),
  },
  (table) => [
    index("canvas_items_search_vector_idx").using("gin", table.searchVector),
    index("canvas_items_canvas_id_idx").on(table.canvasId),
    index("canvas_items_user_id_idx").on(table.userId),
    index("canvas_items_content_id_idx").on(table.contentId),
  ],
);

// ============================================
// Photos
// ============================================

export const photos = pgTable(
  "photos",
  {
    id: text("id").primaryKey(),
    contentType: text("content_type", {
      enum: canvasItemTypes,
    }).notNull(),
    contentId: text("content_id").notNull(),
    filename: text("filename").notNull(),
    originalName: text("original_name").notNull(),
    mimeType: text("mime_type").notNull(),
    isMainPhoto: boolean("is_main_photo").notNull().default(false),
    isImportant: boolean("is_important").notNull().default(false),
    caption: text("caption").notNull().default(""),
    aspectRatio: doublePrecision("aspect_ratio"),
    blurhash: text("blurhash"),
    createdAt: text("created_at").notNull().default(sql`now()::text`),
  },
  (table) => [index("photos_content_idx").on(table.contentType, table.contentId)],
);

// ============================================
// Quick Notes (per-canvas floating notes)
// ============================================

export const quickNotes = pgTable(
  "quick_notes",
  {
    id: text("id").primaryKey(),
    canvasId: text("canvas_id")
      .notNull()
      .references(() => canvases.id, { onDelete: "cascade" }),
    content: text("content").notNull().default(""),
    isImportant: boolean("is_important").notNull().default(false),
    createdAt: text("created_at").notNull().default(sql`now()::text`),
    updatedAt: text("updated_at").notNull().default(sql`now()::text`),
  },
  (table) => [index("quick_notes_canvas_id_idx").on(table.canvasId)],
);

export type QuickNote = typeof quickNotes.$inferSelect;
export type InsertQuickNote = typeof quickNotes.$inferInsert;

// ============================================
// Tags
// ============================================

export const tags = pgTable(
  "tags",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    icon: text("icon").notNull(),
    color: text("color").notNull(),
    canvasId: text("canvas_id")
      .notNull()
      .references(() => canvases.id, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull().default(sql`now()::text`),
    updatedAt: text("updated_at").notNull().default(sql`now()::text`),
  },
  (table) => [index("tags_canvas_id_idx").on(table.canvasId)],
);

export const canvasItemTags = pgTable(
  "canvas_item_tags",
  {
    canvasItemId: text("canvas_item_id")
      .notNull()
      .references(() => canvasItems.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.canvasItemId, table.tagId] })],
);

// ============================================
// Canvas Item Links (renamed from note_links)
// ============================================

export const canvasItemLinks = pgTable(
  "canvas_item_links",
  {
    sourceItemId: text("source_item_id")
      .notNull()
      .references(() => canvasItems.id, { onDelete: "cascade" }),
    targetItemId: text("target_item_id")
      .notNull()
      .references(() => canvasItems.id, { onDelete: "cascade" }),
    snippet: text("snippet"),
    createdAt: text("created_at").notNull().default(sql`now()::text`),
  },
  (table) => [primaryKey({ columns: [table.sourceItemId, table.targetItemId] })],
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
export type Note = typeof notes.$inferSelect;
export type InsertNote = typeof notes.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;
export type CanvasItemTag = typeof canvasItemTags.$inferSelect;
export type InsertCanvasItemTag = typeof canvasItemTags.$inferInsert;
export type NoteHistory = typeof noteHistory.$inferSelect;
export type InsertNoteHistory = typeof noteHistory.$inferInsert;
