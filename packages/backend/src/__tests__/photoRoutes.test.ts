import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { handler as confirmHandler } from "../routes/photos/confirm.js";
import { handler as deleteHandler, validate as deleteValidate } from "../routes/photos/delete.js";
import { handler as presignHandler } from "../routes/photos/presign.js";
import { handler as selectHandler, validate as selectValidate } from "../routes/photos/select.js";
import {
  createItem,
  DEFAULT_CANVAS_ID,
  getItem,
  getItemContentId,
} from "../services/canvasItemService.js";
import { confirmUpload } from "../services/photoService.js";
import { setupTestDb, TEST_USER_ID, teardownTestDb, truncateAllTables } from "./helpers/setup.js";

// Mock S3 module
vi.mock("../lib/s3.js", () => ({
  getS3Object: vi
    .fn()
    .mockResolvedValue(
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64",
      ),
    ),
  deleteS3Object: vi.fn().mockResolvedValue(undefined),
  generatePresignedGetUrl: vi.fn().mockResolvedValue("https://s3.example.com/signed-url"),
  generatePresignedPutUrl: vi.fn().mockResolvedValue("https://s3.example.com/signed-put-url"),
}));

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

describe("photo routes", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe("presign", () => {
    it("handler returns presigned URL data for valid item", async () => {
      const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      const req = createMockReq({
        params: { itemId: item.id },
        body: { contentType: "image/png", filename: "gandalf.png" },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await presignHandler(req as import("express").Request<{ itemId: string }>, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
      expect(jsonArg.data.uploadUrl).toBeDefined();
      expect(jsonArg.data.key).toBeDefined();
      expect(jsonArg.data.photoId).toBeDefined();
    });

    it("handler returns 403 for non-existent item", async () => {
      const req = createMockReq({
        params: { itemId: "550e8400-e29b-41d4-a716-446655440000" },
        body: { contentType: "image/png", filename: "test.png" },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await presignHandler(req as import("express").Request<{ itemId: string }>, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("confirm", () => {
    it("handler creates photo and returns 201 with success envelope", async () => {
      const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      const req = createMockReq({
        params: { itemId: item.id },
        body: {
          key: "photos/test-id.png",
          photoId: crypto.randomUUID(),
          originalName: "gandalf.png",
          mimeType: "image/png",
        },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await confirmHandler(req as import("express").Request<{ itemId: string }>, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
      expect(jsonArg.data.originalName).toBe("gandalf.png");
      expect(jsonArg.data.url).toBeDefined();
    });

    it("handler returns 403 for non-existent item", async () => {
      const req = createMockReq({
        params: { itemId: "550e8400-e29b-41d4-a716-446655440000" },
        body: {
          key: "photos/test.png",
          photoId: crypto.randomUUID(),
          originalName: "test.png",
          mimeType: "image/png",
        },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await confirmHandler(req as import("express").Request<{ itemId: string }>, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("delete", () => {
    it("validate returns null and sends 400 for invalid UUID", () => {
      const res = createMockRes();
      const req = createMockReq({ params: { id: "not-a-uuid" } });
      const context = deleteValidate(req as import("express").Request<{ id: string }>, res);
      expect(context).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("validate returns context with id for valid UUID", () => {
      const res = createMockRes();
      const req = createMockReq({ params: { id: "550e8400-e29b-41d4-a716-446655440000" } });
      const context = deleteValidate(req as import("express").Request<{ id: string }>, res);
      expect(context).toEqual({ id: "550e8400-e29b-41d4-a716-446655440000" });
    });

    it("handler returns 403 for non-existent photo", async () => {
      const req = createMockReq({
        params: { id: "550e8400-e29b-41d4-a716-446655440000" },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await deleteHandler(req as import("express").Request<{ id: string }>, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("handler deletes photo and returns success envelope", async () => {
      const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      const fullItem = await getItem(item.id);
      const contentId = await getItemContentId(item.id);
      const photo = await confirmUpload({
        photoId: crypto.randomUUID(),
        key: "photos/test-delete.png",
        contentType: fullItem!.type,
        contentId: contentId!,
        originalName: "test.jpg",
        mimeType: "image/jpeg",
      });

      const req = createMockReq({
        params: { id: photo.id },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await deleteHandler(req as import("express").Request<{ id: string }>, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
    });
  });

  describe("select", () => {
    it("validate returns null and sends 400 for invalid UUID", () => {
      const res = createMockRes();
      const req = createMockReq({ params: { id: "not-a-uuid" } });
      const context = selectValidate(req as import("express").Request<{ id: string }>, res);
      expect(context).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("validate returns context with id for valid UUID", () => {
      const res = createMockRes();
      const req = createMockReq({ params: { id: "550e8400-e29b-41d4-a716-446655440000" } });
      const context = selectValidate(req as import("express").Request<{ id: string }>, res);
      expect(context).toEqual({ id: "550e8400-e29b-41d4-a716-446655440000" });
    });

    it("handler returns 403 for non-existent photo", async () => {
      const req = createMockReq({
        params: { id: "550e8400-e29b-41d4-a716-446655440000" },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await selectHandler(req as import("express").Request<{ id: string }>, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("handler selects photo and returns success envelope with isMainPhoto true", async () => {
      const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      const fullItem = await getItem(item.id);
      const contentId = await getItemContentId(item.id);
      const photo = await confirmUpload({
        photoId: crypto.randomUUID(),
        key: "photos/test-select.png",
        contentType: fullItem!.type,
        contentId: contentId!,
        originalName: "test.jpg",
        mimeType: "image/jpeg",
      });

      const req = createMockReq({
        params: { id: photo.id },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await selectHandler(req as import("express").Request<{ id: string }>, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
      expect(jsonArg.data.isMainPhoto).toBe(true);
    });
  });
});
