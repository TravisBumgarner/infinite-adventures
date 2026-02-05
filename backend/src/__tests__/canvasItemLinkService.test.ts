import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getDb } from "../db/connection.js";
import { canvasItemLinks, canvasItems } from "../db/schema.js";
import {
  extractSnippet,
  parseMentions,
  parseMentionsWithPositions,
  resolveCanvasItemLinks,
} from "../services/canvasItemLinkService.js";
import { createItem, DEFAULT_CANVAS_ID } from "../services/canvasItemService.js";
import { setupTestDb, teardownTestDb, truncateAllTables } from "./helpers/setup.js";

describe("canvasItemLinkService", () => {
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

    it("handles ID-based mentions", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      expect(parseMentions(`Referencing @{${uuid}}`)).toEqual([{ type: "id", value: uuid }]);
    });

    it("returns empty array for no mentions", () => {
      expect(parseMentions("No mentions here")).toEqual([]);
    });
  });

  describe("parseMentionsWithPositions", () => {
    it("returns mention positions", () => {
      const result = parseMentionsWithPositions("Hello @Gandalf how are you");
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: "title",
        value: "Gandalf",
        startIndex: 6,
        endIndex: 14,
      });
    });

    it("returns correct positions for bracketed mentions", () => {
      const result = parseMentionsWithPositions("Met @[Gandalf the Grey] today");
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: "title",
        value: "Gandalf the Grey",
        startIndex: 4,
        endIndex: 23,
      });
    });

    it("returns correct positions for ID-based mentions", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const result = parseMentionsWithPositions(`See @{${uuid}} for details`);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: "id",
        value: uuid,
        startIndex: 4,
        endIndex: 43, // @{ (2) + uuid (36) + } (1) = 39 chars, starting at 4
      });
    });
  });

  describe("extractSnippet", () => {
    it("extracts words before and after the mention", () => {
      const content = "The wise wizard Gandalf cast a powerful spell on the mountain";
      // Simulating mention at "Gandalf" position (indices 16-23)
      const snippet = extractSnippet(content, 16, 23, 3);
      expect(snippet).toContain("wizard");
      expect(snippet).toContain("Gandalf");
      expect(snippet).toContain("cast");
    });

    it("handles mention at start of content", () => {
      const content = "Gandalf arrived at the Shire early that morning";
      const snippet = extractSnippet(content, 0, 7, 3);
      expect(snippet).toContain("Gandalf");
      expect(snippet).toContain("arrived");
    });

    it("handles mention at end of content", () => {
      const content = "The hero of the story was Gandalf";
      const snippet = extractSnippet(content, 26, 33, 3);
      expect(snippet).toContain("story");
      expect(snippet).toContain("Gandalf");
    });

    it("adds ellipsis when content is truncated", () => {
      const content =
        "Once upon a time in a land far away there lived a wizard named Gandalf who was very wise and powerful";
      const snippet = extractSnippet(content, 63, 70, 3);
      expect(snippet).toMatch(/\.\.\./);
    });
  });

  describe("resolveCanvasItemLinks", () => {
    beforeAll(async () => {
      await setupTestDb();
    });

    beforeEach(async () => {
      await truncateAllTables();
    });

    afterAll(async () => {
      await teardownTestDb();
    });

    it("creates links to existing items", async () => {
      const source = await createItem({ type: "person", title: "Frodo" }, DEFAULT_CANVAS_ID);
      await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);

      const resolved = await resolveCanvasItemLinks(source.id, "I met @Gandalf today");

      expect(resolved).toHaveLength(1);
      expect(resolved[0]?.title).toBe("Gandalf");
      expect(resolved[0]?.created).toBe(false);

      // Verify the link exists in the DB
      const db = getDb();
      const links = await db
        .select()
        .from(canvasItemLinks)
        .where(eq(canvasItemLinks.source_item_id, source.id));
      expect(links).toHaveLength(1);
    });

    it("stores snippet in canvas_item_links", async () => {
      const source = await createItem({ type: "person", title: "Frodo" }, DEFAULT_CANVAS_ID);
      await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);

      await resolveCanvasItemLinks(source.id, "The wise wizard @Gandalf helped me on my journey");

      const db = getDb();
      const [link] = await db
        .select()
        .from(canvasItemLinks)
        .where(eq(canvasItemLinks.source_item_id, source.id));

      expect(link?.snippet).toBeDefined();
      expect(link?.snippet).toContain("Gandalf");
    });

    it("auto-creates items on the same canvas as the source", async () => {
      const source = await createItem({ type: "person", title: "Frodo" }, DEFAULT_CANVAS_ID);

      const resolved = await resolveCanvasItemLinks(source.id, "Going to @Rivendell");

      expect(resolved).toHaveLength(1);
      expect(resolved[0]?.title).toBe("Rivendell");
      expect(resolved[0]?.created).toBe(true);

      // Verify the new item inherits source's canvas_id and is type 'person'
      const db = getDb();
      const [newItem] = await db
        .select()
        .from(canvasItems)
        .where(eq(canvasItems.id, resolved[0]?.targetItemId));
      expect(newItem?.type).toBe("person");
      expect(newItem?.title).toBe("Rivendell");
      expect(newItem?.canvas_id).toBe(DEFAULT_CANVAS_ID);
    });

    it("removes stale links when mentions are removed", async () => {
      const source = await createItem({ type: "person", title: "Frodo" }, DEFAULT_CANVAS_ID);
      await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      await createItem({ type: "place", title: "Shire" }, DEFAULT_CANVAS_ID);

      // First, link to both
      await resolveCanvasItemLinks(source.id, "@Gandalf in @Shire");

      const db = getDb();
      let links = await db
        .select()
        .from(canvasItemLinks)
        .where(eq(canvasItemLinks.source_item_id, source.id));
      expect(links).toHaveLength(2);

      // Now remove Shire mention
      await resolveCanvasItemLinks(source.id, "@Gandalf alone");

      links = await db
        .select()
        .from(canvasItemLinks)
        .where(eq(canvasItemLinks.source_item_id, source.id));
      expect(links).toHaveLength(1);
    });

    it("is case-insensitive when matching titles", async () => {
      const source = await createItem({ type: "person", title: "Frodo" }, DEFAULT_CANVAS_ID);
      await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);

      const resolved = await resolveCanvasItemLinks(source.id, "Met @gandalf");
      expect(resolved[0]?.created).toBe(false);
    });

    it("does not link an item to itself", async () => {
      const source = await createItem({ type: "person", title: "Frodo" }, DEFAULT_CANVAS_ID);

      await resolveCanvasItemLinks(source.id, "I am @Frodo");

      const db = getDb();
      const links = await db
        .select()
        .from(canvasItemLinks)
        .where(eq(canvasItemLinks.source_item_id, source.id));
      expect(links).toHaveLength(0);
    });

    it("links to existing item by ID", async () => {
      const source = await createItem({ type: "person", title: "Frodo" }, DEFAULT_CANVAS_ID);
      const target = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);

      const resolved = await resolveCanvasItemLinks(source.id, `See @{${target.id}} for help`);

      expect(resolved).toHaveLength(1);
      expect(resolved[0]?.targetItemId).toBe(target.id);
      expect(resolved[0]?.created).toBe(false);
    });

    it("skips ID-based mentions that do not exist", async () => {
      const source = await createItem({ type: "person", title: "Frodo" }, DEFAULT_CANVAS_ID);
      const nonExistentId = "00000000-0000-0000-0000-000000000000";

      const resolved = await resolveCanvasItemLinks(source.id, `See @{${nonExistentId}} for help`);

      expect(resolved).toHaveLength(0);
    });
  });
});
