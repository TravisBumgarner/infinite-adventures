import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import { getDb } from "../db/connection.js";
import { notes, noteLinks } from "../db/schema.js";

export type NoteType = typeof notes.$inferSelect.type;

export type Note = typeof notes.$inferSelect;

export interface NoteSummary {
  id: string;
  type: NoteType;
  title: string;
  canvas_x: number;
  canvas_y: number;
}

export interface NoteLinkInfo {
  id: string;
  title: string;
  type: NoteType;
}

export interface NoteWithLinks extends Note {
  links_to: NoteLinkInfo[];
  linked_from: NoteLinkInfo[];
}

export interface CreateNoteInput {
  type: string;
  title: string;
  content?: string;
  canvas_x?: number;
  canvas_y?: number;
}

export interface UpdateNoteInput {
  type?: string;
  title?: string;
  content?: string;
  canvas_x?: number;
  canvas_y?: number;
}

const VALID_TYPES = [
  "pc",
  "npc",
  "item",
  "quest",
  "location",
  "goal",
  "session",
] as const;

export function isValidNoteType(type: string): type is NoteType {
  return (VALID_TYPES as readonly string[]).includes(type);
}

export function listNotes(): NoteSummary[] {
  const db = getDb();
  return db
    .select({
      id: notes.id,
      type: notes.type,
      title: notes.title,
      canvas_x: notes.canvas_x,
      canvas_y: notes.canvas_y,
    })
    .from(notes)
    .orderBy(notes.created_at)
    .all();
}

export function getNote(id: string): NoteWithLinks | null {
  const db = getDb();
  const note = db.select().from(notes).where(eq(notes.id, id)).get();
  if (!note) return null;

  const linksTo = db
    .select({
      id: notes.id,
      title: notes.title,
      type: notes.type,
    })
    .from(noteLinks)
    .innerJoin(notes, eq(notes.id, noteLinks.target_note_id))
    .where(eq(noteLinks.source_note_id, id))
    .all();

  const linkedFrom = db
    .select({
      id: notes.id,
      title: notes.title,
      type: notes.type,
    })
    .from(noteLinks)
    .innerJoin(notes, eq(notes.id, noteLinks.source_note_id))
    .where(eq(noteLinks.target_note_id, id))
    .all();

  return { ...note, links_to: linksTo, linked_from: linkedFrom };
}

export function createNote(input: CreateNoteInput): Note {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  if (!input.title) {
    throw new ValidationError("title is required");
  }
  if (!isValidNoteType(input.type)) {
    throw new ValidationError(
      `Invalid type "${input.type}". Must be one of: ${VALID_TYPES.join(", ")}`
    );
  }

  db.insert(notes)
    .values({
      id,
      type: input.type as NoteType,
      title: input.title,
      content: input.content ?? "",
      canvas_x: input.canvas_x ?? 0,
      canvas_y: input.canvas_y ?? 0,
      created_at: now,
      updated_at: now,
    })
    .run();

  return db.select().from(notes).where(eq(notes.id, id)).get()!;
}

export function updateNote(id: string, input: UpdateNoteInput): Note | null {
  const db = getDb();
  const existing = db.select().from(notes).where(eq(notes.id, id)).get();
  if (!existing) return null;

  if (input.type !== undefined && !isValidNoteType(input.type)) {
    throw new ValidationError(
      `Invalid type "${input.type}". Must be one of: ${VALID_TYPES.join(", ")}`
    );
  }

  db.update(notes)
    .set({
      type: (input.type as NoteType) ?? existing.type,
      title: input.title ?? existing.title,
      content: input.content ?? existing.content,
      canvas_x: input.canvas_x ?? existing.canvas_x,
      canvas_y: input.canvas_y ?? existing.canvas_y,
      updated_at: new Date().toISOString(),
    })
    .where(eq(notes.id, id))
    .run();

  return db.select().from(notes).where(eq(notes.id, id)).get()!;
}

export function deleteNote(id: string): boolean {
  const db = getDb();
  const result = db.delete(notes).where(eq(notes.id, id)).run();
  return result.changes > 0;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
