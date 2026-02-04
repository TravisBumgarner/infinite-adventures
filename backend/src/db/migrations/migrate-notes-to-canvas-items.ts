import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { v4 as uuidv4 } from "uuid";
import {
  type CanvasItemType,
  canvasItemLinks,
  canvasItems,
  events,
  noteLinks,
  notes,
  people,
  places,
  sessions,
  things,
} from "../schema.js";

const NOTE_TYPE_MAP: Record<string, CanvasItemType> = {
  pc: "person",
  npc: "person",
  item: "thing",
  quest: "event",
  goal: "event",
  location: "place",
  session: "session",
};

/**
 * Maps legacy note types to new canvas item types.
 */
export function mapNoteTypeToCanvasItemType(noteType: string): CanvasItemType {
  const mapped = NOTE_TYPE_MAP[noteType];
  if (!mapped) {
    throw new Error(`Unknown note type: ${noteType}`);
  }
  return mapped;
}

/**
 * Gets the content table for a given canvas item type.
 */
function getContentTable(type: CanvasItemType) {
  switch (type) {
    case "person":
      return people;
    case "place":
      return places;
    case "thing":
      return things;
    case "session":
      return sessions;
    case "event":
      return events;
  }
}

/**
 * Main migration function - migrates all notes to canvas_items.
 * This function is idempotent - safe to run multiple times.
 */
export async function migrateNotesToCanvasItems(): Promise<void> {
  const databaseUrl =
    process.env.DATABASE_URL || "postgresql://infinite:infinite@localhost:5434/infinite_adventures";

  const pool = new pg.Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  try {
    // Fetch all notes
    const allNotes = await db.select().from(notes);
    console.log(`Found ${allNotes.length} notes to migrate`);

    // Track note ID -> canvas item ID mapping for link migration
    const noteIdToCanvasItemId = new Map<string, string>();

    for (const note of allNotes) {
      const canvasItemType = mapNoteTypeToCanvasItemType(note.type);

      // Check if already migrated (idempotency) - look for canvas_item with same ID
      const existing = await db.select().from(canvasItems).where(eq(canvasItems.id, note.id));

      if (existing.length > 0) {
        console.log(`Note ${note.id} already migrated, skipping`);
        noteIdToCanvasItemId.set(note.id, note.id);
        continue;
      }

      // Create content record
      const contentId = uuidv4();
      const contentTable = getContentTable(canvasItemType);

      await db.insert(contentTable).values({
        id: contentId,
        notes: note.content,
        created_at: note.created_at,
        updated_at: note.updated_at,
      });

      // Create canvas_item record - preserve the original note ID
      await db.insert(canvasItems).values({
        id: note.id, // Preserve ID for link continuity
        type: canvasItemType,
        title: note.title,
        canvas_x: note.canvas_x,
        canvas_y: note.canvas_y,
        canvas_id: note.canvas_id,
        user_id: note.user_id,
        content_id: contentId,
        created_at: note.created_at,
        updated_at: note.updated_at,
      });

      noteIdToCanvasItemId.set(note.id, note.id);
      console.log(`Migrated note ${note.id} (${note.title}) -> ${canvasItemType}`);
    }

    // Migrate note_links to canvas_item_links
    const allLinks = await db.select().from(noteLinks);
    console.log(`Found ${allLinks.length} links to migrate`);

    for (const link of allLinks) {
      const sourceItemId = noteIdToCanvasItemId.get(link.source_note_id);
      const targetItemId = noteIdToCanvasItemId.get(link.target_note_id);

      if (!sourceItemId || !targetItemId) {
        console.warn(
          `Skipping link ${link.source_note_id} -> ${link.target_note_id}: missing canvas item`,
        );
        continue;
      }

      // Check if already migrated (idempotency)
      const existingLink = await db
        .select()
        .from(canvasItemLinks)
        .where(eq(canvasItemLinks.source_item_id, sourceItemId));

      const linkExists = existingLink.some((l) => l.target_item_id === targetItemId);

      if (linkExists) {
        console.log(`Link ${sourceItemId} -> ${targetItemId} already migrated, skipping`);
        continue;
      }

      // Create canvas_item_link (snippet will be null initially)
      await db.insert(canvasItemLinks).values({
        source_item_id: sourceItemId,
        target_item_id: targetItemId,
        snippet: null,
      });

      console.log(`Migrated link ${sourceItemId} -> ${targetItemId}`);
    }

    console.log("Migration complete!");
  } finally {
    await pool.end();
  }
}

// Run migration if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateNotesToCanvasItems()
    .then(() => {
      console.log("Migration complete");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}
