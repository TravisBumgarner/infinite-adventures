import { eq } from "drizzle-orm";
import type { CreateNoteInput, Note, UpdateNoteInput } from "shared";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/connection.js";
import { notes } from "../db/schema.js";
import { resolveCanvasItemLinks } from "./canvasItemLinkService.js";

export async function listNotes(canvasItemId: string): Promise<Note[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(notes)
    .where(eq(notes.canvas_item_id, canvasItemId))
    .orderBy(notes.created_at);

  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export async function getNote(noteId: string): Promise<Note | null> {
  const db = getDb();
  const [row] = await db.select().from(notes).where(eq(notes.id, noteId));

  if (!row) return null;

  return {
    id: row.id,
    content: row.content,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function createNote(canvasItemId: string, input: CreateNoteInput): Promise<Note> {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  await db.insert(notes).values({
    id,
    canvas_item_id: canvasItemId,
    content: input.content ?? "",
    created_at: now,
    updated_at: now,
  });

  // Process @mentions and update links
  if (input.content) {
    await resolveCanvasItemLinks(canvasItemId, input.content);
  }

  return {
    id,
    content: input.content ?? "",
    created_at: now,
    updated_at: now,
  };
}

export async function updateNote(noteId: string, input: UpdateNoteInput): Promise<Note | null> {
  const db = getDb();
  const now = new Date().toISOString();

  // Get the note to find the canvas_item_id
  const [existing] = await db.select().from(notes).where(eq(notes.id, noteId));
  if (!existing) return null;

  await db
    .update(notes)
    .set({
      content: input.content,
      updated_at: now,
    })
    .where(eq(notes.id, noteId));

  // Process @mentions and update links for the canvas item
  await resolveCanvasItemLinks(existing.canvas_item_id, input.content);

  return {
    id: noteId,
    content: input.content,
    created_at: existing.created_at,
    updated_at: now,
  };
}

export async function deleteNote(noteId: string): Promise<boolean> {
  const db = getDb();

  // Get the note to find the canvas_item_id for re-resolving links
  const [existing] = await db.select().from(notes).where(eq(notes.id, noteId));
  if (!existing) return false;

  const result = await db.delete(notes).where(eq(notes.id, noteId));

  if (result.rowCount === 0) return false;

  // Re-resolve links for the canvas item based on remaining notes
  const remainingNotes = await listNotes(existing.canvas_item_id);
  const combinedContent = remainingNotes.map((n) => n.content).join("\n");
  await resolveCanvasItemLinks(existing.canvas_item_id, combinedContent);

  return true;
}

export async function getNoteCanvasItemId(noteId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ canvas_item_id: notes.canvas_item_id })
    .from(notes)
    .where(eq(notes.id, noteId));

  return row?.canvas_item_id ?? null;
}
