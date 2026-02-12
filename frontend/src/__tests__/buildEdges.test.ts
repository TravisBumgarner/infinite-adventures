import type { CanvasItem } from "shared";
import { describe, expect, it } from "vitest";
import { buildEdges } from "../utils/buildEdges";

function makeItem(overrides: Partial<CanvasItem> & { id: string; title: string }): CanvasItem {
  return {
    type: "person",
    content: { id: overrides.id, notes: "" },
    photos: [],
    canvasX: 0,
    canvasY: 0,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    linksTo: [],
    linkedFrom: [],
    notes: [],
    tags: [],
    ...overrides,
  };
}

describe("buildEdges", () => {
  it("creates one edge for a unidirectional link with count 1", () => {
    const a = makeItem({
      id: "a",
      title: "A",
      linksTo: [{ id: "b", title: "B", type: "person" }],
    });
    const b = makeItem({ id: "b", title: "B" });
    const cache = new Map([
      ["a", a],
      ["b", b],
    ]);

    const edges = buildEdges([a, b], cache);
    expect(edges).toHaveLength(1);
    expect(edges[0]!.data?.count).toBe(1);
  });

  it("deduplicates bidirectional links into one edge with count 2", () => {
    const a = makeItem({
      id: "a",
      title: "A",
      linksTo: [{ id: "b", title: "B", type: "person" }],
    });
    const b = makeItem({
      id: "b",
      title: "B",
      linksTo: [{ id: "a", title: "A", type: "person" }],
    });
    const cache = new Map([
      ["a", a],
      ["b", b],
    ]);

    const edges = buildEdges([a, b], cache);
    expect(edges).toHaveLength(1);
    expect(edges[0]!.data?.count).toBe(2);
  });

  it("returns no edges when there are no links", () => {
    const a = makeItem({ id: "a", title: "A" });
    const b = makeItem({ id: "b", title: "B" });
    const cache = new Map([
      ["a", a],
      ["b", b],
    ]);

    const edges = buildEdges([a, b], cache);
    expect(edges).toHaveLength(0);
  });
});
