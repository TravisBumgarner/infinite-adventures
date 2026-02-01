import type { NoteLink, NoteType } from "../types";

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
  return [];
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
  return [];
}
