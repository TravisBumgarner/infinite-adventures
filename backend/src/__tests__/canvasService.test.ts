import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getDb } from "../db/connection.js";
import { notes } from "../db/schema.js";
import {
  createCanvas,
  deleteCanvas,
  getCanvas,
  LastCanvasError,
  listCanvases,
  updateCanvas,
} from "../services/canvasService.js";
import { setupTestDb, teardownTestDb, truncateAllTables } from "./helpers/setup.js";

describe("canvasService", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe("createCanvas", () => {
    it("creates a canvas with valid name", async () => {
      const canvas = await createCanvas("Adventure Map");

      expect(canvas.id).toBeDefined();
      expect(canvas.name).toBe("Adventure Map");
      expect(canvas.created_at).toBeDefined();
      expect(canvas.updated_at).toBeDefined();
    });
  });

  describe("listCanvases", () => {
    it("returns the default canvas", async () => {
      const canvases = await listCanvases();
      expect(canvases).toHaveLength(1);
      expect(canvases[0]?.name).toBe("Default");
    });

    it("returns all canvases", async () => {
      await createCanvas("Map One");
      await createCanvas("Map Two");

      const canvases = await listCanvases();
      expect(canvases).toHaveLength(3); // default + 2 created
    });
  });

  describe("getCanvas", () => {
    it("returns a canvas by id", async () => {
      const created = await createCanvas("My Canvas");
      const canvas = await getCanvas(created.id);

      expect(canvas).not.toBeNull();
      expect(canvas?.id).toBe(created.id);
      expect(canvas?.name).toBe("My Canvas");
    });

    it("returns null for non-existent id", async () => {
      expect(await getCanvas("non-existent")).toBeNull();
    });
  });

  describe("updateCanvas", () => {
    it("updates canvas name", async () => {
      const created = await createCanvas("Old Name");
      const updated = await updateCanvas(created.id, "New Name");

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe("New Name");
    });

    it("returns null for non-existent id", async () => {
      expect(await updateCanvas("non-existent", "Test")).toBeNull();
    });
  });

  describe("deleteCanvas", () => {
    it("deletes an existing canvas", async () => {
      const created = await createCanvas("To Delete");
      expect(await deleteCanvas(created.id)).toBe(true);
      expect(await getCanvas(created.id)).toBeNull();
    });

    it("returns false for non-existent id", async () => {
      expect(await deleteCanvas("non-existent")).toBe(false);
    });

    it("throws LastCanvasError when deleting the only canvas", async () => {
      const canvases = await listCanvases();
      expect(canvases).toHaveLength(1);

      await expect(deleteCanvas(canvases[0]!.id)).rejects.toThrow(LastCanvasError);
    });

    it("cascade-deletes notes belonging to the canvas", async () => {
      const canvas = await createCanvas("Doomed Canvas");

      // Insert a note directly on this canvas
      const db = getDb();
      const noteId = uuidv4();
      const now = new Date().toISOString();
      await db.insert(notes).values({
        id: noteId,
        type: "npc",
        title: "Doomed NPC",
        content: "",
        canvas_x: 0,
        canvas_y: 0,
        canvas_id: canvas.id,
        created_at: now,
        updated_at: now,
      });

      // Verify note exists
      const [before] = await db.select().from(notes).where(eq(notes.id, noteId));
      expect(before).toBeDefined();

      // Delete the canvas
      expect(await deleteCanvas(canvas.id)).toBe(true);

      // Verify note was cascade-deleted
      const [after] = await db.select().from(notes).where(eq(notes.id, noteId));
      expect(after).toBeUndefined();
    });
  });
});
