import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  confirmUpload,
  deletePhoto,
  deletePhotosForContent,
  getPhoto,
  listPhotos,
  selectPhoto,
} from "../services/photoService.js";
import { setupTestDb, teardownTestDb, truncateAllTables } from "./helpers/setup.js";

// Test content item details (simulating a person content record)
const TEST_CONTENT_TYPE = "person" as const;
const TEST_CONTENT_ID = "00000000-0000-4000-a000-000000000001";
const TEST_CONTENT_ID_2 = "00000000-0000-4000-a000-000000000002";

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

async function createTestPhoto(
  contentType: "person" | "place" | "thing" | "session" | "event" = TEST_CONTENT_TYPE,
  contentId: string = TEST_CONTENT_ID,
  originalName = "gandalf.png",
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

describe("photoService", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe("confirmUpload", () => {
    it("creates a photo record and returns photo info", async () => {
      const photo = await createTestPhoto();

      expect(photo.id).toBeDefined();
      expect(photo.contentType).toBe(TEST_CONTENT_TYPE);
      expect(photo.contentId).toBe(TEST_CONTENT_ID);
      expect(photo.originalName).toBe("gandalf.png");
      expect(photo.mimeType).toBe("image/png");
      expect(photo.isMainPhoto).toBe(true);
      expect(photo.createdAt).toBeDefined();
    });

    it("stores the S3 key in the filename column", async () => {
      const photo = await createTestPhoto();
      expect(photo.filename).toMatch(/^photos\//);
    });

    it("auto-selects first photo as main", async () => {
      const photo1 = await createTestPhoto();
      const photo2 = await createTestPhoto();

      expect(photo1.isMainPhoto).toBe(true);
      expect(photo2.isMainPhoto).toBe(false);
    });
  });

  describe("getPhoto", () => {
    it("returns photo by ID", async () => {
      const uploaded = await createTestPhoto();

      const photo = await getPhoto(uploaded.id);
      expect(photo).not.toBeNull();
      expect(photo?.id).toBe(uploaded.id);
      expect(photo?.originalName).toBe("gandalf.png");
    });

    it("returns null for non-existent ID", async () => {
      const photo = await getPhoto("00000000-0000-4000-8000-ffffffffffff");
      expect(photo).toBeNull();
    });
  });

  describe("listPhotos", () => {
    it("returns empty array when no photos exist", async () => {
      const photos = await listPhotos(TEST_CONTENT_TYPE, TEST_CONTENT_ID);
      expect(photos).toEqual([]);
    });

    it("returns photos for specified content only", async () => {
      await createTestPhoto(TEST_CONTENT_TYPE, TEST_CONTENT_ID, "photo1.png");
      await createTestPhoto(TEST_CONTENT_TYPE, TEST_CONTENT_ID, "photo2.png");
      await createTestPhoto(TEST_CONTENT_TYPE, TEST_CONTENT_ID_2, "other.png");

      const photos = await listPhotos(TEST_CONTENT_TYPE, TEST_CONTENT_ID);
      expect(photos).toHaveLength(2);
      expect(photos.every((p) => p.contentId === TEST_CONTENT_ID)).toBe(true);
    });
  });

  describe("deletePhoto", () => {
    it("deletes photo metadata from DB", async () => {
      const uploaded = await createTestPhoto();

      const result = await deletePhoto(uploaded.id);

      expect(result).toBe(true);
      expect(await getPhoto(uploaded.id)).toBeNull();
    });

    it("returns false for non-existent ID", async () => {
      const result = await deletePhoto("00000000-0000-4000-8000-ffffffffffff");
      expect(result).toBe(false);
    });
  });

  describe("selectPhoto", () => {
    it("sets isMainPhoto to true", async () => {
      const uploaded = await createTestPhoto();

      const selected = await selectPhoto(uploaded.id);
      expect(selected?.isMainPhoto).toBe(true);
    });

    it("unselects previously selected photo for same content", async () => {
      const photo1 = await createTestPhoto();
      await selectPhoto(photo1.id);

      const photo2 = await createTestPhoto();
      await selectPhoto(photo2.id);

      const updatedPhoto1 = await getPhoto(photo1.id);
      const updatedPhoto2 = await getPhoto(photo2.id);

      expect(updatedPhoto1?.isMainPhoto).toBe(false);
      expect(updatedPhoto2?.isMainPhoto).toBe(true);
    });

    it("does not affect photos of other content items", async () => {
      const photo1 = await createTestPhoto(TEST_CONTENT_TYPE, TEST_CONTENT_ID);
      await selectPhoto(photo1.id);

      const photo2 = await createTestPhoto(TEST_CONTENT_TYPE, TEST_CONTENT_ID_2);
      await selectPhoto(photo2.id);

      const updatedPhoto1 = await getPhoto(photo1.id);
      expect(updatedPhoto1?.isMainPhoto).toBe(true);
    });

    it("returns null for non-existent ID", async () => {
      const result = await selectPhoto("00000000-0000-4000-8000-ffffffffffff");
      expect(result).toBeNull();
    });
  });

  describe("deletePhotosForContent", () => {
    it("deletes all photos for a content item", async () => {
      await createTestPhoto(TEST_CONTENT_TYPE, TEST_CONTENT_ID, "photo1.png");
      await createTestPhoto(TEST_CONTENT_TYPE, TEST_CONTENT_ID, "photo2.png");

      const count = await deletePhotosForContent(TEST_CONTENT_TYPE, TEST_CONTENT_ID);

      expect(count).toBe(2);
      expect(await listPhotos(TEST_CONTENT_TYPE, TEST_CONTENT_ID)).toHaveLength(0);
    });

    it("returns 0 when no photos exist", async () => {
      const count = await deletePhotosForContent(TEST_CONTENT_TYPE, TEST_CONTENT_ID);
      expect(count).toBe(0);
    });

    it("does not affect photos of other content items", async () => {
      await createTestPhoto(TEST_CONTENT_TYPE, TEST_CONTENT_ID, "photo1.png");
      await createTestPhoto(TEST_CONTENT_TYPE, TEST_CONTENT_ID_2, "photo2.png");

      await deletePhotosForContent(TEST_CONTENT_TYPE, TEST_CONTENT_ID);

      expect(await listPhotos(TEST_CONTENT_TYPE, TEST_CONTENT_ID_2)).toHaveLength(1);
    });
  });
});
