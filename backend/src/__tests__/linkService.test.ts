import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getDb } from "../db/connection.js";
import { noteLinks, notes } from "../db/schema.js";
import { parseMentions, resolveLinks } from "../services/linkService.js";
import { createNote, DEFAULT_CANVAS_ID } from "../services/noteService.js";
import { setupTestDb, teardownTestDb, truncateAllTables } from "./helpers/setup.js";

describe("linkService", () => {
  describe("parseMentions", () => {
    it("extracts single mentions", () => {
      expect(parseMentions("Hello @Gandalf")).toEqual([{ type: "title", value: "Gandalf" }]);
    });

    it("extracts multiple mentions", () => {
      expect(parseMentions("@Gandalf and @Frodo")).toEqual([
        { type: "title", value: "Gandalf" },
        { type: "title", value: "Frodo" },
      ]);
    });

    it("handles multi-word mentions with brackets", () => {
      expect(parseMentions("Met @[Gandalf the Grey] today")).toEqual([
        { type: "title", value: "Gandalf the Grey" },
      ]);
    });

    it("handles mentions followed by punctuation", () => {
      expect(parseMentions("Saw @Gandalf, @Frodo.")).toEqual([
        { type: "title", value: "Gandalf" },
        { type: "title", value: "Frodo" },
      ]);
    });

    it("deduplicates mentions", () => {
      expect(parseMentions("@Gandalf and @Gandalf")).toEqual([{ type: "title", value: "Gandalf" }]);
    });

    it("returns empty array for no mentions", () => {
      expect(parseMentions("No mentions here")).toEqual([]);
    });
  });

  describe("resolveLinks", () => {
    beforeAll(async () => {
      await setupTestDb();
    });

    beforeEach(async () => {
      await truncateAllTables();
    });

    afterAll(async () => {
      await teardownTestDb();
    });

    it("creates links to existing notes", async () => {
      const source = await createNote(
        { type: "pc", title: "Frodo", content: "" },
        DEFAULT_CANVAS_ID,
      );
      await createNote({ type: "npc", title: "Gandalf", content: "" }, DEFAULT_CANVAS_ID);

      const resolved = await resolveLinks(source.id, "I met @Gandalf today");

      expect(resolved).toHaveLength(1);
      expect(resolved[0]?.title).toBe("Gandalf");
      expect(resolved[0]?.created).toBe(false);

      // Verify the link exists in the DB
      const db = getDb();
      const links = await db
        .select()
        .from(noteLinks)
        .where(eq(noteLinks.source_note_id, source.id));
      expect(links).toHaveLength(1);
    });

    it("auto-creates notes on the same canvas as the source", async () => {
      const source = await createNote(
        { type: "pc", title: "Frodo", content: "" },
        DEFAULT_CANVAS_ID,
      );

      const resolved = await resolveLinks(source.id, "Going to @Rivendell");

      expect(resolved).toHaveLength(1);
      expect(resolved[0]?.title).toBe("Rivendell");
      expect(resolved[0]?.created).toBe(true);

      // Verify the new note inherits source's canvas_id
      const db = getDb();
      const [newNote] = await db
        .select()
        .from(notes)
        .where(eq(notes.id, resolved[0]?.targetNoteId));
      expect(newNote?.type).toBe("npc");
      expect(newNote?.title).toBe("Rivendell");
      expect(newNote?.canvas_id).toBe(DEFAULT_CANVAS_ID);
    });

    it("removes stale links when mentions are removed", async () => {
      const source = await createNote(
        { type: "pc", title: "Frodo", content: "" },
        DEFAULT_CANVAS_ID,
      );
      await createNote({ type: "npc", title: "Gandalf", content: "" }, DEFAULT_CANVAS_ID);
      await createNote({ type: "location", title: "Shire", content: "" }, DEFAULT_CANVAS_ID);

      // First, link to both
      await resolveLinks(source.id, "@Gandalf in @Shire");

      const db = getDb();
      let links = await db.select().from(noteLinks).where(eq(noteLinks.source_note_id, source.id));
      expect(links).toHaveLength(2);

      // Now remove Shire mention
      await resolveLinks(source.id, "@Gandalf alone");

      links = await db.select().from(noteLinks).where(eq(noteLinks.source_note_id, source.id));
      expect(links).toHaveLength(1);
    });

    it("is case-insensitive when matching titles", async () => {
      const source = await createNote(
        { type: "pc", title: "Frodo", content: "" },
        DEFAULT_CANVAS_ID,
      );
      await createNote({ type: "npc", title: "Gandalf", content: "" }, DEFAULT_CANVAS_ID);

      const resolved = await resolveLinks(source.id, "Met @gandalf");
      expect(resolved[0]?.created).toBe(false);
    });

    it("does not link a note to itself", async () => {
      const source = await createNote(
        {
          type: "pc",
          title: "Frodo",
          content: "",
        },
        DEFAULT_CANVAS_ID,
      );

      await resolveLinks(source.id, "I am @Frodo");

      const db = getDb();
      const links = await db
        .select()
        .from(noteLinks)
        .where(eq(noteLinks.source_note_id, source.id));
      expect(links).toHaveLength(0);
    });
  });
});
