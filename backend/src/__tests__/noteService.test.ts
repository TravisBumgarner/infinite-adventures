import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  createNote,
  deleteNote,
  getNote,
  listNotes,
  searchNotes,
  updateNote,
  ValidationError,
} from "../services/noteService.js";
import { setupTestDb, teardownTestDb, truncateAllTables } from "./helpers/setup.js";

describe("noteService", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe("createNote", () => {
    it("creates a note with valid input", async () => {
      const note = await createNote({
        type: "npc",
        title: "Gandalf",
        content: "A wise wizard",
        canvas_x: 100,
        canvas_y: 200,
      });

      expect(note.id).toBeDefined();
      expect(note.type).toBe("npc");
      expect(note.title).toBe("Gandalf");
      expect(note.content).toBe("A wise wizard");
      expect(note.canvas_x).toBe(100);
      expect(note.canvas_y).toBe(200);
      expect(note.created_at).toBeDefined();
      expect(note.updated_at).toBeDefined();
    });

    it("defaults content to empty string and position to 0,0", async () => {
      const note = await createNote({ type: "pc", title: "Frodo" });
      expect(note.content).toBe("");
      expect(note.canvas_x).toBe(0);
      expect(note.canvas_y).toBe(0);
    });

    it("throws ValidationError for missing title", async () => {
      await expect(createNote({ type: "npc", title: "" })).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError for invalid type", async () => {
      await expect(createNote({ type: "dragon" as any, title: "Smaug" })).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe("listNotes", () => {
    it("returns empty array when no notes exist", async () => {
      expect(await listNotes()).toEqual([]);
    });

    it("returns all notes without content", async () => {
      await createNote({ type: "npc", title: "Gandalf", content: "A wizard" });
      await createNote({ type: "pc", title: "Frodo", content: "A hobbit" });

      const notes = await listNotes();
      expect(notes).toHaveLength(2);
      expect(notes[0]).not.toHaveProperty("content");
      expect(notes[0]).toHaveProperty("id");
      expect(notes[0]).toHaveProperty("type");
      expect(notes[0]).toHaveProperty("title");
      expect(notes[0]).toHaveProperty("canvas_x");
      expect(notes[0]).toHaveProperty("canvas_y");
    });
  });

  describe("getNote", () => {
    it("returns a note with links arrays", async () => {
      const created = await createNote({ type: "npc", title: "Gandalf" });
      const note = await getNote(created.id);

      expect(note).not.toBeNull();
      expect(note?.id).toBe(created.id);
      expect(note?.title).toBe("Gandalf");
      expect(note?.links_to).toEqual([]);
      expect(note?.linked_from).toEqual([]);
    });

    it("returns null for non-existent id", async () => {
      expect(await getNote("non-existent")).toBeNull();
    });
  });

  describe("updateNote", () => {
    it("updates specified fields", async () => {
      const created = await createNote({
        type: "npc",
        title: "Gandalf",
        content: "A wizard",
      });

      const updated = await updateNote(created.id, {
        title: "Gandalf the Grey",
        content: "A wise wizard",
      });

      expect(updated).not.toBeNull();
      expect(updated?.title).toBe("Gandalf the Grey");
      expect(updated?.content).toBe("A wise wizard");
      expect(updated?.type).toBe("npc"); // unchanged
    });

    it("returns null for non-existent id", async () => {
      expect(await updateNote("non-existent", { title: "test" })).toBeNull();
    });

    it("throws ValidationError for invalid type", async () => {
      const created = await createNote({ type: "npc", title: "Gandalf" });
      await expect(updateNote(created.id, { type: "dragon" as any })).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe("deleteNote", () => {
    it("deletes an existing note", async () => {
      const created = await createNote({ type: "npc", title: "Gandalf" });
      expect(await deleteNote(created.id)).toBe(true);
      expect(await getNote(created.id)).toBeNull();
    });

    it("returns false for non-existent id", async () => {
      expect(await deleteNote("non-existent")).toBe(false);
    });
  });

  describe("searchNotes", () => {
    it("finds notes by title", async () => {
      await createNote({ type: "npc", title: "Gandalf", content: "A wizard" });
      await createNote({ type: "pc", title: "Frodo", content: "A hobbit" });

      const results = await searchNotes("Gandalf");
      expect(results).toHaveLength(1);
      expect(results[0]?.title).toBe("Gandalf");
      expect(results[0]?.type).toBe("npc");
    });

    it("finds notes by content", async () => {
      await createNote({
        type: "npc",
        title: "Gandalf",
        content: "A wise wizard from Middle Earth",
      });

      const results = await searchNotes("wizard");
      expect(results).toHaveLength(1);
      expect(results[0]?.title).toBe("Gandalf");
      expect(results[0]?.snippet).toContain("wizard");
    });

    it("returns empty array for no matches", async () => {
      await createNote({ type: "npc", title: "Gandalf", content: "A wizard" });

      const results = await searchNotes("dragon");
      expect(results).toEqual([]);
    });

    it("returns empty array for empty query", async () => {
      await createNote({ type: "npc", title: "Gandalf", content: "A wizard" });

      expect(await searchNotes("")).toEqual([]);
      expect(await searchNotes("   ")).toEqual([]);
    });

    it("supports prefix matching", async () => {
      await createNote({ type: "npc", title: "Gandalf", content: "A wizard" });

      const results = await searchNotes("Gan");
      expect(results).toHaveLength(1);
      expect(results[0]?.title).toBe("Gandalf");
    });
  });
});
