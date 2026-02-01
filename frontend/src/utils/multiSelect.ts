import type { Node } from "@xyflow/react";

/**
 * Collect positions of all selected nodes (for batch-saving after drag).
 * Returns a map of nodeId → { x, y } for every selected node.
 */
export function getSelectedNodePositions(
  nodes: Node[]
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  for (const node of nodes) {
    if (node.selected) {
      positions.set(node.id, { x: node.position.x, y: node.position.y });
    }
  }
  return positions;
}

/**
 * Delete multiple notes via the provided delete function.
 * Returns the IDs that were successfully deleted.
 */
export async function batchDeleteNotes(
  noteIds: string[],
  deleteFn: (id: string) => Promise<void>
): Promise<string[]> {
  const results = await Promise.allSettled(
    noteIds.map((id) => deleteFn(id).then(() => id))
  );
  return results
    .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
    .map((r) => r.value);
}
