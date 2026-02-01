export interface NodePosition {
  x: number;
  y: number;
}

const NODE_W = 200;
const NODE_H = 100;

function hasOverlap(
  x: number,
  y: number,
  existingNodes: NodePosition[]
): boolean {
  return existingNodes.some(
    (node) => Math.abs(x - node.x) < NODE_W && Math.abs(y - node.y) < NODE_H
  );
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
  if (!hasOverlap(targetX, targetY, existingNodes)) {
    return { x: targetX, y: targetY };
  }

  // Spiral outward in rings, checking positions at each ring distance
  for (let ring = 1; ring <= 20; ring++) {
    for (let dx = -ring; dx <= ring; dx++) {
      for (let dy = -ring; dy <= ring; dy++) {
        // Only check positions on the current ring's perimeter
        if (Math.abs(dx) !== ring && Math.abs(dy) !== ring) continue;

        const x = targetX + dx * NODE_W;
        const y = targetY + dy * NODE_H;

        if (!hasOverlap(x, y, existingNodes)) {
          return { x, y };
        }
      }
    }
  }

  // Fallback: offset far enough that it won't overlap
  return { x: targetX + 21 * NODE_W, y: targetY };
}
