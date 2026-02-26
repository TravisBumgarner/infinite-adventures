import type { PaginatedTimeline, TimelineDayCounts } from "shared";
import { request } from "./http.js";

export function fetchTimeline(
  canvasId: string,
  sort: "createdAt" | "updatedAt" = "createdAt",
  cursor?: string,
  limit = 30,
): Promise<PaginatedTimeline> {
  const params = new URLSearchParams({ sort, limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  return request<PaginatedTimeline>(`/canvases/${canvasId}/timeline?${params}`);
}

export function fetchTimelineCounts(
  canvasId: string,
  start: string,
  end: string,
): Promise<TimelineDayCounts> {
  const params = new URLSearchParams({
    start,
    end,
    tzOffset: String(new Date().getTimezoneOffset()),
  });
  return request<TimelineDayCounts>(`/canvases/${canvasId}/timeline/counts?${params}`);
}
