import type { Edge } from "@xyflow/react";
import type { CanvasItem } from "shared";

/**
 * Build deduplicated edges between canvas items with connection counts.
 * For each pair of nodes (A, B), emits only ONE edge regardless of direction,
 * with a count reflecting how many directed links exist (1 or 2).
 */
export function buildEdges(
  _items: CanvasItem[],
  _cache: Map<string, CanvasItem>,
): Edge[] {
  return [];
}
