import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { validate as exportValidate } from "../routes/canvases/export.js";
import {
  processRequest as importProcessRequest,
  validate as importValidate,
} from "../routes/canvases/import.js";
import {
  setupTestDb,
  TEST_USER_AUTH_ID,
  TEST_USER_ID,
  teardownTestDb,
  truncateAllTables,
} from "./helpers/setup.js";

function createMockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return res as unknown as import("express").Response;
}

function createMockReq(overrides: Record<string, unknown> = {}) {
  return {
    params: {},
    query: {},
    body: {},
    user: { authId: TEST_USER_AUTH_ID, userId: TEST_USER_ID, email: "test@example.com" },
    ...overrides,
  } as unknown as import("express").Request;
}

describe("backup routes", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe("export", () => {
    it("validate returns null and sends 400 for invalid UUID", () => {
      const res = createMockRes();
      const req = createMockReq({ params: { id: "not-a-uuid" } });
      const context = exportValidate(req as import("express").Request<{ id: string }>, res);
      expect(context).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("validate returns null and sends 401 when user is not authenticated", () => {
      const res = createMockRes();
      const req = createMockReq({
        params: { id: "550e8400-e29b-41d4-a716-446655440000" },
        user: undefined,
      });
      const context = exportValidate(req as import("express").Request<{ id: string }>, res);
      expect(context).toBeNull();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("validate returns context for valid request", () => {
      const res = createMockRes();
      const canvasId = "550e8400-e29b-41d4-a716-446655440000";
      const req = createMockReq({ params: { id: canvasId } });
      const context = exportValidate(req as import("express").Request<{ id: string }>, res);
      expect(context).toEqual({ canvasId, userId: TEST_USER_ID });
    });
  });

  describe("import", () => {
    it("validate returns null and sends 401 when user is not authenticated", () => {
      const res = createMockRes();
      const req = createMockReq({ user: undefined });
      const context = importValidate(req, res);
      expect(context).toBeNull();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("processRequest sends 400 when no file is uploaded", async () => {
      const res = createMockRes();
      const req = createMockReq();
      await importProcessRequest(req, res, { userId: TEST_USER_ID });
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("processRequest sends 400 for invalid backup zip", async () => {
      const res = createMockRes();
      const req = createMockReq({
        file: { buffer: Buffer.from("not-a-zip") },
      });
      await importProcessRequest(req, res, { userId: TEST_USER_ID });
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("processRequest returns success with id and name for valid import", async () => {
      // Create a canvas with data, export it, then use that zip as the upload
      const { createItem, DEFAULT_CANVAS_ID } = await import("../services/canvasItemService.js");
      await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      const { exportCanvas } = await import("../services/backupService.js");
      const zipBuffer = await exportCanvas(DEFAULT_CANVAS_ID);

      const res = createMockRes();
      const req = createMockReq({
        file: { buffer: zipBuffer },
      });
      await importProcessRequest(req, res, { userId: TEST_USER_ID });
      expect(res.status).toHaveBeenCalledWith(200);
      const responseData = (res.json as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.id).toBeTruthy();
      expect(responseData.data.name).toBe("Default");
    });
  });
});
