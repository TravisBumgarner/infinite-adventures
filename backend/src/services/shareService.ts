import { and, eq, isNull } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/connection.js";
import { canvasItems, shares } from "../db/schema.js";

export async function createShare(
  canvasId: string,
  itemId: string | null,
  userId: string,
): Promise<typeof shares.$inferSelect> {
  const db = getDb();

  // Check for existing share with same canvas+item combo
  const existing = await db
    .select()
    .from(shares)
    .where(
      and(
        eq(shares.canvasId, canvasId),
        itemId ? eq(shares.itemId, itemId) : isNull(shares.itemId),
      ),
    );

  if (existing.length > 0) {
    return existing[0]!;
  }

  const id = uuidv4();
  const token = uuidv4();

  const [row] = await db
    .insert(shares)
    .values({ id, token, canvasId, itemId, createdBy: userId })
    .returning();

  return row!;
}

export async function listSharesByCanvas(canvasId: string) {
  const db = getDb();

  const rows = await db
    .select({
      id: shares.id,
      token: shares.token,
      canvasId: shares.canvasId,
      itemId: shares.itemId,
      createdAt: shares.createdAt,
      itemTitle: canvasItems.title,
      itemType: canvasItems.type,
    })
    .from(shares)
    .leftJoin(canvasItems, eq(shares.itemId, canvasItems.id))
    .where(eq(shares.canvasId, canvasId));

  return rows;
}

export async function deleteShare(shareId: string): Promise<boolean> {
  const db = getDb();
  const result = await db.delete(shares).where(eq(shares.id, shareId)).returning({ id: shares.id });
  return result.length > 0;
}

export async function getShareByToken(token: string) {
  const db = getDb();
  const [row] = await db.select().from(shares).where(eq(shares.token, token));
  return row ?? null;
}

export async function getShareById(shareId: string) {
  const db = getDb();
  const [row] = await db.select().from(shares).where(eq(shares.id, shareId));
  return row ?? null;
}
