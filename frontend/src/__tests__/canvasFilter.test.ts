import type { Edge, Node } from "@xyflow/react";
import type { NoteType } from "shared";
import { describe, expect, it } from "vitest";
import type { NoteNodeData } from "../components/NoteNode";
import { filterEdges, filterNodes } from "../utils/canvasFilter";

function makeNode(id: string, type: NoteType, title: string, content: string): Node<NoteNodeData> {
  return {
    id,
    position: { x: 0, y: 0 },
    type: "note",
    data: {
      noteId: id,
      type,
      title,
      content,
      mentionLabels: {},
      onMentionClick: () => {},
    },
  };
}

const nodes = [
  makeNode("1", "pc", "Gandalf", "A wise wizard"),
  makeNode("2", "npc", "Shopkeeper", "Sells potions"),
  makeNode("3", "quest", "Find the Ring", "Search the shire"),
  makeNode("4", "pc", "Frodo", "Ring bearer"),
];

describe("filterNodes", () => {
  it("returns all nodes when no filters are active", () => {
    const result = filterNodes(nodes, new Set(), "");
    expect(result).toHaveLength(4);
  });

  it("filters by type", () => {
    const result = filterNodes(nodes, new Set<NoteType>(["pc"]), "");
    expect(result).toHaveLength(2);
    expect(result.map((n) => n.id)).toEqual(["1", "4"]);
  });

  it("filters by multiple types", () => {
    const result = filterNodes(nodes, new Set<NoteType>(["pc", "quest"]), "");
    expect(result).toHaveLength(3);
  });

  it("filters by search text case-insensitively", () => {
    const result = filterNodes(nodes, new Set(), "gandalf");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("matches search against content", () => {
    const result = filterNodes(nodes, new Set(), "potions");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("combines type and search filters", () => {
    const result = filterNodes(nodes, new Set<NoteType>(["pc"]), "ring");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("4");
  });

  it("returns empty array when no nodes match", () => {
    const result = filterNodes(nodes, new Set<NoteType>(["item"]), "");
    expect(result).toHaveLength(0);
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
