import type { Note } from "../types";

/**
 * Format a note and its connections as readable plain text.
 * Resolves @{id} mentions in content to note titles.
 */
export function formatNoteExport(
  note: Note,
  notesCache: Map<string, Note>
): string {
  return "";
}
