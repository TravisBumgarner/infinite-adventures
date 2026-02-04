import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../db/connection.js";
import { canvasItemLinks, canvasItems } from "../db/schema.js";
import { createItem } from "./canvasItemService.js";

export interface ResolvedCanvasItemLink {
  targetItemId: string;
  title: string;
  created: boolean;
}

export interface ParsedMention {
  type: "id" | "title";
  value: string;
}

export interface MentionWithPosition extends ParsedMention {
  startIndex: number;
  endIndex: number;
}

/**
 * Parse @mentions from content.
 * Supports three forms:
 *   @{itemId}           — ID-based mention (UUID in curly braces)
 *   @[Multi Word Name]  — bracketed multi-word title
 *   @SingleWord         — single word title (letters, digits, underscores, hyphens)
 */
export function parseMentions(content: string): ParsedMention[] {
  const regex = /@\{([^}]+)\}|@\[([^\]]+)\]|@([\w-]+)/g;
  const mentions: ParsedMention[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null = regex.exec(content);
  while (match !== null) {
    if (match[1]) {
      const id = match[1].trim();
      if (id && !seen.has(`id:${id}`)) {
        seen.add(`id:${id}`);
        mentions.push({ type: "id", value: id });
      }
    } else {
      const title = (match[2] ?? match[3])?.trim();
      if (title && !seen.has(`title:${title.toLowerCase()}`)) {
        seen.add(`title:${title.toLowerCase()}`);
        mentions.push({ type: "title", value: title });
      }
    }
    match = regex.exec(content);
  }
  return mentions;
}

/**
 * Parse @mentions from content with their positions.
 * Used for snippet extraction.
 */
export function parseMentionsWithPositions(content: string): MentionWithPosition[] {
  const regex = /@\{([^}]+)\}|@\[([^\]]+)\]|@([\w-]+)/g;
  const mentions: MentionWithPosition[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null = regex.exec(content);
  while (match !== null) {
    const startIndex = match.index;
    const endIndex = match.index + match[0].length;

    if (match[1]) {
      const id = match[1].trim();
      if (id && !seen.has(`id:${id}`)) {
        seen.add(`id:${id}`);
        mentions.push({ type: "id", value: id, startIndex, endIndex });
      }
    } else {
      const title = (match[2] ?? match[3])?.trim();
      if (title && !seen.has(`title:${title.toLowerCase()}`)) {
        seen.add(`title:${title.toLowerCase()}`);
        mentions.push({ type: "title", value: title, startIndex, endIndex });
      }
    }
    match = regex.exec(content);
  }
  return mentions;
}

/**
 * Extract a snippet of text surrounding a mention.
 * Returns ~wordsAround words before and after the mention.
 */
export function extractSnippet(
  content: string,
  startIndex: number,
  endIndex: number,
  wordsAround: number = 10,
): string {
  const mentionText = content.slice(startIndex, endIndex);

  // Get text before and after the mention
  const textBefore = content.slice(0, startIndex);
  const textAfter = content.slice(endIndex);

  // Split into words (preserving empty strings for split boundaries)
  const wordsBefore = textBefore.trim().split(/\s+/).filter(Boolean);
  const wordsAfter = textAfter.trim().split(/\s+/).filter(Boolean);

  // Get the words we want
  const beforeWords = wordsBefore.slice(-wordsAround);
  const afterWords = wordsAfter.slice(0, wordsAround);

  // Build the snippet
  let snippet = "";

  // Add leading ellipsis if we truncated from the beginning
  if (wordsBefore.length > wordsAround) {
    snippet += "...";
  }

  // Add words before
  if (beforeWords.length > 0) {
    snippet += `${beforeWords.join(" ")} `;
  }

  // Add the mention text
  snippet += mentionText;

  // Add words after
  if (afterWords.length > 0) {
    snippet += ` ${afterWords.join(" ")}`;
  }

  // Add trailing ellipsis if we truncated at the end
  if (wordsAfter.length > wordsAround) {
    snippet += "...";
  }

  return snippet;
}

/**
 * Resolve @mentions in a canvas item's content:
 * 1. Parse all @mentions with positions
 * 2. For each, find or create the target item
 * 3. Create canvas_item_links entries with snippets
 * 4. Remove stale links for mentions that were removed
 */
export async function resolveCanvasItemLinks(
  sourceItemId: string,
  content: string,
): Promise<ResolvedCanvasItemLink[]> {
  const db = getDb();
  const mentionsWithPositions = parseMentionsWithPositions(content);

  // Get the source item for positioning new items nearby and inheriting canvas_id
  const [sourceItem] = await db
    .select({
      canvas_x: canvasItems.canvas_x,
      canvas_y: canvasItems.canvas_y,
      canvas_id: canvasItems.canvas_id,
    })
    .from(canvasItems)
    .where(eq(canvasItems.id, sourceItemId));

  const baseX = sourceItem?.canvas_x ?? 0;
  const baseY = sourceItem?.canvas_y ?? 0;
  const canvasId = sourceItem?.canvas_id ?? "";

  const resolved: ResolvedCanvasItemLink[] = [];

  for (let i = 0; i < mentionsWithPositions.length; i++) {
    const mention = mentionsWithPositions[i]!;

    let targetItem: { id: string; title: string } | undefined;
    let created = false;

    if (mention.type === "id") {
      // ID-based mention: look up by ID, skip if not found
      const [found] = await db
        .select({ id: canvasItems.id, title: canvasItems.title })
        .from(canvasItems)
        .where(eq(canvasItems.id, mention.value));

      targetItem = found;
      if (!targetItem) continue;
    } else {
      // Title-based mention: case-insensitive lookup + auto-create
      const [found] = await db
        .select({ id: canvasItems.id, title: canvasItems.title })
        .from(canvasItems)
        .where(sql`LOWER(${canvasItems.title}) = LOWER(${mention.value})`);

      targetItem = found;

      if (!targetItem) {
        // Auto-create as 'person' type per the task description
        const offsetX = baseX + 300 + i * 50;
        const offsetY = baseY + 100 + i * 50;

        const newItem = await createItem(
          {
            type: "person",
            title: mention.value,
            canvas_x: offsetX,
            canvas_y: offsetY,
          },
          canvasId,
        );

        targetItem = { id: newItem.id, title: newItem.title };
        created = true;
      }
    }

    // Don't link an item to itself
    if (targetItem.id !== sourceItemId) {
      // Extract snippet for this mention
      const snippet = extractSnippet(content, mention.startIndex, mention.endIndex, 10);

      // Insert or update the link with snippet
      await db
        .insert(canvasItemLinks)
        .values({
          source_item_id: sourceItemId,
          target_item_id: targetItem.id,
          snippet,
          created_at: new Date().toISOString(),
        })
        .onConflictDoUpdate({
          target: [canvasItemLinks.source_item_id, canvasItemLinks.target_item_id],
          set: { snippet },
        });
    }

    resolved.push({
      targetItemId: targetItem.id,
      title: targetItem.title,
      created,
    });
  }

  // Remove stale links: links from this source that are no longer mentioned
  const currentTargetIds = resolved.map((r) => r.targetItemId);
  const existingLinks = await db
    .select({ target_item_id: canvasItemLinks.target_item_id })
    .from(canvasItemLinks)
    .where(eq(canvasItemLinks.source_item_id, sourceItemId));

  const staleIds = existingLinks
    .map((l) => l.target_item_id)
    .filter((id) => !currentTargetIds.includes(id));

  for (const staleId of staleIds) {
    await db
      .delete(canvasItemLinks)
      .where(
        and(
          eq(canvasItemLinks.source_item_id, sourceItemId),
          eq(canvasItemLinks.target_item_id, staleId),
        ),
      );
  }

  return resolved;
}
