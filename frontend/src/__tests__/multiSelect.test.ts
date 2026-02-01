import type { Node } from "@xyflow/react";
import { describe, expect, it, vi } from "vitest";
import { batchDeleteNotes, getSelectedNodePositions } from "../utils/multiSelect";

function makeNode(id: string, x: number, y: number, selected: boolean): Node {
  return {
    id,
    position: { x, y },
    data: {},
    selected,
  } as Node;
}

describe("getSelectedNodePositions", () => {
  it("returns positions only for selected nodes", () => {
    const nodes = [
      makeNode("a", 10, 20, true),
      makeNode("b", 30, 40, false),
      makeNode("c", 50, 60, true),
    ];
    const result = getSelectedNodePositions(nodes);
    expect(result.size).toBe(2);
    expect(result.get("a")).toEqual({ x: 10, y: 20 });
    expect(result.get("c")).toEqual({ x: 50, y: 60 });
  });

  it("returns empty map when no nodes are selected", () => {
    const nodes = [makeNode("a", 10, 20, false)];
    const result = getSelectedNodePositions(nodes);
    expect(result.size).toBe(0);
  });

  it("returns empty map for empty nodes array", () => {
    const result = getSelectedNodePositions([]);
    expect(result.size).toBe(0);
  });
});

describe("batchDeleteNotes", () => {
  it("calls deleteFn for each note ID", async () => {
    const deleteFn = vi.fn().mockResolvedValue(undefined);
    await batchDeleteNotes(["a", "b", "c"], deleteFn);
    expect(deleteFn).toHaveBeenCalledTimes(3);
    expect(deleteFn).toHaveBeenCalledWith("a");
    expect(deleteFn).toHaveBeenCalledWith("b");
    expect(deleteFn).toHaveBeenCalledWith("c");
  });

  it("returns all IDs when all deletions succeed", async () => {
    const deleteFn = vi.fn().mockResolvedValue(undefined);
    const result = await batchDeleteNotes(["a", "b"], deleteFn);
    expect(result).toEqual(["a", "b"]);
  });

  it("returns only successfully deleted IDs when some fail", async () => {
    const deleteFn = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce(undefined);
    const result = await batchDeleteNotes(["a", "b", "c"], deleteFn);
    expect(result).toEqual(["a", "c"]);
  });

  it("returns empty array when given no IDs", async () => {
    const deleteFn = vi.fn();
    const result = await batchDeleteNotes([], deleteFn);
    expect(result).toEqual([]);
    expect(deleteFn).not.toHaveBeenCalled();
  });
});
