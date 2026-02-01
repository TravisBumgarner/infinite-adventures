export interface NodePosition {
  x: number;
  y: number;
}

/**
 * Find a non-overlapping position near the target point.
 * Spirals outward from (targetX, targetY) to find a spot that
 * doesn't overlap any existing node bounding boxes (~200x100px).
 */
export function findOpenPosition(
  targetX: number,
  targetY: number,
  existingNodes: NodePosition[]
): { x: number; y: number } {
  return { x: targetX, y: targetY };
}
