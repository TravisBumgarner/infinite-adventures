import type { Node, Edge } from "@xyflow/react";
import type { NoteNodeData } from "../components/NoteNode";
import type { NoteType } from "shared";

/**
 * Filter nodes by active types and search text.
 * - If activeTypes is empty, no type filtering is applied (all types shown).
 * - Search text matches against title and content (case-insensitive).
 * - If search is empty, no text filtering is applied.
 */
export function filterNodes(
  nodes: Node<NoteNodeData>[],
  activeTypes: Set<NoteType>,
  search: string
): Node<NoteNodeData>[] {
  const hasTypeFilter = activeTypes.size > 0;
  const searchLower = search.toLowerCase();
  const hasSearch = searchLower.length > 0;

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
    return true;
  });
}

/**
 * Filter edges to only include those where both source and target are in the visible node set.
 */
export function filterEdges(
  edges: Edge[],
  visibleNodeIds: Set<string>
): Edge[] {
  return edges.filter(
    (edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
  );
}
