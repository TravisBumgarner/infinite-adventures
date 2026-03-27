import { and, eq } from "drizzle-orm";
import { getDb } from "../db/connection.js";
import { canvasItems, canvasUsers, notes, photos, tags } from "../db/schema.js";

export async function userOwnsCanvas(userId: string, canvasId: string): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(canvasUsers)
    .where(and(eq(canvasUsers.canvasId, canvasId), eq(canvasUsers.userId, userId)));
  return !!row;
}

export async function getCanvasIdForItem(itemId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ canvasId: canvasItems.canvasId })
    .from(canvasItems)
    .where(eq(canvasItems.id, itemId));
  return row?.canvasId ?? null;
}

export async function getCanvasIdForNote(noteId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ canvasId: canvasItems.canvasId })
    .from(notes)
    .innerJoin(canvasItems, eq(canvasItems.id, notes.canvasItemId))
    .where(eq(notes.id, noteId));
  return row?.canvasId ?? null;
}

export async function getCanvasIdForPhoto(photoId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ canvasId: canvasItems.canvasId })
    .from(photos)
    .innerJoin(canvasItems, eq(canvasItems.contentId, photos.contentId))
    .where(eq(photos.id, photoId));
  return row?.canvasId ?? null;
}

export async function getCanvasIdForTag(tagId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db.select({ canvasId: tags.canvasId }).from(tags).where(eq(tags.id, tagId));
  return row?.canvasId ?? null;
}

export type ResourceType = "item" | "note" | "photo" | "tag";

export async function userOwnsResource(
  userId: string,
  resourceType: ResourceType,
  resourceId: string,
): Promise<string | null> {
  let canvasId: string | null;
  switch (resourceType) {
    case "item":
      canvasId = await getCanvasIdForItem(resourceId);
      break;
    case "note":
      canvasId = await getCanvasIdForNote(resourceId);
      break;
    case "photo":
      canvasId = await getCanvasIdForPhoto(resourceId);
      break;
    case "tag":
      canvasId = await getCanvasIdForTag(resourceId);
      break;
  }
  if (!canvasId) return null;
  const owns = await userOwnsCanvas(userId, canvasId);
  return owns ? canvasId : null;
}
