import * as path from "node:path";
import { encode } from "blurhash";
import { and, eq } from "drizzle-orm";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/connection.js";
import { type CanvasItemType, photos } from "../db/schema.js";
import {
  deleteS3Object,
  generatePresignedGetUrl,
  generatePresignedPutUrl,
  getS3Object,
} from "../lib/s3.js";

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

export interface PresignResult {
  uploadUrl: string;
  key: string;
  photoId: string;
}

export interface ConfirmUploadInput {
  photoId: string;
  key: string;
  contentType: CanvasItemType;
  contentId: string;
  originalName: string;
  mimeType: string;
}

/**
 * Generate a presigned PUT URL for uploading a photo to S3.
 */
export async function presignUpload(
  originalName: string,
  mimeType: string,
): Promise<PresignResult> {
  const photoId = uuidv4();
  const ext = path.extname(originalName);
  const key = `photos/${photoId}${ext}`;
  const uploadUrl = await generatePresignedPutUrl(key, mimeType);
  return { uploadUrl, key, photoId };
}

/**
 * Confirm a photo upload: download from S3, compute metadata, store in DB.
 */
export async function confirmUpload(input: ConfirmUploadInput): Promise<PhotoInfo> {
  const db = getDb();
  const now = new Date();

  // Download from S3 to compute metadata
  const buffer = await getS3Object(input.key);

  // Compute aspectRatio and blurhash
  let aspectRatio: number | null = null;
  let blurhash: string | null = null;
  try {
    const metadata = await sharp(buffer).metadata();
    if (metadata.width && metadata.height) {
      aspectRatio = metadata.width / metadata.height;
      const { data, info } = await sharp(buffer)
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

  // The S3 key is stored in the filename column
  await db.insert(photos).values({
    id: input.photoId,
    contentType: input.contentType,
    contentId: input.contentId,
    filename: input.key,
    originalName: input.originalName,
    mimeType: input.mimeType,
    isMainPhoto,
    aspectRatio,
    blurhash,
    createdAt: now,
  });

  return {
    id: input.photoId,
    contentType: input.contentType,
    contentId: input.contentId,
    filename: input.key,
    originalName: input.originalName,
    mimeType: input.mimeType,
    isMainPhoto,
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
 * Get a presigned GET URL for a photo's S3 key.
 */
export async function getPhotoUrl(s3Key: string): Promise<string> {
  return generatePresignedGetUrl(s3Key);
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
 * Delete a photo by ID (removes from S3 and database).
 * Returns true if deleted, false if not found.
 */
export async function deletePhoto(id: string): Promise<boolean> {
  const db = getDb();

  const photo = await getPhoto(id);
  if (!photo) return false;

  const result = await db.delete(photos).where(eq(photos.id, id)).returning({ id: photos.id });
  if (result.length === 0) return false;

  // Delete from S3
  await deleteS3Object(photo.filename);

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

  const photosToDelete = await listPhotos(contentType, contentId);
  if (photosToDelete.length === 0) return 0;

  // Delete from S3
  for (const photo of photosToDelete) {
    await deleteS3Object(photo.filename);
  }

  // Delete from database
  await db
    .delete(photos)
    .where(and(eq(photos.contentType, contentType), eq(photos.contentId, contentId)));

  return photosToDelete.length;
}
