import { and, eq } from "drizzle-orm";
import type { TimelineEntry } from "shared";
import { getDb } from "../db/connection.js";
import { canvasItems, notes, photos } from "../db/schema.js";

export type TimelineSort = "created_at" | "updated_at";

export async function getTimeline(
  canvasId: string,
  sort: TimelineSort = "created_at",
): Promise<TimelineEntry[]> {
  const db = getDb();

  // Query notes joined with canvas_items filtered by canvas_id
  const noteRows = await db
    .select({
      id: notes.id,
      content: notes.content,
      created_at: notes.created_at,
      updated_at: notes.updated_at,
      parent_item_id: canvasItems.id,
      parent_item_type: canvasItems.type,
      parent_item_title: canvasItems.title,
    })
    .from(notes)
    .innerJoin(canvasItems, eq(notes.canvas_item_id, canvasItems.id))
    .where(eq(canvasItems.canvas_id, canvasId));

  const noteEntries: TimelineEntry[] = noteRows.map((row) => ({
    id: row.id,
    kind: "note" as const,
    created_at: row.created_at,
    updated_at: row.updated_at,
    content: row.content,
    parent_item_id: row.parent_item_id,
    parent_item_type: row.parent_item_type,
    parent_item_title: row.parent_item_title,
  }));

  // Query photos joined with canvas_items via content_type + content_id
  const photoRows = await db
    .select({
      id: photos.id,
      original_name: photos.original_name,
      created_at: photos.created_at,
      parent_item_id: canvasItems.id,
      parent_item_type: canvasItems.type,
      parent_item_title: canvasItems.title,
    })
    .from(photos)
    .innerJoin(
      canvasItems,
      and(eq(photos.content_type, canvasItems.type), eq(photos.content_id, canvasItems.content_id)),
    )
    .where(eq(canvasItems.canvas_id, canvasId));

  const photoEntries: TimelineEntry[] = photoRows.map((row) => ({
    id: row.id,
    kind: "photo" as const,
    created_at: row.created_at,
    updated_at: row.created_at,
    photo_url: `/api/photos/${row.id}`,
    original_name: row.original_name,
    parent_item_id: row.parent_item_id,
    parent_item_type: row.parent_item_type,
    parent_item_title: row.parent_item_title,
  }));

  // Merge and sort descending by requested field
  const all = [...noteEntries, ...photoEntries];
  all.sort((a, b) => {
    const aVal = sort === "updated_at" ? a.updated_at : a.created_at;
    const bVal = sort === "updated_at" ? b.updated_at : b.created_at;
    return bVal.localeCompare(aVal);
  });

  return all;
}
