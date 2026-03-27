import sanitizeHtml from "sanitize-html";

/**
 * Strip all HTML tags from rich-text note content and resolve @{id} mentions
 * to their display names, returning plain readable text for full-text search.
 *
 * @param html        - raw HTML note content
 * @param mentionNames - map of mention ID -> display name
 */
export function stripHtml(html: string, mentionNames?: Map<string, string>): string {
  // Remove HTML tags via sanitize-html (returns plain text)
  let text = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} });
  // Replace @{uuid} mentions with resolved names (or strip if unknown)
  text = text.replace(/@\{([^}]+)\}/g, (_match, id) => {
    return mentionNames?.get(id) ?? " ";
  });
  // Collapse whitespace
  text = text.replace(/\s+/g, " ").trim();
  return text;
}
