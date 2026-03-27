import type { Edge, Node } from "@xyflow/react";
import type { CanvasItemType } from "shared";
import type { CanvasItemNodeData } from "../pages/Canvas/components/CanvasItemNode";

/**
 * Filter nodes by active types, search text, and tags.
 * - If activeTypes is empty, no type filtering is applied (all types shown).
 * - Search text matches against title and content (case-insensitive).
 * - If search is empty, no text filtering is applied.
 * - If activeTags is empty, no tag filtering is applied.
 * - Tag filtering uses OR logic: node matches if it has any of the active tags.
 */
export function filterNodes(
  nodes: Node<CanvasItemNodeData>[],
  activeTypes: Set<CanvasItemType>,
  search: string,
  activeTags: Set<string>,
): Node<CanvasItemNodeData>[] {
  const hasTypeFilter = activeTypes.size > 0;
  const searchLower = search.toLowerCase();
  const hasSearch = searchLower.length > 0;
  const hasTagFilter = activeTags.size > 0;

  return nodes.filter((node) => {
    if (hasTypeFilter && !activeTypes.has(node.data.type)) {
      return false;
    }
    if (hasSearch) {
      const titleMatch = node.data.title.toLowerCase().includes(searchLower);
      const contentMatch = node.data.content.toLowerCase().includes(searchLower);
      if (!titleMatch && !contentMatch) {
        return false;
      }
    }
    if (hasTagFilter) {
      const nodeTagIds = node.data.tagIds ?? [];
      if (!nodeTagIds.some((id) => activeTags.has(id))) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Filter edges to only include those where both source and target are in the visible node set.
 */
export function filterEdges(edges: Edge[], visibleNodeIds: Set<string>): Edge[] {
  return edges.filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target));
}
