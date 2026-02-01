import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { closeDb, initDb } from "../db/connection.js";
import { createNote } from "../services/noteService.js";

import { validate as listValidate, handler as listHandler } from "../routes/notes/list.js";
import { validate as getValidate, handler as getHandler } from "../routes/notes/get.js";
import { validate as createValidate, handler as createHandler } from "../routes/notes/create.js";
import { validate as updateValidate, handler as updateHandler } from "../routes/notes/update.js";
import { validate as deleteValidate, handler as deleteHandler } from "../routes/notes/delete.js";
import { validate as searchValidate, handler as searchHandler } from "../routes/notes/search.js";

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

describe("note routes", () => {
  beforeEach(() => {
    initDb(":memory:");
  });

  afterEach(() => {
    closeDb();
  });

  describe("list", () => {
    it("validate always returns a context object", () => {
      const res = createMockRes();
      const req = createMockReq();
      const context = listValidate(req, res);
      expect(context).not.toBeNull();
    });

    it("handler returns all notes wrapped in success envelope", async () => {
      createNote({ type: "npc", title: "Gandalf", content: "wizard" });
      createNote({ type: "pc", title: "Frodo", content: "hobbit" });

      const req = createMockReq();
      const res = createMockRes();
      await listHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
      expect(jsonArg.data).toHaveLength(2);
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

    it("validate returns context with id for valid UUID", () => {
      const res = createMockRes();
      const req = createMockReq({ params: { id: "550e8400-e29b-41d4-a716-446655440000" } });
      const context = getValidate(req as import("express").Request<{ id: string }>, res);
      expect(context).toEqual({ id: "550e8400-e29b-41d4-a716-446655440000" });
    });

    it("handler returns note in success envelope", async () => {
      const note = createNote({ type: "npc", title: "Gandalf" });
      const req = createMockReq({ params: { id: note.id } });
      const res = createMockRes();
      await getHandler(req as import("express").Request<{ id: string }>, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
      expect(jsonArg.data.id).toBe(note.id);
      expect(jsonArg.data.title).toBe("Gandalf");
    });

    it("handler returns 404 with NOTE_NOT_FOUND for missing note", async () => {
      const req = createMockReq({ params: { id: "550e8400-e29b-41d4-a716-446655440000" } });
      const res = createMockRes();
      await getHandler(req as import("express").Request<{ id: string }>, res);

      expect(res.status).toHaveBeenCalledWith(404);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(false);
      expect(jsonArg.errorCode).toBe("NOTE_NOT_FOUND");
    });
  });

  describe("create", () => {
    it("validate returns null and sends 400 when body has no title", () => {
      const res = createMockRes();
      const req = createMockReq({ body: { type: "npc" } });
      const context = createValidate(req, res);
      expect(context).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("validate returns null and sends 400 when body has no type", () => {
      const res = createMockRes();
      const req = createMockReq({ body: { title: "Gandalf" } });
      const context = createValidate(req, res);
      expect(context).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("validate returns context with parsed input for valid body", () => {
      const res = createMockRes();
      const req = createMockReq({ body: { type: "npc", title: "Gandalf", content: "wizard" } });
      const context = createValidate(req, res);
      expect(context).not.toBeNull();
      expect(context?.input.title).toBe("Gandalf");
      expect(context?.input.type).toBe("npc");
    });

    it("handler creates note and returns 201 with success envelope", async () => {
      const req = createMockReq({
        body: { type: "npc", title: "Gandalf", content: "wizard", canvas_x: 10, canvas_y: 20 },
      });
      const res = createMockRes();
      await createHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
      expect(jsonArg.data.title).toBe("Gandalf");
      expect(jsonArg.data.type).toBe("npc");
    });

    it("handler returns 400 for invalid type", async () => {
      const req = createMockReq({ body: { type: "dragon", title: "Smaug" } });
      const res = createMockRes();
      await createHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(false);
    });
  });

  describe("update", () => {
    it("validate returns null and sends 400 for invalid UUID", () => {
      const res = createMockRes();
      const req = createMockReq({ params: { id: "bad" }, body: { title: "new title" } });
      const context = updateValidate(req as import("express").Request<{ id: string }>, res);
      expect(context).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("validate returns context for valid UUID and body", () => {
      const res = createMockRes();
      const req = createMockReq({
        params: { id: "550e8400-e29b-41d4-a716-446655440000" },
        body: { title: "Updated" },
      });
      const context = updateValidate(req as import("express").Request<{ id: string }>, res);
      expect(context).not.toBeNull();
      expect(context?.id).toBe("550e8400-e29b-41d4-a716-446655440000");
      expect(context?.input.title).toBe("Updated");
    });

    it("handler updates note and returns success envelope", async () => {
      const note = createNote({ type: "npc", title: "Gandalf" });
      const req = createMockReq({
        params: { id: note.id },
        body: { title: "Gandalf the Grey" },
      });
      const res = createMockRes();
      await updateHandler(req as import("express").Request<{ id: string }>, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
      expect(jsonArg.data.title).toBe("Gandalf the Grey");
    });

    it("handler returns 404 with NOTE_NOT_FOUND for missing note", async () => {
      const req = createMockReq({
        params: { id: "550e8400-e29b-41d4-a716-446655440000" },
        body: { title: "test" },
      });
      const res = createMockRes();
      await updateHandler(req as import("express").Request<{ id: string }>, res);

      expect(res.status).toHaveBeenCalledWith(404);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.errorCode).toBe("NOTE_NOT_FOUND");
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

    it("validate returns context for valid UUID", () => {
      const res = createMockRes();
      const req = createMockReq({ params: { id: "550e8400-e29b-41d4-a716-446655440000" } });
      const context = deleteValidate(req as import("express").Request<{ id: string }>, res);
      expect(context).toEqual({ id: "550e8400-e29b-41d4-a716-446655440000" });
    });

    it("handler deletes note and returns success envelope", async () => {
      const note = createNote({ type: "npc", title: "Gandalf" });
      const req = createMockReq({ params: { id: note.id } });
      const res = createMockRes();
      await deleteHandler(req as import("express").Request<{ id: string }>, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
    });

    it("handler returns 404 with NOTE_NOT_FOUND for missing note", async () => {
      const req = createMockReq({ params: { id: "550e8400-e29b-41d4-a716-446655440000" } });
      const res = createMockRes();
      await deleteHandler(req as import("express").Request<{ id: string }>, res);

      expect(res.status).toHaveBeenCalledWith(404);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.errorCode).toBe("NOTE_NOT_FOUND");
    });
  });

  describe("search", () => {
    it("validate returns context with query string", () => {
      const res = createMockRes();
      const req = createMockReq({ query: { q: "gandalf" } });
      const context = searchValidate(req, res);
      expect(context).toEqual({ query: "gandalf" });
    });

    it("validate returns context with empty string when q is missing", () => {
      const res = createMockRes();
      const req = createMockReq({ query: {} });
      const context = searchValidate(req, res);
      expect(context).toEqual({ query: "" });
    });

    it("handler returns search results in success envelope", async () => {
      createNote({ type: "npc", title: "Gandalf", content: "A wise wizard" });

      const req = createMockReq({ query: { q: "wizard" } });
      const res = createMockRes();
      await searchHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
      expect(jsonArg.data.results).toHaveLength(1);
      expect(jsonArg.data.results[0].title).toBe("Gandalf");
    });

    it("handler returns empty results for no matches", async () => {
      createNote({ type: "npc", title: "Gandalf", content: "A wizard" });

      const req = createMockReq({ query: { q: "dragon" } });
      const res = createMockRes();
      await searchHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
      expect(jsonArg.data.results).toEqual([]);
    });
  });
});
