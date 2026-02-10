import { desc, eq } from "drizzle-orm";
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
    .where(eq(notes.canvasItemId, canvasItemId))
    .orderBy(desc(notes.isImportant), notes.createdAt);

  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    isImportant: row.isImportant,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function getNote(noteId: string): Promise<Note | null> {
  const db = getDb();
  const [row] = await db.select().from(notes).where(eq(notes.id, noteId));

  if (!row) return null;

  return {
    id: row.id,
    content: row.content,
    isImportant: row.isImportant,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createNote(canvasItemId: string, input: CreateNoteInput): Promise<Note> {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  await db.insert(notes).values({
    id,
    canvasItemId: canvasItemId,
    content: input.content ?? "",
    createdAt: now,
    updatedAt: now,
  });

  // Process @mentions and update links
  if (input.content) {
    await resolveCanvasItemLinks(canvasItemId, input.content);
  }

  return {
    id,
    content: input.content ?? "",
    isImportant: false,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateNote(noteId: string, input: UpdateNoteInput): Promise<Note | null> {
  const db = getDb();
  const now = new Date().toISOString();

  // Get the note to find the canvasItemId
  const [existing] = await db.select().from(notes).where(eq(notes.id, noteId));
  if (!existing) return null;

  const updates: Record<string, unknown> = { updatedAt: now };
  if (input.content !== undefined) updates.content = input.content;
  if (input.isImportant !== undefined) updates.isImportant = input.isImportant;

  await db.update(notes).set(updates).where(eq(notes.id, noteId));

  // Process @mentions and update links for the canvas item
  if (input.content !== undefined) {
    await resolveCanvasItemLinks(existing.canvasItemId, input.content);
  }

  return {
    id: noteId,
    content: input.content ?? existing.content,
    isImportant: input.isImportant ?? existing.isImportant,
    createdAt: existing.createdAt,
    updatedAt: now,
  };
}

export async function deleteNote(noteId: string): Promise<boolean> {
  const db = getDb();

  // Get the note to find the canvasItemId for re-resolving links
  const [existing] = await db.select().from(notes).where(eq(notes.id, noteId));
  if (!existing) return false;

  const result = await db.delete(notes).where(eq(notes.id, noteId));

  if (result.rowCount === 0) return false;

  // Re-resolve links for the canvas item based on remaining notes
  const remainingNotes = await listNotes(existing.canvasItemId);
  const combinedContent = remainingNotes.map((n) => n.content).join("\n");
  await resolveCanvasItemLinks(existing.canvasItemId, combinedContent);

  return true;
}

export async function getNoteCanvasItemId(noteId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ canvasItemId: notes.canvasItemId })
    .from(notes)
    .where(eq(notes.id, noteId));

  return row?.canvasItemId ?? null;
}
