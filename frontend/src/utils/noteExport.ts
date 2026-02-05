import type { CanvasItem } from "shared";

/**
 * Resolve @{id} mentions in text to @title format using the cache.
 * Falls back to @id if the item is not in the cache.
 */
function resolveMentions(text: string, itemsCache: Map<string, CanvasItem>): string {
  return text.replace(/@\{([^}]+)\}/g, (_match, id: string) => {
    const item = itemsCache.get(id);
    return item ? `@${item.title}` : `@${id}`;
  });
}

/**
 * Format a single item as a text block with title, type, and content.
 */
function formatItemBlock(item: CanvasItem, itemsCache: Map<string, CanvasItem>): string {
  const resolvedContent = resolveMentions(item.content.notes, itemsCache);
  const lines = [`${item.title} [${item.type}]`];
  if (resolvedContent) {
    lines.push(resolvedContent);
  }
  return lines.join("\n");
}

/**
 * Format an item and its connections as readable plain text.
 * Resolves @{id} mentions in content to item titles.
 */
export function formatItemExport(item: CanvasItem, itemsCache: Map<string, CanvasItem>): string {
  const parts: string[] = [formatItemBlock(item, itemsCache)];

  // Collect connected item IDs, deduplicating
  const seen = new Set<string>();
  const connectedIds: string[] = [];

  for (const link of item.links_to) {
    if (!seen.has(link.id)) {
      seen.add(link.id);
      connectedIds.push(link.id);
    }
  }
  for (const link of item.linked_from) {
    if (!seen.has(link.id)) {
      seen.add(link.id);
      connectedIds.push(link.id);
    }
  }

  // Append connected items that exist in cache
  for (const id of connectedIds) {
    const connected = itemsCache.get(id);
    if (connected) {
      parts.push("---");
      parts.push(formatItemBlock(connected, itemsCache));
    }
  }

  return parts.join("\n");
}
