import type { CanvasItem, Note } from "shared";

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

  for (const link of item.linksTo) {
    if (!seen.has(link.id)) {
      seen.add(link.id);
      connectedIds.push(link.id);
    }
  }
  for (const link of item.linkedFrom) {
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

/**
 * Format an item with its notes and connections as a Markdown document.
 * Strips HTML tags from note content and resolves @{id} mentions.
 */
export function formatItemMarkdown(
  item: CanvasItem,
  notes: Note[],
  itemsCache: Map<string, CanvasItem>,
): string {
  const lines: string[] = [];

  lines.push(`# ${item.title}`);
  lines.push(`**Type:** ${item.type}`);
  lines.push("");

  lines.push("## Notes");
  if (notes.length === 0) {
    lines.push("No notes.");
  } else {
    for (const note of notes) {
      const stripped = note.content.replace(/<[^>]*>/g, "");
      const resolved = resolveMentions(stripped, itemsCache);
      lines.push(resolved);
      lines.push("");
    }
  }
  lines.push("");

  const connections = [
    ...(item.linksTo?.map((l) => ({ ...l, direction: "outgoing" as const })) ?? []),
    ...(item.linkedFrom?.map((l) => ({ ...l, direction: "incoming" as const })) ?? []),
  ];

  lines.push("## Connections");
  if (connections.length === 0) {
    lines.push("No connections.");
  } else {
    for (const c of connections) {
      const arrow = c.direction === "outgoing" ? "\u2192" : "\u2190";
      lines.push(`- ${arrow} **${c.title}** (${c.type})`);
    }
  }

  return lines.join("\n");
}

/**
 * Generate a printable HTML document for an item with notes, photos, and connections.
 * Opens in a new window and triggers the browser print dialog.
 */
export function printItemHtml(
  item: CanvasItem,
  notes: Note[],
  photos: { url: string; originalName: string }[],
  itemsCache: Map<string, CanvasItem>,
): void {
  const connections = [
    ...(item.linksTo?.map((l) => ({ ...l, direction: "outgoing" as const })) ?? []),
    ...(item.linkedFrom?.map((l) => ({ ...l, direction: "incoming" as const })) ?? []),
  ];

  const notesHtml =
    notes.length === 0
      ? '<p style="color: #888;">No notes</p>'
      : notes
          .map(
            (note) => `
      <div class="note">
        ${note.content.replace(/<[^>]*>/g, "").replace(/@\{([^}]+)\}/g, (_, id) => {
          const linked = itemsCache.get(id);
          return linked ? `@${linked.title}` : "@mention";
        })}
        <div class="note-date">Last edited: ${new Date(note.updatedAt).toLocaleDateString()}</div>
      </div>`,
          )
          .join("");

  const photosHtml =
    photos.length === 0
      ? '<p style="color: #888;">No photos</p>'
      : `<div class="photos">${photos.map((p) => `<img class="photo" src="${p.url}" alt="${p.originalName}" />`).join("")}</div>`;

  const connectionsHtml =
    connections.length === 0
      ? '<p style="color: #888;">No connections</p>'
      : connections
          .map(
            (c) => `
      <div class="connection">
        <span class="direction">${c.direction === "outgoing" ? "\u2192" : "\u2190"}</span>
        <strong>${c.title}</strong>
        <span style="color: #888; font-size: 12px; margin-left: 8px;">${c.type}</span>
      </div>`,
          )
          .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${item.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #333; }
    h1 { margin-bottom: 8px; }
    .type-badge { display: inline-block; background: #666; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 24px; }
    h2 { border-bottom: 2px solid #eee; padding-bottom: 8px; margin-top: 32px; }
    .note { background: #f5f5f5; padding: 16px; border-radius: 8px; margin-bottom: 16px; white-space: pre-wrap; }
    .note-date { font-size: 12px; color: #888; margin-top: 8px; }
    .photos { display: flex; flex-wrap: wrap; gap: 12px; }
    .photo { width: 200px; height: 200px; object-fit: cover; border-radius: 8px; }
    .connection { padding: 8px 0; border-bottom: 1px solid #eee; }
    .connection:last-child { border-bottom: none; }
    .direction { color: #888; font-size: 14px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>${item.title}</h1>
  <span class="type-badge">${item.type}</span>
  <h2>Notes (${notes.length})</h2>
  ${notesHtml}
  <h2>Photos (${photos.length})</h2>
  ${photosHtml}
  <h2>Connections (${connections.length})</h2>
  ${connectionsHtml}
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}
