import type { Photo } from "shared";
import config from "../config.js";
import { getAuthHeaders, request } from "./http.js";

export async function uploadPhoto(itemId: string, file: File): Promise<Photo> {
  const authHeaders = await getAuthHeaders();
  const formData = new FormData();
  formData.append("photo", file);

  const res = await fetch(`${config.apiBaseUrl}/items/${itemId}/photos`, {
    method: "POST",
    headers: { ...authHeaders },
    body: formData,
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.errorCode || `HTTP ${res.status}`);
  }
  return body.data as Photo;
}

export function deletePhoto(id: string): Promise<void> {
  return request<void>(`/photos/${id}`, { method: "DELETE" });
}

export function selectPhoto(id: string): Promise<Photo> {
  return request<Photo>(`/photos/${id}/select`, { method: "PUT" });
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
