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

export function createCanvas(_input: CreateCanvasInput): Promise<Canvas> {
  return request<Canvas>("/canvases");
}

export function updateCanvas(_id: string, _input: UpdateCanvasInput): Promise<Canvas> {
  return request<Canvas>("/canvases");
}

export function deleteCanvas(_id: string): Promise<void> {
  return request<void>("/canvases");
}

// --- Note functions ---

export function fetchNotes(_canvasId: string): Promise<NoteSummary[]> {
  return request<NoteSummary[]>("/notes");
}

export function fetchNote(id: string): Promise<Note> {
  return request<Note>(`/notes/${id}`);
}

export function createNote(_canvasId: string, _input: CreateNoteInput): Promise<Note> {
  return request<Note>("/notes");
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

export async function searchNotes(_query: string, _canvasId: string): Promise<SearchResult[]> {
  const data = await request<{ results: SearchResult[] }>("/notes/search");
  return data.results;
}
