import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createItem, DEFAULT_CANVAS_ID } from "../services/canvasItemService.js";
import { createShare } from "../services/shareService.js";
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

describe("share routes", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe("POST /api/shares (create)", () => {
    it("creates a canvas-level share and returns 201", async () => {
      const { handler } = await import("../routes/shares/create.js");
      const req = createMockReq({
        body: { canvasId: DEFAULT_CANVAS_ID },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
      expect(jsonArg.data.canvasId).toBe(DEFAULT_CANVAS_ID);
      expect(jsonArg.data.token).toBeTruthy();
    });

    it("creates an item-level share and returns 201", async () => {
      const { handler } = await import("../routes/shares/create.js");
      const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      const req = createMockReq({
        body: { canvasId: DEFAULT_CANVAS_ID, itemId: item.id },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.data.itemId).toBe(item.id);
    });

    it("returns 401 when not authenticated", async () => {
      const { handler } = await import("../routes/shares/create.js");
      const req = createMockReq({
        body: { canvasId: DEFAULT_CANVAS_ID },
      });
      const res = createMockRes();
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("returns 403 when user does not own canvas", async () => {
      const { handler } = await import("../routes/shares/create.js");
      const req = createMockReq({
        body: { canvasId: DEFAULT_CANVAS_ID },
        user: { userId: "00000000-0000-4000-8000-000000000099" },
      });
      const res = createMockRes();
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("GET /api/shares (list)", () => {
    it("returns shares for the canvas", async () => {
      const { handler } = await import("../routes/shares/list.js");
      await createShare(DEFAULT_CANVAS_ID, null, TEST_USER_ID);

      const req = createMockReq({
        query: { canvasId: DEFAULT_CANVAS_ID },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
      expect(jsonArg.data).toHaveLength(1);
    });

    it("returns 400 for invalid canvasId query param", async () => {
      const { handler } = await import("../routes/shares/list.js");
      const req = createMockReq({
        query: { canvasId: "not-a-uuid" },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 403 when user does not own canvas", async () => {
      const { handler } = await import("../routes/shares/list.js");
      const req = createMockReq({
        query: { canvasId: DEFAULT_CANVAS_ID },
        user: { userId: "00000000-0000-4000-8000-000000000099" },
      });
      const res = createMockRes();
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("DELETE /api/shares/:id", () => {
    it("deletes an existing share", async () => {
      const { handler } = await import("../routes/shares/deleteShare.js");
      const share = await createShare(DEFAULT_CANVAS_ID, null, TEST_USER_ID);

      const req = createMockReq({
        params: { id: share.id },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await handler(req as import("express").Request<{ id: string }>, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
    });

    it("returns 404 for non-existent share", async () => {
      const { handler } = await import("../routes/shares/deleteShare.js");
      const req = createMockReq({
        params: { id: "00000000-0000-4000-8000-ffffffffffff" },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await handler(req as import("express").Request<{ id: string }>, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 403 when user does not own the canvas", async () => {
      const { handler } = await import("../routes/shares/deleteShare.js");
      const share = await createShare(DEFAULT_CANVAS_ID, null, TEST_USER_ID);

      const req = createMockReq({
        params: { id: share.id },
        user: { userId: "00000000-0000-4000-8000-000000000099" },
      });
      const res = createMockRes();
      await handler(req as import("express").Request<{ id: string }>, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
