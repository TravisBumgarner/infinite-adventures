export type PreviewSegment =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  | { type: "italic"; text: string }
  | { type: "code"; text: string }
  | { type: "mention-clickable"; text: string; targetId: string }
  | { type: "mention-static"; text: string };

// Combined regex matching all token types in priority order:
// 1. @{id} clickable mentions
// 2. @[Multi Word] static mentions
// 3. @SingleWord static mentions
// 4. `inline code`
// 5. **bold**
// 6. *italic* (but not **)
const TOKEN_REGEX = /@\{([^}]+)\}|@\[[^\]]+\]|@[\w-]+|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*/g;

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
  maxLength = 80,
): PreviewSegment[] {
  if (!content) return [];

  const preview = content.length > maxLength ? `${content.slice(0, maxLength)}...` : content;
  const segments: PreviewSegment[] = [];
  let lastIndex = 0;
  // Reset regex state
  TOKEN_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null = TOKEN_REGEX.exec(preview);
  while (match !== null) {
    // Add plain text before this match
    if (match.index > lastIndex) {
      segments.push({ type: "text", text: preview.slice(lastIndex, match.index) });
    }

    const fullMatch = match[0];

    if (fullMatch.startsWith("@{")) {
      // Clickable mention: @{id}
      const targetId = match[1]!;
      const label = mentionLabels[targetId] || targetId;
      segments.push({ type: "mention-clickable", text: label, targetId });
    } else if (fullMatch.startsWith("@")) {
      // Static mention: @[Title] or @Word
      segments.push({ type: "mention-static", text: fullMatch });
    } else if (fullMatch.startsWith("`")) {
      // Inline code
      segments.push({ type: "code", text: match[2]! });
    } else if (fullMatch.startsWith("**")) {
      // Bold
      segments.push({ type: "bold", text: match[3]! });
    } else if (fullMatch.startsWith("*")) {
      // Italic
      segments.push({ type: "italic", text: match[4]! });
    }

    lastIndex = match.index + fullMatch.length;
    match = TOKEN_REGEX.exec(preview);
  }

  // Add remaining plain text
  if (lastIndex < preview.length) {
    segments.push({ type: "text", text: preview.slice(lastIndex) });
  }

  return segments;
}
