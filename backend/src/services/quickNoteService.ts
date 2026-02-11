import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/connection.js";
import { type QuickNote, quickNotes } from "../db/schema.js";

export async function listQuickNotes(canvasId: string): Promise<QuickNote[]> {
  const db = getDb();
  return db.select().from(quickNotes).where(eq(quickNotes.canvasId, canvasId));
}

export async function createQuickNote(canvasId: string, content: string): Promise<QuickNote> {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();
  const [note] = await db
    .insert(quickNotes)
    .values({ id, canvasId, content, createdAt: now, updatedAt: now })
    .returning();
  return note;
}

export async function updateQuickNote(id: string, content: string): Promise<QuickNote | null> {
  const db = getDb();
  const now = new Date().toISOString();
  const [updated] = await db
    .update(quickNotes)
    .set({ content, updatedAt: now })
    .where(eq(quickNotes.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteQuickNote(id: string): Promise<boolean> {
  const db = getDb();
  const result = await db
    .delete(quickNotes)
    .where(eq(quickNotes.id, id))
    .returning({ id: quickNotes.id });
  return result.length > 0;
}

export async function getQuickNote(id: string): Promise<QuickNote | null> {
  const db = getDb();
  const [note] = await db.select().from(quickNotes).where(eq(quickNotes.id, id));
  return note ?? null;
}
