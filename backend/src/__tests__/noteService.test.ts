import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initDb, closeDb } from "../db/connection.js";
import {
  listNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  searchNotes,
  ValidationError,
} from "../services/noteService.js";

describe("noteService", () => {
  beforeEach(() => {
    initDb(":memory:");
  });

  afterEach(() => {
    closeDb();
  });

  describe("createNote", () => {
    it("creates a note with valid input", () => {
      const note = createNote({
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

    it("defaults content to empty string and position to 0,0", () => {
      const note = createNote({ type: "pc", title: "Frodo" });
      expect(note.content).toBe("");
      expect(note.canvas_x).toBe(0);
      expect(note.canvas_y).toBe(0);
    });

    it("throws ValidationError for missing title", () => {
      expect(() => createNote({ type: "npc", title: "" })).toThrow(
        ValidationError
      );
    });

    it("throws ValidationError for invalid type", () => {
      expect(() =>
        createNote({ type: "dragon", title: "Smaug" })
      ).toThrow(ValidationError);
    });
  });

  describe("listNotes", () => {
    it("returns empty array when no notes exist", () => {
      expect(listNotes()).toEqual([]);
    });

    it("returns all notes without content", () => {
      createNote({ type: "npc", title: "Gandalf", content: "A wizard" });
      createNote({ type: "pc", title: "Frodo", content: "A hobbit" });

      const notes = listNotes();
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
    it("returns a note with links arrays", () => {
      const created = createNote({ type: "npc", title: "Gandalf" });
      const note = getNote(created.id);

      expect(note).not.toBeNull();
      expect(note!.id).toBe(created.id);
      expect(note!.title).toBe("Gandalf");
      expect(note!.links_to).toEqual([]);
      expect(note!.linked_from).toEqual([]);
    });

    it("returns null for non-existent id", () => {
      expect(getNote("non-existent")).toBeNull();
    });
  });

  describe("updateNote", () => {
    it("updates specified fields", () => {
      const created = createNote({
        type: "npc",
        title: "Gandalf",
        content: "A wizard",
      });

      const updated = updateNote(created.id, {
        title: "Gandalf the Grey",
        content: "A wise wizard",
      });

      expect(updated).not.toBeNull();
      expect(updated!.title).toBe("Gandalf the Grey");
      expect(updated!.content).toBe("A wise wizard");
      expect(updated!.type).toBe("npc"); // unchanged
    });

    it("returns null for non-existent id", () => {
      expect(updateNote("non-existent", { title: "test" })).toBeNull();
    });

    it("throws ValidationError for invalid type", () => {
      const created = createNote({ type: "npc", title: "Gandalf" });
      expect(() => updateNote(created.id, { type: "dragon" })).toThrow(
        ValidationError
      );
    });
  });

  describe("deleteNote", () => {
    it("deletes an existing note", () => {
      const created = createNote({ type: "npc", title: "Gandalf" });
      expect(deleteNote(created.id)).toBe(true);
      expect(getNote(created.id)).toBeNull();
    });

    it("returns false for non-existent id", () => {
      expect(deleteNote("non-existent")).toBe(false);
    });
  });

  describe("searchNotes", () => {
    it("finds notes by title", () => {
      createNote({ type: "npc", title: "Gandalf", content: "A wizard" });
      createNote({ type: "pc", title: "Frodo", content: "A hobbit" });

      const results = searchNotes("Gandalf");
      expect(results).toHaveLength(1);
      expect(results[0]!.title).toBe("Gandalf");
      expect(results[0]!.type).toBe("npc");
    });

    it("finds notes by content", () => {
      createNote({ type: "npc", title: "Gandalf", content: "A wise wizard from Middle Earth" });

      const results = searchNotes("wizard");
      expect(results).toHaveLength(1);
      expect(results[0]!.title).toBe("Gandalf");
      expect(results[0]!.snippet).toContain("wizard");
    });

    it("returns empty array for no matches", () => {
      createNote({ type: "npc", title: "Gandalf", content: "A wizard" });

      const results = searchNotes("dragon");
      expect(results).toEqual([]);
    });

    it("returns empty array for empty query", () => {
      createNote({ type: "npc", title: "Gandalf", content: "A wizard" });

      expect(searchNotes("")).toEqual([]);
      expect(searchNotes("   ")).toEqual([]);
    });

    it("supports prefix matching", () => {
      createNote({ type: "npc", title: "Gandalf", content: "A wizard" });

      const results = searchNotes("Gan");
      expect(results).toHaveLength(1);
      expect(results[0]!.title).toBe("Gandalf");
    });
  });
});
