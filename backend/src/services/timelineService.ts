import { and, between, eq, lt, or, sql } from "drizzle-orm";
import type { TimelineEntry } from "shared";
import { getDb } from "../db/connection.js";
import { canvasItems, notes, photos } from "../db/schema.js";

export type TimelineSort = "createdAt" | "updatedAt";

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
  sort: TimelineSort = "createdAt",
  cursor?: string,
  limit = 30,
  parentItemId?: string,
): Promise<PaginatedTimelineResult> {
  const db = getDb();
  const parsed = cursor ? decodeCursor(cursor) : null;

  // Build note cursor conditions
  const noteSortCol = sort === "updatedAt" ? notes.updatedAt : notes.createdAt;
  const noteCursorCondition = parsed
    ? or(
        lt(noteSortCol, new Date(parsed.timestamp)),
        and(eq(noteSortCol, new Date(parsed.timestamp)), lt(notes.id, parsed.id)),
      )
    : undefined;

  const noteConditions = [eq(canvasItems.canvasId, canvasId)];
  if (parentItemId) noteConditions.push(eq(canvasItems.id, parentItemId));
  if (noteCursorCondition) noteConditions.push(noteCursorCondition);

  const noteRows = await db
    .select({
      id: notes.id,
      content: notes.content,
      isImportant: notes.isImportant,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
      parentItemId: canvasItems.id,
      parentItemType: canvasItems.type,
      parentItemTitle: canvasItems.title,
    })
    .from(notes)
    .innerJoin(canvasItems, eq(notes.canvasItemId, canvasItems.id))
    .where(and(...noteConditions))
    .orderBy(sql`${noteSortCol} DESC, ${notes.id} DESC`)
    .limit(limit + 1);

  const noteEntries: TimelineEntry[] = noteRows.map((row) => ({
    id: row.id,
    kind: "note" as const,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    isImportant: row.isImportant,
    content: row.content,
    parentItemId: row.parentItemId,
    parentItemType: row.parentItemType,
    parentItemTitle: row.parentItemTitle,
  }));

  // Build photo cursor conditions
  // Photos only have createdAt, so sort field is always createdAt
  const photoCursorCondition = parsed
    ? or(
        lt(photos.createdAt, new Date(parsed.timestamp)),
        and(eq(photos.createdAt, new Date(parsed.timestamp)), lt(photos.id, parsed.id)),
      )
    : undefined;

  const photoConditions = [eq(canvasItems.canvasId, canvasId)];
  if (parentItemId) photoConditions.push(eq(canvasItems.id, parentItemId));
  if (photoCursorCondition) photoConditions.push(photoCursorCondition);

  const photoRows = await db
    .select({
      id: photos.id,
      originalName: photos.originalName,
      isImportant: photos.isImportant,
      createdAt: photos.createdAt,
      aspectRatio: photos.aspectRatio,
      blurhash: photos.blurhash,
      parentItemId: canvasItems.id,
      parentItemType: canvasItems.type,
      parentItemTitle: canvasItems.title,
    })
    .from(photos)
    .innerJoin(
      canvasItems,
      and(eq(photos.contentType, canvasItems.type), eq(photos.contentId, canvasItems.contentId)),
    )
    .where(and(...photoConditions))
    .orderBy(sql`${photos.createdAt} DESC, ${photos.id} DESC`)
    .limit(limit + 1);

  const photoEntries: TimelineEntry[] = photoRows.map((row) => ({
    id: row.id,
    kind: "photo" as const,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.createdAt.toISOString(),
    isImportant: row.isImportant,
    photoUrl: `/api/photos/${row.id}`,
    originalName: row.originalName,
    aspectRatio: row.aspectRatio ?? undefined,
    blurhash: row.blurhash ?? undefined,
    parentItemId: row.parentItemId,
    parentItemType: row.parentItemType,
    parentItemTitle: row.parentItemTitle,
  }));

  // Merge and sort descending by requested field
  const all = [...noteEntries, ...photoEntries];
  all.sort((a, b) => {
    const aVal = sort === "updatedAt" ? a.updatedAt : a.createdAt;
    const bVal = sort === "updatedAt" ? b.updatedAt : b.createdAt;
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
    const ts = sort === "updatedAt" ? last.updatedAt : last.createdAt;
    nextCursor = encodeCursor(ts, last.id);
  }

  return { entries, nextCursor };
}

export async function getTimelineDayCounts(
  canvasId: string,
  startDate: string,
  endDate: string,
  tzOffset?: number,
  parentItemId?: string,
): Promise<Record<string, number>> {
  const db = getDb();

  // tzOffset is the user's getTimezoneOffset() in minutes (e.g. 300 for UTC-5).
  // We subtract it to convert UTC → local: timestamp - interval '300 minutes' for UTC-5.
  const offsetMinutes = tzOffset ?? 0;
  const noteDateExpr = sql`to_char(${notes.createdAt}::timestamptz - interval '${sql.raw(String(offsetMinutes))} minutes', 'YYYY-MM-DD')`;
  const noteRows = await db
    .select({
      day: noteDateExpr.as("day"),
      count: sql<number>`count(*)`.as("count"),
    })
    .from(notes)
    .innerJoin(canvasItems, eq(notes.canvasItemId, canvasItems.id))
    .where(
      and(
        eq(canvasItems.canvasId, canvasId),
        between(noteDateExpr, startDate, endDate),
        parentItemId ? eq(canvasItems.id, parentItemId) : undefined,
      ),
    )
    .groupBy(noteDateExpr);

  const photoDateExpr = sql`to_char(${photos.createdAt}::timestamptz - interval '${sql.raw(String(offsetMinutes))} minutes', 'YYYY-MM-DD')`;
  const photoRows = await db
    .select({
      day: photoDateExpr.as("day"),
      count: sql<number>`count(*)`.as("count"),
    })
    .from(photos)
    .innerJoin(
      canvasItems,
      and(eq(photos.contentType, canvasItems.type), eq(photos.contentId, canvasItems.contentId)),
    )
    .where(
      and(
        eq(canvasItems.canvasId, canvasId),
        between(photoDateExpr, startDate, endDate),
        parentItemId ? eq(canvasItems.id, parentItemId) : undefined,
      ),
    )
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
