import { and, between, eq, lt, or, sql } from "drizzle-orm";
import type { TimelineEntry } from "shared";
import { getDb } from "../db/connection.js";
import { canvasItems, notes, photos } from "../db/schema.js";

export type TimelineSort = "created_at" | "updated_at";

interface TimelineCursor {
  timestamp: string;
  id: string;
}

export interface PaginatedTimelineResult {
  entries: TimelineEntry[];
  nextCursor: string | null;
}

function decodeCursor(cursor: string): TimelineCursor {
  return JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
}

function encodeCursor(timestamp: string, id: string): string {
  return Buffer.from(JSON.stringify({ timestamp, id })).toString("base64");
}

export async function getTimeline(
  canvasId: string,
  sort: TimelineSort = "created_at",
  cursor?: string,
  limit = 30,
): Promise<PaginatedTimelineResult> {
  const db = getDb();
  const parsed = cursor ? decodeCursor(cursor) : null;

  // Build note cursor conditions
  const noteSortCol = sort === "updated_at" ? notes.updated_at : notes.created_at;
  const noteCursorCondition = parsed
    ? or(
        lt(noteSortCol, parsed.timestamp),
        and(eq(noteSortCol, parsed.timestamp), lt(notes.id, parsed.id)),
      )
    : undefined;

  const noteConditions = [eq(canvasItems.canvas_id, canvasId)];
  if (noteCursorCondition) noteConditions.push(noteCursorCondition);

  const noteRows = await db
    .select({
      id: notes.id,
      content: notes.content,
      is_important: notes.is_important,
      created_at: notes.created_at,
      updated_at: notes.updated_at,
      parent_item_id: canvasItems.id,
      parent_item_type: canvasItems.type,
      parent_item_title: canvasItems.title,
    })
    .from(notes)
    .innerJoin(canvasItems, eq(notes.canvas_item_id, canvasItems.id))
    .where(and(...noteConditions))
    .orderBy(sql`${noteSortCol} DESC, ${notes.id} DESC`)
    .limit(limit + 1);

  const noteEntries: TimelineEntry[] = noteRows.map((row) => ({
    id: row.id,
    kind: "note" as const,
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_important: row.is_important,
    content: row.content,
    parent_item_id: row.parent_item_id,
    parent_item_type: row.parent_item_type,
    parent_item_title: row.parent_item_title,
  }));

  // Build photo cursor conditions
  // Photos only have created_at, so sort field is always created_at
  const photoCursorCondition = parsed
    ? or(
        lt(photos.created_at, parsed.timestamp),
        and(eq(photos.created_at, parsed.timestamp), lt(photos.id, parsed.id)),
      )
    : undefined;

  const photoConditions = [eq(canvasItems.canvas_id, canvasId)];
  if (photoCursorCondition) photoConditions.push(photoCursorCondition);

  const photoRows = await db
    .select({
      id: photos.id,
      original_name: photos.original_name,
      is_important: photos.is_important,
      created_at: photos.created_at,
      aspect_ratio: photos.aspect_ratio,
      blurhash: photos.blurhash,
      parent_item_id: canvasItems.id,
      parent_item_type: canvasItems.type,
      parent_item_title: canvasItems.title,
    })
    .from(photos)
    .innerJoin(
      canvasItems,
      and(eq(photos.content_type, canvasItems.type), eq(photos.content_id, canvasItems.content_id)),
    )
    .where(and(...photoConditions))
    .orderBy(sql`${photos.created_at} DESC, ${photos.id} DESC`)
    .limit(limit + 1);

  const photoEntries: TimelineEntry[] = photoRows.map((row) => ({
    id: row.id,
    kind: "photo" as const,
    created_at: row.created_at,
    updated_at: row.created_at,
    is_important: row.is_important,
    photo_url: `/api/photos/${row.id}`,
    original_name: row.original_name,
    aspect_ratio: row.aspect_ratio ?? undefined,
    blurhash: row.blurhash ?? undefined,
    parent_item_id: row.parent_item_id,
    parent_item_type: row.parent_item_type,
    parent_item_title: row.parent_item_title,
  }));

  // Merge and sort descending by requested field
  const all = [...noteEntries, ...photoEntries];
  all.sort((a, b) => {
    const aVal = sort === "updated_at" ? a.updated_at : a.created_at;
    const bVal = sort === "updated_at" ? b.updated_at : b.created_at;
    const cmp = bVal.localeCompare(aVal);
    if (cmp !== 0) return cmp;
    return b.id.localeCompare(a.id);
  });

  // Take limit entries, compute next cursor if there are more
  const entries = all.slice(0, limit);
  const hasMore = all.length > limit;
  let nextCursor: string | null = null;

  if (hasMore && entries.length > 0) {
    const last = entries[entries.length - 1]!;
    const ts = sort === "updated_at" ? last.updated_at : last.created_at;
    nextCursor = encodeCursor(ts, last.id);
  }

  return { entries, nextCursor };
}

export async function getTimelineDayCounts(
  canvasId: string,
  startDate: string,
  endDate: string,
): Promise<Record<string, number>> {
  const db = getDb();

  const dateExpr = sql`substr(${notes.created_at}, 1, 10)`;
  const noteRows = await db
    .select({
      day: dateExpr.as("day"),
      count: sql<number>`count(*)`.as("count"),
    })
    .from(notes)
    .innerJoin(canvasItems, eq(notes.canvas_item_id, canvasItems.id))
    .where(and(eq(canvasItems.canvas_id, canvasId), between(dateExpr, startDate, endDate)))
    .groupBy(dateExpr);

  const photoDateExpr = sql`substr(${photos.created_at}, 1, 10)`;
  const photoRows = await db
    .select({
      day: photoDateExpr.as("day"),
      count: sql<number>`count(*)`.as("count"),
    })
    .from(photos)
    .innerJoin(
      canvasItems,
      and(eq(photos.content_type, canvasItems.type), eq(photos.content_id, canvasItems.content_id)),
    )
    .where(and(eq(canvasItems.canvas_id, canvasId), between(photoDateExpr, startDate, endDate)))
    .groupBy(photoDateExpr);

  const counts: Record<string, number> = {};
  for (const row of noteRows) {
    const day = row.day as string;
    counts[day] = (counts[day] ?? 0) + Number(row.count);
  }
  for (const row of photoRows) {
    const day = row.day as string;
    counts[day] = (counts[day] ?? 0) + Number(row.count);
  }
  return counts;
}
