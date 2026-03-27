import { desc, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/connection.js";
import { type QuickNote, quickNotes } from "../db/schema.js";
import { createSnapshot, deleteHistoryForSource } from "./contentHistoryService.js";

export async function listQuickNotes(canvasId: string): Promise<QuickNote[]> {
  const db = getDb();
  return db
    .select()
    .from(quickNotes)
    .where(eq(quickNotes.canvasId, canvasId))
    .orderBy(desc(quickNotes.isImportant), desc(quickNotes.createdAt));
}

export async function createQuickNote(
  canvasId: string,
  content: string,
  title?: string,
): Promise<QuickNote> {
  const db = getDb();
  const id = uuidv4();
  const now = new Date();
  const [note] = await db
    .insert(quickNotes)
    .values({ id, canvasId, title: title ?? null, content, createdAt: now, updatedAt: now })
    .returning();
  return note;
}

export async function updateQuickNote(
  id: string,
  content: string,
  snapshot?: boolean,
  title?: string,
): Promise<QuickNote | null> {
  const db = getDb();

  if (snapshot) {
    const existing = await getQuickNote(id);
    if (existing && existing.content !== content && existing.content.trim()) {
      await createSnapshot(id, "quick_note", existing.content);
    }
  }

  const now = new Date();
  const updates: Record<string, unknown> = { content, updatedAt: now };
  if (title !== undefined) updates.title = title;
  const [updated] = await db
    .update(quickNotes)
    .set(updates)
    .where(eq(quickNotes.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteQuickNote(id: string): Promise<boolean> {
  const db = getDb();
  await deleteHistoryForSource(id);
  const result = await db
    .delete(quickNotes)
    .where(eq(quickNotes.id, id))
    .returning({ id: quickNotes.id });
  return result.length > 0;
}

export async function toggleQuickNoteImportant(id: string): Promise<QuickNote | null> {
  const db = getDb();
  const existing = await getQuickNote(id);
  if (!existing) return null;
  const [updated] = await db
    .update(quickNotes)
    .set({ isImportant: !existing.isImportant, updatedAt: new Date() })
    .where(eq(quickNotes.id, id))
    .returning();
  return updated ?? null;
}

export async function getQuickNote(id: string): Promise<QuickNote | null> {
  const db = getDb();
  const [note] = await db.select().from(quickNotes).where(eq(quickNotes.id, id));
  return note ?? null;
}
