import type { CanvasItem } from "shared";

/**
 * Convert rich-text note content into an HTML preview string.
 * Strips HTML tags, truncates, escapes entities, then re-renders
 * mentions, links, bold, and italic as safe HTML.
 *
 * @param content     - raw note HTML content
 * @param itemsCache  - optional map of canvas item ID -> CanvasItem for mention resolution
 * @param maxLength   - truncation limit (0 = no truncation)
 */
export function getNotePreview(
  content: string,
  itemsCache?: Map<string, CanvasItem>,
  maxLength = 300,
): string {
  let text = content.replace(/<[^>]*>/g, "").trim();
  if (!text) return "Empty note";
  if (maxLength > 0 && text.length > maxLength) text = `${text.slice(0, maxLength)}...`;
  // Escape HTML entities
  text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // Render mentions as clickable spans
  if (itemsCache) {
    text = text.replace(/@\{([^}]+)\}/g, (_match, id) => {
      const cached = itemsCache.get(id);
      const name = cached ? cached.title : "mention";
      return `<span class="mention-link" data-item-id="${id}" style="cursor:pointer;color:var(--color-blue);font-weight:600">@${name}</span>`;
    });
  } else {
    text = text.replace(/@\{[^}]+\}/g, "<strong>@mention</strong>");
  }
  // Render links, bold, italic
  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--color-blue)">$1</a>',
  );
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return text;
}
