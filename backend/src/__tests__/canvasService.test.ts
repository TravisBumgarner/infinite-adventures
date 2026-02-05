import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getDb } from "../db/connection.js";
import { canvasItems, people } from "../db/schema.js";
import {
  createCanvas,
  deleteCanvas,
  getCanvas,
  LastCanvasError,
  listCanvases,
  updateCanvas,
} from "../services/canvasService.js";
import { setupTestDb, TEST_USER_ID, teardownTestDb, truncateAllTables } from "./helpers/setup.js";

const OTHER_USER_ID = "other-user-0000-0000-000000000002";

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
      const canvas = await createCanvas("Adventure Map", TEST_USER_ID);

      expect(canvas.id).toBeDefined();
      expect(canvas.name).toBe("Adventure Map");
      expect(canvas.created_at).toBeDefined();
      expect(canvas.updated_at).toBeDefined();
    });
  });

  describe("listCanvases", () => {
    it("returns the default canvas", async () => {
      const canvases = await listCanvases(TEST_USER_ID);
      expect(canvases).toHaveLength(1);
      expect(canvases[0]?.name).toBe("Default");
    });

    it("returns all canvases for the user", async () => {
      await createCanvas("Map One", TEST_USER_ID);
      await createCanvas("Map Two", TEST_USER_ID);

      const canvases = await listCanvases(TEST_USER_ID);
      expect(canvases).toHaveLength(3); // default + 2 created
    });

    it("lazily creates a Default canvas for a user with none", async () => {
      const db = getDb();
      await db.execute(
        await import("drizzle-orm").then(
          ({ sql }) =>
            sql`INSERT INTO users (id, auth_id, email, display_name) VALUES (${OTHER_USER_ID}, 'auth-other', 'other@example.com', 'Other User') ON CONFLICT (id) DO NOTHING`,
        ),
      );

      const canvases = await listCanvases(OTHER_USER_ID);
      expect(canvases).toHaveLength(1);
      expect(canvases[0]?.name).toBe("Default");
    });

    it("does not return canvases from other users", async () => {
      const db = getDb();
      await db.execute(
        await import("drizzle-orm").then(
          ({ sql }) =>
            sql`INSERT INTO users (id, auth_id, email, display_name) VALUES (${OTHER_USER_ID}, 'auth-other', 'other@example.com', 'Other User') ON CONFLICT (id) DO NOTHING`,
        ),
      );

      await createCanvas("User1 Canvas", TEST_USER_ID);
      await createCanvas("User2 Canvas", OTHER_USER_ID);

      const user1Canvases = await listCanvases(TEST_USER_ID);
      const user2Canvases = await listCanvases(OTHER_USER_ID);

      const user1Names = user1Canvases.map((c) => c.name);
      const user2Names = user2Canvases.map((c) => c.name);

      expect(user1Names).toContain("User1 Canvas");
      expect(user1Names).not.toContain("User2 Canvas");
      expect(user2Names).toContain("User2 Canvas");
      expect(user2Names).not.toContain("User1 Canvas");
    });
  });

  describe("getCanvas", () => {
    it("returns a canvas by id", async () => {
      const created = await createCanvas("My Canvas", TEST_USER_ID);
      const canvas = await getCanvas(created.id, TEST_USER_ID);

      expect(canvas).not.toBeNull();
      expect(canvas?.id).toBe(created.id);
      expect(canvas?.name).toBe("My Canvas");
    });

    it("returns null for non-existent id", async () => {
      expect(await getCanvas("non-existent", TEST_USER_ID)).toBeNull();
    });

    it("returns null when accessing another user's canvas", async () => {
      const db = getDb();
      await db.execute(
        await import("drizzle-orm").then(
          ({ sql }) =>
            sql`INSERT INTO users (id, auth_id, email, display_name) VALUES (${OTHER_USER_ID}, 'auth-other', 'other@example.com', 'Other User') ON CONFLICT (id) DO NOTHING`,
        ),
      );

      const created = await createCanvas("Private Canvas", OTHER_USER_ID);
      expect(await getCanvas(created.id, TEST_USER_ID)).toBeNull();
    });
  });

  describe("updateCanvas", () => {
    it("updates canvas name", async () => {
      const created = await createCanvas("Old Name", TEST_USER_ID);
      const updated = await updateCanvas(created.id, "New Name", TEST_USER_ID);

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe("New Name");
    });

    it("returns null for non-existent id", async () => {
      expect(await updateCanvas("non-existent", "Test", TEST_USER_ID)).toBeNull();
    });
  });

  describe("deleteCanvas", () => {
    it("deletes an existing canvas", async () => {
      const created = await createCanvas("To Delete", TEST_USER_ID);
      expect(await deleteCanvas(created.id, TEST_USER_ID)).toBe(true);
      expect(await getCanvas(created.id, TEST_USER_ID)).toBeNull();
    });

    it("returns false for non-existent id", async () => {
      expect(await deleteCanvas("non-existent", TEST_USER_ID)).toBe(false);
    });

    it("throws LastCanvasError when deleting the only canvas", async () => {
      const canvases = await listCanvases(TEST_USER_ID);
      expect(canvases).toHaveLength(1);

      await expect(deleteCanvas(canvases[0]!.id, TEST_USER_ID)).rejects.toThrow(LastCanvasError);
    });

    it("cascade-deletes canvas items belonging to the canvas", async () => {
      const canvas = await createCanvas("Doomed Canvas", TEST_USER_ID);

      // Insert a canvas item directly on this canvas
      const db = getDb();
      const itemId = uuidv4();
      const contentId = uuidv4();
      const now = new Date().toISOString();

      // First insert the content record
      await db.insert(people).values({
        id: contentId,
        notes: "",
        created_at: now,
        updated_at: now,
      });

      // Then insert the canvas item
      await db.insert(canvasItems).values({
        id: itemId,
        type: "person",
        title: "Doomed Person",
        canvas_x: 0,
        canvas_y: 0,
        canvas_id: canvas.id,
        content_id: contentId,
        created_at: now,
        updated_at: now,
      });

      // Verify item exists
      const [before] = await db.select().from(canvasItems).where(eq(canvasItems.id, itemId));
      expect(before).toBeDefined();

      // Delete the canvas
      expect(await deleteCanvas(canvas.id, TEST_USER_ID)).toBe(true);

      // Verify item was cascade-deleted
      const [after] = await db.select().from(canvasItems).where(eq(canvasItems.id, itemId));
      expect(after).toBeUndefined();
    });
  });
});
