import type { SessionSummary, TaggedItem } from "shared";
import { request } from "./http.js";

export function fetchSessions(canvasId: string): Promise<SessionSummary[]> {
  return request<SessionSummary[]>(`/canvases/${canvasId}/sessions`);
}

export function fetchTaggedItems(itemId: string): Promise<TaggedItem[]> {
  return request<TaggedItem[]>(`/items/${itemId}/tagged`);
}
