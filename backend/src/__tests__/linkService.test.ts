import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeDb, getDb, initDb } from "../db/connection.js";
import { noteLinks, notes } from "../db/schema.js";
import { parseMentions, resolveLinks } from "../services/linkService.js";
import { createNote } from "../services/noteService.js";

describe("linkService", () => {
  describe("parseMentions", () => {
    it("extracts single mentions", () => {
      expect(parseMentions("Hello @Gandalf")).toEqual(["Gandalf"]);
    });

    it("extracts multiple mentions", () => {
      expect(parseMentions("@Gandalf and @Frodo")).toEqual(["Gandalf", "Frodo"]);
    });

    it("handles multi-word mentions with brackets", () => {
      expect(parseMentions("Met @[Gandalf the Grey] today")).toEqual(["Gandalf the Grey"]);
    });

    it("handles mentions followed by punctuation", () => {
      expect(parseMentions("Saw @Gandalf, @Frodo.")).toEqual(["Gandalf", "Frodo"]);
    });

    it("deduplicates mentions", () => {
      expect(parseMentions("@Gandalf and @Gandalf")).toEqual(["Gandalf"]);
    });

    it("returns empty array for no mentions", () => {
      expect(parseMentions("No mentions here")).toEqual([]);
    });
  });

  describe("resolveLinks", () => {
    beforeEach(() => {
      initDb(":memory:");
    });

    afterEach(() => {
      closeDb();
    });

    it("creates links to existing notes", () => {
      const source = createNote({ type: "pc", title: "Frodo", content: "" });
      createNote({ type: "npc", title: "Gandalf", content: "" });

      const resolved = resolveLinks(source.id, "I met @Gandalf today");

      expect(resolved).toHaveLength(1);
      expect(resolved[0]?.title).toBe("Gandalf");
      expect(resolved[0]?.created).toBe(false);

      // Verify the link exists in the DB
      const db = getDb();
      const links = db
        .select()
        .from(noteLinks)
        .where(eq(noteLinks.source_note_id, source.id))
        .all();
      expect(links).toHaveLength(1);
    });

    it("auto-creates notes for unknown mentions", () => {
      const source = createNote({ type: "pc", title: "Frodo", content: "" });

      const resolved = resolveLinks(source.id, "Going to @Rivendell");

      expect(resolved).toHaveLength(1);
      expect(resolved[0]?.title).toBe("Rivendell");
      expect(resolved[0]?.created).toBe(true);

      // Verify the new note was created
      const db = getDb();
      const newNote = db.select().from(notes).where(eq(notes.id, resolved[0]?.targetNoteId)).get();
      expect(newNote?.type).toBe("npc");
      expect(newNote?.title).toBe("Rivendell");
    });

    it("removes stale links when mentions are removed", () => {
      const source = createNote({ type: "pc", title: "Frodo", content: "" });
      createNote({ type: "npc", title: "Gandalf", content: "" });
      createNote({ type: "location", title: "Shire", content: "" });

      // First, link to both
      resolveLinks(source.id, "@Gandalf in @Shire");

      const db = getDb();
      let links = db.select().from(noteLinks).where(eq(noteLinks.source_note_id, source.id)).all();
      expect(links).toHaveLength(2);

      // Now remove Shire mention
      resolveLinks(source.id, "@Gandalf alone");

      links = db.select().from(noteLinks).where(eq(noteLinks.source_note_id, source.id)).all();
      expect(links).toHaveLength(1);
    });

    it("is case-insensitive when matching titles", () => {
      const source = createNote({ type: "pc", title: "Frodo", content: "" });
      createNote({ type: "npc", title: "Gandalf", content: "" });

      const resolved = resolveLinks(source.id, "Met @gandalf");
      expect(resolved[0]?.created).toBe(false);
    });

    it("does not link a note to itself", () => {
      const source = createNote({
        type: "pc",
        title: "Frodo",
        content: "",
      });

      resolveLinks(source.id, "I am @Frodo");

      const db = getDb();
      const links = db
        .select()
        .from(noteLinks)
        .where(eq(noteLinks.source_note_id, source.id))
        .all();
      expect(links).toHaveLength(0);
    });
  });
});
