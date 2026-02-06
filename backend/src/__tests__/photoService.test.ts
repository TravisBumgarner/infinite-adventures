import * as fs from "node:fs";
import * as path from "node:path";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  deletePhoto,
  deletePhotosForContent,
  getPhoto,
  getPhotoPath,
  listPhotos,
  selectPhoto,
  uploadPhoto,
} from "../services/photoService.js";
import { setupTestDb, teardownTestDb, truncateAllTables } from "./helpers/setup.js";

// Test content item details (simulating a person content record)
const TEST_CONTENT_TYPE = "person" as const;
const TEST_CONTENT_ID = "test-content-0000-0000-000000000001";
const TEST_CONTENT_ID_2 = "test-content-0000-0000-000000000002";

// Minimal valid PNG (1x1 pixel transparent)
const TEST_PNG_BUFFER = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

// Minimal valid JPEG header
const TEST_JPEG_BUFFER = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
  0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
]);

describe("photoService", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  afterEach(async () => {
    // Clean up any uploaded files after each test
    const uploadsDir = path.resolve(
      process.cwd(),
      process.env.UPLOADS_DIR || "uploads/photos-test",
    );
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        fs.unlinkSync(path.join(uploadsDir, file));
      }
    }
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe("uploadPhoto", () => {
    it("uploads a photo and returns photo info", async () => {
      const photo = await uploadPhoto({
        content_type: TEST_CONTENT_TYPE,
        content_id: TEST_CONTENT_ID,
        original_name: "gandalf.png",
        mime_type: "image/png",
        buffer: TEST_PNG_BUFFER,
      });

      expect(photo.id).toBeDefined();
      expect(photo.content_type).toBe(TEST_CONTENT_TYPE);
      expect(photo.content_id).toBe(TEST_CONTENT_ID);
      expect(photo.original_name).toBe("gandalf.png");
      expect(photo.mime_type).toBe("image/png");
      expect(photo.is_selected).toBe(false);
      expect(photo.created_at).toBeDefined();
    });

    it("stores the file on disk with UUID filename", async () => {
      const photo = await uploadPhoto({
        content_type: TEST_CONTENT_TYPE,
        content_id: TEST_CONTENT_ID,
        original_name: "gandalf.png",
        mime_type: "image/png",
        buffer: TEST_PNG_BUFFER,
      });

      const filePath = getPhotoPath(photo.filename);
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("preserves original file extension in stored filename", async () => {
      const photo = await uploadPhoto({
        content_type: TEST_CONTENT_TYPE,
        content_id: TEST_CONTENT_ID,
        original_name: "gandalf.jpeg",
        mime_type: "image/jpeg",
        buffer: TEST_JPEG_BUFFER,
      });

      expect(photo.filename).toMatch(/\.jpeg$/);
    });
  });

  describe("getPhoto", () => {
    it("returns photo by ID", async () => {
      const uploaded = await uploadPhoto({
        content_type: TEST_CONTENT_TYPE,
        content_id: TEST_CONTENT_ID,
        original_name: "gandalf.png",
        mime_type: "image/png",
        buffer: TEST_PNG_BUFFER,
      });

      const photo = await getPhoto(uploaded.id);
      expect(photo).not.toBeNull();
      expect(photo?.id).toBe(uploaded.id);
      expect(photo?.original_name).toBe("gandalf.png");
    });

    it("returns null for non-existent ID", async () => {
      const photo = await getPhoto("non-existent-id");
      expect(photo).toBeNull();
    });
  });

  describe("listPhotos", () => {
    it("returns empty array when no photos exist", async () => {
      const photos = await listPhotos(TEST_CONTENT_TYPE, TEST_CONTENT_ID);
      expect(photos).toEqual([]);
    });

    it("returns photos for specified content only", async () => {
      await uploadPhoto({
        content_type: TEST_CONTENT_TYPE,
        content_id: TEST_CONTENT_ID,
        original_name: "photo1.png",
        mime_type: "image/png",
        buffer: TEST_PNG_BUFFER,
      });
      await uploadPhoto({
        content_type: TEST_CONTENT_TYPE,
        content_id: TEST_CONTENT_ID,
        original_name: "photo2.png",
        mime_type: "image/png",
        buffer: TEST_PNG_BUFFER,
      });
      await uploadPhoto({
        content_type: TEST_CONTENT_TYPE,
        content_id: TEST_CONTENT_ID_2,
        original_name: "other.png",
        mime_type: "image/png",
        buffer: TEST_PNG_BUFFER,
      });

      const photos = await listPhotos(TEST_CONTENT_TYPE, TEST_CONTENT_ID);
      expect(photos).toHaveLength(2);
      expect(photos.every((p) => p.content_id === TEST_CONTENT_ID)).toBe(true);
    });
  });

  describe("deletePhoto", () => {
    it("deletes photo metadata and file", async () => {
      const uploaded = await uploadPhoto({
        content_type: TEST_CONTENT_TYPE,
        content_id: TEST_CONTENT_ID,
        original_name: "gandalf.png",
        mime_type: "image/png",
        buffer: TEST_PNG_BUFFER,
      });
      const filePath = getPhotoPath(uploaded.filename);

      expect(fs.existsSync(filePath)).toBe(true);
      const result = await deletePhoto(uploaded.id);

      expect(result).toBe(true);
      expect(await getPhoto(uploaded.id)).toBeNull();
      expect(fs.existsSync(filePath)).toBe(false);
    });

    it("returns false for non-existent ID", async () => {
      const result = await deletePhoto("non-existent-id");
      expect(result).toBe(false);
    });
  });

  describe("selectPhoto", () => {
    it("sets is_selected to true", async () => {
      const uploaded = await uploadPhoto({
        content_type: TEST_CONTENT_TYPE,
        content_id: TEST_CONTENT_ID,
        original_name: "gandalf.png",
        mime_type: "image/png",
        buffer: TEST_PNG_BUFFER,
      });

      const selected = await selectPhoto(uploaded.id);
      expect(selected?.is_selected).toBe(true);
    });

    it("unselects previously selected photo for same content", async () => {
      const photo1 = await uploadPhoto({
        content_type: TEST_CONTENT_TYPE,
        content_id: TEST_CONTENT_ID,
        original_name: "photo1.png",
        mime_type: "image/png",
        buffer: TEST_PNG_BUFFER,
      });
      await selectPhoto(photo1.id);

      const photo2 = await uploadPhoto({
        content_type: TEST_CONTENT_TYPE,
        content_id: TEST_CONTENT_ID,
        original_name: "photo2.png",
        mime_type: "image/png",
        buffer: TEST_PNG_BUFFER,
      });
      await selectPhoto(photo2.id);

      const updatedPhoto1 = await getPhoto(photo1.id);
      const updatedPhoto2 = await getPhoto(photo2.id);

      expect(updatedPhoto1?.is_selected).toBe(false);
      expect(updatedPhoto2?.is_selected).toBe(true);
    });

    it("does not affect photos of other content items", async () => {
      const photo1 = await uploadPhoto({
        content_type: TEST_CONTENT_TYPE,
        content_id: TEST_CONTENT_ID,
        original_name: "photo1.png",
        mime_type: "image/png",
        buffer: TEST_PNG_BUFFER,
      });
      await selectPhoto(photo1.id);

      const photo2 = await uploadPhoto({
        content_type: TEST_CONTENT_TYPE,
        content_id: TEST_CONTENT_ID_2,
        original_name: "photo2.png",
        mime_type: "image/png",
        buffer: TEST_PNG_BUFFER,
      });
      await selectPhoto(photo2.id);

      const updatedPhoto1 = await getPhoto(photo1.id);
      expect(updatedPhoto1?.is_selected).toBe(true);
    });

    it("returns null for non-existent ID", async () => {
      const result = await selectPhoto("non-existent-id");
      expect(result).toBeNull();
    });
  });

  describe("getPhotoPath", () => {
    it("returns correct file path for filename", () => {
      const filePath = getPhotoPath("abc123.png");
      expect(filePath).toContain("abc123.png");
    });
  });

  describe("deletePhotosForContent", () => {
    it("deletes all photos for a content item", async () => {
      await uploadPhoto({
        content_type: TEST_CONTENT_TYPE,
        content_id: TEST_CONTENT_ID,
        original_name: "photo1.png",
        mime_type: "image/png",
        buffer: TEST_PNG_BUFFER,
      });
      await uploadPhoto({
        content_type: TEST_CONTENT_TYPE,
        content_id: TEST_CONTENT_ID,
        original_name: "photo2.png",
        mime_type: "image/png",
        buffer: TEST_PNG_BUFFER,
      });

      const count = await deletePhotosForContent(TEST_CONTENT_TYPE, TEST_CONTENT_ID);

      expect(count).toBe(2);
      expect(await listPhotos(TEST_CONTENT_TYPE, TEST_CONTENT_ID)).toHaveLength(0);
    });

    it("returns 0 when no photos exist", async () => {
      const count = await deletePhotosForContent(TEST_CONTENT_TYPE, TEST_CONTENT_ID);
      expect(count).toBe(0);
    });

    it("does not affect photos of other content items", async () => {
      await uploadPhoto({
        content_type: TEST_CONTENT_TYPE,
        content_id: TEST_CONTENT_ID,
        original_name: "photo1.png",
        mime_type: "image/png",
        buffer: TEST_PNG_BUFFER,
      });
      await uploadPhoto({
        content_type: TEST_CONTENT_TYPE,
        content_id: TEST_CONTENT_ID_2,
        original_name: "photo2.png",
        mime_type: "image/png",
        buffer: TEST_PNG_BUFFER,
      });

      await deletePhotosForContent(TEST_CONTENT_TYPE, TEST_CONTENT_ID);

      expect(await listPhotos(TEST_CONTENT_TYPE, TEST_CONTENT_ID_2)).toHaveLength(1);
    });
  });
});
