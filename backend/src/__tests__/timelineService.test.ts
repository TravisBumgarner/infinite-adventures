import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createItem, DEFAULT_CANVAS_ID, getItemContentId } from "../services/canvasItemService.js";
import { createCanvas } from "../services/canvasService.js";
import { createNote, updateNote } from "../services/noteService.js";
import { confirmUpload } from "../services/photoService.js";
import { getTimeline, getTimelineDayCounts } from "../services/timelineService.js";
import { setupTestDb, TEST_USER_ID, teardownTestDb, truncateAllTables } from "./helpers/setup.js";

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

describe("timelineService", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  it("returns notes and photos with parent item info", async () => {
    const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
    await createNote(item.id, { content: "A wizard" });

    const contentId = (await getItemContentId(item.id))!;
    await confirmUpload({
      photoId: crypto.randomUUID(),
      key: `photos/test-${crypto.randomUUID()}.png`,
      contentType: "person",
      contentId: contentId,
      originalName: "gandalf.png",
      mimeType: "image/png",
    });

    const result = await getTimeline(DEFAULT_CANVAS_ID);
    expect(result.entries).toHaveLength(2);

    const note = result.entries.find((e) => e.kind === "note")!;
    expect(note.content).toBe("A wizard");
    expect(note.parentItemId).toBe(item.id);
    expect(note.parentItemType).toBe("person");
    expect(note.parentItemTitle).toBe("Gandalf");

    const photo = result.entries.find((e) => e.kind === "photo")!;
    expect(photo.photoUrl).toContain("s3.example.com");
    expect(photo.originalName).toBe("gandalf.png");
    expect(photo.parentItemId).toBe(item.id);
    expect(photo.parentItemType).toBe("person");
  });

  it("only returns entries for the specified canvas", async () => {
    const otherCanvas = await createCanvas("Other", TEST_USER_ID);
    const item1 = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
    const item2 = await createItem({ type: "place", title: "Mordor" }, otherCanvas.id);

    await createNote(item1.id, { content: "Default canvas note" });
    await createNote(item2.id, { content: "Other canvas note" });

    const defaultResult = await getTimeline(DEFAULT_CANVAS_ID);
    expect(defaultResult.entries).toHaveLength(1);
    expect(defaultResult.entries[0]!.content).toBe("Default canvas note");

    const otherResult = await getTimeline(otherCanvas.id);
    expect(otherResult.entries).toHaveLength(1);
    expect(otherResult.entries[0]!.content).toBe("Other canvas note");
  });

  it("sorts by createdAt descending by default", async () => {
    const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);

    await createNote(item.id, { content: "First" });
    await new Promise((r) => setTimeout(r, 50));
    await createNote(item.id, { content: "Second" });

    const result = await getTimeline(DEFAULT_CANVAS_ID);
    expect(result.entries[0]!.content).toBe("Second");
    expect(result.entries[1]!.content).toBe("First");
  });

  describe("getTimelineDayCounts", () => {
    it("returns counts grouped by day for notes and photos", async () => {
      const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      await createNote(item.id, { content: "Note 1" });
      await createNote(item.id, { content: "Note 2" });

      const contentId = (await getItemContentId(item.id))!;
      await confirmUpload({
        photoId: crypto.randomUUID(),
        key: `photos/test-${crypto.randomUUID()}.png`,
        contentType: "person",
        contentId: contentId,
        originalName: "pic.png",
        mimeType: "image/png",
      });

      const today = new Date().toISOString().slice(0, 10);
      const counts = await getTimelineDayCounts(DEFAULT_CANVAS_ID, today, today);
      expect(counts[today]).toBe(3);
    });

    it("only counts entries for the specified canvas", async () => {
      const otherCanvas = await createCanvas("Other", TEST_USER_ID);
      const item1 = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      const item2 = await createItem({ type: "place", title: "Mordor" }, otherCanvas.id);

      await createNote(item1.id, { content: "Default note" });
      await createNote(item2.id, { content: "Other note" });

      const today = new Date().toISOString().slice(0, 10);
      const counts = await getTimelineDayCounts(DEFAULT_CANVAS_ID, today, today);
      expect(counts[today]).toBe(1);
    });

    it("returns empty object when no entries in range", async () => {
      const counts = await getTimelineDayCounts(DEFAULT_CANVAS_ID, "2020-01-01", "2020-01-31");
      expect(counts).toEqual({});
    });
  });

  it("sorts by updatedAt when requested", async () => {
    const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);

    const older = await createNote(item.id, { content: "Older note" });
    await new Promise((r) => setTimeout(r, 50));
    await createNote(item.id, { content: "Newer note" });
    await new Promise((r) => setTimeout(r, 50));
    // Update the older note so its updatedAt becomes the most recent
    await updateNote(older.id, { content: "Older note edited" });

    const result = await getTimeline(DEFAULT_CANVAS_ID, "updatedAt");
    expect(result.entries[0]!.content).toBe("Older note edited");
  });
});
