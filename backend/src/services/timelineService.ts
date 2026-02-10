import type { TimelineEntry } from "shared";

export type TimelineSort = "created_at" | "updated_at";

export async function getTimeline(
  _canvasId: string,
  _sort: TimelineSort = "created_at",
): Promise<TimelineEntry[]> {
  return [];
}
