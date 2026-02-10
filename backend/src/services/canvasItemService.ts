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
  TaggedItem,
  UpdateCanvasItemInput,
} from "shared";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/connection.js";
import {
  canvasItemLinks,
  canvasItems,
  events,
  notes,
  people,
  photos,
  places,
  sessions,
  things,
} from "../db/schema.js";
import { parseMentionsWithPositions } from "./canvasItemLinkService.js";
import { listNotes } from "./noteService.js";
import { deletePhotosForContent, listPhotos } from "./photoService.js";
import { listTagIdsForItem, listTagsForItem } from "./tagService.js";

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
      summary: canvasItems.summary,
      canvasX: canvasItems.canvasX,
      canvasY: canvasItems.canvasY,
      createdAt: canvasItems.createdAt,
      contentId: canvasItems.contentId,
    })
    .from(canvasItems)
    .where(eq(canvasItems.canvasId, canvasId))
    .orderBy(canvasItems.createdAt);

  // Get selected photos for these items
  const summaries: CanvasItemSummary[] = [];
  for (const item of items) {
    const selectedPhotos = await db
      .select({ filename: photos.filename })
      .from(photos)
      .where(
        and(
          eq(photos.contentType, item.type),
          eq(photos.contentId, item.contentId),
          eq(photos.isMainPhoto, true),
        ),
      );

    const tagIds = await listTagIdsForItem(item.id);

    summaries.push({
      id: item.id,
      type: item.type as CanvasItemType,
      title: item.title,
      summary: item.summary,
      canvasX: item.canvasX,
      canvasY: item.canvasY,
      createdAt: item.createdAt,
      selectedPhotoUrl: selectedPhotos[0] ? `/api/photos/${selectedPhotos[0].filename}` : undefined,
      tagIds: tagIds.length > 0 ? tagIds : undefined,
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

  // Get sessionDate if this is a session
  let sessionDate: string | undefined;
  if (type === "session") {
    const [sessionRow] = await db
      .select({ sessionDate: sessions.sessionDate })
      .from(sessions)
      .where(eq(sessions.id, item.contentId));
    sessionDate = sessionRow?.sessionDate;
  }

  // Get notes
  const noteList = await listNotes(id);

  // Get photos
  const photoRecords = await listPhotos(type, item.contentId);
  const photoList: Photo[] = photoRecords.map((p) => ({
    id: p.id,
    url: `/api/photos/${p.filename}`,
    originalName: p.originalName,
    isMainPhoto: p.isMainPhoto,
    isImportant: p.isImportant,
    aspectRatio: p.aspectRatio ?? undefined,
    blurhash: p.blurhash ?? undefined,
  }));

  // Get tags
  const tagList = await listTagsForItem(id);

  // Get linksTo (items this item links to)
  const linksTo = await db
    .select({
      id: canvasItems.id,
      title: canvasItems.title,
      type: canvasItems.type,
    })
    .from(canvasItemLinks)
    .innerJoin(canvasItems, eq(canvasItems.id, canvasItemLinks.targetItemId))
    .where(eq(canvasItemLinks.sourceItemId, id));

  // Get linkedFrom (items that link to this item, with snippets)
  const linkedFrom = await db
    .select({
      id: canvasItems.id,
      title: canvasItems.title,
      type: canvasItems.type,
      snippet: canvasItemLinks.snippet,
    })
    .from(canvasItemLinks)
    .innerJoin(canvasItems, eq(canvasItems.id, canvasItemLinks.sourceItemId))
    .where(eq(canvasItemLinks.targetItemId, id));

  return {
    id: item.id,
    type,
    title: item.title,
    summary: item.summary,
    canvasX: item.canvasX,
    canvasY: item.canvasY,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    sessionDate,
    notes: noteList,
    photos: photoList,
    tags: tagList,
    linksTo: linksTo as CanvasItemLink[],
    linkedFrom: linkedFrom.map((l) => ({
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
  if (type === "session") {
    await db.insert(sessions).values({
      id: contentId,
      sessionDate: input.sessionDate ?? now.split("T")[0]!,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    await db.insert(contentTable).values({
      id: contentId,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Create canvas item
  await db.insert(canvasItems).values({
    id: itemId,
    type,
    title: input.title,
    canvasX: input.canvasX ?? 0,
    canvasY: input.canvasY ?? 0,
    canvasId: canvasId,
    contentId: contentId,
    createdAt: now,
    updatedAt: now,
  });

  return {
    id: itemId,
    type,
    title: input.title,
    summary: "",
    canvasX: input.canvasX ?? 0,
    canvasY: input.canvasY ?? 0,
    createdAt: now,
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
  if (
    input.title !== undefined ||
    input.summary !== undefined ||
    input.canvasX !== undefined ||
    input.canvasY !== undefined
  ) {
    await db
      .update(canvasItems)
      .set({
        title: input.title ?? existing.title,
        summary: input.summary ?? existing.summary,
        canvasX: input.canvasX ?? existing.canvasX,
        canvasY: input.canvasY ?? existing.canvasY,
        updatedAt: now,
      })
      .where(eq(canvasItems.id, id));
  }

  // Update sessionDate if provided and item is a session
  if (input.sessionDate !== undefined && type === "session") {
    await db
      .update(sessions)
      .set({ sessionDate: input.sessionDate, updatedAt: now })
      .where(eq(sessions.id, existing.contentId));
  }

  // Get updated item
  const [updated] = await db.select().from(canvasItems).where(eq(canvasItems.id, id));

  return {
    id: updated!.id,
    type,
    title: updated!.title,
    summary: updated!.summary,
    canvasX: updated!.canvasX,
    canvasY: updated!.canvasY,
    createdAt: updated!.createdAt,
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
  await deletePhotosForContent(type, existing.contentId);

  // Notes will be deleted by cascade when canvas item is deleted

  // Delete the canvas item (links and notes will cascade)
  await db.delete(canvasItems).where(eq(canvasItems.id, id));

  // Delete the content record
  await db.delete(contentTable).where(eq(contentTable.id, existing.contentId));

  return true;
}

/**
 * Get the contentId for a canvas item (used for photo association).
 */
export async function getItemContentId(itemId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ contentId: canvasItems.contentId })
    .from(canvasItems)
    .where(eq(canvasItems.id, itemId));
  return row?.contentId ?? null;
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
 * List all session-type items for a canvas, sorted by sessionDate descending.
 */
export async function listSessions(canvasId: string): Promise<SessionSummary[]> {
  const db = getDb();

  const items = await db
    .select({
      id: canvasItems.id,
      title: canvasItems.title,
      sessionDate: sessions.sessionDate,
      createdAt: canvasItems.createdAt,
      contentId: canvasItems.contentId,
    })
    .from(canvasItems)
    .innerJoin(sessions, eq(sessions.id, canvasItems.contentId))
    .where(and(eq(canvasItems.canvasId, canvasId), eq(canvasItems.type, "session")))
    .orderBy(desc(sessions.sessionDate));

  const summaries: SessionSummary[] = [];
  for (const item of items) {
    const selectedPhotos = await db
      .select({ filename: photos.filename })
      .from(photos)
      .where(
        and(
          eq(photos.contentType, "session"),
          eq(photos.contentId, item.contentId),
          eq(photos.isMainPhoto, true),
        ),
      );

    summaries.push({
      id: item.id,
      title: item.title,
      sessionDate: item.sessionDate,
      createdAt: item.createdAt,
      selectedPhotoUrl: selectedPhotos[0] ? `/api/photos/${selectedPhotos[0].filename}` : undefined,
    });
  }

  return summaries;
}

/**
 * Get items @mentioned in a canvas item's notes, ordered by first appearance.
 */
export async function getTaggedItems(itemId: string): Promise<TaggedItem[]> {
  const db = getDb();

  // Get all notes for this item, ordered by createdAt
  const noteRows = await db
    .select({ content: notes.content })
    .from(notes)
    .where(eq(notes.canvasItemId, itemId))
    .orderBy(notes.createdAt);

  const seenIds = new Set<string>();
  const taggedItems: TaggedItem[] = [];

  for (const note of noteRows) {
    const mentions = parseMentionsWithPositions(note.content);
    for (const mention of mentions) {
      let targetItem:
        | { id: string; title: string; type: CanvasItemType; contentId: string }
        | undefined;

      if (mention.type === "id") {
        const [found] = await db
          .select({
            id: canvasItems.id,
            title: canvasItems.title,
            type: canvasItems.type,
            contentId: canvasItems.contentId,
          })
          .from(canvasItems)
          .where(eq(canvasItems.id, mention.value));
        targetItem = found;
      } else {
        const [found] = await db
          .select({
            id: canvasItems.id,
            title: canvasItems.title,
            type: canvasItems.type,
            contentId: canvasItems.contentId,
          })
          .from(canvasItems)
          .where(sql`LOWER(${canvasItems.title}) = LOWER(${mention.value})`);
        targetItem = found;
      }

      if (!targetItem || seenIds.has(targetItem.id)) continue;
      seenIds.add(targetItem.id);

      // Check for selected photo
      const selectedPhotos = await db
        .select({ filename: photos.filename })
        .from(photos)
        .where(
          and(
            eq(photos.contentType, targetItem.type),
            eq(photos.contentId, targetItem.contentId),
            eq(photos.isMainPhoto, true),
          ),
        );

      taggedItems.push({
        id: targetItem.id,
        title: targetItem.title,
        type: targetItem.type as CanvasItemType,
        selectedPhotoUrl: selectedPhotos[0]
          ? `/api/photos/${selectedPhotos[0].filename}`
          : undefined,
      });
    }
  }

  return taggedItems;
}
