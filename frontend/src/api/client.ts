import type { Note, NoteSummary, CreateNoteInput, UpdateNoteInput } from "../types";

const API_BASE = "http://localhost:3001/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
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
