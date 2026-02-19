import * as fs from "node:fs";
import * as path from "node:path";
import AdmZip from "adm-zip";
import archiver from "archiver";
import { and, eq, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import config from "../config.js";
import { getDb } from "../db/connection.js";
import type { CanvasItemType } from "../db/schema.js";
import {
  canvases,
  canvasItemLinks,
  canvasItems,
  canvasItemTags,
  canvasUsers,
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

  const toISO = (d: Date) => d.toISOString();

  const data: BackupData = {
    canvas: {
      id: canvas.id,
      name: canvas.name,
      createdAt: toISO(canvas.createdAt),
      updatedAt: toISO(canvas.updatedAt),
    },
    canvasItems: itemRows.map((r) => ({
      ...r,
      createdAt: toISO(r.createdAt),
      updatedAt: toISO(r.updatedAt),
    })),
    people: peopleRows.map((r) => ({
      ...r,
      createdAt: toISO(r.createdAt),
      updatedAt: toISO(r.updatedAt),
    })),
    places: placesRows.map((r) => ({
      ...r,
      createdAt: toISO(r.createdAt),
      updatedAt: toISO(r.updatedAt),
    })),
    things: thingsRows.map((r) => ({
      ...r,
      createdAt: toISO(r.createdAt),
      updatedAt: toISO(r.updatedAt),
    })),
    sessions: sessionsRows.map((r) => ({
      ...r,
      createdAt: toISO(r.createdAt),
      updatedAt: toISO(r.updatedAt),
    })),
    events: eventsRows.map((r) => ({
      ...r,
      createdAt: toISO(r.createdAt),
      updatedAt: toISO(r.updatedAt),
    })),
    notes: noteRows.map((r) => ({
      ...r,
      createdAt: toISO(r.createdAt),
      updatedAt: toISO(r.updatedAt),
    })),
    photos: photoData.map((r) => ({
      ...r,
      createdAt: toISO(r.createdAt),
    })),
    tags: tagRows.map((r) => ({
      ...r,
      createdAt: toISO(r.createdAt),
      updatedAt: toISO(r.updatedAt),
    })),
    canvasItemTags: canvasItemTagRows,
    canvasItemLinks: linkRows.map((r) => ({
      ...r,
      createdAt: toISO(r.createdAt),
    })),
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
  zipBuffer: Buffer,
  userId: string,
): Promise<{ id: string; name: string }> {
  const zip = new AdmZip(zipBuffer);

  // Extract and validate manifest
  const manifestEntry = zip.getEntry("manifest.json");
  if (!manifestEntry) throw new Error("Invalid backup file: missing manifest.json");
  const manifest: BackupManifest = JSON.parse(manifestEntry.getData().toString("utf-8"));

  if (manifest.schemaVersion > CURRENT_SCHEMA_VERSION) {
    throw new Error("Backup was created with a newer version");
  }

  // Extract data
  const dataEntry = zip.getEntry("data.json");
  if (!dataEntry) throw new Error("Invalid backup file: missing data.json");
  const data: BackupData = JSON.parse(dataEntry.getData().toString("utf-8"));

  // Build UUID remap maps
  const canvasIdMap = new Map<string, string>();
  const contentIdMap = new Map<string, string>();
  const canvasItemIdMap = new Map<string, string>();
  const noteIdMap = new Map<string, string>();
  const photoIdMap = new Map<string, string>();
  const tagIdMap = new Map<string, string>();

  // 1. New canvas ID
  const newCanvasId = uuidv4();
  canvasIdMap.set(data.canvas.id, newCanvasId);

  // 2. New content IDs (people, places, things, sessions, events)
  for (const p of data.people) contentIdMap.set(p.id, uuidv4());
  for (const p of data.places) contentIdMap.set(p.id, uuidv4());
  for (const t of data.things) contentIdMap.set(t.id, uuidv4());
  for (const s of data.sessions) contentIdMap.set(s.id, uuidv4());
  for (const e of data.events) contentIdMap.set(e.id, uuidv4());

  // 3. New canvas item IDs
  for (const ci of data.canvasItems) canvasItemIdMap.set(ci.id, uuidv4());

  // 4. New note IDs
  for (const n of data.notes) noteIdMap.set(n.id, uuidv4());

  // 5. New photo IDs
  for (const p of data.photos) photoIdMap.set(p.id, uuidv4());

  // 6. New tag IDs
  for (const t of data.tags) tagIdMap.set(t.id, uuidv4());

  // Track written photo files for cleanup on failure
  const writtenPhotoPaths: string[] = [];

  const db = getDb();
  const now = new Date();

  try {
    await db.transaction(async (tx) => {
      // Insert canvas
      await tx.insert(canvases).values({
        id: newCanvasId,
        name: data.canvas.name,
        createdAt: now,
        updatedAt: now,
      });

      // Insert canvas_users
      await tx.insert(canvasUsers).values({
        canvasId: newCanvasId,
        userId,
      });

      // Insert content tables
      for (const p of data.people) {
        await tx.insert(people).values({
          id: contentIdMap.get(p.id)!,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        });
      }
      for (const p of data.places) {
        await tx.insert(places).values({
          id: contentIdMap.get(p.id)!,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        });
      }
      for (const t of data.things) {
        await tx.insert(things).values({
          id: contentIdMap.get(t.id)!,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
        });
      }
      for (const s of data.sessions) {
        await tx.insert(sessions).values({
          id: contentIdMap.get(s.id)!,
          sessionDate: s.sessionDate,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        });
      }
      for (const e of data.events) {
        await tx.insert(events).values({
          id: contentIdMap.get(e.id)!,
          createdAt: new Date(e.createdAt),
          updatedAt: new Date(e.updatedAt),
        });
      }

      // Insert canvas items (remap canvasId and contentId)
      for (const ci of data.canvasItems) {
        await tx.insert(canvasItems).values({
          id: canvasItemIdMap.get(ci.id)!,
          type: ci.type,
          title: ci.title,
          summary: ci.summary,
          canvasX: ci.canvasX,
          canvasY: ci.canvasY,
          canvasId: newCanvasId,
          userId: null,
          contentId: contentIdMap.get(ci.contentId)!,
          createdAt: new Date(ci.createdAt),
          updatedAt: new Date(ci.updatedAt),
        });
      }

      // Insert notes (remap canvasItemId)
      for (const n of data.notes) {
        await tx.insert(notes).values({
          id: noteIdMap.get(n.id)!,
          canvasItemId: canvasItemIdMap.get(n.canvasItemId)!,
          content: n.content,
          isImportant: n.isImportant,
          createdAt: new Date(n.createdAt),
          updatedAt: new Date(n.updatedAt),
        });
      }

      // Write photo files and insert photo records
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }

      for (const p of data.photos) {
        const newPhotoId = photoIdMap.get(p.id)!;
        const ext = path.extname(p.filename);
        const newFilename = `${newPhotoId}${ext}`;

        // Extract photo from zip
        const photoEntry = zip.getEntry(`photos/${p.filename}`);
        if (photoEntry) {
          const filePath = path.join(UPLOADS_DIR, newFilename);
          fs.writeFileSync(filePath, photoEntry.getData());
          writtenPhotoPaths.push(filePath);
        }

        await tx.insert(photos).values({
          id: newPhotoId,
          contentType: p.contentType,
          contentId: contentIdMap.get(p.contentId)!,
          filename: newFilename,
          originalName: p.originalName,
          mimeType: p.mimeType,
          isMainPhoto: p.isMainPhoto,
          isImportant: p.isImportant,
          aspectRatio: p.aspectRatio,
          blurhash: p.blurhash,
          createdAt: new Date(p.createdAt),
        });
      }

      // Insert tags (remap canvasId)
      for (const t of data.tags) {
        await tx.insert(tags).values({
          id: tagIdMap.get(t.id)!,
          name: t.name,
          icon: t.icon,
          color: t.color,
          canvasId: newCanvasId,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
        });
      }

      // Insert canvas_item_tags (remap both canvasItemId and tagId)
      for (const cit of data.canvasItemTags) {
        await tx.insert(canvasItemTags).values({
          canvasItemId: canvasItemIdMap.get(cit.canvasItemId)!,
          tagId: tagIdMap.get(cit.tagId)!,
        });
      }

      // Insert canvas_item_links (remap both sourceItemId and targetItemId)
      for (const link of data.canvasItemLinks) {
        await tx.insert(canvasItemLinks).values({
          sourceItemId: canvasItemIdMap.get(link.sourceItemId)!,
          targetItemId: canvasItemIdMap.get(link.targetItemId)!,
          snippet: link.snippet,
          createdAt: new Date(link.createdAt),
        });
      }
    });
  } catch (err) {
    // Clean up any photo files written before the failure
    for (const filePath of writtenPhotoPaths) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    throw err;
  }

  return { id: newCanvasId, name: data.canvas.name };
}
