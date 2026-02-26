import type { ContentHistoryEntry, CreateNoteInput, Note, UpdateNoteInput } from "shared";
import { request } from "./http.js";

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

export function fetchNoteHistory(noteId: string): Promise<ContentHistoryEntry[]> {
  return request<ContentHistoryEntry[]>(`/notes/${noteId}/history`);
}
