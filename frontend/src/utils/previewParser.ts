export type PreviewSegment =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  | { type: "italic"; text: string }
  | { type: "code"; text: string }
  | { type: "mention-clickable"; text: string; targetId: string }
  | { type: "mention-static"; text: string };

/**
 * Parse a content string into preview segments, handling:
 * - @{id} clickable mentions (resolved via mentionLabels)
 * - @[Title] and @Word static mentions
 * - **bold**, *italic*, `code` markdown
 * - Plain text
 *
 * Content is truncated to maxLength before parsing.
 */
export function parsePreviewContent(
  content: string,
  mentionLabels: Record<string, string>,
  maxLength = 80
): PreviewSegment[] {
  // Stub: return raw text only
  const preview = content.length > maxLength ? content.slice(0, maxLength) + "..." : content;
  return [{ type: "text", text: preview }];
}
