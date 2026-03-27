import type { Photo } from "shared";
import config from "../config.js";
import { getAuthHeaders, request } from "./http.js";

export async function uploadPhoto(itemId: string, file: File): Promise<Photo> {
  const authHeaders = await getAuthHeaders();

  // Step 1: Get presigned URL
  const presignRes = await fetch(`${config.apiBaseUrl}/items/${itemId}/photos/presign`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: file.type, filename: file.name }),
  });
  const presignBody = await presignRes.json().catch(() => ({}));
  if (!presignRes.ok) {
    throw new Error(presignBody.errorCode || `HTTP ${presignRes.status}`);
  }
  const { uploadUrl, key, photoId } = presignBody.data;

  // Step 2: Upload directly to S3
  const s3Res = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!s3Res.ok) {
    throw new Error(`S3 upload failed: HTTP ${s3Res.status}`);
  }

  // Step 3: Confirm upload
  const confirmRes = await fetch(`${config.apiBaseUrl}/items/${itemId}/photos/confirm`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ key, photoId, originalName: file.name, mimeType: file.type }),
  });
  const confirmBody = await confirmRes.json().catch(() => ({}));
  if (!confirmRes.ok) {
    throw new Error(confirmBody.errorCode || `HTTP ${confirmRes.status}`);
  }
  return confirmBody.data as Photo;
}

export function deletePhoto(id: string): Promise<void> {
  return request<void>(`/photos/${id}`, { method: "DELETE" });
}

export function selectPhoto(id: string, cropX?: number, cropY?: number): Promise<Photo> {
  return request<Photo>(`/photos/${id}/select`, {
    method: "PUT",
    body: JSON.stringify({ cropX, cropY }),
  });
}

export function togglePhotoImportant(id: string): Promise<Photo> {
  return request<Photo>(`/photos/${id}/important`, { method: "PUT" });
}

export function updatePhotoCaption(id: string, caption: string): Promise<Photo> {
  return request<Photo>(`/photos/${id}/caption`, {
    method: "PUT",
    body: JSON.stringify({ caption }),
  });
}
