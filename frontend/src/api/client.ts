import type {
  Canvas,
  CanvasSummary,
  CreateCanvasInput,
  CreateNoteInput,
  Note,
  NoteSummary,
  SearchResult,
  UpdateCanvasInput,
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

// --- Note functions ---

export function fetchNotes(canvasId: string): Promise<NoteSummary[]> {
  return request<NoteSummary[]>(`/canvases/${canvasId}/notes`);
}

export function fetchNote(id: string): Promise<Note> {
  return request<Note>(`/notes/${id}`);
}

export function createNote(canvasId: string, input: CreateNoteInput): Promise<Note> {
  return request<Note>(`/canvases/${canvasId}/notes`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateNote(id: string, input: UpdateNoteInput): Promise<Note> {
  return request<Note>(`/notes/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteNote(id: string): Promise<void> {
  return request<void>(`/notes/${id}`, { method: "DELETE" });
}

export async function searchNotes(query: string, canvasId: string): Promise<SearchResult[]> {
  const encoded = encodeURIComponent(query);
  const data = await request<{ results: SearchResult[] }>(
    `/canvases/${canvasId}/notes/search?q=${encoded}`,
  );
  return data.results;
}
