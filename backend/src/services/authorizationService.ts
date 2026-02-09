import { and, eq } from "drizzle-orm";
import { getDb } from "../db/connection.js";
import { canvasItems, canvasUsers, notes, photos, tags } from "../db/schema.js";

export async function userOwnsCanvas(userId: string, canvasId: string): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(canvasUsers)
    .where(and(eq(canvasUsers.canvas_id, canvasId), eq(canvasUsers.user_id, userId)));
  return !!row;
}

export async function getCanvasIdForItem(itemId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ canvas_id: canvasItems.canvas_id })
    .from(canvasItems)
    .where(eq(canvasItems.id, itemId));
  return row?.canvas_id ?? null;
}

export async function getCanvasIdForNote(noteId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ canvas_id: canvasItems.canvas_id })
    .from(notes)
    .innerJoin(canvasItems, eq(canvasItems.id, notes.canvas_item_id))
    .where(eq(notes.id, noteId));
  return row?.canvas_id ?? null;
}

export async function getCanvasIdForPhoto(photoId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ canvas_id: canvasItems.canvas_id })
    .from(photos)
    .innerJoin(canvasItems, eq(canvasItems.content_id, photos.content_id))
    .where(eq(photos.id, photoId));
  return row?.canvas_id ?? null;
}

export async function getCanvasIdForTag(tagId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db.select({ canvas_id: tags.canvas_id }).from(tags).where(eq(tags.id, tagId));
  return row?.canvas_id ?? null;
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
