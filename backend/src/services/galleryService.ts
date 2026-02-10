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
        lt(photos.created_at, parsed.timestamp),
        and(eq(photos.created_at, parsed.timestamp), lt(photos.id, parsed.id)),
      )
    : undefined;

  const conditions = [eq(canvasItems.canvas_id, canvasId)];
  if (cursorCondition) conditions.push(cursorCondition);
  if (options.importantOnly) conditions.push(eq(photos.is_important, true));

  const rows = await db
    .select({
      id: photos.id,
      filename: photos.filename,
      original_name: photos.original_name,
      aspect_ratio: photos.aspect_ratio,
      blurhash: photos.blurhash,
      is_main_photo: photos.is_main_photo,
      is_important: photos.is_important,
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
    .where(and(...conditions))
    .orderBy(sql`${photos.created_at} DESC, ${photos.id} DESC`)
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const entries: GalleryEntry[] = rows.slice(0, limit).map((row) => ({
    id: row.id,
    url: `/api/photos/${row.filename}`,
    original_name: row.original_name,
    aspect_ratio: row.aspect_ratio ?? undefined,
    blurhash: row.blurhash ?? undefined,
    is_main_photo: row.is_main_photo,
    is_important: row.is_important,
    created_at: row.created_at,
    parent_item_id: row.parent_item_id,
    parent_item_type: row.parent_item_type,
    parent_item_title: row.parent_item_title,
  }));

  let nextCursor: string | null = null;
  if (hasMore && entries.length > 0) {
    const last = entries[entries.length - 1]!;
    nextCursor = encodeCursor(last.created_at, last.id);
  }

  return { entries, nextCursor };
}
