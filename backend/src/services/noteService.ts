import { eq, sql } from "drizzle-orm";
import type {
  CreateNoteInput,
  NoteLink as NoteLinkInfo,
  NoteSummary,
  NoteType,
  SearchResult,
  UpdateNoteInput,
} from "shared";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/connection.js";
import { noteLinks, notes } from "../db/schema.js";
import { resolveLinks } from "./linkService.js";

export const DEFAULT_CANVAS_ID = "00000000-0000-4000-8000-000000000000";

export type { NoteType, NoteSummary, CreateNoteInput, UpdateNoteInput };
export type { NoteLinkInfo };

type Note = typeof notes.$inferSelect;

export interface NoteWithLinks extends Note {
  links_to: NoteLinkInfo[];
  linked_from: NoteLinkInfo[];
}

const VALID_TYPES = ["pc", "npc", "item", "quest", "location", "goal", "session"] as const;

export function isValidNoteType(type: string): type is NoteType {
  return (VALID_TYPES as readonly string[]).includes(type);
}

export async function listNotes(_canvasId: string): Promise<NoteSummary[]> {
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
    .orderBy(notes.created_at);
}

export async function getNote(id: string): Promise<NoteWithLinks | null> {
  const db = getDb();
  const [note] = await db.select().from(notes).where(eq(notes.id, id));
  if (!note) return null;

  const linksTo = await db
    .select({
      id: notes.id,
      title: notes.title,
      type: notes.type,
    })
    .from(noteLinks)
    .innerJoin(notes, eq(notes.id, noteLinks.target_note_id))
    .where(eq(noteLinks.source_note_id, id));

  const linkedFrom = await db
    .select({
      id: notes.id,
      title: notes.title,
      type: notes.type,
    })
    .from(noteLinks)
    .innerJoin(notes, eq(notes.id, noteLinks.source_note_id))
    .where(eq(noteLinks.target_note_id, id));

  return { ...note, links_to: linksTo, linked_from: linkedFrom };
}

export async function createNote(input: CreateNoteInput, canvasId: string): Promise<Note> {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  if (!input.title) {
    throw new ValidationError("title is required");
  }
  if (!isValidNoteType(input.type)) {
    throw new ValidationError(
      `Invalid type "${input.type}". Must be one of: ${VALID_TYPES.join(", ")}`,
    );
  }

  await db.insert(notes).values({
    id,
    type: input.type as NoteType,
    title: input.title,
    content: input.content ?? "",
    canvas_x: input.canvas_x ?? 0,
    canvas_y: input.canvas_y ?? 0,
    canvas_id: canvasId,
    created_at: now,
    updated_at: now,
  });

  const [note] = await db.select().from(notes).where(eq(notes.id, id));

  if (note!.content) {
    await resolveLinks(id, note!.content);
  }

  return note!;
}

export async function updateNote(id: string, input: UpdateNoteInput): Promise<Note | null> {
  const db = getDb();
  const [existing] = await db.select().from(notes).where(eq(notes.id, id));
  if (!existing) return null;

  if (input.type !== undefined && !isValidNoteType(input.type)) {
    throw new ValidationError(
      `Invalid type "${input.type}". Must be one of: ${VALID_TYPES.join(", ")}`,
    );
  }

  await db
    .update(notes)
    .set({
      type: (input.type as NoteType) ?? existing.type,
      title: input.title ?? existing.title,
      content: input.content ?? existing.content,
      canvas_x: input.canvas_x ?? existing.canvas_x,
      canvas_y: input.canvas_y ?? existing.canvas_y,
      updated_at: new Date().toISOString(),
    })
    .where(eq(notes.id, id));

  const [updatedNote] = await db.select().from(notes).where(eq(notes.id, id));

  if (input.content !== undefined) {
    await resolveLinks(id, updatedNote!.content);
  }

  return updatedNote!;
}

export async function deleteNote(id: string): Promise<boolean> {
  const db = getDb();
  const result = await db.delete(notes).where(eq(notes.id, id)).returning({ id: notes.id });
  return result.length > 0;
}

export type { SearchResult };

export async function searchNotes(query: string, _canvasId: string): Promise<SearchResult[]> {
  if (!query || !query.trim()) {
    return [];
  }

  const db = getDb();
  // Sanitize query: remove special tsquery characters, then format for prefix matching
  const sanitized = query
    .trim()
    .replace(/[&|!<>():*'"\\]/g, " ")
    .trim();
  if (!sanitized) return [];

  const tsquery = sanitized
    .split(/\s+/)
    .map((word) => `${word}:*`)
    .join(" & ");

  const result = await db.execute<SearchResult>(
    sql`SELECT n.id, n.type, n.title,
          ts_headline('english', n.content, to_tsquery('english', ${tsquery}),
            'StartSel=<b>, StopSel=</b>, MaxFragments=1, MaxWords=32') as snippet
     FROM notes n
     WHERE n.search_vector @@ to_tsquery('english', ${tsquery})
     ORDER BY ts_rank(n.search_vector, to_tsquery('english', ${tsquery})) DESC
     LIMIT 20`,
  );
  return result.rows;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
