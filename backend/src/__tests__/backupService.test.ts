import AdmZip from "adm-zip";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { type BackupData, type BackupManifest, exportCanvas } from "../services/backupService.js";
import { createItem, DEFAULT_CANVAS_ID, getItemContentId } from "../services/canvasItemService.js";
import { createCanvas } from "../services/canvasService.js";
import { createNote } from "../services/noteService.js";
import { uploadPhoto } from "../services/photoService.js";
import { addTagToItem, createTag } from "../services/tagService.js";
import { setupTestDb, TEST_USER_ID, teardownTestDb, truncateAllTables } from "./helpers/setup.js";

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
      await uploadPhoto({
        contentType: "person",
        contentId,
        originalName: "gandalf.png",
        mimeType: "image/png",
        buffer: Buffer.from("fake-photo-data"),
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
      expect(manifest.schemaVersion).toBe(1);
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

      // Photo file should be in the zip
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
      // Create a note with @mention to create a link
      await createNote(item1.id, { content: `Went to @[Rivendell](${item2.id})` });

      const zipBuffer = await exportCanvas(DEFAULT_CANVAS_ID);
      const zip = new AdmZip(zipBuffer);
      const data: BackupData = JSON.parse(zip.getEntry("data.json")!.getData().toString("utf-8"));

      expect(data.canvasItemLinks.length).toBeGreaterThanOrEqual(1);
      expect(data.canvasItemLinks[0]!.sourceItemId).toBe(item1.id);
      expect(data.canvasItemLinks[0]!.targetItemId).toBe(item2.id);
    });
  });
});
