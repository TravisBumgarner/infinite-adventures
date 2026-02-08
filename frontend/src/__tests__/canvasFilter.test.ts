import type { Edge, Node } from "@xyflow/react";
import type { CanvasItemType } from "shared";
import { describe, expect, it } from "vitest";
import type { CanvasItemNodeData } from "../pages/Canvas/components/CanvasItemNode";
import { filterEdges, filterNodes } from "../utils/canvasFilter";

function makeNode(
  id: string,
  type: CanvasItemType,
  title: string,
  content: string,
  tagIds: string[] = [],
): Node<CanvasItemNodeData> {
  return {
    id,
    position: { x: 0, y: 0 },
    type: "canvasItem",
    data: {
      itemId: id,
      type,
      title,
      content,
      mentionLabels: {},
      onMentionClick: () => {},
      tagIds,
    },
  };
}

const nodes = [
  makeNode("1", "person", "Gandalf", "A wise wizard", ["tag-a"]),
  makeNode("2", "person", "Shopkeeper", "Sells potions", ["tag-b"]),
  makeNode("3", "event", "Find the Ring", "Search the shire", ["tag-a", "tag-b"]),
  makeNode("4", "person", "Frodo", "Ring bearer"),
];

describe("filterNodes", () => {
  it("returns all nodes when no filters are active", () => {
    const result = filterNodes(nodes, new Set(), "", new Set());
    expect(result).toHaveLength(4);
  });

  it("filters by type", () => {
    const result = filterNodes(nodes, new Set<CanvasItemType>(["person"]), "", new Set());
    expect(result).toHaveLength(3);
    expect(result.map((n) => n.id)).toEqual(["1", "2", "4"]);
  });

  it("filters by multiple types", () => {
    const result = filterNodes(nodes, new Set<CanvasItemType>(["person", "event"]), "", new Set());
    expect(result).toHaveLength(4);
  });

  it("filters by search text case-insensitively", () => {
    const result = filterNodes(nodes, new Set(), "gandalf", new Set());
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("matches search against content", () => {
    const result = filterNodes(nodes, new Set(), "potions", new Set());
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("combines type and search filters", () => {
    const result = filterNodes(nodes, new Set<CanvasItemType>(["person"]), "ring", new Set());
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("4");
  });

  it("returns empty array when no nodes match", () => {
    const result = filterNodes(nodes, new Set<CanvasItemType>(["thing"]), "", new Set());
    expect(result).toHaveLength(0);
  });

  it("filters by a single tag using OR logic", () => {
    const result = filterNodes(nodes, new Set(), "", new Set(["tag-a"]));
    expect(result.map((n) => n.id)).toEqual(["1", "3"]);
  });

  it("filters by multiple tags using OR logic", () => {
    const result = filterNodes(nodes, new Set(), "", new Set(["tag-a", "tag-b"]));
    expect(result.map((n) => n.id)).toEqual(["1", "2", "3"]);
  });

  it("combines tag filter with type and search filters", () => {
    const result = filterNodes(nodes, new Set<CanvasItemType>(["person"]), "", new Set(["tag-a"]));
    expect(result.map((n) => n.id)).toEqual(["1"]);
  });
});

describe("filterEdges", () => {
  const edges: Edge[] = [
    { id: "e1", source: "1", target: "2" },
    { id: "e2", source: "2", target: "3" },
    { id: "e3", source: "3", target: "4" },
  ];

  it("keeps edges where both endpoints are visible", () => {
    const visible = new Set(["1", "2", "3", "4"]);
    const result = filterEdges(edges, visible);
    expect(result).toHaveLength(3);
  });

  it("removes edges where source is hidden", () => {
    const visible = new Set(["2", "3", "4"]);
    const result = filterEdges(edges, visible);
    expect(result.map((e) => e.id)).toEqual(["e2", "e3"]);
  });

  it("removes edges where target is hidden", () => {
    const visible = new Set(["1", "3", "4"]);
    const result = filterEdges(edges, visible);
    expect(result.map((e) => e.id)).toEqual(["e3"]);
  });

  it("returns empty array when no nodes are visible", () => {
    const result = filterEdges(edges, new Set());
    expect(result).toHaveLength(0);
  });
});
