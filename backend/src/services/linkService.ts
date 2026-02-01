import { v4 as uuidv4 } from "uuid";
import { eq, and, sql } from "drizzle-orm";
import { getDb } from "../db/connection.js";
import { notes, noteLinks } from "../db/schema.js";

export interface ResolvedLink {
  targetNoteId: string;
  title: string;
  created: boolean;
}

export interface ParsedMention {
  type: "id" | "title";
  value: string;
}

/**
 * Parse @mentions from note content.
 * Supports three forms:
 *   @{noteId}         — ID-based mention (UUID in curly braces)
 *   @[Multi Word Name] — bracketed multi-word title
 *   @SingleWord       — single word title (letters, digits, underscores, hyphens)
 */
export function parseMentions(content: string): ParsedMention[] {
  const regex = /@\{([^}]+)\}|@\[([^\]]+)\]|@([\w-]+)/g;
  const mentions: ParsedMention[] = [];
  const seen = new Set<string>();
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match[1]) {
      const id = match[1].trim();
      if (id && !seen.has(`id:${id}`)) {
        seen.add(`id:${id}`);
        mentions.push({ type: "id", value: id });
      }
    } else {
      const title = (match[2] ?? match[3])!.trim();
      if (title && !seen.has(`title:${title.toLowerCase()}`)) {
        seen.add(`title:${title.toLowerCase()}`);
        mentions.push({ type: "title", value: title });
      }
    }
  }
  return mentions;
}

/**
 * Resolve @mentions in a note's content:
 * 1. Parse all @mentions
 * 2. For each, find or create the target note
 * 3. Create note_links entries
 * 4. Remove stale links for mentions that were removed
 */
export function resolveLinks(
  sourceNoteId: string,
  content: string
): ResolvedLink[] {
  const db = getDb();
  const mentions = parseMentions(content);

  // Get the source note for positioning new notes nearby
  const sourceNote = db
    .select({ canvas_x: notes.canvas_x, canvas_y: notes.canvas_y })
    .from(notes)
    .where(eq(notes.id, sourceNoteId))
    .get();

  const baseX = sourceNote?.canvas_x ?? 0;
  const baseY = sourceNote?.canvas_y ?? 0;

  const resolved: ResolvedLink[] = [];

  for (let i = 0; i < mentions.length; i++) {
    const mention = mentions[i]!;

    let targetNote: { id: string; title: string } | undefined;
    let created = false;

    if (mention.type === "id") {
      // ID-based mention: look up by ID, skip if not found
      targetNote = db
        .select({ id: notes.id, title: notes.title })
        .from(notes)
        .where(eq(notes.id, mention.value))
        .get();

      if (!targetNote) continue;
    } else {
      // Title-based mention: case-insensitive lookup + auto-create
      targetNote = db
        .select({ id: notes.id, title: notes.title })
        .from(notes)
        .where(sql`LOWER(${notes.title}) = LOWER(${mention.value})`)
        .get();

      if (!targetNote) {
        const newId = uuidv4();
        const offsetX = baseX + 300 + i * 50;
        const offsetY = baseY + 100 + i * 50;
        const now = new Date().toISOString();

        db.insert(notes)
          .values({
            id: newId,
            type: "npc",
            title: mention.value,
            content: "",
            canvas_x: offsetX,
            canvas_y: offsetY,
            created_at: now,
            updated_at: now,
          })
          .run();

        targetNote = { id: newId, title: mention.value };
        created = true;
      }
    }

    // Don't link a note to itself
    if (targetNote.id !== sourceNoteId) {
      db.insert(noteLinks)
        .values({
          source_note_id: sourceNoteId,
          target_note_id: targetNote.id,
        })
        .onConflictDoNothing()
        .run();
    }

    resolved.push({
      targetNoteId: targetNote.id,
      title: targetNote.title,
      created,
    });
  }

  // Remove stale links: links from this source that are no longer mentioned
  const currentTargetIds = resolved.map((r) => r.targetNoteId);
  const existingLinks = db
    .select({ target_note_id: noteLinks.target_note_id })
    .from(noteLinks)
    .where(eq(noteLinks.source_note_id, sourceNoteId))
    .all();

  const staleIds = existingLinks
    .map((l) => l.target_note_id)
    .filter((id) => !currentTargetIds.includes(id));

  for (const staleId of staleIds) {
    db.delete(noteLinks)
      .where(
        and(
          eq(noteLinks.source_note_id, sourceNoteId),
          eq(noteLinks.target_note_id, staleId)
        )
      )
      .run();
  }

  return resolved;
}
