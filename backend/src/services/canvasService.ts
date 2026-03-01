import { and, eq, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/connection.js";
import type { Canvas as CanvasRow } from "../db/schema.js";
import { canvases, canvasItems, canvasUsers } from "../db/schema.js";

export type CanvasSummary = Pick<CanvasRow, "id" | "name">;

export async function listCanvases(userId: string): Promise<CanvasSummary[]> {
  const db = getDb();
  const rows = await db
    .select({ id: canvases.id, name: canvases.name })
    .from(canvases)
    .innerJoin(canvasUsers, eq(canvasUsers.canvasId, canvases.id))
    .where(eq(canvasUsers.userId, userId))
    .orderBy(canvases.createdAt);

  if (rows.length === 0) {
    const canvas = await createCanvas("Default", userId);
    return [{ id: canvas.id, name: canvas.name }];
  }

  return rows;
}

export async function getCanvas(id: string, userId: string): Promise<CanvasRow | null> {
  const db = getDb();
  const [canvas] = await db
    .select({
      id: canvases.id,
      name: canvases.name,
      createdAt: canvases.createdAt,
      updatedAt: canvases.updatedAt,
    })
    .from(canvases)
    .innerJoin(canvasUsers, eq(canvasUsers.canvasId, canvases.id))
    .where(and(eq(canvases.id, id), eq(canvasUsers.userId, userId)));
  return canvas ?? null;
}

export async function getCanvasById(id: string): Promise<CanvasRow | null> {
  const db = getDb();
  const [canvas] = await db
    .select({
      id: canvases.id,
      name: canvases.name,
      createdAt: canvases.createdAt,
      updatedAt: canvases.updatedAt,
    })
    .from(canvases)
    .where(eq(canvases.id, id));
  return canvas ?? null;
}

export async function createCanvas(name: string, userId: string): Promise<CanvasRow> {
  const db = getDb();
  const id = uuidv4();
  const now = new Date();

  await db.insert(canvases).values({
    id,
    name,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(canvasUsers).values({
    canvasId: id,
    userId: userId,
  });

  const [canvas] = await db.select().from(canvases).where(eq(canvases.id, id));
  return canvas!;
}

export async function updateCanvas(
  id: string,
  name: string,
  userId: string,
): Promise<CanvasRow | null> {
  const db = getDb();

  // Verify user has access
  const [membership] = await db
    .select()
    .from(canvasUsers)
    .where(and(eq(canvasUsers.canvasId, id), eq(canvasUsers.userId, userId)));
  if (!membership) return null;

  const [existing] = await db.select().from(canvases).where(eq(canvases.id, id));
  if (!existing) return null;

  await db.update(canvases).set({ name, updatedAt: new Date() }).where(eq(canvases.id, id));

  const [updated] = await db.select().from(canvases).where(eq(canvases.id, id));
  return updated!;
}

export async function deleteCanvas(id: string, userId: string): Promise<boolean> {
  const db = getDb();

  // Verify user has access
  const [membership] = await db
    .select()
    .from(canvasUsers)
    .where(and(eq(canvasUsers.canvasId, id), eq(canvasUsers.userId, userId)));
  if (!membership) return false;

  // Count total canvases for this user to prevent deleting the last one
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(canvasUsers)
    .where(eq(canvasUsers.userId, userId));
  if (count <= 1) {
    throw new LastCanvasError();
  }

  // Cascade-delete canvas items belonging to this canvas
  await db.delete(canvasItems).where(eq(canvasItems.canvasId, id));

  // Delete the canvas (canvas_users rows cascade-delete via FK)
  await db.delete(canvases).where(eq(canvases.id, id));

  return true;
}

export class LastCanvasError extends Error {
  constructor() {
    super("Cannot delete the only canvas");
    this.name = "LastCanvasError";
  }
}
