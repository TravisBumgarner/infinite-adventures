import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createItem, DEFAULT_CANVAS_ID, getItemContentId } from "../services/canvasItemService.js";
import { createCanvas } from "../services/canvasService.js";
import { getGalleryEntries } from "../services/galleryService.js";
import { confirmUpload } from "../services/photoService.js";
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

async function createTestPhoto(
  contentType: "person" | "place" | "thing" | "session" | "event",
  contentId: string,
  originalName: string,
) {
  return confirmUpload({
    photoId: crypto.randomUUID(),
    key: `photos/test-${crypto.randomUUID()}.png`,
    contentType,
    contentId,
    originalName,
    mimeType: "image/png",
  });
}

describe("galleryService", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  it("returns photos with parent item info", async () => {
    const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
    const contentId = (await getItemContentId(item.id))!;
    await createTestPhoto("person", contentId, "gandalf.png");

    const result = await getGalleryEntries(DEFAULT_CANVAS_ID);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]!.originalName).toBe("gandalf.png");
    expect(result.entries[0]!.parentItemId).toBe(item.id);
    expect(result.entries[0]!.parentItemType).toBe("person");
    expect(result.entries[0]!.parentItemTitle).toBe("Gandalf");
    expect(result.entries[0]!.isMainPhoto).toBe(true);
    expect(result.entries[0]!.isImportant).toBe(false);
  });

  it("only returns photos for the specified canvas", async () => {
    const otherCanvas = await createCanvas("Other", TEST_USER_ID);
    const item1 = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
    const item2 = await createItem({ type: "place", title: "Mordor" }, otherCanvas.id);

    const contentId1 = (await getItemContentId(item1.id))!;
    const contentId2 = (await getItemContentId(item2.id))!;

    await createTestPhoto("person", contentId1, "gandalf.png");
    await createTestPhoto("place", contentId2, "mordor.png");

    const defaultResult = await getGalleryEntries(DEFAULT_CANVAS_ID);
    expect(defaultResult.entries).toHaveLength(1);
    expect(defaultResult.entries[0]!.originalName).toBe("gandalf.png");

    const otherResult = await getGalleryEntries(otherCanvas.id);
    expect(otherResult.entries).toHaveLength(1);
    expect(otherResult.entries[0]!.originalName).toBe("mordor.png");
  });

  it("returns empty entries when no photos exist", async () => {
    const result = await getGalleryEntries(DEFAULT_CANVAS_ID);
    expect(result.entries).toEqual([]);
    expect(result.nextCursor).toBeNull();
  });

  it("paginates results with cursor", async () => {
    const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
    const contentId = (await getItemContentId(item.id))!;

    for (let i = 0; i < 3; i++) {
      await createTestPhoto("person", contentId, `photo${i}.png`);
      await new Promise((r) => setTimeout(r, 20));
    }

    const page1 = await getGalleryEntries(DEFAULT_CANVAS_ID, { limit: 2 });
    expect(page1.entries).toHaveLength(2);
    expect(page1.nextCursor).not.toBeNull();

    const page2 = await getGalleryEntries(DEFAULT_CANVAS_ID, {
      limit: 2,
      cursor: page1.nextCursor!,
    });
    expect(page2.entries).toHaveLength(1);
    expect(page2.nextCursor).toBeNull();
  });
});
