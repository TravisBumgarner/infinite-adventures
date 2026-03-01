import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createItem, DEFAULT_CANVAS_ID } from "../services/canvasItemService.js";
import {
  createShare,
  deleteShare,
  getShareById,
  getShareByToken,
  listSharesByCanvas,
} from "../services/shareService.js";
import { setupTestDb, TEST_USER_ID, teardownTestDb, truncateAllTables } from "./helpers/setup.js";

describe("shareService", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe("createShare", () => {
    it("creates a canvas-level share", async () => {
      const share = await createShare(DEFAULT_CANVAS_ID, null, TEST_USER_ID);

      expect(share.canvasId).toBe(DEFAULT_CANVAS_ID);
      expect(share.itemId).toBeNull();
      expect(share.token).toBeTruthy();
      expect(share.createdBy).toBe(TEST_USER_ID);
    });

    it("creates an item-level share", async () => {
      const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      const share = await createShare(DEFAULT_CANVAS_ID, item.id, TEST_USER_ID);

      expect(share.canvasId).toBe(DEFAULT_CANVAS_ID);
      expect(share.itemId).toBe(item.id);
    });

    it("returns existing share for same canvas+item combo", async () => {
      const first = await createShare(DEFAULT_CANVAS_ID, null, TEST_USER_ID);
      const second = await createShare(DEFAULT_CANVAS_ID, null, TEST_USER_ID);

      expect(second.id).toBe(first.id);
      expect(second.token).toBe(first.token);
    });

    it("creates separate shares for canvas vs item on same canvas", async () => {
      const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      const canvasShare = await createShare(DEFAULT_CANVAS_ID, null, TEST_USER_ID);
      const itemShare = await createShare(DEFAULT_CANVAS_ID, item.id, TEST_USER_ID);

      expect(canvasShare.id).not.toBe(itemShare.id);
    });
  });

  describe("listSharesByCanvas", () => {
    it("returns all shares for a canvas with item metadata", async () => {
      const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      await createShare(DEFAULT_CANVAS_ID, null, TEST_USER_ID);
      await createShare(DEFAULT_CANVAS_ID, item.id, TEST_USER_ID);

      const shares = await listSharesByCanvas(DEFAULT_CANVAS_ID);

      expect(shares).toHaveLength(2);
      const itemShare = shares.find((s) => s.itemId != null);
      expect(itemShare?.itemTitle).toBe("Gandalf");
      expect(itemShare?.itemType).toBe("person");
    });

    it("returns empty array when no shares exist", async () => {
      const shares = await listSharesByCanvas(DEFAULT_CANVAS_ID);
      expect(shares).toHaveLength(0);
    });
  });

  describe("getShareByToken", () => {
    it("returns share when token is valid", async () => {
      const created = await createShare(DEFAULT_CANVAS_ID, null, TEST_USER_ID);
      const found = await getShareByToken(created.token);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
    });

    it("returns null for invalid token", async () => {
      const found = await getShareByToken("nonexistent-token");
      expect(found).toBeNull();
    });
  });

  describe("getShareById", () => {
    it("returns share by id", async () => {
      const created = await createShare(DEFAULT_CANVAS_ID, null, TEST_USER_ID);
      const found = await getShareById(created.id);

      expect(found).not.toBeNull();
      expect(found!.token).toBe(created.token);
    });

    it("returns null for non-existent id", async () => {
      const found = await getShareById("00000000-0000-4000-8000-ffffffffffff");
      expect(found).toBeNull();
    });
  });

  describe("deleteShare", () => {
    it("deletes an existing share", async () => {
      const created = await createShare(DEFAULT_CANVAS_ID, null, TEST_USER_ID);
      const deleted = await deleteShare(created.id);

      expect(deleted).toBe(true);
      expect(await getShareById(created.id)).toBeNull();
    });

    it("returns false for non-existent share", async () => {
      const deleted = await deleteShare("00000000-0000-4000-8000-ffffffffffff");
      expect(deleted).toBe(false);
    });
  });
});
