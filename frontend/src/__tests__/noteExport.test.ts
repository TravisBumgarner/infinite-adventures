import type { CanvasItem } from "shared";
import { describe, expect, it } from "vitest";
import { formatItemExport } from "../utils/noteExport";

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
    ...overrides,
  };
}

describe("formatItemExport", () => {
  it("includes the source item title and content", () => {
    const item = makeItem({
      id: "1",
      title: "Gandalf",
      content: { id: "1", notes: "A wizard" },
    });
    const cache = new Map<string, CanvasItem>([["1", item]]);
    const result = formatItemExport(item, cache);
    expect(result).toContain("Gandalf");
    expect(result).toContain("A wizard");
  });

  it("includes the source item type", () => {
    const item = makeItem({ id: "1", title: "Gandalf", type: "person" });
    const cache = new Map<string, CanvasItem>([["1", item]]);
    const result = formatItemExport(item, cache);
    expect(result.toLowerCase()).toContain("person");
  });

  it("resolves @{id} mentions to titles in content", () => {
    const frodo = makeItem({ id: "2", title: "Frodo" });
    const item = makeItem({
      id: "1",
      title: "Gandalf",
      content: { id: "1", notes: "Met @{2} today" },
    });
    const cache = new Map<string, CanvasItem>([
      ["1", item],
      ["2", frodo],
    ]);
    const result = formatItemExport(item, cache);
    expect(result).toContain("Frodo");
    expect(result).not.toContain("@{2}");
  });

  it("falls back to id when mention is not in cache", () => {
    const item = makeItem({
      id: "1",
      title: "Gandalf",
      content: { id: "1", notes: "Met @{unknown-id}" },
    });
    const cache = new Map<string, CanvasItem>([["1", item]]);
    const result = formatItemExport(item, cache);
    expect(result).toContain("@unknown-id");
  });

  it("includes connected items from linksTo", () => {
    const frodo = makeItem({
      id: "2",
      title: "Frodo",
      content: { id: "2", notes: "A hobbit" },
    });
    const item = makeItem({
      id: "1",
      title: "Gandalf",
      linksTo: [{ id: "2", title: "Frodo", type: "person" }],
    });
    const cache = new Map<string, CanvasItem>([
      ["1", item],
      ["2", frodo],
    ]);
    const result = formatItemExport(item, cache);
    expect(result).toContain("Frodo");
    expect(result).toContain("A hobbit");
  });

  it("includes connected items from linkedFrom", () => {
    const shire = makeItem({
      id: "3",
      title: "The Shire",
      type: "place",
      content: { id: "3", notes: "A peaceful place" },
    });
    const item = makeItem({
      id: "1",
      title: "Gandalf",
      linkedFrom: [{ id: "3", title: "The Shire", type: "place" }],
    });
    const cache = new Map<string, CanvasItem>([
      ["1", item],
      ["3", shire],
    ]);
    const result = formatItemExport(item, cache);
    expect(result).toContain("The Shire");
    expect(result).toContain("A peaceful place");
  });

  it("deduplicates items that appear in both linksTo and linkedFrom", () => {
    const frodo = makeItem({
      id: "2",
      title: "Frodo",
      content: { id: "2", notes: "A hobbit" },
    });
    const item = makeItem({
      id: "1",
      title: "Gandalf",
      linksTo: [{ id: "2", title: "Frodo", type: "person" }],
      linkedFrom: [{ id: "2", title: "Frodo", type: "person" }],
    });
    const cache = new Map<string, CanvasItem>([
      ["1", item],
      ["2", frodo],
    ]);
    const result = formatItemExport(item, cache);
    // "Frodo" should appear as a connected item only once (plus possibly in the header)
    const sections = result.split("---");
    const connectedSections = sections.slice(1);
    const frodoSections = connectedSections.filter((s) => s.includes("Frodo"));
    expect(frodoSections).toHaveLength(1);
  });

  it("returns just the source item when there are no connections", () => {
    const item = makeItem({
      id: "1",
      title: "Gandalf",
      content: { id: "1", notes: "A wizard" },
    });
    const cache = new Map<string, CanvasItem>([["1", item]]);
    const result = formatItemExport(item, cache);
    expect(result).toContain("Gandalf");
    expect(result).toContain("A wizard");
    // No separator for connected items
    expect(result).not.toContain("---");
  });

  it("skips connected items not found in cache", () => {
    const item = makeItem({
      id: "1",
      title: "Gandalf",
      linksTo: [{ id: "missing", title: "Ghost", type: "person" }],
    });
    const cache = new Map<string, CanvasItem>([["1", item]]);
    const result = formatItemExport(item, cache);
    expect(result).not.toContain("Ghost");
  });
});
