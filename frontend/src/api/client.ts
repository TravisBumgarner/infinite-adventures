import type {
  Canvas,
  CanvasItem,
  CanvasItemSearchResult,
  CanvasItemSummary,
  CanvasSummary,
  CreateCanvasInput,
  CreateCanvasItemInput,
  CreateNoteInput,
  CreateTagInput,
  ImportCanvasResult,
  Note,
  PaginatedGallery,
  PaginatedTimeline,
  Photo,
  SessionSummary,
  Tag,
  TaggedItem,
  TimelineDayCounts,
  UpdateCanvasInput,
  UpdateCanvasItemInput,
  UpdateNoteInput,
  UpdateTagInput,
} from "shared";
import { getToken } from "../auth/service.js";
import config from "../config.js";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  errorCode?: string;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const result = await getToken();
  if (result.success) {
    return { Authorization: `Bearer ${result.data}` };
  }
  return {};
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${config.apiBaseUrl}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeaders },
    ...options,
  });
  const body: ApiResponse<T> = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.errorCode || `HTTP ${res.status}`);
  }
  return body.data as T;
}

// --- Canvas functions ---

export function fetchCanvases(): Promise<CanvasSummary[]> {
  return request<CanvasSummary[]>("/canvases");
}

export function createCanvas(input: CreateCanvasInput): Promise<Canvas> {
  return request<Canvas>("/canvases", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCanvas(id: string, input: UpdateCanvasInput): Promise<Canvas> {
  return request<Canvas>(`/canvases/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteCanvas(id: string): Promise<void> {
  return request<void>(`/canvases/${id}`, { method: "DELETE" });
}

// --- Canvas Item functions ---

export function fetchItems(canvasId: string): Promise<CanvasItemSummary[]> {
  return request<CanvasItemSummary[]>(`/canvases/${canvasId}/items`);
}

export function fetchItem(id: string): Promise<CanvasItem> {
  return request<CanvasItem>(`/items/${id}`);
}

export function createItem(canvasId: string, input: CreateCanvasItemInput): Promise<CanvasItem> {
  return request<CanvasItem>(`/canvases/${canvasId}/items`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateItem(id: string, input: UpdateCanvasItemInput): Promise<CanvasItem> {
  return request<CanvasItem>(`/items/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteItem(id: string): Promise<void> {
  return request<void>(`/items/${id}`, { method: "DELETE" });
}

export async function searchItems(
  query: string,
  canvasId: string,
): Promise<CanvasItemSearchResult[]> {
  const encoded = encodeURIComponent(query);
  const data = await request<{ results: CanvasItemSearchResult[] }>(
    `/canvases/${canvasId}/items/search?q=${encoded}`,
  );
  return data.results;
}

// --- Timeline functions ---

export function fetchTimeline(
  canvasId: string,
  sort: "createdAt" | "updatedAt" = "createdAt",
  cursor?: string,
  limit = 30,
): Promise<PaginatedTimeline> {
  const params = new URLSearchParams({ sort, limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  return request<PaginatedTimeline>(`/canvases/${canvasId}/timeline?${params}`);
}

export function fetchTimelineCounts(
  canvasId: string,
  start: string,
  end: string,
): Promise<TimelineDayCounts> {
  const params = new URLSearchParams({ start, end });
  return request<TimelineDayCounts>(`/canvases/${canvasId}/timeline/counts?${params}`);
}

// --- Gallery functions ---

export function fetchGallery(
  canvasId: string,
  options: { cursor?: string; limit?: number; importantOnly?: boolean } = {},
): Promise<PaginatedGallery> {
  const params = new URLSearchParams({ limit: String(options.limit ?? 30) });
  if (options.cursor) params.set("cursor", options.cursor);
  if (options.importantOnly) params.set("importantOnly", "true");
  return request<PaginatedGallery>(`/canvases/${canvasId}/gallery?${params}`);
}

// --- Session functions ---

export function fetchSessions(canvasId: string): Promise<SessionSummary[]> {
  return request<SessionSummary[]>(`/canvases/${canvasId}/sessions`);
}

export function fetchTaggedItems(itemId: string): Promise<TaggedItem[]> {
  return request<TaggedItem[]>(`/items/${itemId}/tagged`);
}

// --- Photo functions ---

export async function uploadPhoto(itemId: string, file: File): Promise<Photo> {
  const authHeaders = await getAuthHeaders();
  const formData = new FormData();
  formData.append("photo", file);

  const res = await fetch(`${config.apiBaseUrl}/items/${itemId}/photos`, {
    method: "POST",
    headers: { ...authHeaders },
    body: formData,
  });

  const body: ApiResponse<Photo> = await res.json().catch(() => ({}));
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

// --- Note functions ---

export function fetchNotes(itemId: string): Promise<Note[]> {
  return request<Note[]>(`/items/${itemId}/notes`);
}

export function createNote(itemId: string, input: CreateNoteInput): Promise<Note> {
  return request<Note>(`/items/${itemId}/notes`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateNote(noteId: string, input: UpdateNoteInput): Promise<Note> {
  return request<Note>(`/notes/${noteId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteNote(noteId: string): Promise<void> {
  return request<void>(`/notes/${noteId}`, { method: "DELETE" });
}

// --- Link functions ---

export function createLink(
  sourceItemId: string,
  targetItemId: string,
): Promise<{ created: boolean }> {
  return request<{ created: boolean }>("/links", {
    method: "POST",
    body: JSON.stringify({ sourceItemId, targetItemId }),
  });
}

export function deleteLink(sourceItemId: string, targetItemId: string): Promise<void> {
  return request<void>(`/links/${sourceItemId}/${targetItemId}`, { method: "DELETE" });
}

// --- Tag functions ---

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

// --- Backup functions ---

export async function exportCanvas(_canvasId: string): Promise<Blob> {
  throw new Error("Not implemented");
}

export async function importCanvas(_file: File): Promise<ImportCanvasResult> {
  throw new Error("Not implemented");
}
