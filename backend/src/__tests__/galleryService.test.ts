import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createItem, DEFAULT_CANVAS_ID, getItemContentId } from "../services/canvasItemService.js";
import { createCanvas } from "../services/canvasService.js";
import { getGalleryEntries } from "../services/galleryService.js";
import { uploadPhoto } from "../services/photoService.js";
import { setupTestDb, TEST_USER_ID, teardownTestDb, truncateAllTables } from "./helpers/setup.js";

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
    await uploadPhoto({
      contentType: "person",
      contentId: contentId,
      originalName: "gandalf.png",
      mimeType: "image/png",
      buffer: Buffer.from("fake"),
    });

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

    await uploadPhoto({
      contentType: "person",
      contentId: contentId1,
      originalName: "gandalf.png",
      mimeType: "image/png",
      buffer: Buffer.from("fake"),
    });
    await uploadPhoto({
      contentType: "place",
      contentId: contentId2,
      originalName: "mordor.png",
      mimeType: "image/png",
      buffer: Buffer.from("fake"),
    });

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
      await uploadPhoto({
        contentType: "person",
        contentId: contentId,
        originalName: `photo${i}.png`,
        mimeType: "image/png",
        buffer: Buffer.from("fake"),
      });
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
