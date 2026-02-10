import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { handler as taggedHandler, validate as taggedValidate } from "../routes/items/tagged.js";
import { createItem, DEFAULT_CANVAS_ID, getTaggedItems } from "../services/canvasItemService.js";
import { createNote } from "../services/noteService.js";
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

describe("tagged items", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe("getTaggedItems", () => {
    it("returns empty array when item has no notes", async () => {
      const session = await createItem(
        { type: "session", title: "Session 1", sessionDate: "2025-06-15" },
        DEFAULT_CANVAS_ID,
      );
      const result = await getTaggedItems(session.id);
      expect(result).toEqual([]);
    });

    it("returns empty array when notes have no mentions", async () => {
      const session = await createItem(
        { type: "session", title: "Session 1", sessionDate: "2025-06-15" },
        DEFAULT_CANVAS_ID,
      );
      await createNote(session.id, { content: "No mentions here." });

      const result = await getTaggedItems(session.id);
      expect(result).toEqual([]);
    });

    it("returns items mentioned by title", async () => {
      const person = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      const session = await createItem(
        { type: "session", title: "Session 1", sessionDate: "2025-06-15" },
        DEFAULT_CANVAS_ID,
      );
      await createNote(session.id, { content: "Met with @Gandalf today." });

      const result = await getTaggedItems(session.id);
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe(person.id);
      expect(result[0]!.title).toBe("Gandalf");
      expect(result[0]!.type).toBe("person");
    });

    it("returns items mentioned by ID", async () => {
      const place = await createItem({ type: "place", title: "Rivendell" }, DEFAULT_CANVAS_ID);
      const session = await createItem(
        { type: "session", title: "Session 1", sessionDate: "2025-06-15" },
        DEFAULT_CANVAS_ID,
      );
      await createNote(session.id, { content: `Traveled to @{${place.id}}.` });

      const result = await getTaggedItems(session.id);
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe(place.id);
      expect(result[0]!.title).toBe("Rivendell");
    });

    it("returns items mentioned with bracket syntax", async () => {
      const thing = await createItem({ type: "thing", title: "One Ring" }, DEFAULT_CANVAS_ID);
      const session = await createItem(
        { type: "session", title: "Session 1", sessionDate: "2025-06-15" },
        DEFAULT_CANVAS_ID,
      );
      await createNote(session.id, { content: "Found @[One Ring] in cave." });

      const result = await getTaggedItems(session.id);
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe(thing.id);
      expect(result[0]!.title).toBe("One Ring");
    });

    it("deduplicates mentions across notes", async () => {
      const person = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      const session = await createItem(
        { type: "session", title: "Session 1", sessionDate: "2025-06-15" },
        DEFAULT_CANVAS_ID,
      );
      await createNote(session.id, { content: "Saw @Gandalf at breakfast." });
      await createNote(session.id, { content: "@Gandalf left for Mordor." });

      const result = await getTaggedItems(session.id);
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe(person.id);
    });

    it("orders by first appearance across notes", async () => {
      const gandalf = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      const frodo = await createItem({ type: "person", title: "Frodo" }, DEFAULT_CANVAS_ID);
      const session = await createItem(
        { type: "session", title: "Session 1", sessionDate: "2025-06-15" },
        DEFAULT_CANVAS_ID,
      );
      await createNote(session.id, { content: "Met @Gandalf first." });
      await createNote(session.id, { content: "Then @Frodo arrived." });

      const result = await getTaggedItems(session.id);
      expect(result).toHaveLength(2);
      expect(result[0]!.id).toBe(gandalf.id);
      expect(result[1]!.id).toBe(frodo.id);
    });

    it("skips mentions that don't match any item", async () => {
      const session = await createItem(
        { type: "session", title: "Session 1", sessionDate: "2025-06-15" },
        DEFAULT_CANVAS_ID,
      );
      await createNote(session.id, { content: "Met @{00000000-0000-0000-0000-000000000099}." });

      const result = await getTaggedItems(session.id);
      expect(result).toEqual([]);
    });

    it("includes selectedPhotoUrl when available", async () => {
      // Note: This test verifies the field is undefined when no photo is set
      // Full photo testing requires photo upload which is handled at the API level
      await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      const session = await createItem(
        { type: "session", title: "Session 1", sessionDate: "2025-06-15" },
        DEFAULT_CANVAS_ID,
      );
      await createNote(session.id, { content: "Met @Gandalf." });

      const result = await getTaggedItems(session.id);
      expect(result[0]!.selectedPhotoUrl).toBeUndefined();
    });
  });

  describe("tagged route", () => {
    it("validate returns null for invalid UUID", () => {
      const res = createMockRes();
      const req = createMockReq({ params: { id: "not-a-uuid" } });
      const context = taggedValidate(req, res);
      expect(context).toBeNull();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("validate returns context with itemId for valid UUID", () => {
      const res = createMockRes();
      const req = createMockReq({ params: { id: DEFAULT_CANVAS_ID } });
      const context = taggedValidate(req, res);
      expect(context).toEqual({ itemId: DEFAULT_CANVAS_ID });
    });

    it("handler returns tagged items in success envelope", async () => {
      const person = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      const session = await createItem(
        { type: "session", title: "Session 1", sessionDate: "2025-06-15" },
        DEFAULT_CANVAS_ID,
      );
      await createNote(session.id, { content: "Met @Gandalf today." });

      const req = createMockReq({
        params: { id: session.id },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await taggedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.success).toBe(true);
      expect(jsonArg.data).toHaveLength(1);
      expect(jsonArg.data[0].id).toBe(person.id);
    });

    it("handler returns empty array when no tagged items", async () => {
      const session = await createItem(
        { type: "session", title: "Session 1", sessionDate: "2025-06-15" },
        DEFAULT_CANVAS_ID,
      );

      const req = createMockReq({
        params: { id: session.id },
        user: { userId: TEST_USER_ID },
      });
      const res = createMockRes();
      await taggedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(jsonArg.data).toEqual([]);
    });
  });
});
