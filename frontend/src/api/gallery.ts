import type { PaginatedGallery } from "shared";
import { request } from "./http.js";

export function fetchGallery(
  canvasId: string,
  options: { cursor?: string; limit?: number; importantOnly?: boolean; parentItemId?: string } = {},
): Promise<PaginatedGallery> {
  const params = new URLSearchParams({ limit: String(options.limit ?? 30) });
  if (options.cursor) params.set("cursor", options.cursor);
  if (options.importantOnly) params.set("importantOnly", "true");
  if (options.parentItemId) params.set("parentItemId", options.parentItemId);
  return request<PaginatedGallery>(`/canvases/${canvasId}/gallery?${params}`);
}
