import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { handler as listHandler, validate as listValidate } from "../routes/sessions/list.js";
import { createItem, DEFAULT_CANVAS_ID, listSessions } from "../services/canvasItemService.js";
import { createCanvas } from "../services/canvasService.js";
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

describe("sessions", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe("listSessions", () => {
    it("returns empty array when no sessions exist", async () => {
      const result = await listSessions(DEFAULT_CANVAS_ID);
      expect(result).toEqual([]);
    });

    it("returns only session-type items", async () => {
      await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      await createItem(
        { type: "session", title: "Session One", sessionDate: "2025-06-15" },
        DEFAULT_CANVAS_ID,
      );

      const result = await listSessions(DEFAULT_CANVAS_ID);
      expect(result).toHaveLength(1);
      expect(result[0]!.title).toBe("Session One");
    });

    it("returns sessions sorted by sessionDate descending", async () => {
      await createItem(
        { type: "session", title: "Older Session", sessionDate: "2025-01-01" },
        DEFAULT_CANVAS_ID,
      );
      await createItem(
        { type: "session", title: "Newer Session", sessionDate: "2025-06-15" },
        DEFAULT_CANVAS_ID,
      );

      const result = await listSessions(DEFAULT_CANVAS_ID);
      expect(result).toHaveLength(2);
      expect(result[0]!.title).toBe("Newer Session");
      expect(result[1]!.title).toBe("Older Session");
    });

    it("returns sessions for the specified canvas only", async () => {
      const otherCanvas = await createCanvas("Other Canvas", TEST_USER_ID);
      await createItem(
        { type: "session", title: "Session A", sessionDate: "2025-06-15" },
        DEFAULT_CANVAS_ID,
      );
      await createItem(
        { type: "session", title: "Session B", sessionDate: "2025-06-15" },
        otherCanvas.id,
      );

      const result = await listSessions(DEFAULT_CANVAS_ID);
      expect(result).toHaveLength(1);
      expect(result[0]!.title).toBe("Session A");
    });

    it("includes sessionDate and createdAt in response", async () => {
      await createItem(
        { type: "session", title: "Session One", sessionDate: "2025-06-15" },
        DEFAULT_CANVAS_ID,
      );

      const result = await listSessions(DEFAULT_CANVAS_ID);
      expect(result[0]!.sessionDate).toBe("2025-06-15");
      expect(result[0]!.createdAt).toBeDefined();
    });
  });

  describe("list route", () => {
    it("validate returns context with canvasId", () => {
      const res = createMockRes();
      const req = createMockReq({ params: { canvasId: DEFAULT_CANVAS_ID } });
      const context = listValidate(req, res);
      expect(context).toEqual({ canvasId: DEFAULT_CANVAS_ID });
    });

    it("handler returns sessions in success envelope", async () => {
      await createItem(
        { type: "session", title: "Session One", sessionDate: "2025-06-15" },
        DEFAULT_CANVAS_ID,
      );

      const req = createMockReq({
        params: { canvasId: DEFAULT_CANVAS_ID },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await listHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
      expect(jsonArg.data).toHaveLength(1);
      expect(jsonArg.data[0].title).toBe("Session One");
    });

    it("handler returns empty array when no sessions exist", async () => {
      const req = createMockReq({
        params: { canvasId: DEFAULT_CANVAS_ID },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await listHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.data).toEqual([]);
    });
  });
});
