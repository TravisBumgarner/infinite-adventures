import type { Edge } from "@xyflow/react";
import type { CanvasItem } from "shared";

/**
 * Build deduplicated edges between canvas items with connection counts.
 * For each pair of nodes (A, B), emits only ONE edge regardless of direction,
 * with a count reflecting how many directed links exist (1 or 2).
 */
export function buildEdges(items: CanvasItem[], _cache: Map<string, CanvasItem>): Edge[] {
  const pairCounts = new Map<string, { source: string; target: string; count: number }>();

  for (const item of items) {
    if (!item.linksTo) continue;
    for (const link of item.linksTo) {
      const key = [item.id, link.id].sort().join("<->");
      const existing = pairCounts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        pairCounts.set(key, { source: item.id, target: link.id, count: 1 });
      }
    }
  }

  const edges: Edge[] = [];
  for (const [, { source, target, count }] of pairCounts) {
    edges.push({
      id: `${source}<->${target}`,
      source,
      target,
      type: "count",
      style: { stroke: "var(--color-surface2)", strokeWidth: 1.5 },
      data: { count },
    });
  }

  return edges;
}
