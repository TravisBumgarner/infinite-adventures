import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/connection.js";

const VALID_TYPES = [
  "pc",
  "npc",
  "item",
  "quest",
  "location",
  "goal",
  "session",
] as const;

export type NoteType = (typeof VALID_TYPES)[number];

export interface Note {
  id: string;
  type: NoteType;
  title: string;
  content: string;
  canvas_x: number;
  canvas_y: number;
  created_at: string;
  updated_at: string;
}

export interface NoteSummary {
  id: string;
  type: NoteType;
  title: string;
  canvas_x: number;
  canvas_y: number;
}

export interface NoteLink {
  id: string;
  title: string;
  type: NoteType;
}

export interface NoteWithLinks extends Note {
  links_to: NoteLink[];
  linked_from: NoteLink[];
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

export function isValidNoteType(type: string): type is NoteType {
  return VALID_TYPES.includes(type as NoteType);
}

export function listNotes(): NoteSummary[] {
  const db = getDb();
  return db
    .prepare("SELECT id, type, title, canvas_x, canvas_y FROM notes ORDER BY created_at DESC")
    .all() as NoteSummary[];
}

export function getNote(id: string): NoteWithLinks | null {
  const db = getDb();
  const note = db.prepare("SELECT * FROM notes WHERE id = ?").get(id) as
    | Note
    | undefined;
  if (!note) return null;

  const linksTo = db
    .prepare(
      `SELECT n.id, n.title, n.type FROM note_links nl
       JOIN notes n ON n.id = nl.target_note_id
       WHERE nl.source_note_id = ?`
    )
    .all(id) as NoteLink[];

  const linkedFrom = db
    .prepare(
      `SELECT n.id, n.title, n.type FROM note_links nl
       JOIN notes n ON n.id = nl.source_note_id
       WHERE nl.target_note_id = ?`
    )
    .all(id) as NoteLink[];

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

  db.prepare(
    `INSERT INTO notes (id, type, title, content, canvas_x, canvas_y, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.type,
    input.title,
    input.content ?? "",
    input.canvas_x ?? 0,
    input.canvas_y ?? 0,
    now,
    now
  );

  return db.prepare("SELECT * FROM notes WHERE id = ?").get(id) as Note;
}

export function updateNote(id: string, input: UpdateNoteInput): Note | null {
  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM notes WHERE id = ?")
    .get(id) as Note | undefined;
  if (!existing) return null;

  if (input.type !== undefined && !isValidNoteType(input.type)) {
    throw new ValidationError(
      `Invalid type "${input.type}". Must be one of: ${VALID_TYPES.join(", ")}`
    );
  }

  const updated = {
    type: input.type ?? existing.type,
    title: input.title ?? existing.title,
    content: input.content ?? existing.content,
    canvas_x: input.canvas_x ?? existing.canvas_x,
    canvas_y: input.canvas_y ?? existing.canvas_y,
    updated_at: new Date().toISOString(),
  };

  db.prepare(
    `UPDATE notes SET type = ?, title = ?, content = ?, canvas_x = ?, canvas_y = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    updated.type,
    updated.title,
    updated.content,
    updated.canvas_x,
    updated.canvas_y,
    updated.updated_at,
    id
  );

  return db.prepare("SELECT * FROM notes WHERE id = ?").get(id) as Note;
}

export function deleteNote(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM notes WHERE id = ?").run(id);
  return result.changes > 0;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
