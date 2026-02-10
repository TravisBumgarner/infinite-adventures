import { desc, eq, inArray, like } from "drizzle-orm";
import type { CreateNoteInput, Note, UpdateNoteInput } from "shared";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/connection.js";
import { canvasItems, notes } from "../db/schema.js";
import { stripHtml } from "../utils/stripHtml.js";
import { resolveCanvasItemLinks } from "./canvasItemLinkService.js";

const MENTION_ID_REGEX = /@\{([^}]+)\}/g;

/** Extract all @{id} mention IDs from content and resolve them to titles. */
async function resolveMentionNames(content: string): Promise<Map<string, string>> {
  const ids: string[] = [];
  let match: RegExpExecArray | null = MENTION_ID_REGEX.exec(content);
  while (match !== null) {
    ids.push(match[1]!);
    match = MENTION_ID_REGEX.exec(content);
  }
  if (ids.length === 0) return new Map();

  const db = getDb();
  const rows = await db
    .select({ id: canvasItems.id, title: canvasItems.title })
    .from(canvasItems)
    .where(inArray(canvasItems.id, ids));
  return new Map(rows.map((r) => [r.id, r.title]));
}

export async function listNotes(canvasItemId: string): Promise<Note[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(notes)
    .where(eq(notes.canvasItemId, canvasItemId))
    .orderBy(desc(notes.isImportant), desc(notes.createdAt));

  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    plainContent: row.plainContent,
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
    plainContent: row.plainContent,
    isImportant: row.isImportant,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createNote(canvasItemId: string, input: CreateNoteInput): Promise<Note> {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();
  const content = input.content ?? "";
  const mentionNames = await resolveMentionNames(content);
  const plainContent = stripHtml(content, mentionNames);

  await db.insert(notes).values({
    id,
    canvasItemId: canvasItemId,
    content,
    plainContent,
    createdAt: now,
    updatedAt: now,
  });

  // Process @mentions and update links
  if (input.content) {
    await resolveCanvasItemLinks(canvasItemId, input.content);
  }

  return {
    id,
    content,
    plainContent,
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
  let newPlainContent: string | undefined;
  if (input.content !== undefined) {
    const mentionNames = await resolveMentionNames(input.content);
    newPlainContent = stripHtml(input.content, mentionNames);
    updates.content = input.content;
    updates.plainContent = newPlainContent;
  }
  if (input.isImportant !== undefined) updates.isImportant = input.isImportant;

  await db.update(notes).set(updates).where(eq(notes.id, noteId));

  // Process @mentions and update links for the canvas item
  if (input.content !== undefined) {
    await resolveCanvasItemLinks(existing.canvasItemId, input.content);
  }

  return {
    id: noteId,
    content: input.content ?? existing.content,
    plainContent: newPlainContent ?? existing.plainContent,
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

/**
 * Recompute plainContent for all notes that mention the given item ID.
 * Call this when a canvas item's title changes so search stays accurate.
 */
export async function recomputePlainContentForMentionedItem(itemId: string): Promise<void> {
  const db = getDb();
  const rows = await db
    .select({ id: notes.id, content: notes.content })
    .from(notes)
    .where(like(notes.content, `%@{${itemId}}%`));

  for (const row of rows) {
    const mentionNames = await resolveMentionNames(row.content);
    const plainContent = stripHtml(row.content, mentionNames);
    await db.update(notes).set({ plainContent }).where(eq(notes.id, row.id));
  }
}

export async function getNoteCanvasItemId(noteId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ canvasItemId: notes.canvasItemId })
    .from(notes)
    .where(eq(notes.id, noteId));

  return row?.canvasItemId ?? null;
}
