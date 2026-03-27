import AdmZip from "adm-zip";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type BackupData,
  type BackupManifest,
  CURRENT_SCHEMA_VERSION,
  exportCanvas,
  importCanvas,
} from "../services/backupService.js";
import { createItem, DEFAULT_CANVAS_ID, getItemContentId } from "../services/canvasItemService.js";
import { createCanvas } from "../services/canvasService.js";
import { createNote } from "../services/noteService.js";
import { confirmUpload } from "../services/photoService.js";
import { addTagToItem, createTag } from "../services/tagService.js";
import { setupTestDb, TEST_USER_ID, teardownTestDb, truncateAllTables } from "./helpers/setup.js";

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

// Mock fetch for S3 presigned PUT uploads during import
vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200 }));

describe("backupService", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe("exportCanvas", () => {
    it("produces a zip with manifest.json, data.json, and photo files", async () => {
      const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      const contentId = (await getItemContentId(item.id))!;
      await createNote(item.id, { content: "A wizard" });
      await confirmUpload({
        photoId: crypto.randomUUID(),
        key: "photos/test-export.png",
        contentType: "person",
        contentId,
        originalName: "gandalf.png",
        mimeType: "image/png",
      });
      const tag = await createTag(
        { name: "NPC", icon: "user", color: "#ff0000" },
        DEFAULT_CANVAS_ID,
      );
      await addTagToItem(item.id, tag.id);

      const zipBuffer = await exportCanvas(DEFAULT_CANVAS_ID);
      const zip = new AdmZip(zipBuffer);
      const entries = zip.getEntries().map((e) => e.entryName);

      expect(entries).toContain("manifest.json");
      expect(entries).toContain("data.json");

      const manifest: BackupManifest = JSON.parse(
        zip.getEntry("manifest.json")!.getData().toString("utf-8"),
      );
      expect(manifest.schemaVersion).toBe(2);
      expect(manifest.canvasName).toBe("Default");
      expect(manifest.exportedAt).toBeTruthy();

      const data: BackupData = JSON.parse(zip.getEntry("data.json")!.getData().toString("utf-8"));
      expect(data.canvasItems).toHaveLength(1);
      expect(data.canvasItems[0]!.title).toBe("Gandalf");
      expect(data.people).toHaveLength(1);
      expect(data.notes).toHaveLength(1);
      expect(data.notes[0]!.content).toBe("A wizard");
      expect(data.photos).toHaveLength(1);
      expect(data.tags).toHaveLength(1);
      expect(data.canvasItemTags).toHaveLength(1);

      // Photo file should be in the zip (downloaded from S3)
      const photoEntry = entries.find((e) => e.startsWith("photos/"));
      expect(photoEntry).toBeTruthy();
    });

    it("only includes data from the specified canvas", async () => {
      const otherCanvas = await createCanvas("Other", TEST_USER_ID);

      await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      await createItem({ type: "place", title: "Mordor" }, otherCanvas.id);

      const zipBuffer = await exportCanvas(DEFAULT_CANVAS_ID);
      const zip = new AdmZip(zipBuffer);
      const data: BackupData = JSON.parse(zip.getEntry("data.json")!.getData().toString("utf-8"));

      expect(data.canvasItems).toHaveLength(1);
      expect(data.canvasItems[0]!.title).toBe("Gandalf");
      expect(data.canvas.id).toBe(DEFAULT_CANVAS_ID);
    });

    it("includes canvas_item_links in export", async () => {
      const item1 = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      const item2 = await createItem({ type: "place", title: "Rivendell" }, DEFAULT_CANVAS_ID);
      await createNote(item1.id, { content: `Went to @[Rivendell](${item2.id})` });

      const zipBuffer = await exportCanvas(DEFAULT_CANVAS_ID);
      const zip = new AdmZip(zipBuffer);
      const data: BackupData = JSON.parse(zip.getEntry("data.json")!.getData().toString("utf-8"));

      expect(data.canvasItemLinks.length).toBeGreaterThanOrEqual(1);
      expect(data.canvasItemLinks[0]!.sourceItemId).toBe(item1.id);
      expect(data.canvasItemLinks[0]!.targetItemId).toBe(item2.id);
    });
  });

  describe("importCanvas", () => {
    it("creates a new canvas with fresh UUIDs and preserved relationships", async () => {
      const item1 = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
      const item2 = await createItem({ type: "place", title: "Rivendell" }, DEFAULT_CANVAS_ID);
      const content1Id = (await getItemContentId(item1.id))!;
      await createNote(item1.id, { content: `Went to @[Rivendell](${item2.id})` });
      await confirmUpload({
        photoId: crypto.randomUUID(),
        key: "photos/test-import.png",
        contentType: "person",
        contentId: content1Id,
        originalName: "gandalf.png",
        mimeType: "image/png",
      });
      const tag = await createTag(
        { name: "NPC", icon: "user", color: "#ff0000" },
        DEFAULT_CANVAS_ID,
      );
      await addTagToItem(item1.id, tag.id);

      const zipBuffer = await exportCanvas(DEFAULT_CANVAS_ID);
      const originalData: BackupData = JSON.parse(
        new AdmZip(zipBuffer).getEntry("data.json")!.getData().toString("utf-8"),
      );

      const result = await importCanvas(zipBuffer, TEST_USER_ID);

      // Re-export the imported canvas to inspect its data
      const reimportedZip = new AdmZip(await exportCanvas(result.id));
      const imported: BackupData = JSON.parse(
        reimportedZip.getEntry("data.json")!.getData().toString("utf-8"),
      );

      // Canvas ID is fresh
      expect(result.id).not.toBe(DEFAULT_CANVAS_ID);
      expect(imported.canvas.id).toBe(result.id);
      expect(imported.canvas.name).toBe("Default");

      // All entity counts match
      expect(imported.canvasItems).toHaveLength(originalData.canvasItems.length);
      expect(imported.people).toHaveLength(originalData.people.length);
      expect(imported.notes).toHaveLength(originalData.notes.length);
      expect(imported.photos).toHaveLength(originalData.photos.length);
      expect(imported.tags).toHaveLength(originalData.tags.length);
      expect(imported.canvasItemTags).toHaveLength(originalData.canvasItemTags.length);
      expect(imported.canvasItemLinks).toHaveLength(originalData.canvasItemLinks.length);

      // All UUIDs are different from originals
      const originalIds = new Set([
        originalData.canvas.id,
        ...originalData.canvasItems.map((i) => i.id),
        ...originalData.people.map((p) => p.id),
        ...originalData.notes.map((n) => n.id),
        ...originalData.photos.map((p) => p.id),
        ...originalData.tags.map((t) => t.id),
      ]);

      expect(originalIds.has(imported.canvas.id)).toBe(false);
      for (const ci of imported.canvasItems) {
        expect(originalIds.has(ci.id)).toBe(false);
        expect(ci.canvasId).toBe(result.id);
      }

      // Links reference new canvas item IDs
      const newItemIds = new Set(imported.canvasItems.map((i) => i.id));
      for (const link of imported.canvasItemLinks) {
        expect(newItemIds.has(link.sourceItemId)).toBe(true);
        expect(newItemIds.has(link.targetItemId)).toBe(true);
      }
    });

    it("rejects zip with schemaVersion greater than current", async () => {
      const manifest: BackupManifest = {
        schemaVersion: CURRENT_SCHEMA_VERSION + 1,
        exportedAt: new Date().toISOString(),
        canvasName: "Future Canvas",
      };
      const data: BackupData = {
        canvas: {
          id: "00000000-0000-0000-0000-000000000099",
          name: "Future Canvas",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        canvasItems: [],
        people: [],
        places: [],
        things: [],
        sessions: [],
        events: [],
        notes: [],
        photos: [],
        tags: [],
        canvasItemTags: [],
        canvasItemLinks: [],
        quickNotes: [],
        contentHistory: [],
      };

      const zip = new AdmZip();
      zip.addFile("manifest.json", Buffer.from(JSON.stringify(manifest)));
      zip.addFile("data.json", Buffer.from(JSON.stringify(data)));

      await expect(importCanvas(zip.toBuffer(), TEST_USER_ID)).rejects.toThrow(/newer version/i);
    });
  });
});
