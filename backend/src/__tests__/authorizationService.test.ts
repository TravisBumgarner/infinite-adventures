import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  getCanvasIdForItem,
  getCanvasIdForNote,
  getCanvasIdForPhoto,
  getCanvasIdForTag,
  userOwnsCanvas,
  userOwnsResource,
} from "../services/authorizationService.js";
import { createItem, DEFAULT_CANVAS_ID, getItemContentId } from "../services/canvasItemService.js";
import { createNote } from "../services/noteService.js";
import { uploadPhoto } from "../services/photoService.js";
import { createTag } from "../services/tagService.js";
import { setupTestDb, TEST_USER_ID, teardownTestDb, truncateAllTables } from "./helpers/setup.js";

const OTHER_USER_ID = "other-user-0000-0000-000000000002";

describe("authorizationService", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe("userOwnsCanvas", () => {
    it("returns true when user owns the canvas", async () => {
      expect(await userOwnsCanvas(TEST_USER_ID, DEFAULT_CANVAS_ID)).toBe(true);
    });

    it("returns false when user does not own the canvas", async () => {
      expect(await userOwnsCanvas(OTHER_USER_ID, DEFAULT_CANVAS_ID)).toBe(false);
    });

    it("returns false for non-existent canvas", async () => {
      expect(await userOwnsCanvas(TEST_USER_ID, "550e8400-e29b-41d4-a716-446655440000")).toBe(
        false,
      );
    });
  });

  describe("getCanvasIdForItem", () => {
    it("returns canvas ID for existing item", async () => {
      const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      expect(await getCanvasIdForItem(item.id)).toBe(DEFAULT_CANVAS_ID);
    });

    it("returns null for non-existent item", async () => {
      expect(await getCanvasIdForItem("550e8400-e29b-41d4-a716-446655440000")).toBeNull();
    });
  });

  describe("getCanvasIdForNote", () => {
    it("returns canvas ID for existing note", async () => {
      const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      const note = await createNote(item.id, {});
      expect(await getCanvasIdForNote(note.id)).toBe(DEFAULT_CANVAS_ID);
    });

    it("returns null for non-existent note", async () => {
      expect(await getCanvasIdForNote("550e8400-e29b-41d4-a716-446655440000")).toBeNull();
    });
  });

  describe("getCanvasIdForPhoto", () => {
    it("returns canvas ID for existing photo", async () => {
      const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      const contentId = await getItemContentId(item.id);
      const photo = await uploadPhoto({
        content_type: "person",
        content_id: contentId!,
        original_name: "test.jpg",
        mime_type: "image/jpeg",
        buffer: Buffer.from("fake"),
      });
      expect(await getCanvasIdForPhoto(photo.id)).toBe(DEFAULT_CANVAS_ID);
    });

    it("returns null for non-existent photo", async () => {
      expect(await getCanvasIdForPhoto("550e8400-e29b-41d4-a716-446655440000")).toBeNull();
    });
  });

  describe("getCanvasIdForTag", () => {
    it("returns canvas ID for existing tag", async () => {
      const tag = await createTag({ name: "Hero", icon: "star", color: "#ff0" }, DEFAULT_CANVAS_ID);
      expect(await getCanvasIdForTag(tag.id)).toBe(DEFAULT_CANVAS_ID);
    });

    it("returns null for non-existent tag", async () => {
      expect(await getCanvasIdForTag("550e8400-e29b-41d4-a716-446655440000")).toBeNull();
    });
  });

  describe("userOwnsResource", () => {
    it("returns canvasId when user owns the item's canvas", async () => {
      const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      expect(await userOwnsResource(TEST_USER_ID, "item", item.id)).toBe(DEFAULT_CANVAS_ID);
    });

    it("returns null when user does not own the item's canvas", async () => {
      const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      expect(await userOwnsResource(OTHER_USER_ID, "item", item.id)).toBeNull();
    });

    it("returns null for non-existent resource", async () => {
      expect(
        await userOwnsResource(TEST_USER_ID, "note", "550e8400-e29b-41d4-a716-446655440000"),
      ).toBeNull();
    });
  });
});
