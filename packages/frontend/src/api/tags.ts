import type { CreateTagInput, Tag, UpdateTagInput } from "shared";
import { request } from "./http.js";

export function fetchTags(canvasId: string): Promise<Tag[]> {
  return request<Tag[]>(`/canvases/${canvasId}/tags`);
}

export function createTag(canvasId: string, input: CreateTagInput): Promise<Tag> {
  return request<Tag>(`/canvases/${canvasId}/tags`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTag(canvasId: string, tagId: string, input: UpdateTagInput): Promise<Tag> {
  return request<Tag>(`/canvases/${canvasId}/tags/${tagId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteTag(canvasId: string, tagId: string): Promise<void> {
  return request<void>(`/canvases/${canvasId}/tags/${tagId}`, { method: "DELETE" });
}

export function addTagToItem(itemId: string, tagId: string): Promise<void> {
  return request<void>(`/items/${itemId}/tags/${tagId}`, { method: "PUT" });
}

export function removeTagFromItem(itemId: string, tagId: string): Promise<void> {
  return request<void>(`/items/${itemId}/tags/${tagId}`, { method: "DELETE" });
}
