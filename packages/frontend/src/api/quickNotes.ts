import type { ContentHistoryEntry, QuickNote } from "shared";
import { request } from "./http.js";

export function fetchQuickNotes(canvasId: string): Promise<QuickNote[]> {
  return request<QuickNote[]>(`/canvases/${canvasId}/quick-notes`);
}

export function createQuickNote(canvasId: string, content?: string): Promise<QuickNote> {
  return request<QuickNote>(`/canvases/${canvasId}/quick-notes`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export function updateQuickNote(
  canvasId: string,
  id: string,
  content: string,
  snapshot?: boolean,
  title?: string,
): Promise<QuickNote> {
  return request<QuickNote>(`/canvases/${canvasId}/quick-notes/${id}`, {
    method: "PUT",
    body: JSON.stringify({ content, snapshot, title }),
  });
}

export function deleteQuickNote(canvasId: string, id: string): Promise<void> {
  return request<void>(`/canvases/${canvasId}/quick-notes/${id}`, {
    method: "DELETE",
  });
}

export function toggleQuickNoteImportant(canvasId: string, id: string): Promise<QuickNote> {
  return request<QuickNote>(`/canvases/${canvasId}/quick-notes/${id}/toggle-important`, {
    method: "PATCH",
  });
}

export function fetchQuickNoteHistory(
  canvasId: string,
  id: string,
): Promise<ContentHistoryEntry[]> {
  return request<ContentHistoryEntry[]>(`/canvases/${canvasId}/quick-notes/${id}/history`);
}
