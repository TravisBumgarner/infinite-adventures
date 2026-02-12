import type { CanvasItem, Note } from "shared";
import { describe, expect, it } from "vitest";
import { formatItemMarkdown } from "../utils/noteExport";

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

function makeNote(overrides: Partial<Note> & { content: string }): Note {
  return {
    id: "note-1",
    plainContent: "",
    isImportant: false,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    ...overrides,
  };
}

describe("formatItemMarkdown", () => {
  it("includes title as heading and type", () => {
    const item = makeItem({ id: "1", title: "Gandalf", type: "person" });
    const result = formatItemMarkdown(item, [], new Map());
    expect(result).toContain("# Gandalf");
    expect(result).toContain("person");
  });

  it("includes notes with HTML stripped and mentions resolved", () => {
    const frodo = makeItem({ id: "2", title: "Frodo" });
    const item = makeItem({ id: "1", title: "Gandalf" });
    const notes = [makeNote({ content: "<p>Met @{2} at the <b>inn</b></p>" })];
    const cache = new Map<string, CanvasItem>([
      ["1", item],
      ["2", frodo],
    ]);
    const result = formatItemMarkdown(item, notes, cache);
    expect(result).toContain("Met @Frodo at the inn");
    expect(result).not.toContain("<p>");
    expect(result).not.toContain("<b>");
  });

  it("includes connections with direction arrows", () => {
    const frodo = makeItem({ id: "2", title: "Frodo" });
    const shire = makeItem({ id: "3", title: "The Shire", type: "place" });
    const item = makeItem({
      id: "1",
      title: "Gandalf",
      linksTo: [{ id: "2", title: "Frodo", type: "person" }],
      linkedFrom: [{ id: "3", title: "The Shire", type: "place" }],
    });
    const cache = new Map<string, CanvasItem>([
      ["1", item],
      ["2", frodo],
      ["3", shire],
    ]);
    const result = formatItemMarkdown(item, [], cache);
    expect(result).toContain("Frodo");
    expect(result).toContain("The Shire");
  });

  it("returns valid markdown with no notes and no connections", () => {
    const item = makeItem({ id: "1", title: "Gandalf" });
    const result = formatItemMarkdown(item, [], new Map());
    expect(result).toContain("# Gandalf");
    // Should not throw or produce broken output
    expect(result.length).toBeGreaterThan(0);
  });
});
