import { v4 as uuidv4 } from "uuid";
import { eq, and, sql } from "drizzle-orm";
import { getDb } from "../db/connection.js";
import { notes, noteLinks } from "../db/schema.js";

export interface ResolvedLink {
  targetNoteId: string;
  title: string;
  created: boolean;
}

/**
 * Parse @mentions from note content.
 * Supports two forms:
 *   @SingleWord       — matches a single word (letters, digits, underscores, hyphens)
 *   @[Multi Word Name] — matches a bracketed multi-word name
 */
export function parseMentions(content: string): string[] {
  const regex = /@\[([^\]]+)\]|@([\w-]+)/g;
  const mentions: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const title = (match[1] ?? match[2])!.trim();
    if (title) {
      mentions.push(title);
    }
  }
  return [...new Set(mentions)];
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
  const mentionedTitles = parseMentions(content);

  // Get the source note for positioning new notes nearby
  const sourceNote = db
    .select({ canvas_x: notes.canvas_x, canvas_y: notes.canvas_y })
    .from(notes)
    .where(eq(notes.id, sourceNoteId))
    .get();

  const baseX = sourceNote?.canvas_x ?? 0;
  const baseY = sourceNote?.canvas_y ?? 0;

  const resolved: ResolvedLink[] = [];

  for (let i = 0; i < mentionedTitles.length; i++) {
    const title = mentionedTitles[i]!;

    // Case-insensitive title lookup
    let targetNote = db
      .select({ id: notes.id, title: notes.title })
      .from(notes)
      .where(sql`LOWER(${notes.title}) = LOWER(${title})`)
      .get();

    let created = false;

    if (!targetNote) {
      // Auto-create a new note, offset from source
      const newId = uuidv4();
      const offsetX = baseX + 300 + i * 50;
      const offsetY = baseY + 100 + i * 50;
      const now = new Date().toISOString();

      db.insert(notes)
        .values({
          id: newId,
          type: "npc",
          title,
          content: "",
          canvas_x: offsetX,
          canvas_y: offsetY,
          created_at: now,
          updated_at: now,
        })
        .run();

      targetNote = { id: newId, title };
      created = true;
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
