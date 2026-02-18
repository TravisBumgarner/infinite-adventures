import { desc, eq } from "drizzle-orm";
import type { NoteHistoryEntry } from "shared";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/connection.js";
import { noteHistory } from "../db/schema.js";

export async function createSnapshot(noteId: string, content: string): Promise<NoteHistoryEntry> {
  const db = getDb();
  const id = uuidv4();

  const [row] = await db.insert(noteHistory).values({ id, noteId, content }).returning({
    id: noteHistory.id,
    noteId: noteHistory.noteId,
    content: noteHistory.content,
    snapshotAt: noteHistory.snapshotAt,
  });

  return {
    id: row!.id,
    noteId: row!.noteId,
    content: row!.content,
    snapshotAt: row!.snapshotAt.toISOString(),
  };
}

export async function listHistory(noteId: string): Promise<NoteHistoryEntry[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(noteHistory)
    .where(eq(noteHistory.noteId, noteId))
    .orderBy(desc(noteHistory.snapshotAt));

  return rows.map((row) => ({
    id: row.id,
    noteId: row.noteId,
    content: row.content,
    snapshotAt: row.snapshotAt.toISOString(),
  }));
}
