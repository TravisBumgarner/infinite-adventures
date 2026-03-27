import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { handler as createHandler, validate as createValidate } from "../routes/canvases/create.js";
import { handler as deleteHandler, validate as deleteValidate } from "../routes/canvases/delete.js";
import { handler as getHandler, validate as getValidate } from "../routes/canvases/get.js";
import { handler as listHandler } from "../routes/canvases/list.js";
import { handler as updateHandler, validate as updateValidate } from "../routes/canvases/update.js";
import { createCanvas } from "../services/canvasService.js";
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

describe("canvas routes", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe("list", () => {
    it("handler returns canvases in success envelope", async () => {
      const req = createMockReq();
      const res = createMockRes();
      await listHandler(req as any, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
      expect(jsonArg.data).toHaveLength(1); // default canvas
    });
  });

  describe("get", () => {
    it("validate returns null and sends 400 for invalid UUID", () => {
      const res = createMockRes();
      const req = createMockReq({ params: { id: "not-a-uuid" } });
      const context = getValidate(req as import("express").Request<{ id: string }>, res);
      expect(context).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("handler returns canvas in success envelope", async () => {
      const canvas = await createCanvas("Test Canvas", TEST_USER_ID);
      const req = createMockReq({ params: { id: canvas.id } });
      const res = createMockRes();
      await getHandler(req as import("express").Request<{ id: string }>, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
      expect(jsonArg.data.name).toBe("Test Canvas");
    });

    it("handler returns 404 for missing canvas", async () => {
      const req = createMockReq({ params: { id: "550e8400-e29b-41d4-a716-446655440000" } });
      const res = createMockRes();
      await getHandler(req as import("express").Request<{ id: string }>, res);

      expect(res.status).toHaveBeenCalledWith(404);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.errorCode).toBe("CANVAS_NOT_FOUND");
    });
  });

  describe("create", () => {
    it("validate returns null and sends 400 when name is missing", () => {
      const res = createMockRes();
      const req = createMockReq({ body: {} });
      const context = createValidate(req, res);
      expect(context).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("handler creates canvas and returns 201", async () => {
      const req = createMockReq({ body: { name: "New Canvas" } });
      const res = createMockRes();
      await createHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
      expect(jsonArg.data.name).toBe("New Canvas");
    });
  });

  describe("update", () => {
    it("validate returns null and sends 400 for invalid UUID", () => {
      const res = createMockRes();
      const req = createMockReq({ params: { id: "bad" }, body: { name: "New" } });
      const context = updateValidate(req as import("express").Request<{ id: string }>, res);
      expect(context).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("validate returns null and sends 400 when name is missing", () => {
      const res = createMockRes();
      const req = createMockReq({
        params: { id: "550e8400-e29b-41d4-a716-446655440000" },
        body: {},
      });
      const context = updateValidate(req as import("express").Request<{ id: string }>, res);
      expect(context).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("handler updates canvas and returns success", async () => {
      const canvas = await createCanvas("Old Name", TEST_USER_ID);
      const req = createMockReq({
        params: { id: canvas.id },
        body: { name: "New Name" },
      });
      const res = createMockRes();
      await updateHandler(req as import("express").Request<{ id: string }>, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
      expect(jsonArg.data.name).toBe("New Name");
    });

    it("handler returns 404 for missing canvas", async () => {
      const req = createMockReq({
        params: { id: "550e8400-e29b-41d4-a716-446655440000" },
        body: { name: "Test" },
      });
      const res = createMockRes();
      await updateHandler(req as import("express").Request<{ id: string }>, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("delete", () => {
    it("validate returns null and sends 400 for invalid UUID", () => {
      const res = createMockRes();
      const req = createMockReq({ params: { id: "bad" } });
      const context = deleteValidate(req as import("express").Request<{ id: string }>, res);
      expect(context).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("handler deletes canvas and returns success", async () => {
      const canvas = await createCanvas("To Delete", TEST_USER_ID);
      const req = createMockReq({ params: { id: canvas.id } });
      const res = createMockRes();
      await deleteHandler(req as import("express").Request<{ id: string }>, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
    });

    it("handler returns 404 for missing canvas", async () => {
      const req = createMockReq({ params: { id: "550e8400-e29b-41d4-a716-446655440000" } });
      const res = createMockRes();
      await deleteHandler(req as import("express").Request<{ id: string }>, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("handler returns 400 with LAST_CANVAS when deleting the only canvas", async () => {
      const canvases = await (await import("../services/canvasService.js")).listCanvases(
        TEST_USER_ID,
      );
      const req = createMockReq({ params: { id: canvases[0]!.id } });
      const res = createMockRes();
      await deleteHandler(req as import("express").Request<{ id: string }>, res);

      expect(res.status).toHaveBeenCalledWith(400);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.errorCode).toBe("LAST_CANVAS");
    });
  });
});
