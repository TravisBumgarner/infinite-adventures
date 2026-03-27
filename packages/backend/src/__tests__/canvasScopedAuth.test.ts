import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { handler as createItemHandler } from "../routes/items/create.js";
import { handler as listItemsHandler } from "../routes/items/list.js";
import { handler as searchItemsHandler } from "../routes/items/search.js";
import { handler as listSessionsHandler } from "../routes/sessions/list.js";
import { handler as createTagHandler } from "../routes/tags/create.js";
import { handler as listTagsHandler } from "../routes/tags/list.js";
import { DEFAULT_CANVAS_ID } from "../services/canvasItemService.js";
import { setupTestDb, teardownTestDb, truncateAllTables } from "./helpers/setup.js";

const OTHER_USER_ID = "00000000-0000-4000-8000-000000000002";

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

describe("canvas-scoped route authorization", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe("returns 403 when user does not own the canvas", () => {
    it("items/list", async () => {
      const req = createMockReq({
        params: { canvasId: DEFAULT_CANVAS_ID },
        user: { userId: OTHER_USER_ID },
      });
      const res = createMockRes();
      await listItemsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(false);
      expect(jsonArg.errorCode).toBe("FORBIDDEN");
    });

    it("items/create", async () => {
      const req = createMockReq({
        params: { canvasId: DEFAULT_CANVAS_ID },
        body: { type: "person", title: "Gandalf" },
        user: { userId: OTHER_USER_ID },
      });
      const res = createMockRes();
      await createItemHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.errorCode).toBe("FORBIDDEN");
    });

    it("items/search", async () => {
      const req = createMockReq({
        params: { canvasId: DEFAULT_CANVAS_ID },
        query: { q: "test" },
        user: { userId: OTHER_USER_ID },
      });
      const res = createMockRes();
      await searchItemsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.errorCode).toBe("FORBIDDEN");
    });

    it("tags/list", async () => {
      const req = createMockReq({
        params: { canvasId: DEFAULT_CANVAS_ID },
        user: { userId: OTHER_USER_ID },
      });
      const res = createMockRes();
      await listTagsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.errorCode).toBe("FORBIDDEN");
    });

    it("tags/create", async () => {
      const req = createMockReq({
        params: { canvasId: DEFAULT_CANVAS_ID },
        body: { name: "Hero", icon: "star", color: "#ff0" },
        user: { userId: OTHER_USER_ID },
      });
      const res = createMockRes();
      await createTagHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.errorCode).toBe("FORBIDDEN");
    });

    it("sessions/list", async () => {
      const req = createMockReq({
        params: { canvasId: DEFAULT_CANVAS_ID },
        user: { userId: OTHER_USER_ID },
      });
      const res = createMockRes();
      await listSessionsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.errorCode).toBe("FORBIDDEN");
    });
  });

  describe("returns 401 when no user is authenticated", () => {
    it("items/list without user", async () => {
      const req = createMockReq({
        params: { canvasId: DEFAULT_CANVAS_ID },
      });
      const res = createMockRes();
      await listItemsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.errorCode).toBe("UNAUTHORIZED");
    });
  });
});
