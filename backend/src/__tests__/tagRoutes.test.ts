import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { handler as assignHandler, validate as assignValidate } from "../routes/tags/assign.js";
import { handler as createHandler, validate as createValidate } from "../routes/tags/create.js";
import { handler as deleteHandler, validate as deleteValidate } from "../routes/tags/delete.js";
import { handler as listHandler } from "../routes/tags/list.js";
import { handler as removeHandler, validate as removeValidate } from "../routes/tags/remove.js";
import { handler as updateHandler, validate as updateValidate } from "../routes/tags/update.js";
import {
  createItem,
  DEFAULT_CANVAS_ID,
  getItem,
  listItems,
} from "../services/canvasItemService.js";
import { createTag } from "../services/tagService.js";
import { setupTestDb, TEST_USER_ID, teardownTestDb, truncateAllTables } from "./helpers/setup.js";

function createMockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as import("express").Response;
}

function createMockReq(overrides: Record<string, unknown> = {}) {
  return {
    params: {},
    query: {},
    body: {},
    ...overrides,
  } as unknown as import("express").Request;
}

describe("tag routes", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe("create", () => {
    it("validate returns null and sends 400 when name is missing", () => {
      const res = createMockRes();
      const req = createMockReq({
        body: { icon: "Star", color: "#f9e2af" },
        params: { canvasId: DEFAULT_CANVAS_ID },
      });
      expect(createValidate(req, res)).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("handler creates tag and returns 201", async () => {
      const req = createMockReq({
        body: { name: "Important", icon: "Star", color: "#f9e2af" },
        params: { canvasId: DEFAULT_CANVAS_ID },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await createHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
      expect(jsonArg.data.name).toBe("Important");
    });
  });

  describe("list", () => {
    it("handler returns tags for canvas in success envelope", async () => {
      await createTag({ name: "Tag1", icon: "Star", color: "#f9e2af" }, DEFAULT_CANVAS_ID);
      await createTag({ name: "Tag2", icon: "Flag", color: "#f38ba8" }, DEFAULT_CANVAS_ID);

      const req = createMockReq({
        params: { canvasId: DEFAULT_CANVAS_ID },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await listHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
      expect(jsonArg.data).toHaveLength(2);
    });
  });

  describe("update", () => {
    it("validate returns null for invalid UUID", () => {
      const res = createMockRes();
      const req = createMockReq({ params: { tagId: "bad" }, body: { name: "New" } });
      expect(updateValidate(req as import("express").Request<{ tagId: string }>, res)).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("handler returns 403 for non-existent tag", async () => {
      const req = createMockReq({
        params: { tagId: "550e8400-e29b-41d4-a716-446655440000" },
        body: { name: "New" },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await updateHandler(req as import("express").Request<{ tagId: string }>, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("handler updates tag and returns success", async () => {
      const tag = await createTag(
        { name: "Important", icon: "Star", color: "#f9e2af" },
        DEFAULT_CANVAS_ID,
      );
      const req = createMockReq({
        params: { tagId: tag.id },
        body: { name: "Critical" },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await updateHandler(req as import("express").Request<{ tagId: string }>, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.data.name).toBe("Critical");
    });
  });

  describe("delete", () => {
    it("validate returns null for invalid UUID", () => {
      const res = createMockRes();
      const req = createMockReq({ params: { tagId: "bad" } });
      expect(deleteValidate(req as import("express").Request<{ tagId: string }>, res)).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("handler deletes tag and returns success", async () => {
      const tag = await createTag(
        { name: "Important", icon: "Star", color: "#f9e2af" },
        DEFAULT_CANVAS_ID,
      );
      const req = createMockReq({
        params: { tagId: tag.id },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await deleteHandler(req as import("express").Request<{ tagId: string }>, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
    });

    it("handler returns 403 for non-existent tag", async () => {
      const req = createMockReq({
        params: { tagId: "550e8400-e29b-41d4-a716-446655440000" },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await deleteHandler(req as import("express").Request<{ tagId: string }>, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("assign", () => {
    it("validate returns null for invalid UUIDs", () => {
      const res = createMockRes();
      const req = createMockReq({ params: { itemId: "bad", tagId: "bad" } });
      expect(
        assignValidate(req as import("express").Request<{ itemId: string; tagId: string }>, res),
      ).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("handler assigns tag to item and returns 201", async () => {
      const tag = await createTag(
        { name: "Important", icon: "Star", color: "#f9e2af" },
        DEFAULT_CANVAS_ID,
      );
      const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);

      const req = createMockReq({
        params: { itemId: item.id, tagId: tag.id },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await assignHandler(req as import("express").Request<{ itemId: string; tagId: string }>, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
    });
  });

  describe("remove", () => {
    it("validate returns null for invalid UUIDs", () => {
      const res = createMockRes();
      const req = createMockReq({ params: { itemId: "bad", tagId: "bad" } });
      expect(
        removeValidate(req as import("express").Request<{ itemId: string; tagId: string }>, res),
      ).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("handler removes tag from item and returns success", async () => {
      const tag = await createTag(
        { name: "Important", icon: "Star", color: "#f9e2af" },
        DEFAULT_CANVAS_ID,
      );
      const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);

      // First assign, then remove
      const assignReq = createMockReq({
        params: { itemId: item.id, tagId: tag.id },
        user: { userId: TEST_USER_ID },
      });
      const assignRes = createMockRes();
      await assignHandler(
        assignReq as import("express").Request<{ itemId: string; tagId: string }>,
        assignRes,
      );

      const req = createMockReq({
        params: { itemId: item.id, tagId: tag.id },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await removeHandler(req as import("express").Request<{ itemId: string; tagId: string }>, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
    });
  });

  describe("getItem returns tags", () => {
    it("includes tags array in getItem response", async () => {
      const tag = await createTag(
        { name: "Important", icon: "Star", color: "#f9e2af" },
        DEFAULT_CANVAS_ID,
      );
      const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);

      // Assign the tag
      const assignReq = createMockReq({
        params: { itemId: item.id, tagId: tag.id },
        user: { userId: TEST_USER_ID },
      });
      const assignRes = createMockRes();
      await assignHandler(
        assignReq as import("express").Request<{ itemId: string; tagId: string }>,
        assignRes,
      );

      const fullItem = await getItem(item.id);
      expect(fullItem?.tags).toHaveLength(1);
      expect(fullItem?.tags[0]?.name).toBe("Important");
    });
  });

  describe("listItems returns tag_ids", () => {
    it("includes tag_ids in item summaries", async () => {
      const tag = await createTag(
        { name: "Important", icon: "Star", color: "#f9e2af" },
        DEFAULT_CANVAS_ID,
      );
      const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);

      // Assign the tag
      const assignReq = createMockReq({
        params: { itemId: item.id, tagId: tag.id },
        user: { userId: TEST_USER_ID },
      });
      const assignRes = createMockRes();
      await assignHandler(
        assignReq as import("express").Request<{ itemId: string; tagId: string }>,
        assignRes,
      );

      const items = await listItems(DEFAULT_CANVAS_ID);
      const gandalf = items.find((i) => i.id === item.id);
      expect(gandalf?.tag_ids).toEqual([tag.id]);
    });
  });
});
