import { z } from "zod";

// --- Schemas ---

export const NoteTypeSchema = z.enum(["pc", "npc", "item", "quest", "location", "goal", "session"]);

export const NoteSummarySchema = z.object({
  id: z.string(),
  type: NoteTypeSchema,
  title: z.string(),
  canvas_x: z.number(),
  canvas_y: z.number(),
});

export const NoteLinkSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: NoteTypeSchema,
});

export const NoteSchema = z.object({
  id: z.string(),
  type: NoteTypeSchema,
  title: z.string(),
  content: z.string(),
  canvas_x: z.number(),
  canvas_y: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  links_to: z.array(NoteLinkSchema),
  linked_from: z.array(NoteLinkSchema),
});

export const CreateNoteInputSchema = z.object({
  type: NoteTypeSchema,
  title: z.string(),
  content: z.string().optional(),
  canvas_x: z.number().optional(),
  canvas_y: z.number().optional(),
});

export const UpdateNoteInputSchema = z.object({
  type: NoteTypeSchema.optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  canvas_x: z.number().optional(),
  canvas_y: z.number().optional(),
});

export const SearchResultSchema = z.object({
  id: z.string(),
  type: NoteTypeSchema,
  title: z.string(),
  snippet: z.string(),
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
});

export const CreateCanvasInputSchema = z.object({
  name: z.string(),
});

export const UpdateCanvasInputSchema = z.object({
  name: z.string(),
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
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

// --- Inferred types ---

export type NoteType = z.infer<typeof NoteTypeSchema>;
export type NoteSummary = z.infer<typeof NoteSummarySchema>;
export type NoteLink = z.infer<typeof NoteLinkSchema>;
export type Note = z.infer<typeof NoteSchema>;
export type CreateNoteInput = z.infer<typeof CreateNoteInputSchema>;
export type UpdateNoteInput = z.infer<typeof UpdateNoteInputSchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type User = z.infer<typeof UserSchema>;
export type CanvasSummary = z.infer<typeof CanvasSummarySchema>;
export type Canvas = z.infer<typeof CanvasSchema>;
export type CreateCanvasInput = z.infer<typeof CreateCanvasInputSchema>;
export type UpdateCanvasInput = z.infer<typeof UpdateCanvasInputSchema>;
