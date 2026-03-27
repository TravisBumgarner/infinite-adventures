import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createItem, DEFAULT_CANVAS_ID } from "../services/canvasItemService.js";
import { createSnapshot, listHistory } from "../services/contentHistoryService.js";
import { createNote, updateNote } from "../services/noteService.js";
import { setupTestDb, teardownTestDb, truncateAllTables } from "./helpers/setup.js";

describe("contentHistoryService", () => {
  beforeAll(async () => {
    await setupTestDb();
  });
  afterAll(async () => {
    await teardownTestDb();
  });
  beforeEach(async () => {
    await truncateAllTables();
  });

  async function createTestNote(content = "<p>original</p>") {
    const item = await createItem({ type: "person", title: "Test Person" }, DEFAULT_CANVAS_ID);
    const note = await createNote(item.id, { content });
    return { item, note };
  }

  describe("createSnapshot", () => {
    it("stores a snapshot and returns it", async () => {
      const { note } = await createTestNote();
      const snapshot = await createSnapshot(note.id, "note", note.content);

      expect(snapshot.sourceId).toBe(note.id);
      expect(snapshot.content).toBe(note.content);
      expect(snapshot.id).toBeDefined();
      expect(snapshot.snapshotAt).toBeDefined();
    });
  });

  describe("listHistory", () => {
    it("returns snapshots newest first", async () => {
      const { note } = await createTestNote();
      await createSnapshot(note.id, "note", "version 1");
      // Small delay to ensure different timestamps
      await new Promise((r) => setTimeout(r, 10));
      await createSnapshot(note.id, "note", "version 2");

      const history = await listHistory(note.id);
      expect(history).toHaveLength(2);
      expect(history[0]!.content).toBe("version 2");
      expect(history[1]!.content).toBe("version 1");
    });

    it("returns empty array when no history exists", async () => {
      const { note } = await createTestNote();
      const history = await listHistory(note.id);
      expect(history).toEqual([]);
    });
  });

  describe("updateNote with snapshot flag", () => {
    it("creates a snapshot of old content when snapshot is true", async () => {
      const { note } = await createTestNote("<p>old content</p>");
      await updateNote(note.id, {
        content: "<p>new content</p>",
        snapshot: true,
      });

      const history = await listHistory(note.id);
      expect(history).toHaveLength(1);
      expect(history[0]!.content).toBe("<p>old content</p>");
    });

    it("skips snapshot when content is identical", async () => {
      const { note } = await createTestNote("<p>same</p>");
      await updateNote(note.id, {
        content: "<p>same</p>",
        snapshot: true,
      });

      const history = await listHistory(note.id);
      expect(history).toHaveLength(0);
    });

    it("does not snapshot for isImportant-only updates", async () => {
      const { note } = await createTestNote();
      await updateNote(note.id, {
        isImportant: true,
        snapshot: true,
      });

      const history = await listHistory(note.id);
      expect(history).toHaveLength(0);
    });

    it("does not snapshot when snapshot flag is absent", async () => {
      const { note } = await createTestNote("<p>old</p>");
      await updateNote(note.id, { content: "<p>new</p>" });

      const history = await listHistory(note.id);
      expect(history).toHaveLength(0);
    });
  });
});
