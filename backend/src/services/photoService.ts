import type { CanvasItemType } from "../db/schema.js";

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
 * Upload a photo and store metadata.
 * Returns the photo record.
 */
export async function uploadPhoto(_input: UploadPhotoInput): Promise<PhotoInfo> {
  throw new Error("Not implemented");
}

/**
 * Get photo metadata by ID.
 */
export async function getPhoto(_id: string): Promise<PhotoInfo | null> {
  throw new Error("Not implemented");
}

/**
 * List all photos for a content item.
 */
export async function listPhotos(
  _contentType: CanvasItemType,
  _contentId: string,
): Promise<PhotoInfo[]> {
  throw new Error("Not implemented");
}

/**
 * Delete a photo by ID (removes file and metadata).
 * Returns true if deleted, false if not found.
 */
export async function deletePhoto(_id: string): Promise<boolean> {
  throw new Error("Not implemented");
}

/**
 * Select a photo as the primary photo for its content item.
 * Unselects any previously selected photo for the same content.
 * Returns the updated photo or null if not found.
 */
export async function selectPhoto(_id: string): Promise<PhotoInfo | null> {
  throw new Error("Not implemented");
}

/**
 * Get the file path for a photo (for serving).
 */
export function getPhotoPath(_filename: string): string {
  throw new Error("Not implemented");
}

/**
 * Delete all photos for a content item (used when deleting canvas items).
 */
export async function deletePhotosForContent(
  _contentType: CanvasItemType,
  _contentId: string,
): Promise<number> {
  throw new Error("Not implemented");
}
