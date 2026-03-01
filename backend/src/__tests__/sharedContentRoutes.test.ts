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
    headers: {},
    ...overrides,
  } as unknown as import("express").Request;
}

describe("shared content routes", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe("GET /api/shared/:token (view)", () => {
    it("returns canvas-level shared content", async () => {
      const { handler } = await import("../routes/shared-content/view.js");
      await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      const share = await createShare(DEFAULT_CANVAS_ID, null, TEST_USER_ID);

      const req = createMockReq({ params: { token: share.token } });
      const res = createMockRes();
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
      expect(jsonArg.data.shareType).toBe("canvas");
      expect(jsonArg.data.canvasName).toBe("Default");
      expect(jsonArg.data.items).toHaveLength(1);
      expect(jsonArg.data.tags).toBeDefined();
    });

    it("returns item-level shared content", async () => {
      const { handler } = await import("../routes/shared-content/view.js");
      const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      const share = await createShare(DEFAULT_CANVAS_ID, item.id, TEST_USER_ID);

      const req = createMockReq({ params: { token: share.token } });
      const res = createMockRes();
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
      expect(jsonArg.data.shareType).toBe("item");
      expect(jsonArg.data.canvasName).toBe("Default");
      expect(jsonArg.data.item.title).toBe("Gandalf");
    });

    it("returns 404 for invalid token", async () => {
      const { handler } = await import("../routes/shared-content/view.js");
      const req = createMockReq({
        params: { token: "00000000-0000-4000-8000-ffffffffffff" },
      });
      const res = createMockRes();
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 400 for non-UUID token", async () => {
      const { handler } = await import("../routes/shared-content/view.js");
      const req = createMockReq({ params: { token: "not-a-uuid" } });
      const res = createMockRes();
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("POST /api/shared/:token/copy", () => {
    it("copies canvas into user workspace", async () => {
      const { handler } = await import("../routes/shared-content/copy.js");
      await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      const share = await createShare(DEFAULT_CANVAS_ID, null, TEST_USER_ID);

      const req = createMockReq({
        params: { token: share.token },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
      expect(jsonArg.data.id).toBeTruthy();
      expect(jsonArg.data.name).toBeTruthy();
    });

    it("returns 401 when not authenticated", async () => {
      const { handler } = await import("../routes/shared-content/copy.js");
      const share = await createShare(DEFAULT_CANVAS_ID, null, TEST_USER_ID);

      const req = createMockReq({ params: { token: share.token } });
      const res = createMockRes();
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("returns 404 for invalid token", async () => {
      const { handler } = await import("../routes/shared-content/copy.js");
      const req = createMockReq({
        params: { token: "00000000-0000-4000-8000-ffffffffffff" },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
