import { and, eq } from "drizzle-orm";
import type { CreateTagInput, Tag, UpdateTagInput } from "shared";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/connection.js";
import { canvasItemTags, tags } from "../db/schema.js";

export async function createTag(input: CreateTagInput, canvasId: string): Promise<Tag> {
  const db = getDb();
  const id = uuidv4();
  const now = new Date();

  await db.insert(tags).values({
    id,
    name: input.name,
    icon: input.icon,
    color: input.color,
    canvasId: canvasId,
    createdAt: now,
    updatedAt: now,
  });

  return { id, name: input.name, icon: input.icon, color: input.color };
}

export async function listTags(canvasId: string): Promise<Tag[]> {
  const db = getDb();
  const rows = await db.select().from(tags).where(eq(tags.canvasId, canvasId));
  return rows.map((r) => ({ id: r.id, name: r.name, icon: r.icon, color: r.color }));
}

export async function getTag(id: string): Promise<Tag | null> {
  const db = getDb();
  const [row] = await db.select().from(tags).where(eq(tags.id, id));
  if (!row) return null;
  return { id: row.id, name: row.name, icon: row.icon, color: row.color };
}

export async function updateTag(id: string, input: UpdateTagInput): Promise<Tag | null> {
  const db = getDb();
  const [existing] = await db.select().from(tags).where(eq(tags.id, id));
  if (!existing) return null;

  const now = new Date();
  await db
    .update(tags)
    .set({
      name: input.name ?? existing.name,
      icon: input.icon ?? existing.icon,
      color: input.color ?? existing.color,
      updatedAt: now,
    })
    .where(eq(tags.id, id));

  return {
    id: existing.id,
    name: input.name ?? existing.name,
    icon: input.icon ?? existing.icon,
    color: input.color ?? existing.color,
  };
}

export async function deleteTag(id: string): Promise<boolean> {
  const db = getDb();
  const result = await db.delete(tags).where(eq(tags.id, id)).returning({ id: tags.id });
  return result.length > 0;
}

export async function addTagToItem(canvasItemId: string, tagId: string): Promise<void> {
  const db = getDb();
  await db
    .insert(canvasItemTags)
    .values({ canvasItemId: canvasItemId, tagId: tagId })
    .onConflictDoNothing();
}

export async function removeTagFromItem(canvasItemId: string, tagId: string): Promise<boolean> {
  const db = getDb();
  const result = await db
    .delete(canvasItemTags)
    .where(and(eq(canvasItemTags.canvasItemId, canvasItemId), eq(canvasItemTags.tagId, tagId)))
    .returning({ canvasItemId: canvasItemTags.canvasItemId });
  return result.length > 0;
}

export async function listTagsForItem(canvasItemId: string): Promise<Tag[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: tags.id,
      name: tags.name,
      icon: tags.icon,
      color: tags.color,
    })
    .from(canvasItemTags)
    .innerJoin(tags, eq(tags.id, canvasItemTags.tagId))
    .where(eq(canvasItemTags.canvasItemId, canvasItemId));
  return rows;
}

export async function listTagIdsForItem(canvasItemId: string): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ tagId: canvasItemTags.tagId })
    .from(canvasItemTags)
    .where(eq(canvasItemTags.canvasItemId, canvasItemId));
  return rows.map((r) => r.tagId);
}
