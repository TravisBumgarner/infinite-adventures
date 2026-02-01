import type { NoteLink, NoteType } from "shared";
import { describe, expect, it } from "vitest";
import {
  buildConnectionEntries,
  type ConnectionEntry,
  filterConnections,
} from "../utils/connectionFilter";

function makeLink(id: string, title: string, type: NoteType): NoteLink {
  return { id, title, type };
}

describe("buildConnectionEntries", () => {
  it("returns outgoing entries for links_to", () => {
    const linksTo = [makeLink("a", "Alpha", "pc")];
    const result = buildConnectionEntries(linksTo, []);
    expect(result).toHaveLength(1);
    expect(result[0].direction).toBe("outgoing");
    expect(result[0].link.id).toBe("a");
  });

  it("returns incoming entries for linked_from", () => {
    const linkedFrom = [makeLink("b", "Beta", "npc")];
    const result = buildConnectionEntries([], linkedFrom);
    expect(result).toHaveLength(1);
    expect(result[0].direction).toBe("incoming");
    expect(result[0].link.id).toBe("b");
  });

  it("combines both directions", () => {
    const linksTo = [makeLink("a", "Alpha", "pc")];
    const linkedFrom = [makeLink("b", "Beta", "npc")];
    const result = buildConnectionEntries(linksTo, linkedFrom);
    expect(result).toHaveLength(2);
  });

  it("deduplicates notes that appear in both directions", () => {
    const linksTo = [makeLink("a", "Alpha", "pc")];
    const linkedFrom = [makeLink("a", "Alpha", "pc")];
    const result = buildConnectionEntries(linksTo, linkedFrom);
    expect(result).toHaveLength(1);
    expect(result[0].direction).toBe("outgoing");
  });

  it("returns empty array when no connections exist", () => {
    const result = buildConnectionEntries([], []);
    expect(result).toHaveLength(0);
  });
});

describe("filterConnections", () => {
  const entries: ConnectionEntry[] = [
    { link: makeLink("a", "Gandalf", "pc"), direction: "outgoing" },
    { link: makeLink("b", "Shopkeeper", "npc"), direction: "incoming" },
    { link: makeLink("c", "Find Ring", "quest"), direction: "outgoing" },
    { link: makeLink("d", "Frodo", "pc"), direction: "incoming" },
  ];

  it("returns all entries when no filters are active", () => {
    const result = filterConnections(entries, new Set(), "");
    expect(result).toHaveLength(4);
  });

  it("filters by type", () => {
    const result = filterConnections(entries, new Set<NoteType>(["pc"]), "");
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.link.id)).toEqual(["a", "d"]);
  });

  it("filters by search text case-insensitively", () => {
    const result = filterConnections(entries, new Set(), "gandalf");
    expect(result).toHaveLength(1);
    expect(result[0].link.id).toBe("a");
  });

  it("combines type and search filters", () => {
    const result = filterConnections(entries, new Set<NoteType>(["pc"]), "frodo");
    expect(result).toHaveLength(1);
    expect(result[0].link.id).toBe("d");
  });

  it("returns empty array when no entries match", () => {
    const result = filterConnections(entries, new Set<NoteType>(["item"]), "");
    expect(result).toHaveLength(0);
  });
});
