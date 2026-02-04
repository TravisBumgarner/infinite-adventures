import * as fs from "node:fs";
import * as path from "node:path";
import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/connection.js";
import { type CanvasItemType, photos } from "../db/schema.js";

// Base directory for photo uploads
const UPLOADS_DIR = path.resolve(process.cwd(), "uploads/photos");

export interface PhotoInfo {
  id: string;
  content_type: CanvasItemType;
  content_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  is_selected: boolean;
  created_at: string;
}

export interface UploadPhotoInput {
  content_type: CanvasItemType;
  content_id: string;
  original_name: string;
  mime_type: string;
  buffer: Buffer;
}

/**
 * Ensure the uploads directory exists.
 */
function ensureUploadsDir(): void {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

/**
 * Extract file extension from filename.
 */
function getExtension(filename: string): string {
  const ext = path.extname(filename);
  return ext || "";
}

/**
 * Upload a photo and store metadata.
 * Returns the photo record.
 */
export async function uploadPhoto(input: UploadPhotoInput): Promise<PhotoInfo> {
  const db = getDb();
  const id = uuidv4();
  const ext = getExtension(input.original_name);
  const filename = `${id}${ext}`;
  const now = new Date().toISOString();

  // Ensure uploads directory exists
  ensureUploadsDir();

  // Write file to disk
  const filePath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(filePath, input.buffer);

  // Insert metadata into database
  await db.insert(photos).values({
    id,
    content_type: input.content_type,
    content_id: input.content_id,
    filename,
    original_name: input.original_name,
    mime_type: input.mime_type,
    is_selected: false,
    created_at: now,
  });

  return {
    id,
    content_type: input.content_type,
    content_id: input.content_id,
    filename,
    original_name: input.original_name,
    mime_type: input.mime_type,
    is_selected: false,
    created_at: now,
  };
}

/**
 * Get photo metadata by ID.
 */
export async function getPhoto(id: string): Promise<PhotoInfo | null> {
  const db = getDb();
  const [photo] = await db.select().from(photos).where(eq(photos.id, id));
  if (!photo) return null;
  return photo as PhotoInfo;
}

/**
 * List all photos for a content item.
 */
export async function listPhotos(
  contentType: CanvasItemType,
  contentId: string,
): Promise<PhotoInfo[]> {
  const db = getDb();
  const result = await db
    .select()
    .from(photos)
    .where(and(eq(photos.content_type, contentType), eq(photos.content_id, contentId)));
  return result as PhotoInfo[];
}

/**
 * Delete a photo by ID (removes file and metadata).
 * Returns true if deleted, false if not found.
 */
export async function deletePhoto(id: string): Promise<boolean> {
  const db = getDb();

  // Get photo to find filename
  const photo = await getPhoto(id);
  if (!photo) return false;

  // Delete from database
  const result = await db.delete(photos).where(eq(photos.id, id)).returning({ id: photos.id });
  if (result.length === 0) return false;

  // Delete file from disk
  const filePath = getPhotoPath(photo.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return true;
}

/**
 * Select a photo as the primary photo for its content item.
 * Unselects any previously selected photo for the same content.
 * Returns the updated photo or null if not found.
 */
export async function selectPhoto(id: string): Promise<PhotoInfo | null> {
  const db = getDb();

  // Get the photo to find its content
  const photo = await getPhoto(id);
  if (!photo) return null;

  // Unselect all photos for the same content item
  await db
    .update(photos)
    .set({ is_selected: false })
    .where(
      and(eq(photos.content_type, photo.content_type), eq(photos.content_id, photo.content_id)),
    );

  // Select the specified photo
  await db.update(photos).set({ is_selected: true }).where(eq(photos.id, id));

  // Return updated photo
  return getPhoto(id);
}

/**
 * Get the file path for a photo (for serving).
 */
export function getPhotoPath(filename: string): string {
  return path.join(UPLOADS_DIR, filename);
}

/**
 * Delete all photos for a content item (used when deleting canvas items).
 */
export async function deletePhotosForContent(
  contentType: CanvasItemType,
  contentId: string,
): Promise<number> {
  const db = getDb();

  // Get all photos for this content
  const photosToDelete = await listPhotos(contentType, contentId);

  if (photosToDelete.length === 0) return 0;

  // Delete files from disk
  for (const photo of photosToDelete) {
    const filePath = getPhotoPath(photo.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  // Delete from database
  await db
    .delete(photos)
    .where(and(eq(photos.content_type, contentType), eq(photos.content_id, contentId)));

  return photosToDelete.length;
}
