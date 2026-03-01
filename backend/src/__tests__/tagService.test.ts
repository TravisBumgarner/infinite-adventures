import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createItem, DEFAULT_CANVAS_ID } from "../services/canvasItemService.js";
import { createCanvas } from "../services/canvasService.js";
import {
  addTagToItem,
  createTag,
  deleteTag,
  getTag,
  listTagIdsForItem,
  listTags,
  listTagsForItem,
  removeTagFromItem,
  updateTag,
} from "../services/tagService.js";
import { setupTestDb, TEST_USER_ID, teardownTestDb, truncateAllTables } from "./helpers/setup.js";

describe("tagService", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe("createTag", () => {
    it("creates a tag and returns it", async () => {
      const tag = await createTag(
        { name: "Important", icon: "Star", color: "#f9e2af" },
        DEFAULT_CANVAS_ID,
      );

      expect(tag.id).toBeDefined();
      expect(tag.name).toBe("Important");
      expect(tag.icon).toBe("Star");
      expect(tag.color).toBe("#f9e2af");
    });
  });

  describe("listTags", () => {
    it("returns empty array when no tags exist", async () => {
      const result = await listTags(DEFAULT_CANVAS_ID);
      expect(result).toEqual([]);
    });

    it("returns only tags for the specified canvas", async () => {
      await createTag({ name: "Tag1", icon: "Star", color: "#f9e2af" }, DEFAULT_CANVAS_ID);
      await createTag({ name: "Tag2", icon: "Flag", color: "#f38ba8" }, DEFAULT_CANVAS_ID);
      const otherCanvas = await createCanvas("Other Canvas", TEST_USER_ID);
      await createTag({ name: "Other", icon: "Home", color: "#89b4fa" }, otherCanvas.id);

      const result = await listTags(DEFAULT_CANVAS_ID);
      expect(result).toHaveLength(2);
      expect(result.map((t) => t.name).sort()).toEqual(["Tag1", "Tag2"]);
    });
  });

  describe("getTag", () => {
    it("returns tag by id", async () => {
      const created = await createTag(
        { name: "Important", icon: "Star", color: "#f9e2af" },
        DEFAULT_CANVAS_ID,
      );

      const tag = await getTag(created.id);
      expect(tag).not.toBeNull();
      expect(tag?.name).toBe("Important");
    });

    it("returns null for non-existent id", async () => {
      const tag = await getTag("00000000-0000-4000-8000-ffffffffffff");
      expect(tag).toBeNull();
    });
  });

  describe("updateTag", () => {
    it("updates tag fields", async () => {
      const created = await createTag(
        { name: "Important", icon: "Star", color: "#f9e2af" },
        DEFAULT_CANVAS_ID,
      );

      const updated = await updateTag(created.id, { name: "Critical", color: "#f38ba8" });
      expect(updated?.name).toBe("Critical");
      expect(updated?.color).toBe("#f38ba8");
      expect(updated?.icon).toBe("Star"); // unchanged
    });

    it("returns null for non-existent id", async () => {
      const result = await updateTag("00000000-0000-4000-8000-ffffffffffff", { name: "Nope" });
      expect(result).toBeNull();
    });
  });

  describe("deleteTag", () => {
    it("deletes an existing tag", async () => {
      const created = await createTag(
        { name: "Important", icon: "Star", color: "#f9e2af" },
        DEFAULT_CANVAS_ID,
      );

      const result = await deleteTag(created.id);
      expect(result).toBe(true);
      expect(await getTag(created.id)).toBeNull();
    });

    it("returns false for non-existent id", async () => {
      const result = await deleteTag("00000000-0000-4000-8000-ffffffffffff");
      expect(result).toBe(false);
    });
  });

  describe("addTagToItem / removeTagFromItem", () => {
    it("assigns a tag to an item and removes it", async () => {
      const tag = await createTag(
        { name: "Important", icon: "Star", color: "#f9e2af" },
        DEFAULT_CANVAS_ID,
      );
      const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);

      await addTagToItem(item.id, tag.id);
      const tagsOnItem = await listTagsForItem(item.id);
      expect(tagsOnItem).toHaveLength(1);
      expect(tagsOnItem[0]?.id).toBe(tag.id);

      const removed = await removeTagFromItem(item.id, tag.id);
      expect(removed).toBe(true);
      expect(await listTagsForItem(item.id)).toHaveLength(0);
    });

    it("handles duplicate assignment gracefully", async () => {
      const tag = await createTag(
        { name: "Important", icon: "Star", color: "#f9e2af" },
        DEFAULT_CANVAS_ID,
      );
      const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);

      await addTagToItem(item.id, tag.id);
      await addTagToItem(item.id, tag.id); // duplicate — should not throw

      const tagsOnItem = await listTagsForItem(item.id);
      expect(tagsOnItem).toHaveLength(1);
    });

    it("removeTagFromItem returns false when association does not exist", async () => {
      const result = await removeTagFromItem(
        "00000000-0000-4000-8000-fffffffffff1",
        "00000000-0000-4000-8000-fffffffffff2",
      );
      expect(result).toBe(false);
    });
  });

  describe("listTagsForItem", () => {
    it("returns full tag objects for an item", async () => {
      const tag1 = await createTag(
        { name: "Important", icon: "Star", color: "#f9e2af" },
        DEFAULT_CANVAS_ID,
      );
      const tag2 = await createTag(
        { name: "Urgent", icon: "Flag", color: "#f38ba8" },
        DEFAULT_CANVAS_ID,
      );
      const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);

      await addTagToItem(item.id, tag1.id);
      await addTagToItem(item.id, tag2.id);

      const result = await listTagsForItem(item.id);
      expect(result).toHaveLength(2);
      expect(result.map((t) => t.name).sort()).toEqual(["Important", "Urgent"]);
    });
  });

  describe("listTagIdsForItem", () => {
    it("returns tag ids for an item", async () => {
      const tag = await createTag(
        { name: "Important", icon: "Star", color: "#f9e2af" },
        DEFAULT_CANVAS_ID,
      );
      const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);

      await addTagToItem(item.id, tag.id);

      const ids = await listTagIdsForItem(item.id);
      expect(ids).toEqual([tag.id]);
    });

    it("returns empty array when item has no tags", async () => {
      const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      const ids = await listTagIdsForItem(item.id);
      expect(ids).toEqual([]);
    });
  });
});
