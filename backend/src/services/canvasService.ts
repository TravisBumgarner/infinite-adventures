import { eq, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/connection.js";
import type { Canvas as CanvasRow } from "../db/schema.js";
import { canvases, notes } from "../db/schema.js";

export type CanvasSummary = Pick<CanvasRow, "id" | "name">;

export async function listCanvases(): Promise<CanvasSummary[]> {
  const db = getDb();
  return db
    .select({ id: canvases.id, name: canvases.name })
    .from(canvases)
    .orderBy(canvases.created_at);
}

export async function getCanvas(id: string): Promise<CanvasRow | null> {
  const db = getDb();
  const [canvas] = await db.select().from(canvases).where(eq(canvases.id, id));
  return canvas ?? null;
}

export async function createCanvas(name: string): Promise<CanvasRow> {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  await db.insert(canvases).values({
    id,
    name,
    created_at: now,
    updated_at: now,
  });

  const [canvas] = await db.select().from(canvases).where(eq(canvases.id, id));
  return canvas!;
}

export async function updateCanvas(id: string, name: string): Promise<CanvasRow | null> {
  const db = getDb();
  const [existing] = await db.select().from(canvases).where(eq(canvases.id, id));
  if (!existing) return null;

  await db
    .update(canvases)
    .set({ name, updated_at: new Date().toISOString() })
    .where(eq(canvases.id, id));

  const [updated] = await db.select().from(canvases).where(eq(canvases.id, id));
  return updated!;
}

export async function deleteCanvas(id: string): Promise<boolean> {
  const db = getDb();

  // Check if this canvas exists
  const [existing] = await db.select().from(canvases).where(eq(canvases.id, id));
  if (!existing) return false;

  // Count total canvases to prevent deleting the last one
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(canvases);
  if (count <= 1) {
    throw new LastCanvasError();
  }

  // Cascade-delete notes belonging to this canvas
  await db.delete(notes).where(eq(notes.canvas_id, id));

  // Delete the canvas
  await db.delete(canvases).where(eq(canvases.id, id));

  return true;
}

export class LastCanvasError extends Error {
  constructor() {
    super("Cannot delete the last canvas");
    this.name = "LastCanvasError";
  }
}
