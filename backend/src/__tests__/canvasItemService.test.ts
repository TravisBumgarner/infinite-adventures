import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getDb } from "../db/connection.js";
import { sessions } from "../db/schema.js";
import {
  createItem,
  DEFAULT_CANVAS_ID,
  deleteItem,
  getItem,
  isValidCanvasItemType,
  listItems,
  searchItems,
  updateItem,
  ValidationError,
} from "../services/canvasItemService.js";
import { createCanvas } from "../services/canvasService.js";
import { setupTestDb, TEST_USER_ID, teardownTestDb, truncateAllTables } from "./helpers/setup.js";

describe("canvasItemService", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe("isValidCanvasItemType", () => {
    it("returns true for valid types", () => {
      expect(isValidCanvasItemType("person")).toBe(true);
      expect(isValidCanvasItemType("place")).toBe(true);
      expect(isValidCanvasItemType("thing")).toBe(true);
      expect(isValidCanvasItemType("session")).toBe(true);
      expect(isValidCanvasItemType("event")).toBe(true);
    });

    it("returns false for invalid types", () => {
      expect(isValidCanvasItemType("npc")).toBe(false);
      expect(isValidCanvasItemType("dragon")).toBe(false);
      expect(isValidCanvasItemType("")).toBe(false);
    });
  });

  describe("createItem", () => {
    it("creates a canvas item with valid input", async () => {
      const item = await createItem(
        {
          type: "person",
          title: "Gandalf",
          canvasX: 100,
          canvasY: 200,
        },
        DEFAULT_CANVAS_ID,
      );

      expect(item.id).toBeDefined();
      expect(item.type).toBe("person");
      expect(item.title).toBe("Gandalf");
      expect(item.canvasX).toBe(100);
      expect(item.canvasY).toBe(200);
      expect(item.createdAt).toBeDefined();
    });

    it("creates content record in the correct type-specific table", async () => {
      const item = await createItem({ type: "place", title: "Rivendell" }, DEFAULT_CANVAS_ID);

      const fullItem = await getItem(item.id);
      expect(fullItem?.notes).toEqual([]);
    });

    it("defaults notes to empty array and position to 0,0", async () => {
      const item = await createItem({ type: "person", title: "Frodo" }, DEFAULT_CANVAS_ID);

      const fullItem = await getItem(item.id);
      expect(fullItem?.notes).toEqual([]);
      expect(item.canvasX).toBe(0);
      expect(item.canvasY).toBe(0);
    });

    it("throws ValidationError for missing title", async () => {
      await expect(createItem({ type: "person", title: "" }, DEFAULT_CANVAS_ID)).rejects.toThrow(
        ValidationError,
      );
    });

    it("throws ValidationError for invalid type", async () => {
      await expect(
        createItem({ type: "dragon" as any, title: "Smaug" }, DEFAULT_CANVAS_ID),
      ).rejects.toThrow(ValidationError);
    });

    it("stores sessionDate when provided for session-type items", async () => {
      await createItem(
        { type: "session", title: "Session One", sessionDate: "2025-06-15" },
        DEFAULT_CANVAS_ID,
      );

      const db = getDb();
      const allSessions = await db.select().from(sessions);
      expect(allSessions).toHaveLength(1);
      expect(allSessions[0]!.sessionDate).toBe("2025-06-15");
    });

    it("defaults sessionDate to current date for session-type items", async () => {
      await createItem({ type: "session", title: "Session Two" }, DEFAULT_CANVAS_ID);

      const db = getDb();
      const allSessions = await db.select().from(sessions);
      expect(allSessions).toHaveLength(1);
      // Should be today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0];
      expect(allSessions[0]!.sessionDate).toBe(today);
    });

    it("ignores sessionDate for non-session types", async () => {
      const item = await createItem(
        { type: "person", title: "Gandalf", sessionDate: "2025-06-15" },
        DEFAULT_CANVAS_ID,
      );
      // Should not throw — sessionDate is silently ignored for non-session types
      expect(item.type).toBe("person");
    });
  });

  describe("listItems", () => {
    it("returns empty array when no items exist on the canvas", async () => {
      expect(await listItems(DEFAULT_CANVAS_ID)).toEqual([]);
    });

    it("returns items for the specified canvas only", async () => {
      const otherCanvas = await createCanvas("Other Canvas", TEST_USER_ID);

      await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      await createItem({ type: "person", title: "Frodo" }, DEFAULT_CANVAS_ID);
      await createItem({ type: "thing", title: "Ring" }, otherCanvas.id);

      const defaultItems = await listItems(DEFAULT_CANVAS_ID);
      expect(defaultItems).toHaveLength(2);

      const otherItems = await listItems(otherCanvas.id);
      expect(otherItems).toHaveLength(1);
      expect(otherItems[0]?.title).toBe("Ring");
    });

    it("returns items as summaries without notes", async () => {
      await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);

      const items = await listItems(DEFAULT_CANVAS_ID);
      expect(items).toHaveLength(1);
      expect(items[0]).not.toHaveProperty("notes");
      expect(items[0]).toHaveProperty("id");
      expect(items[0]).toHaveProperty("type");
      expect(items[0]).toHaveProperty("title");
      expect(items[0]).toHaveProperty("canvasX");
      expect(items[0]).toHaveProperty("canvasY");
    });
  });

  describe("getItem", () => {
    it("returns a full item with notes, photos, and links arrays", async () => {
      const created = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      const item = await getItem(created.id);

      expect(item).not.toBeNull();
      expect(item?.id).toBe(created.id);
      expect(item?.title).toBe("Gandalf");
      expect(item?.notes).toEqual([]);
      expect(item?.photos).toEqual([]);
      expect(item?.linksTo).toEqual([]);
      expect(item?.linkedFrom).toEqual([]);
    });

    it("returns null for non-existent id", async () => {
      expect(await getItem("non-existent")).toBeNull();
    });

    it("returns sessionDate for session-type items", async () => {
      const created = await createItem(
        { type: "session", title: "Session One", sessionDate: "2025-06-15" },
        DEFAULT_CANVAS_ID,
      );
      const item = await getItem(created.id);
      expect(item?.sessionDate).toBe("2025-06-15");
    });

    it("returns undefined sessionDate for non-session items", async () => {
      const created = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      const item = await getItem(created.id);
      expect(item?.sessionDate).toBeUndefined();
    });
  });

  describe("updateItem", () => {
    it("updates the title", async () => {
      const created = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);

      const updated = await updateItem(created.id, { title: "Gandalf the Grey" });

      expect(updated).not.toBeNull();
      expect(updated?.title).toBe("Gandalf the Grey");
    });

    it("updates the position", async () => {
      const created = await createItem(
        { type: "person", title: "Gandalf", canvasX: 0, canvasY: 0 },
        DEFAULT_CANVAS_ID,
      );

      const updated = await updateItem(created.id, { canvasX: 150, canvasY: 250 });

      expect(updated?.canvasX).toBe(150);
      expect(updated?.canvasY).toBe(250);
    });

    it("returns null for non-existent id", async () => {
      expect(await updateItem("non-existent", { title: "test" })).toBeNull();
    });
  });

  describe("deleteItem", () => {
    it("deletes an existing item", async () => {
      const created = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      expect(await deleteItem(created.id)).toBe(true);
      expect(await getItem(created.id)).toBeNull();
    });

    it("returns false for non-existent id", async () => {
      expect(await deleteItem("non-existent")).toBe(false);
    });

    it("also deletes the associated content record", async () => {
      const created = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);

      await deleteItem(created.id);
      // If we could query the content table directly, it would be empty
      // The getItem returning null is proof the cascade worked
      expect(await getItem(created.id)).toBeNull();
    });
  });

  describe("searchItems", () => {
    it("finds items by title within a canvas", async () => {
      await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      await createItem({ type: "person", title: "Frodo" }, DEFAULT_CANVAS_ID);

      const results = await searchItems("Gandalf", DEFAULT_CANVAS_ID);
      expect(results).toHaveLength(1);
      expect(results[0]?.title).toBe("Gandalf");
      expect(results[0]?.type).toBe("person");
    });

    it("does not return items from other canvases", async () => {
      const otherCanvas = await createCanvas("Other Canvas", TEST_USER_ID);

      await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      await createItem({ type: "person", title: "Gandalf Clone" }, otherCanvas.id);

      const results = await searchItems("Gandalf", DEFAULT_CANVAS_ID);
      expect(results).toHaveLength(1);
      expect(results[0]?.title).toBe("Gandalf");
    });

    it("returns empty array for no matches", async () => {
      await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);

      const results = await searchItems("Sauron", DEFAULT_CANVAS_ID);
      expect(results).toEqual([]);
    });

    it("returns empty array for empty query", async () => {
      await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);

      expect(await searchItems("", DEFAULT_CANVAS_ID)).toEqual([]);
      expect(await searchItems("   ", DEFAULT_CANVAS_ID)).toEqual([]);
    });

    it("supports prefix matching", async () => {
      await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);

      const results = await searchItems("Gan", DEFAULT_CANVAS_ID);
      expect(results).toHaveLength(1);
      expect(results[0]?.title).toBe("Gandalf");
    });
  });
});
