import type { Note } from "../types";

/**
 * Resolve @{id} mentions in text to @title format using the cache.
 * Falls back to @id if the note is not in the cache.
 */
function resolveMentions(text: string, notesCache: Map<string, Note>): string {
  return text.replace(/@\{([^}]+)\}/g, (_match, id: string) => {
    const note = notesCache.get(id);
    return note ? `@${note.title}` : `@${id}`;
  });
}

/**
 * Format a single note as a text block with title, type, and content.
 */
function formatNoteBlock(note: Note, notesCache: Map<string, Note>): string {
  const resolvedContent = resolveMentions(note.content, notesCache);
  const lines = [`${note.title} [${note.type}]`];
  if (resolvedContent) {
    lines.push(resolvedContent);
  }
  return lines.join("\n");
}

/**
 * Format a note and its connections as readable plain text.
 * Resolves @{id} mentions in content to note titles.
 */
export function formatNoteExport(
  note: Note,
  notesCache: Map<string, Note>
): string {
  const parts: string[] = [formatNoteBlock(note, notesCache)];

  // Collect connected note IDs, deduplicating
  const seen = new Set<string>();
  const connectedIds: string[] = [];

  for (const link of note.links_to) {
    if (!seen.has(link.id)) {
      seen.add(link.id);
      connectedIds.push(link.id);
    }
  }
  for (const link of note.linked_from) {
    if (!seen.has(link.id)) {
      seen.add(link.id);
      connectedIds.push(link.id);
    }
  }

  // Append connected notes that exist in cache
  for (const id of connectedIds) {
    const connected = notesCache.get(id);
    if (connected) {
      parts.push("---");
      parts.push(formatNoteBlock(connected, notesCache));
    }
  }

  return parts.join("\n");
}
