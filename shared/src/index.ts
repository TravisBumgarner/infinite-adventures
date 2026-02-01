import { z } from "zod";

// --- Schemas (stubs — will be fleshed out in the green phase) ---

export const NoteTypeSchema = z.enum([
  "pc",
  "npc",
  "item",
  "quest",
  "location",
  "goal",
  "session",
]);

export const NoteSummarySchema = z.object({});

export const NoteLinkSchema = z.object({});

export const NoteSchema = z.object({});

export const CreateNoteInputSchema = z.object({});

export const UpdateNoteInputSchema = z.object({});

export const SearchResultSchema = z.object({});

// --- Inferred types ---

export type NoteType = z.infer<typeof NoteTypeSchema>;
export type NoteSummary = z.infer<typeof NoteSummarySchema>;
export type NoteLink = z.infer<typeof NoteLinkSchema>;
export type Note = z.infer<typeof NoteSchema>;
export type CreateNoteInput = z.infer<typeof CreateNoteInputSchema>;
export type UpdateNoteInput = z.infer<typeof UpdateNoteInputSchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
