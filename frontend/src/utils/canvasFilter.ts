import type { Node, Edge } from "@xyflow/react";
import type { NoteNodeData } from "../components/NoteNode";
import type { NoteType } from "../types";

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
  return [];
}

/**
 * Filter edges to only include those where both source and target are in the visible node set.
 */
export function filterEdges(
  edges: Edge[],
  visibleNodeIds: Set<string>
): Edge[] {
  return [];
}
