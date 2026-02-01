import type { Note } from "../types";

/**
 * Serialize TipTap JSON document to plain text with @{id} mentions
 * and markdown syntax for bold, italic, bullet lists, and ordered lists.
 */
export function serializeToMentionText(
  json: Record<string, unknown>
): string {
  return "";
}

/**
 * Convert plain text with @{id} mentions and markdown formatting
 * into TipTap-compatible HTML.
 */
export function contentToHtml(
  content: string,
  notesCache: Map<string, Note>
): string {
  return "<p></p>";
}
