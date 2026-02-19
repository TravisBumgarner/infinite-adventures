import { and, eq, lt, or, sql } from "drizzle-orm";
import type { GalleryEntry } from "shared";
import { getDb } from "../db/connection.js";
import { canvasItems, photos } from "../db/schema.js";

interface GalleryCursor {
  timestamp: string;
  id: string;
}

export interface PaginatedGalleryResult {
  entries: GalleryEntry[];
  nextCursor: string | null;
}

function decodeCursor(cursor: string): GalleryCursor {
  return JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
}

function encodeCursor(timestamp: string, id: string): string {
  return Buffer.from(JSON.stringify({ timestamp, id })).toString("base64");
}

export async function getGalleryEntries(
  canvasId: string,
  options: { cursor?: string; limit?: number; importantOnly?: boolean } = {},
): Promise<PaginatedGalleryResult> {
  const db = getDb();
  const limit = options.limit ?? 30;
  const parsed = options.cursor ? decodeCursor(options.cursor) : null;

  const cursorCondition = parsed
    ? or(
        lt(photos.createdAt, new Date(parsed.timestamp)),
        and(eq(photos.createdAt, new Date(parsed.timestamp)), lt(photos.id, parsed.id)),
      )
    : undefined;

  const conditions = [eq(canvasItems.canvasId, canvasId)];
  if (cursorCondition) conditions.push(cursorCondition);
  if (options.importantOnly) conditions.push(eq(photos.isImportant, true));

  const rows = await db
    .select({
      id: photos.id,
      filename: photos.filename,
      originalName: photos.originalName,
      caption: photos.caption,
      aspectRatio: photos.aspectRatio,
      blurhash: photos.blurhash,
      isMainPhoto: photos.isMainPhoto,
      isImportant: photos.isImportant,
      createdAt: photos.createdAt,
      parentItemId: canvasItems.id,
      parentItemType: canvasItems.type,
      parentItemTitle: canvasItems.title,
    })
    .from(photos)
    .innerJoin(
      canvasItems,
      and(eq(photos.contentType, canvasItems.type), eq(photos.contentId, canvasItems.contentId)),
    )
    .where(and(...conditions))
    .orderBy(sql`${photos.createdAt} DESC, ${photos.id} DESC`)
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const entries: GalleryEntry[] = rows.slice(0, limit).map((row) => ({
    id: row.id,
    url: `/api/photos/${row.filename}`,
    originalName: row.originalName,
    caption: row.caption,
    aspectRatio: row.aspectRatio ?? undefined,
    blurhash: row.blurhash ?? undefined,
    isMainPhoto: row.isMainPhoto,
    isImportant: row.isImportant,
    createdAt: row.createdAt.toISOString(),
    parentItemId: row.parentItemId,
    parentItemType: row.parentItemType,
    parentItemTitle: row.parentItemTitle,
  }));

  let nextCursor: string | null = null;
  if (hasMore && entries.length > 0) {
    const last = entries[entries.length - 1]!;
    nextCursor = encodeCursor(last.createdAt, last.id);
  }

  return { entries, nextCursor };
}
