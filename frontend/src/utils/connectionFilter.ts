import type { NoteLink, NoteType } from "shared";

export interface ConnectionEntry {
  link: NoteLink;
  direction: "outgoing" | "incoming";
}

/**
 * Build a combined list of connections from a note's links_to and linked_from.
 * Deduplicates entries that appear in both directions.
 */
export function buildConnectionEntries(
  linksTo: NoteLink[],
  linkedFrom: NoteLink[]
): ConnectionEntry[] {
  const seen = new Set<string>();
  const entries: ConnectionEntry[] = [];

  for (const link of linksTo) {
    seen.add(link.id);
    entries.push({ link, direction: "outgoing" });
  }

  for (const link of linkedFrom) {
    if (!seen.has(link.id)) {
      entries.push({ link, direction: "incoming" });
    }
  }

  return entries;
}

/**
 * Filter connection entries by active types and search text.
 * - If activeTypes is empty, no type filtering is applied.
 * - Search text matches against title (case-insensitive).
 */
export function filterConnections(
  entries: ConnectionEntry[],
  activeTypes: Set<NoteType>,
  search: string
): ConnectionEntry[] {
  const lowerSearch = search.toLowerCase();
  return entries.filter((entry) => {
    if (activeTypes.size > 0 && !activeTypes.has(entry.link.type)) {
      return false;
    }
    if (lowerSearch && !entry.link.title.toLowerCase().includes(lowerSearch)) {
      return false;
    }
    return true;
  });
}
