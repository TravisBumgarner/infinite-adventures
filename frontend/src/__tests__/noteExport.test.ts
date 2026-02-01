import { describe, it, expect } from "vitest";
import type { Note } from "shared";
import { formatNoteExport } from "../utils/noteExport";

function makeNote(overrides: Partial<Note> & { id: string; title: string }): Note {
  return {
    type: "npc",
    content: "",
    canvas_x: 0,
    canvas_y: 0,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    links_to: [],
    linked_from: [],
    ...overrides,
  };
}

describe("formatNoteExport", () => {
  it("includes the source note title and content", () => {
    const note = makeNote({ id: "1", title: "Gandalf", content: "A wizard" });
    const cache = new Map<string, Note>([["1", note]]);
    const result = formatNoteExport(note, cache);
    expect(result).toContain("Gandalf");
    expect(result).toContain("A wizard");
  });

  it("includes the source note type", () => {
    const note = makeNote({ id: "1", title: "Gandalf", type: "pc" });
    const cache = new Map<string, Note>([["1", note]]);
    const result = formatNoteExport(note, cache);
    expect(result.toUpperCase()).toContain("PC");
  });

  it("resolves @{id} mentions to titles in content", () => {
    const frodo = makeNote({ id: "2", title: "Frodo" });
    const note = makeNote({ id: "1", title: "Gandalf", content: "Met @{2} today" });
    const cache = new Map<string, Note>([
      ["1", note],
      ["2", frodo],
    ]);
    const result = formatNoteExport(note, cache);
    expect(result).toContain("Frodo");
    expect(result).not.toContain("@{2}");
  });

  it("falls back to id when mention is not in cache", () => {
    const note = makeNote({ id: "1", title: "Gandalf", content: "Met @{unknown-id}" });
    const cache = new Map<string, Note>([["1", note]]);
    const result = formatNoteExport(note, cache);
    expect(result).toContain("@unknown-id");
  });

  it("includes connected notes from links_to", () => {
    const frodo = makeNote({ id: "2", title: "Frodo", content: "A hobbit" });
    const note = makeNote({
      id: "1",
      title: "Gandalf",
      links_to: [{ id: "2", title: "Frodo", type: "pc" }],
    });
    const cache = new Map<string, Note>([
      ["1", note],
      ["2", frodo],
    ]);
    const result = formatNoteExport(note, cache);
    expect(result).toContain("Frodo");
    expect(result).toContain("A hobbit");
  });

  it("includes connected notes from linked_from", () => {
    const shire = makeNote({ id: "3", title: "The Shire", type: "location", content: "A peaceful place" });
    const note = makeNote({
      id: "1",
      title: "Gandalf",
      linked_from: [{ id: "3", title: "The Shire", type: "location" }],
    });
    const cache = new Map<string, Note>([
      ["1", note],
      ["3", shire],
    ]);
    const result = formatNoteExport(note, cache);
    expect(result).toContain("The Shire");
    expect(result).toContain("A peaceful place");
  });

  it("deduplicates notes that appear in both links_to and linked_from", () => {
    const frodo = makeNote({ id: "2", title: "Frodo", content: "A hobbit" });
    const note = makeNote({
      id: "1",
      title: "Gandalf",
      links_to: [{ id: "2", title: "Frodo", type: "pc" }],
      linked_from: [{ id: "2", title: "Frodo", type: "pc" }],
    });
    const cache = new Map<string, Note>([
      ["1", note],
      ["2", frodo],
    ]);
    const result = formatNoteExport(note, cache);
    // "Frodo" should appear as a connected note only once (plus possibly in the header)
    const sections = result.split("---");
    const connectedSections = sections.slice(1);
    const frodoSections = connectedSections.filter((s) => s.includes("Frodo"));
    expect(frodoSections).toHaveLength(1);
  });

  it("returns just the source note when there are no connections", () => {
    const note = makeNote({ id: "1", title: "Gandalf", content: "A wizard" });
    const cache = new Map<string, Note>([["1", note]]);
    const result = formatNoteExport(note, cache);
    expect(result).toContain("Gandalf");
    expect(result).toContain("A wizard");
    // No separator for connected notes
    expect(result).not.toContain("---");
  });

  it("skips connected notes not found in cache", () => {
    const note = makeNote({
      id: "1",
      title: "Gandalf",
      links_to: [{ id: "missing", title: "Ghost", type: "npc" }],
    });
    const cache = new Map<string, Note>([["1", note]]);
    const result = formatNoteExport(note, cache);
    expect(result).not.toContain("Ghost");
  });
});
