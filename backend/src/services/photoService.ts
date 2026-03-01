import * as fs from "node:fs";
import * as path from "node:path";
import { encode } from "blurhash";
import { and, eq } from "drizzle-orm";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import config from "../config.js";
import { getDb } from "../db/connection.js";
import { type CanvasItemType, photos } from "../db/schema.js";

const UPLOADS_DIR = path.resolve(process.cwd(), config.uploadsDir);

export interface PhotoInfo {
  id: string;
  contentType: CanvasItemType;
  contentId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  isMainPhoto: boolean;
  isImportant: boolean;
  caption: string;
  aspectRatio: number | null;
  blurhash: string | null;
  cropX: number | null;
  cropY: number | null;
  createdAt: string;
}

export interface UploadPhotoInput {
  contentType: CanvasItemType;
  contentId: string;
  originalName: string;
  mimeType: string;
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
  const ext = getExtension(input.originalName);
  const filename = `${id}${ext}`;
  const now = new Date();

  // Ensure uploads directory exists
  ensureUploadsDir();

  // Write file to disk
  const filePath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(filePath, input.buffer);

  // Compute aspectRatio and blurhash
  let aspectRatio: number | null = null;
  let blurhash: string | null = null;
  try {
    const metadata = await sharp(input.buffer).metadata();
    if (metadata.width && metadata.height) {
      aspectRatio = metadata.width / metadata.height;
      const { data, info } = await sharp(input.buffer)
        .resize(32, 32, { fit: "inside" })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      blurhash = encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3);
    }
  } catch {
    // Non-fatal: leave as null for unsupported formats
  }

  // Auto-select as main photo if this is the first photo for the content item
  const existing = await listPhotos(input.contentType, input.contentId);
  const isMainPhoto = existing.length === 0;

  // Insert metadata into database
  await db.insert(photos).values({
    id,
    contentType: input.contentType,
    contentId: input.contentId,
    filename,
    originalName: input.originalName,
    mimeType: input.mimeType,
    isMainPhoto: isMainPhoto,
    aspectRatio,
    blurhash,
    createdAt: now,
  });

  return {
    id,
    contentType: input.contentType,
    contentId: input.contentId,
    filename,
    originalName: input.originalName,
    mimeType: input.mimeType,
    isMainPhoto: isMainPhoto,
    isImportant: false,
    caption: "",
    aspectRatio,
    blurhash,
    cropX: null,
    cropY: null,
    createdAt: now.toISOString(),
  };
}

/**
 * Get photo metadata by ID.
 */
export async function getPhoto(id: string): Promise<PhotoInfo | null> {
  const db = getDb();
  const [photo] = await db.select().from(photos).where(eq(photos.id, id));
  if (!photo) return null;
  return { ...photo, createdAt: photo.createdAt.toISOString() } as PhotoInfo;
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
    .where(and(eq(photos.contentType, contentType), eq(photos.contentId, contentId)));
  return result.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })) as PhotoInfo[];
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
export async function selectPhoto(
  id: string,
  cropX?: number,
  cropY?: number,
): Promise<PhotoInfo | null> {
  const db = getDb();

  // Get the photo to find its content
  const photo = await getPhoto(id);
  if (!photo) return null;

  // Unselect all photos for the same content item
  await db
    .update(photos)
    .set({ isMainPhoto: false })
    .where(and(eq(photos.contentType, photo.contentType), eq(photos.contentId, photo.contentId)));

  // Select the specified photo and optionally store crop
  await db
    .update(photos)
    .set({
      isMainPhoto: true,
      cropX: cropX ?? null,
      cropY: cropY ?? null,
    })
    .where(eq(photos.id, id));

  // Return updated photo
  return getPhoto(id);
}

/**
 * Toggle the isImportant flag on a photo.
 * Returns the updated photo or null if not found.
 */
export async function togglePhotoImportant(id: string): Promise<PhotoInfo | null> {
  const db = getDb();
  const photo = await getPhoto(id);
  if (!photo) return null;

  await db.update(photos).set({ isImportant: !photo.isImportant }).where(eq(photos.id, id));

  return getPhoto(id);
}

/**
 * Get the file path for a photo (for serving).
 */
export function getPhotoPath(filename: string): string {
  return path.join(UPLOADS_DIR, filename);
}

/**
 * Update a photo's caption.
 * Returns the updated photo or null if not found.
 */
export async function updatePhotoCaption(id: string, caption: string): Promise<PhotoInfo | null> {
  const db = getDb();
  const photo = await getPhoto(id);
  if (!photo) return null;

  await db.update(photos).set({ caption }).where(eq(photos.id, id));

  return getPhoto(id);
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
    .where(and(eq(photos.contentType, contentType), eq(photos.contentId, contentId)));

  return photosToDelete.length;
}
