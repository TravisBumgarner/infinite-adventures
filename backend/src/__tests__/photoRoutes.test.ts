import * as fs from "node:fs";
import * as path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import config from "../config.js";
import { handler as deleteHandler, validate as deleteValidate } from "../routes/photos/delete.js";
import { handler as selectHandler, validate as selectValidate } from "../routes/photos/select.js";
import { handler as serveHandler } from "../routes/photos/serve.js";
import { handler as uploadHandler, validate as uploadValidate } from "../routes/photos/upload.js";
import {
  createItem,
  DEFAULT_CANVAS_ID,
  getItem,
  getItemContentId,
} from "../services/canvasItemService.js";
import { uploadPhoto } from "../services/photoService.js";
import { setupTestDb, TEST_USER_ID, teardownTestDb, truncateAllTables } from "./helpers/setup.js";

const UPLOADS_DIR = path.resolve(process.cwd(), config.uploadsDir);

function createMockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    sendFile: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
  };
  return res as unknown as import("express").Response;
}

function createMockReq(overrides: Record<string, unknown> = {}) {
  return {
    params: {},
    query: {},
    body: {},
    file: undefined,
    ...overrides,
  } as unknown as import("express").Request;
}

describe("photo routes", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await truncateAllTables();
    // Clean up test photos
    if (fs.existsSync(UPLOADS_DIR)) {
      const files = fs.readdirSync(UPLOADS_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(UPLOADS_DIR, file));
      }
    }
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe("upload", () => {
    it("validate returns null and sends 400 for invalid UUID", () => {
      const res = createMockRes();
      const req = createMockReq({ params: { itemId: "not-a-uuid" } });
      const context = uploadValidate(req as import("express").Request<{ itemId: string }>, res);
      expect(context).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("validate returns context with itemId for valid UUID", () => {
      const res = createMockRes();
      const req = createMockReq({ params: { itemId: "550e8400-e29b-41d4-a716-446655440000" } });
      const context = uploadValidate(req as import("express").Request<{ itemId: string }>, res);
      expect(context).toEqual({ itemId: "550e8400-e29b-41d4-a716-446655440000" });
    });

    it("handler returns 403 for non-existent item", async () => {
      const req = createMockReq({
        params: { itemId: "550e8400-e29b-41d4-a716-446655440000" },
        file: {
          originalname: "test.jpg",
          mimetype: "image/jpeg",
          buffer: Buffer.from("test"),
        },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await uploadHandler(req as import("express").Request<{ itemId: string }>, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("handler returns 400 when no file is uploaded", async () => {
      const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      const req = createMockReq({
        params: { itemId: item.id },
        file: undefined,
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await uploadHandler(req as import("express").Request<{ itemId: string }>, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("handler uploads photo and returns 201 with success envelope", async () => {
      const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      const req = createMockReq({
        params: { itemId: item.id },
        file: {
          originalname: "gandalf.jpg",
          mimetype: "image/jpeg",
          buffer: Buffer.from("fake image data"),
        },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await uploadHandler(req as import("express").Request<{ itemId: string }>, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
      expect(jsonArg.data.original_name).toBe("gandalf.jpg");
    });
  });

  describe("serve", () => {
    it("handler returns 404 for non-existent photo", async () => {
      const req = createMockReq({ params: { filename: "nonexistent.jpg" } });
      const res = createMockRes();
      await serveHandler(req as import("express").Request<{ filename: string }>, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("handler serves photo file with correct content type", async () => {
      const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      const fullItem = await getItem(item.id);
      const contentId = await getItemContentId(item.id);
      const photo = await uploadPhoto({
        content_type: fullItem!.type,
        content_id: contentId!,
        original_name: "test.jpg",
        mime_type: "image/jpeg",
        buffer: Buffer.from("test image data"),
      });

      const req = createMockReq({ params: { filename: photo.filename } });
      const res = createMockRes();
      await serveHandler(req as import("express").Request<{ filename: string }>, res);

      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "image/jpeg");
      expect(res.sendFile).toHaveBeenCalled();
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
      const photo = await uploadPhoto({
        content_type: fullItem!.type,
        content_id: contentId!,
        original_name: "test.jpg",
        mime_type: "image/jpeg",
        buffer: Buffer.from("test image data"),
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

    it("handler selects photo and returns success envelope with is_selected true", async () => {
      const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      const fullItem = await getItem(item.id);
      const contentId = await getItemContentId(item.id);
      const photo = await uploadPhoto({
        content_type: fullItem!.type,
        content_id: contentId!,
        original_name: "test.jpg",
        mime_type: "image/jpeg",
        buffer: Buffer.from("test image data"),
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
      expect(jsonArg.data.is_selected).toBe(true);
    });
  });
});
