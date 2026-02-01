import type { Node } from "@xyflow/react";

/**
 * Collect positions of all selected nodes (for batch-saving after drag).
 * Returns a map of nodeId → { x, y } for every selected node.
 */
export function getSelectedNodePositions(
  nodes: Node[]
): Map<string, { x: number; y: number }> {
  return new Map();
}

/**
 * Delete multiple notes via the provided delete function.
 * Returns the IDs that were successfully deleted.
 */
export async function batchDeleteNotes(
  noteIds: string[],
  deleteFn: (id: string) => Promise<void>
): Promise<string[]> {
  return [];
}
