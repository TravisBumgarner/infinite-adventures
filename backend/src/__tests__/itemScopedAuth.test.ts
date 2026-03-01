import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { handler as deleteItemHandler } from "../routes/items/delete.js";
import { handler as getItemHandler } from "../routes/items/get.js";
import { handler as taggedItemHandler } from "../routes/items/tagged.js";
import { handler as updateItemHandler } from "../routes/items/update.js";
import { handler as createLinkHandler } from "../routes/links/create.js";
import { handler as deleteLinkHandler } from "../routes/links/delete.js";
import { handler as createNoteHandler } from "../routes/notes/create.js";
import { handler as deleteNoteHandler } from "../routes/notes/delete.js";
import { handler as getNoteHandler } from "../routes/notes/get.js";
import { handler as listNotesHandler } from "../routes/notes/list.js";
import { handler as updateNoteHandler } from "../routes/notes/update.js";
import { handler as deletePhotoHandler } from "../routes/photos/delete.js";
import { handler as selectPhotoHandler } from "../routes/photos/select.js";
import { handler as uploadPhotoHandler } from "../routes/photos/upload.js";
import { handler as assignTagHandler } from "../routes/tags/assign.js";
import { handler as deleteTagHandler } from "../routes/tags/delete.js";
import { handler as removeTagHandler } from "../routes/tags/remove.js";
import { handler as updateTagHandler } from "../routes/tags/update.js";
import { createItem, DEFAULT_CANVAS_ID } from "../services/canvasItemService.js";
import { createNote } from "../services/noteService.js";
import { createTag } from "../services/tagService.js";
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

describe("item-scoped route authorization", () => {
  let itemId: string;
  let noteId: string;
  let tagId: string;

  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await truncateAllTables();
    const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
    itemId = item.id;
    const note = await createNote(itemId, { content: "A wizard" });
    noteId = note.id;
    const tag = await createTag({ name: "Hero", icon: "star", color: "#ff0" }, DEFAULT_CANVAS_ID);
    tagId = tag.id;
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe("returns 403 when user does not own the resource", () => {
    // Item routes
    it("items/get", async () => {
      const req = createMockReq({ params: { id: itemId }, user: { userId: OTHER_USER_ID } });
      const res = createMockRes();
      await getItemHandler(req as import("express").Request<{ id: string }>, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect((res.json as ReturnType<typeof vi.fn>).mock.calls[0][0].errorCode).toBe("FORBIDDEN");
    });

    it("items/update", async () => {
      const req = createMockReq({
        params: { id: itemId },
        body: { title: "Hacked" },
        user: { userId: OTHER_USER_ID },
      });
      const res = createMockRes();
      await updateItemHandler(req as import("express").Request<{ id: string }>, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("items/delete", async () => {
      const req = createMockReq({ params: { id: itemId }, user: { userId: OTHER_USER_ID } });
      const res = createMockRes();
      await deleteItemHandler(req as import("express").Request<{ id: string }>, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("items/tagged", async () => {
      const req = createMockReq({ params: { id: itemId }, user: { userId: OTHER_USER_ID } });
      const res = createMockRes();
      await taggedItemHandler(req as import("express").Request<{ id: string }>, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    // Note routes
    it("notes/list", async () => {
      const req = createMockReq({ params: { itemId }, user: { userId: OTHER_USER_ID } });
      const res = createMockRes();
      await listNotesHandler(req as import("express").Request<{ itemId: string }>, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("notes/create", async () => {
      const req = createMockReq({
        params: { itemId },
        body: { content: "Hacked" },
        user: { userId: OTHER_USER_ID },
      });
      const res = createMockRes();
      await createNoteHandler(req as import("express").Request<{ itemId: string }>, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("notes/get", async () => {
      const req = createMockReq({ params: { noteId }, user: { userId: OTHER_USER_ID } });
      const res = createMockRes();
      await getNoteHandler(req as import("express").Request<{ noteId: string }>, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("notes/update", async () => {
      const req = createMockReq({
        params: { noteId },
        body: { content: "Hacked" },
        user: { userId: OTHER_USER_ID },
      });
      const res = createMockRes();
      await updateNoteHandler(req as import("express").Request<{ noteId: string }>, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("notes/delete", async () => {
      const req = createMockReq({ params: { noteId }, user: { userId: OTHER_USER_ID } });
      const res = createMockRes();
      await deleteNoteHandler(req as import("express").Request<{ noteId: string }>, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    // Photo routes
    it("photos/upload", async () => {
      const req = createMockReq({ params: { itemId }, user: { userId: OTHER_USER_ID } });
      const res = createMockRes();
      await uploadPhotoHandler(req as import("express").Request<{ itemId: string }>, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("photos/select", async () => {
      const req = createMockReq({
        params: { id: "550e8400-e29b-41d4-a716-446655440000" },
        user: { userId: OTHER_USER_ID },
      });
      const res = createMockRes();
      await selectPhotoHandler(req as import("express").Request<{ id: string }>, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("photos/delete", async () => {
      const req = createMockReq({
        params: { id: "550e8400-e29b-41d4-a716-446655440000" },
        user: { userId: OTHER_USER_ID },
      });
      const res = createMockRes();
      await deletePhotoHandler(req as import("express").Request<{ id: string }>, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    // Tag routes
    it("tags/update", async () => {
      const req = createMockReq({
        params: { tagId },
        body: { name: "Hacked" },
        user: { userId: OTHER_USER_ID },
      });
      const res = createMockRes();
      await updateTagHandler(req as import("express").Request<{ tagId: string }>, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("tags/delete", async () => {
      const req = createMockReq({ params: { tagId }, user: { userId: OTHER_USER_ID } });
      const res = createMockRes();
      await deleteTagHandler(req as import("express").Request<{ tagId: string }>, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("tags/assign", async () => {
      const req = createMockReq({
        params: { itemId, tagId },
        user: { userId: OTHER_USER_ID },
      });
      const res = createMockRes();
      await assignTagHandler(
        req as import("express").Request<{ itemId: string; tagId: string }>,
        res,
      );
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("tags/remove", async () => {
      const req = createMockReq({
        params: { itemId, tagId },
        user: { userId: OTHER_USER_ID },
      });
      const res = createMockRes();
      await removeTagHandler(
        req as import("express").Request<{ itemId: string; tagId: string }>,
        res,
      );
      expect(res.status).toHaveBeenCalledWith(403);
    });

    // Link routes
    it("links/create", async () => {
      const item2 = await createItem({ type: "place", title: "Shire" }, DEFAULT_CANVAS_ID);
      const req = createMockReq({
        body: { sourceItemId: itemId, targetItemId: item2.id },
        user: { userId: OTHER_USER_ID },
      });
      const res = createMockRes();
      await createLinkHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("links/delete", async () => {
      const item2 = await createItem({ type: "place", title: "Shire" }, DEFAULT_CANVAS_ID);
      const req = createMockReq({
        params: { sourceItemId: itemId, targetItemId: item2.id },
        user: { userId: OTHER_USER_ID },
      });
      const res = createMockRes();
      await deleteLinkHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("returns 401 when no user is authenticated", () => {
    it("items/get without user", async () => {
      const req = createMockReq({ params: { id: itemId } });
      const res = createMockRes();
      await getItemHandler(req as import("express").Request<{ id: string }>, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect((res.json as ReturnType<typeof vi.fn>).mock.calls[0][0].errorCode).toBe(
        "UNAUTHORIZED",
      );
    });
  });
});
