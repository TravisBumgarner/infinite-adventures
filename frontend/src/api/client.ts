import type { CreateNoteInput, Note, NoteSummary, SearchResult, UpdateNoteInput } from "shared";
import config from "../config.js";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  errorCode?: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${config.apiBaseUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body: ApiResponse<T> = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.errorCode || `HTTP ${res.status}`);
  }
  return body.data as T;
}

export function fetchNotes(): Promise<NoteSummary[]> {
  return request<NoteSummary[]>("/notes");
}

export function fetchNote(id: string): Promise<Note> {
  return request<Note>(`/notes/${id}`);
}

export function createNote(input: CreateNoteInput): Promise<Note> {
  return request<Note>("/notes", {
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

export async function searchNotes(query: string): Promise<SearchResult[]> {
  const data = await request<{ results: SearchResult[] }>(
    `/notes/search?q=${encodeURIComponent(query)}`,
  );
  return data.results;
}
