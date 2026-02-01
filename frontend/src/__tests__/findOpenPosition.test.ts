import { describe, it, expect } from "vitest";
import { findOpenPosition } from "../utils/findOpenPosition";
import type { NodePosition } from "../utils/findOpenPosition";

// Approximate node bounding box from the task description
const NODE_W = 200;
const NODE_H = 100;

function overlaps(a: { x: number; y: number }, b: NodePosition): boolean {
  return (
    Math.abs(a.x - b.x) < NODE_W &&
    Math.abs(a.y - b.y) < NODE_H
  );
}

describe("findOpenPosition", () => {
  it("returns the target position when there are no existing nodes", () => {
    const result = findOpenPosition(500, 300, []);
    expect(result).toEqual({ x: 500, y: 300 });
  });

  it("returns the target position when no nodes overlap", () => {
    const existing: NodePosition[] = [
      { x: 0, y: 0 },
      { x: 1000, y: 1000 },
    ];
    const result = findOpenPosition(500, 300, existing);
    expect(result).toEqual({ x: 500, y: 300 });
  });

  it("finds a non-overlapping position when target is occupied", () => {
    const existing: NodePosition[] = [{ x: 500, y: 300 }];
    const result = findOpenPosition(500, 300, existing);

    for (const node of existing) {
      expect(overlaps(result, node)).toBe(false);
    }
  });

  it("prefers positions close to the original target", () => {
    const existing: NodePosition[] = [{ x: 500, y: 300 }];
    const result = findOpenPosition(500, 300, existing);

    const distance = Math.sqrt(
      (result.x - 500) ** 2 + (result.y - 300) ** 2
    );
    // Should be within a reasonable range (a few node widths away)
    expect(distance).toBeLessThan(NODE_W * 3);
  });

  it("avoids multiple occupied positions", () => {
    const existing: NodePosition[] = [
      { x: 500, y: 300 },
      { x: 700, y: 300 },
      { x: 500, y: 400 },
    ];
    const result = findOpenPosition(500, 300, existing);

    for (const node of existing) {
      expect(overlaps(result, node)).toBe(false);
    }
  });

  it("handles a cluster of nodes and still finds open space", () => {
    // Create a 3x3 grid of nodes around the target
    const existing: NodePosition[] = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        existing.push({ x: 500 + dx * NODE_W, y: 300 + dy * NODE_H });
      }
    }
    const result = findOpenPosition(500, 300, existing);

    for (const node of existing) {
      expect(overlaps(result, node)).toBe(false);
    }
  });
});
