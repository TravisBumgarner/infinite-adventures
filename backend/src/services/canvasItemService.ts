import { and, desc, eq, sql } from "drizzle-orm";
import type {
  CanvasItem,
  CanvasItemLink,
  CanvasItemLinkWithSnippet,
  CanvasItemSearchResult,
  CanvasItemSummary,
  CanvasItemType,
  CreateCanvasItemInput,
  Photo,
  SessionSummary,
  UpdateCanvasItemInput,
} from "shared";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/connection.js";
import {
  canvasItemLinks,
  canvasItems,
  events,
  people,
  photos,
  places,
  sessions,
  things,
} from "../db/schema.js";
import { listNotes } from "./noteService.js";
import { deletePhotosForContent, listPhotos } from "./photoService.js";

export const DEFAULT_CANVAS_ID = "00000000-0000-4000-8000-000000000000";

const VALID_TYPES = ["person", "place", "thing", "session", "event"] as const;

export function isValidCanvasItemType(type: string): type is CanvasItemType {
  return (VALID_TYPES as readonly string[]).includes(type);
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Get the content table for a given type.
 */
function getContentTable(type: CanvasItemType) {
  switch (type) {
    case "person":
      return people;
    case "place":
      return places;
    case "thing":
      return things;
    case "session":
      return sessions;
    case "event":
      return events;
  }
}

/**
 * List all canvas items for a canvas (summary view without content).
 */
export async function listItems(canvasId: string): Promise<CanvasItemSummary[]> {
  const db = getDb();

  // Get items with their selected photo
  const items = await db
    .select({
      id: canvasItems.id,
      type: canvasItems.type,
      title: canvasItems.title,
      canvas_x: canvasItems.canvas_x,
      canvas_y: canvasItems.canvas_y,
      created_at: canvasItems.created_at,
      content_id: canvasItems.content_id,
    })
    .from(canvasItems)
    .where(eq(canvasItems.canvas_id, canvasId))
    .orderBy(canvasItems.created_at);

  // Get selected photos for these items
  const summaries: CanvasItemSummary[] = [];
  for (const item of items) {
    const selectedPhotos = await db
      .select({ filename: photos.filename })
      .from(photos)
      .where(
        and(
          eq(photos.content_type, item.type),
          eq(photos.content_id, item.content_id),
          eq(photos.is_selected, true),
        ),
      );

    summaries.push({
      id: item.id,
      type: item.type as CanvasItemType,
      title: item.title,
      canvas_x: item.canvas_x,
      canvas_y: item.canvas_y,
      created_at: item.created_at,
      selected_photo_url: selectedPhotos[0]
        ? `/api/photos/${selectedPhotos[0].filename}`
        : undefined,
    });
  }

  return summaries;
}

/**
 * Get a single canvas item with full notes, photos, and links.
 */
export async function getItem(id: string): Promise<CanvasItem | null> {
  const db = getDb();

  const [item] = await db.select().from(canvasItems).where(eq(canvasItems.id, id));
  if (!item) return null;

  const type = item.type as CanvasItemType;

  // Get notes
  const noteList = await listNotes(id);

  // Get photos
  const photoRecords = await listPhotos(type, item.content_id);
  const photoList: Photo[] = photoRecords.map((p) => ({
    id: p.id,
    url: `/api/photos/${p.filename}`,
    original_name: p.original_name,
    is_selected: p.is_selected,
  }));

  // Get links_to (items this item links to)
  const linksTo = await db
    .select({
      id: canvasItems.id,
      title: canvasItems.title,
      type: canvasItems.type,
    })
    .from(canvasItemLinks)
    .innerJoin(canvasItems, eq(canvasItems.id, canvasItemLinks.target_item_id))
    .where(eq(canvasItemLinks.source_item_id, id));

  // Get linked_from (items that link to this item, with snippets)
  const linkedFrom = await db
    .select({
      id: canvasItems.id,
      title: canvasItems.title,
      type: canvasItems.type,
      snippet: canvasItemLinks.snippet,
    })
    .from(canvasItemLinks)
    .innerJoin(canvasItems, eq(canvasItems.id, canvasItemLinks.source_item_id))
    .where(eq(canvasItemLinks.target_item_id, id));

  return {
    id: item.id,
    type,
    title: item.title,
    canvas_x: item.canvas_x,
    canvas_y: item.canvas_y,
    created_at: item.created_at,
    updated_at: item.updated_at,
    notes: noteList,
    photos: photoList,
    links_to: linksTo as CanvasItemLink[],
    linked_from: linkedFrom.map((l) => ({
      id: l.id,
      title: l.title,
      type: l.type as CanvasItemType,
      snippet: l.snippet ?? undefined,
    })) as CanvasItemLinkWithSnippet[],
  };
}

/**
 * Create a new canvas item with its type-specific content.
 */
export async function createItem(
  input: CreateCanvasItemInput,
  canvasId: string,
): Promise<CanvasItemSummary> {
  const db = getDb();

  if (!input.title) {
    throw new ValidationError("title is required");
  }
  if (!isValidCanvasItemType(input.type)) {
    throw new ValidationError(
      `Invalid type "${input.type}". Must be one of: ${VALID_TYPES.join(", ")}`,
    );
  }

  const itemId = uuidv4();
  const contentId = uuidv4();
  const now = new Date().toISOString();
  const type = input.type as CanvasItemType;
  const contentTable = getContentTable(type);

  // Create content record first
  const contentValues: Record<string, string> = {
    id: contentId,
    created_at: now,
    updated_at: now,
  };
  if (type === "session") {
    contentValues.session_date = input.session_date ?? now.split("T")[0]!;
  }
  await db.insert(contentTable).values(contentValues);

  // Create canvas item
  await db.insert(canvasItems).values({
    id: itemId,
    type,
    title: input.title,
    canvas_x: input.canvas_x ?? 0,
    canvas_y: input.canvas_y ?? 0,
    canvas_id: canvasId,
    content_id: contentId,
    created_at: now,
    updated_at: now,
  });

  return {
    id: itemId,
    type,
    title: input.title,
    canvas_x: input.canvas_x ?? 0,
    canvas_y: input.canvas_y ?? 0,
    created_at: now,
  };
}

/**
 * Update a canvas item's title or position.
 */
export async function updateItem(
  id: string,
  input: UpdateCanvasItemInput,
): Promise<CanvasItemSummary | null> {
  const db = getDb();

  const [existing] = await db.select().from(canvasItems).where(eq(canvasItems.id, id));
  if (!existing) return null;

  const now = new Date().toISOString();
  const type = existing.type as CanvasItemType;

  // Update canvas item fields if provided
  if (input.title !== undefined || input.canvas_x !== undefined || input.canvas_y !== undefined) {
    await db
      .update(canvasItems)
      .set({
        title: input.title ?? existing.title,
        canvas_x: input.canvas_x ?? existing.canvas_x,
        canvas_y: input.canvas_y ?? existing.canvas_y,
        updated_at: now,
      })
      .where(eq(canvasItems.id, id));
  }

  // Get updated item
  const [updated] = await db.select().from(canvasItems).where(eq(canvasItems.id, id));

  return {
    id: updated!.id,
    type,
    title: updated!.title,
    canvas_x: updated!.canvas_x,
    canvas_y: updated!.canvas_y,
    created_at: updated!.created_at,
  };
}

/**
 * Delete a canvas item and its associated content, notes, and photos.
 */
export async function deleteItem(id: string): Promise<boolean> {
  const db = getDb();

  const [existing] = await db.select().from(canvasItems).where(eq(canvasItems.id, id));
  if (!existing) return false;

  const type = existing.type as CanvasItemType;
  const contentTable = getContentTable(type);

  // Delete photos for this content
  await deletePhotosForContent(type, existing.content_id);

  // Notes will be deleted by cascade when canvas item is deleted

  // Delete the canvas item (links and notes will cascade)
  await db.delete(canvasItems).where(eq(canvasItems.id, id));

  // Delete the content record
  await db.delete(contentTable).where(eq(contentTable.id, existing.content_id));

  return true;
}

/**
 * Get the content_id for a canvas item (used for photo association).
 */
export async function getItemContentId(itemId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ content_id: canvasItems.content_id })
    .from(canvasItems)
    .where(eq(canvasItems.id, itemId));
  return row?.content_id ?? null;
}

/**
 * Search canvas items by title within a canvas.
 */
export async function searchItems(
  query: string,
  canvasId: string,
): Promise<CanvasItemSearchResult[]> {
  if (!query || !query.trim()) {
    return [];
  }

  const db = getDb();

  // Sanitize query: remove special tsquery characters
  const sanitized = query
    .trim()
    .replace(/[&|!<>():*'"\\]/g, " ")
    .trim();
  if (!sanitized) return [];

  // Format for prefix matching
  const tsquery = sanitized
    .split(/\s+/)
    .map((word) => `${word}:*`)
    .join(" & ");

  const result = await db.execute<CanvasItemSearchResult>(
    sql`SELECT ci.id, ci.type, ci.title,
          ts_headline('english', ci.title, to_tsquery('english', ${tsquery}),
            'StartSel=<b>, StopSel=</b>, MaxFragments=1, MaxWords=32') as snippet
     FROM canvas_items ci
     WHERE ci.search_vector @@ to_tsquery('english', ${tsquery})
       AND ci.canvas_id = ${canvasId}
     ORDER BY ts_rank(ci.search_vector, to_tsquery('english', ${tsquery})) DESC
     LIMIT 20`,
  );

  return result.rows;
}

/**
 * List all session-type items for a canvas, sorted by session_date descending.
 */
export async function listSessions(canvasId: string): Promise<SessionSummary[]> {
  const db = getDb();

  const items = await db
    .select({
      id: canvasItems.id,
      title: canvasItems.title,
      session_date: sessions.session_date,
      created_at: canvasItems.created_at,
      content_id: canvasItems.content_id,
    })
    .from(canvasItems)
    .innerJoin(sessions, eq(sessions.id, canvasItems.content_id))
    .where(and(eq(canvasItems.canvas_id, canvasId), eq(canvasItems.type, "session")))
    .orderBy(desc(sessions.session_date));

  const summaries: SessionSummary[] = [];
  for (const item of items) {
    const selectedPhotos = await db
      .select({ filename: photos.filename })
      .from(photos)
      .where(
        and(
          eq(photos.content_type, "session"),
          eq(photos.content_id, item.content_id),
          eq(photos.is_selected, true),
        ),
      );

    summaries.push({
      id: item.id,
      title: item.title,
      session_date: item.session_date,
      created_at: item.created_at,
      selected_photo_url: selectedPhotos[0]
        ? `/api/photos/${selectedPhotos[0].filename}`
        : undefined,
    });
  }

  return summaries;
}
