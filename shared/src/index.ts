import { z } from "zod";

// --- Canvas Item Schemas (new) ---

export const CanvasItemTypeSchema = z.enum(["person", "place", "thing", "session", "event"]);

export const CanvasItemSummarySchema = z.object({
  id: z.string(),
  type: CanvasItemTypeSchema,
  title: z.string(),
  canvas_x: z.number(),
  canvas_y: z.number(),
  selected_photo_url: z.string().optional(),
  created_at: z.string(),
});

export const NoteSchema = z.object({
  id: z.string(),
  content: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const PhotoSchema = z.object({
  id: z.string(),
  url: z.string(),
  original_name: z.string(),
  is_selected: z.boolean(),
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
  canvas_x: z.number(),
  canvas_y: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  notes: z.array(NoteSchema),
  photos: z.array(PhotoSchema),
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
  canvas_x: z.number().optional(),
  canvas_y: z.number().optional(),
});

// --- Note Input Schemas ---

export const CreateNoteInputSchema = z.object({
  content: z.string().optional(),
});

export const UpdateNoteInputSchema = z.object({
  content: z.string(),
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

// --- Inferred types (Other) ---

export type User = z.infer<typeof UserSchema>;
export type CanvasSummary = z.infer<typeof CanvasSummarySchema>;
export type Canvas = z.infer<typeof CanvasSchema>;
export type CreateCanvasInput = z.infer<typeof CreateCanvasInputSchema>;
export type UpdateCanvasInput = z.infer<typeof UpdateCanvasInputSchema>;
