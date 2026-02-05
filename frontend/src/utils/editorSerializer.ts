import type { CanvasItem } from "shared";

interface TipTapNode {
  type: string;
  content?: TipTapNode[];
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string }>;
}

/**
 * Serialize inline content nodes within a paragraph to plain text
 * with markdown syntax for bold/italic and @{id} for mentions.
 */
function serializeInline(nodes: TipTapNode[]): string {
  let result = "";
  for (const node of nodes) {
    if (node.type === "mention") {
      const id = node.attrs?.id as string;
      result += `@{${id}}`;
    } else if (node.type === "text") {
      const text = node.text ?? "";
      const hasBold = node.marks?.some((m) => m.type === "bold");
      const hasItalic = node.marks?.some((m) => m.type === "italic");
      if (hasBold) {
        result += `**${text}**`;
      } else if (hasItalic) {
        result += `*${text}*`;
      } else {
        result += text;
      }
    }
  }
  return result;
}

/**
 * Serialize TipTap JSON document to plain text with @{id} mentions
 * and markdown syntax for bold, italic, bullet lists, and ordered lists.
 */
export function serializeToMentionText(json: Record<string, unknown>): string {
  const doc = json as TipTapNode;
  if (!doc.content) return "";

  const lines: string[] = [];

  for (const block of doc.content) {
    if (block.type === "paragraph") {
      if (!block.content) {
        lines.push("");
      } else {
        lines.push(serializeInline(block.content));
      }
    } else if (block.type === "bulletList") {
      if (block.content) {
        for (const listItem of block.content) {
          const para = listItem.content?.[0];
          const text = para?.content ? serializeInline(para.content) : "";
          lines.push(`- ${text}`);
        }
      }
    } else if (block.type === "orderedList") {
      if (block.content) {
        block.content.forEach((listItem, i) => {
          const para = listItem.content?.[0];
          const text = para?.content ? serializeInline(para.content) : "";
          lines.push(`${i + 1}. ${text}`);
        });
      }
    }
  }

  return lines.join("\n");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(text: string): string {
  return text.replace(/"/g, "&quot;").replace(/&/g, "&amp;");
}

/**
 * Apply inline markdown formatting (bold, italic) to a line of HTML-escaped text.
 * Handles mentions first, then applies formatting to non-mention segments.
 */
function formatInlineMarkdown(line: string): string {
  // Process bold (**text**) and italic (*text*) but not inside mentions
  return line
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

/**
 * Convert plain text with @{id} mentions and markdown formatting
 * into TipTap-compatible HTML.
 */
export function contentToHtml(content: string, itemsCache: Map<string, CanvasItem>): string {
  if (!content) return "<p></p>";

  // Build a title->id lookup for legacy mentions
  const titleToId = new Map<string, string>();
  for (const [id, item] of itemsCache) {
    titleToId.set(item.title.toLowerCase(), id);
  }

  const lines = content.split("\n");
  const htmlParts: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    // Check for bullet list items
    if (/^- /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^- /.test(lines[i]!)) {
        items.push(lines[i]?.slice(2));
        i++;
      }
      const lis = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
      htmlParts.push(`<ul>${lis}</ul>`);
      continue;
    }

    // Check for ordered list items
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i]!)) {
        items.push(lines[i]?.replace(/^\d+\. /, ""));
        i++;
      }
      const lis = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
      htmlParts.push(`<ol>${lis}</ol>`);
      continue;
    }

    // Regular paragraph — process mentions and inline formatting
    htmlParts.push(renderParagraph(line, itemsCache, titleToId));
    i++;
  }

  return htmlParts.join("");
}

function renderParagraph(
  line: string,
  itemsCache: Map<string, CanvasItem>,
  titleToId: Map<string, string>,
): string {
  // Match @{id}, @[Title], or @Word
  const regex = /@\{([^}]+)\}|@\[([^\]]+)\]|@([\w-]+)/g;
  let result = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null = regex.exec(line);
  while (match !== null) {
    // Add text before the match (with inline formatting)
    const before = line.slice(lastIndex, match.index);
    result += formatInlineMarkdown(escapeHtml(before));

    if (match[1]) {
      // @{id} format
      const id = match[1];
      const item = itemsCache.get(id);
      const label = item ? item.title : id;
      result += `<span data-type="mention" data-id="${escapeAttr(id)}" data-label="${escapeAttr(label)}">@${escapeHtml(label)}</span>`;
    } else {
      // Legacy @[Title] or @Title format
      const title = (match[2] ?? match[3])!;
      const id = titleToId.get(title.toLowerCase());
      if (id) {
        result += `<span data-type="mention" data-id="${escapeAttr(id)}" data-label="${escapeAttr(title)}">@${escapeHtml(title)}</span>`;
      } else {
        result += escapeHtml(match[0]);
      }
    }
    lastIndex = match.index + match[0].length;
    match = regex.exec(line);
  }

  // Add remaining text with inline formatting
  const remaining = line.slice(lastIndex);
  result += formatInlineMarkdown(escapeHtml(remaining));

  return `<p>${result || "<br>"}</p>`;
}
