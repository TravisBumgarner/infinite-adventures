import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { handler as historyHandler } from "../routes/notes/history.js";
import { createItem, DEFAULT_CANVAS_ID } from "../services/canvasItemService.js";
import { createSnapshot } from "../services/noteHistoryService.js";
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

describe("note history route", () => {
  beforeAll(async () => {
    await setupTestDb();
  });
  afterAll(async () => {
    await teardownTestDb();
  });
  beforeEach(async () => {
    await truncateAllTables();
  });

  async function createTestNoteWithHistory() {
    const item = await createItem({ type: "person", title: "Test Person" }, DEFAULT_CANVAS_ID);
    const note = await createNote(item.id, { content: "<p>original</p>" });
    await createSnapshot(note.id, "version 1");
    await new Promise((r) => setTimeout(r, 10));
    await createSnapshot(note.id, "version 2");
    return { item, note };
  }

  it("returns history entries for an authenticated user", async () => {
    const { note } = await createTestNoteWithHistory();
    const req = createMockReq({
      params: { noteId: note.id },
      user: { userId: TEST_USER_ID },
    });
    const res = createMockRes();
    await historyHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(jsonArg.success).toBe(true);
    expect(jsonArg.data).toHaveLength(2);
    expect(jsonArg.data[0].content).toBe("version 2");
  });

  it("returns empty array when no history exists", async () => {
    const item = await createItem({ type: "person", title: "Test Person" }, DEFAULT_CANVAS_ID);
    const note = await createNote(item.id, { content: "<p>hello</p>" });
    const req = createMockReq({
      params: { noteId: note.id },
      user: { userId: TEST_USER_ID },
    });
    const res = createMockRes();
    await historyHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(jsonArg.data).toEqual([]);
  });

  it("returns 403 for unauthorized user", async () => {
    const { note } = await createTestNoteWithHistory();
    const req = createMockReq({
      params: { noteId: note.id },
      user: { userId: "other-user-id" },
    });
    const res = createMockRes();
    await historyHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
