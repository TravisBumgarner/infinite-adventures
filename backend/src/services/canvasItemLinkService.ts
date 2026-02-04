import { and, eq, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/connection.js";
import { canvasItemLinks, canvasItems, people } from "../db/schema.js";
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
  // Stub - returns empty array
  return [];
}

/**
 * Parse @mentions from content with their positions.
 * Used for snippet extraction.
 */
export function parseMentionsWithPositions(content: string): MentionWithPosition[] {
  // Stub - returns empty array
  return [];
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
  // Stub - returns empty string
  return "";
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
  // Stub - returns empty array
  return [];
}
