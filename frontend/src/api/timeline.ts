import type { PaginatedTimeline, TimelineDayCounts } from "shared";
import { request } from "./http.js";

export function fetchTimeline(
  canvasId: string,
  sort: "createdAt" | "updatedAt" = "createdAt",
  cursor?: string,
  limit = 30,
  parentItemId?: string,
): Promise<PaginatedTimeline> {
  const params = new URLSearchParams({ sort, limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  if (parentItemId) params.set("parentItemId", parentItemId);
  return request<PaginatedTimeline>(`/canvases/${canvasId}/timeline?${params}`);
}

export function fetchTimelineCounts(
  canvasId: string,
  start: string,
  end: string,
  parentItemId?: string,
): Promise<TimelineDayCounts> {
  const params = new URLSearchParams({
    start,
    end,
    tzOffset: String(new Date().getTimezoneOffset()),
  });
  if (parentItemId) params.set("parentItemId", parentItemId);
  return request<TimelineDayCounts>(`/canvases/${canvasId}/timeline/counts?${params}`);
}
