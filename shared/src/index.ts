import { z } from "zod";

// --- Canvas Item Schemas (new) ---

export const CanvasItemTypeSchema = z.enum(["person", "place", "thing", "session", "event"]);

export const CanvasItemSummarySchema = z.object({
  id: z.string(),
  type: CanvasItemTypeSchema,
  title: z.string(),
  summary: z.string(),
  canvas_x: z.number(),
  canvas_y: z.number(),
  selected_photo_url: z.string().optional(),
  tag_ids: z.array(z.string()).optional(),
  created_at: z.string(),
});

export const NoteSchema = z.object({
  id: z.string(),
  content: z.string(),
  is_pinned: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const PhotoSchema = z.object({
  id: z.string(),
  url: z.string(),
  original_name: z.string(),
  is_selected: z.boolean(),
  aspect_ratio: z.number().optional(),
  blurhash: z.string().optional(),
});

export const TagSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  color: z.string(),
});

export const CreateTagInputSchema = z.object({
  name: z.string(),
  icon: z.string(),
  color: z.string(),
});

export const UpdateTagInputSchema = z.object({
  name: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const CanvasItemLinkSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: CanvasItemTypeSchema,
});

export const CanvasItemLinkWithSnippetSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: CanvasItemTypeSchema,
  snippet: z.string().optional(),
});

export const CanvasItemSchema = z.object({
  id: z.string(),
  type: CanvasItemTypeSchema,
  title: z.string(),
  summary: z.string(),
  canvas_x: z.number(),
  canvas_y: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  session_date: z.string().optional(),
  notes: z.array(NoteSchema),
  photos: z.array(PhotoSchema),
  tags: z.array(TagSchema),
  links_to: z.array(CanvasItemLinkSchema),
  linked_from: z.array(CanvasItemLinkWithSnippetSchema),
});

export const CreateCanvasItemInputSchema = z.object({
  type: CanvasItemTypeSchema,
  title: z.string(),
  canvas_x: z.number().optional(),
  canvas_y: z.number().optional(),
  session_date: z.string().optional(),
});

export const UpdateCanvasItemInputSchema = z.object({
  title: z.string().optional(),
  summary: z.string().optional(),
  canvas_x: z.number().optional(),
  canvas_y: z.number().optional(),
  session_date: z.string().optional(),
});

// --- Note Input Schemas ---

export const CreateNoteInputSchema = z.object({
  content: z.string().optional(),
});

export const UpdateNoteInputSchema = z.object({
  content: z.string().optional(),
  is_pinned: z.boolean().optional(),
});

export const CanvasItemSearchResultSchema = z.object({
  id: z.string(),
  type: CanvasItemTypeSchema,
  title: z.string(),
  snippet: z.string(),
});

export const SessionSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  session_date: z.string(),
  selected_photo_url: z.string().optional(),
  created_at: z.string(),
});

export const TaggedItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: CanvasItemTypeSchema,
  selected_photo_url: z.string().optional(),
});

export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  displayName: z.string(),
});

export const CanvasSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const CanvasSchema = z.object({
  id: z.string(),
  name: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateCanvasInputSchema = z.object({
  name: z.string(),
});

export const UpdateCanvasInputSchema = z.object({
  name: z.string().optional(),
});

// --- Timeline ---

export const TimelineEntrySchema = z.object({
  id: z.string(),
  kind: z.enum(["note", "photo"]),
  created_at: z.string(),
  updated_at: z.string(),
  content: z.string().optional(),
  photo_url: z.string().optional(),
  original_name: z.string().optional(),
  aspect_ratio: z.number().optional(),
  blurhash: z.string().optional(),
  parent_item_id: z.string(),
  parent_item_type: CanvasItemTypeSchema,
  parent_item_title: z.string(),
});

export type TimelineEntry = z.infer<typeof TimelineEntrySchema>;

export const PaginatedTimelineSchema = z.object({
  entries: z.array(TimelineEntrySchema),
  next_cursor: z.string().nullable(),
});

export type PaginatedTimeline = z.infer<typeof PaginatedTimelineSchema>;

export const TimelineDayCountsSchema = z.object({
  counts: z.record(z.string(), z.number()),
});

export type TimelineDayCounts = z.infer<typeof TimelineDayCountsSchema>;

// --- Error codes ---

export const ERROR_CODES = [
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "INVALID_INPUT",
  "INVALID_UUID",
  "INTERNAL_ERROR",
  "NOTE_NOT_FOUND",
  "CANVAS_NOT_FOUND",
  "CANVAS_ITEM_NOT_FOUND",
  "PHOTO_NOT_FOUND",
  "TAG_NOT_FOUND",
  "LAST_CANVAS",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

// --- Inferred types (Canvas Items) ---

export type CanvasItemType = z.infer<typeof CanvasItemTypeSchema>;
export type CanvasItemSummary = z.infer<typeof CanvasItemSummarySchema>;
export type Note = z.infer<typeof NoteSchema>;
export type Photo = z.infer<typeof PhotoSchema>;
export type CanvasItemLink = z.infer<typeof CanvasItemLinkSchema>;
export type CanvasItemLinkWithSnippet = z.infer<typeof CanvasItemLinkWithSnippetSchema>;
export type CanvasItem = z.infer<typeof CanvasItemSchema>;
export type CreateCanvasItemInput = z.infer<typeof CreateCanvasItemInputSchema>;
export type UpdateCanvasItemInput = z.infer<typeof UpdateCanvasItemInputSchema>;
export type CreateNoteInput = z.infer<typeof CreateNoteInputSchema>;
export type UpdateNoteInput = z.infer<typeof UpdateNoteInputSchema>;
export type CanvasItemSearchResult = z.infer<typeof CanvasItemSearchResultSchema>;
export type SessionSummary = z.infer<typeof SessionSummarySchema>;
export type TaggedItem = z.infer<typeof TaggedItemSchema>;
export type Tag = z.infer<typeof TagSchema>;
export type CreateTagInput = z.infer<typeof CreateTagInputSchema>;
export type UpdateTagInput = z.infer<typeof UpdateTagInputSchema>;

// --- Inferred types (Other) ---

export type User = z.infer<typeof UserSchema>;
export type CanvasSummary = z.infer<typeof CanvasSummarySchema>;
export type Canvas = z.infer<typeof CanvasSchema>;
export type CreateCanvasInput = z.infer<typeof CreateCanvasInputSchema>;
export type UpdateCanvasInput = z.infer<typeof UpdateCanvasInputSchema>;
