import * as fs from "node:fs";
import * as path from "node:path";
import archiver from "archiver";
import { and, eq, inArray } from "drizzle-orm";
import config from "../config.js";
import { getDb } from "../db/connection.js";
import type { CanvasItemType } from "../db/schema.js";
import {
  canvases,
  canvasItemLinks,
  canvasItems,
  canvasItemTags,
  events,
  notes,
  people,
  photos,
  places,
  sessions,
  tags,
  things,
} from "../db/schema.js";

const UPLOADS_DIR = path.resolve(process.cwd(), config.uploadsDir);

export const CURRENT_SCHEMA_VERSION = 1;

export interface BackupManifest {
  schemaVersion: number;
  exportedAt: string;
  canvasName: string;
}

export interface BackupData {
  canvas: { id: string; name: string; createdAt: string; updatedAt: string };
  canvasItems: Array<{
    id: string;
    type: CanvasItemType;
    title: string;
    summary: string;
    canvasX: number;
    canvasY: number;
    canvasId: string;
    userId: string | null;
    contentId: string;
    createdAt: string;
    updatedAt: string;
  }>;
  people: Array<{ id: string; createdAt: string; updatedAt: string }>;
  places: Array<{ id: string; createdAt: string; updatedAt: string }>;
  things: Array<{ id: string; createdAt: string; updatedAt: string }>;
  sessions: Array<{ id: string; sessionDate: string; createdAt: string; updatedAt: string }>;
  events: Array<{ id: string; createdAt: string; updatedAt: string }>;
  notes: Array<{
    id: string;
    canvasItemId: string;
    content: string;
    isImportant: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  photos: Array<{
    id: string;
    contentType: CanvasItemType;
    contentId: string;
    filename: string;
    originalName: string;
    mimeType: string;
    isMainPhoto: boolean;
    isImportant: boolean;
    aspectRatio: number | null;
    blurhash: string | null;
    createdAt: string;
  }>;
  tags: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    canvasId: string;
    createdAt: string;
    updatedAt: string;
  }>;
  canvasItemTags: Array<{ canvasItemId: string; tagId: string }>;
  canvasItemLinks: Array<{
    sourceItemId: string;
    targetItemId: string;
    snippet: string | null;
    createdAt: string;
  }>;
}

/**
 * Export a canvas and all its data as a zip buffer.
 */
export async function exportCanvas(canvasId: string): Promise<Buffer> {
  const db = getDb();

  // Fetch canvas
  const [canvas] = await db.select().from(canvases).where(eq(canvases.id, canvasId));
  if (!canvas) throw new Error("Canvas not found");

  // Fetch canvas items
  const itemRows = await db
    .select({
      id: canvasItems.id,
      type: canvasItems.type,
      title: canvasItems.title,
      summary: canvasItems.summary,
      canvasX: canvasItems.canvasX,
      canvasY: canvasItems.canvasY,
      canvasId: canvasItems.canvasId,
      userId: canvasItems.userId,
      contentId: canvasItems.contentId,
      createdAt: canvasItems.createdAt,
      updatedAt: canvasItems.updatedAt,
    })
    .from(canvasItems)
    .where(eq(canvasItems.canvasId, canvasId));

  const contentIds = itemRows.map((i) => i.contentId);
  const itemIds = itemRows.map((i) => i.id);

  // Fetch content tables (only rows referenced by this canvas's items)
  const peopleRows =
    contentIds.length > 0
      ? await db.select().from(people).where(inArray(people.id, contentIds))
      : [];
  const placesRows =
    contentIds.length > 0
      ? await db.select().from(places).where(inArray(places.id, contentIds))
      : [];
  const thingsRows =
    contentIds.length > 0
      ? await db.select().from(things).where(inArray(things.id, contentIds))
      : [];
  const sessionsRows =
    contentIds.length > 0
      ? await db.select().from(sessions).where(inArray(sessions.id, contentIds))
      : [];
  const eventsRows =
    contentIds.length > 0
      ? await db.select().from(events).where(inArray(events.id, contentIds))
      : [];

  // Fetch notes
  const noteRows =
    itemIds.length > 0
      ? await db.select().from(notes).where(inArray(notes.canvasItemId, itemIds))
      : [];

  // Fetch photos (joined via contentType+contentId matching canvas items)
  const photoRows =
    contentIds.length > 0
      ? await db
          .select()
          .from(photos)
          .innerJoin(
            canvasItems,
            and(
              eq(photos.contentType, canvasItems.type),
              eq(photos.contentId, canvasItems.contentId),
            ),
          )
          .where(eq(canvasItems.canvasId, canvasId))
      : [];

  const photoData = photoRows.map((r) => r.photos);

  // Fetch tags
  const tagRows = await db.select().from(tags).where(eq(tags.canvasId, canvasId));

  // Fetch canvas_item_tags
  const canvasItemTagRows =
    itemIds.length > 0
      ? await db.select().from(canvasItemTags).where(inArray(canvasItemTags.canvasItemId, itemIds))
      : [];

  // Fetch canvas_item_links (both source and target must be in this canvas)
  const linkRows =
    itemIds.length > 0
      ? await db
          .select()
          .from(canvasItemLinks)
          .where(
            and(
              inArray(canvasItemLinks.sourceItemId, itemIds),
              inArray(canvasItemLinks.targetItemId, itemIds),
            ),
          )
      : [];

  const data: BackupData = {
    canvas: {
      id: canvas.id,
      name: canvas.name,
      createdAt: canvas.createdAt,
      updatedAt: canvas.updatedAt,
    },
    canvasItems: itemRows,
    people: peopleRows,
    places: placesRows,
    things: thingsRows,
    sessions: sessionsRows,
    events: eventsRows,
    notes: noteRows,
    photos: photoData,
    tags: tagRows,
    canvasItemTags: canvasItemTagRows,
    canvasItemLinks: linkRows,
  };

  const manifest: BackupManifest = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    canvasName: canvas.name,
  };

  // Build zip
  return new Promise<Buffer>((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on("data", (chunk: Buffer) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);

    archive.append(JSON.stringify(manifest, null, 2), { name: "manifest.json" });
    archive.append(JSON.stringify(data, null, 2), { name: "data.json" });

    // Add photo files
    for (const photo of photoData) {
      const filePath = path.join(UPLOADS_DIR, photo.filename);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: `photos/${photo.filename}` });
      }
    }

    archive.finalize();
  });
}

/**
 * Import a canvas from a zip buffer. Creates a new canvas with fresh UUIDs.
 * Returns the new canvas id and name.
 */
export async function importCanvas(
  _zipBuffer: Buffer,
  _userId: string,
): Promise<{ id: string; name: string }> {
  throw new Error("Not implemented");
}
