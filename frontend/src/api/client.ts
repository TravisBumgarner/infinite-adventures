import type {
  Canvas,
  CanvasItem,
  CanvasItemSearchResult,
  CanvasItemSummary,
  CanvasSummary,
  CreateCanvasInput,
  CreateCanvasItemInput,
  CreateNoteInput,
  Note,
  Photo,
  UpdateCanvasInput,
  UpdateCanvasItemInput,
  UpdateNoteInput,
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
