import type {
  CanvasItem,
  CanvasItemSearchResult,
  CanvasItemSummary,
  CreateCanvasItemInput,
  UpdateCanvasItemInput,
} from "shared";
import { request } from "./http.js";

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
