import { desc, eq } from "drizzle-orm";
import type { ContentHistoryEntry } from "shared";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/connection.js";
import { type ContentHistorySourceType, contentHistory } from "../db/schema.js";

export async function createSnapshot(
  sourceId: string,
  sourceType: ContentHistorySourceType,
  content: string,
): Promise<ContentHistoryEntry> {
  const db = getDb();
  const id = uuidv4();

  const [row] = await db
    .insert(contentHistory)
    .values({ id, sourceId, sourceType, content })
    .returning({
      id: contentHistory.id,
      sourceId: contentHistory.sourceId,
      content: contentHistory.content,
      snapshotAt: contentHistory.snapshotAt,
    });

  return {
    id: row!.id,
    sourceId: row!.sourceId,
    content: row!.content,
    snapshotAt: row!.snapshotAt.toISOString(),
  };
}

export async function listHistory(sourceId: string): Promise<ContentHistoryEntry[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(contentHistory)
    .where(eq(contentHistory.sourceId, sourceId))
    .orderBy(desc(contentHistory.snapshotAt));

  return rows.map((row) => ({
    id: row.id,
    sourceId: row.sourceId,
    content: row.content,
    snapshotAt: row.snapshotAt.toISOString(),
  }));
}

export async function deleteHistoryForSource(sourceId: string): Promise<void> {
  const db = getDb();
  await db.delete(contentHistory).where(eq(contentHistory.sourceId, sourceId));
}
