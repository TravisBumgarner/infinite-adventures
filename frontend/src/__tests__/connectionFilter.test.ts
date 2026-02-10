import type { CanvasItemLink, CanvasItemLinkWithSnippet, CanvasItemType } from "shared";
import { describe, expect, it } from "vitest";
import {
  buildConnectionEntries,
  type ConnectionEntry,
  filterConnections,
} from "../utils/connectionFilter";

function makeLink(id: string, title: string, type: CanvasItemType): CanvasItemLink {
  return { id, title, type };
}

function makeLinkWithSnippet(
  id: string,
  title: string,
  type: CanvasItemType,
): CanvasItemLinkWithSnippet {
  return { id, title, type, snippet: "" };
}

describe("buildConnectionEntries", () => {
  it("returns outgoing entries for linksTo", () => {
    const linksTo = [makeLink("a", "Alpha", "person")];
    const result = buildConnectionEntries(linksTo, []);
    expect(result).toHaveLength(1);
    expect(result[0].direction).toBe("outgoing");
    expect(result[0].link.id).toBe("a");
  });

  it("returns incoming entries for linkedFrom", () => {
    const linkedFrom = [makeLinkWithSnippet("b", "Beta", "person")];
    const result = buildConnectionEntries([], linkedFrom);
    expect(result).toHaveLength(1);
    expect(result[0].direction).toBe("incoming");
    expect(result[0].link.id).toBe("b");
  });

  it("combines both directions", () => {
    const linksTo = [makeLink("a", "Alpha", "person")];
    const linkedFrom = [makeLinkWithSnippet("b", "Beta", "person")];
    const result = buildConnectionEntries(linksTo, linkedFrom);
    expect(result).toHaveLength(2);
  });

  it("deduplicates items that appear in both directions", () => {
    const linksTo = [makeLink("a", "Alpha", "person")];
    const linkedFrom = [makeLinkWithSnippet("a", "Alpha", "person")];
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
    { link: makeLink("a", "Gandalf", "person"), direction: "outgoing" },
    { link: makeLink("b", "Shopkeeper", "place"), direction: "incoming" },
    { link: makeLink("c", "Find Ring", "event"), direction: "outgoing" },
    { link: makeLink("d", "Frodo", "person"), direction: "incoming" },
  ];

  it("returns all entries when no filters are active", () => {
    const result = filterConnections(entries, new Set(), "");
    expect(result).toHaveLength(4);
  });

  it("filters by type", () => {
    const result = filterConnections(entries, new Set<CanvasItemType>(["person"]), "");
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.link.id)).toEqual(["a", "d"]);
  });

  it("filters by search text case-insensitively", () => {
    const result = filterConnections(entries, new Set(), "gandalf");
    expect(result).toHaveLength(1);
    expect(result[0].link.id).toBe("a");
  });

  it("combines type and search filters", () => {
    const result = filterConnections(entries, new Set<CanvasItemType>(["person"]), "frodo");
    expect(result).toHaveLength(1);
    expect(result[0].link.id).toBe("d");
  });

  it("returns empty array when no entries match", () => {
    const result = filterConnections(entries, new Set<CanvasItemType>(["thing"]), "");
    expect(result).toHaveLength(0);
  });
});
