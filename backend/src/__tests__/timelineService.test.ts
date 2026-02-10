import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createItem, DEFAULT_CANVAS_ID, getItemContentId } from "../services/canvasItemService.js";
import { createCanvas } from "../services/canvasService.js";
import { createNote, updateNote } from "../services/noteService.js";
import { uploadPhoto } from "../services/photoService.js";
import { getTimeline } from "../services/timelineService.js";
import { setupTestDb, TEST_USER_ID, teardownTestDb, truncateAllTables } from "./helpers/setup.js";

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
    await uploadPhoto({
      content_type: "person",
      content_id: contentId,
      original_name: "gandalf.png",
      mime_type: "image/png",
      buffer: Buffer.from("fake"),
    });

    const entries = await getTimeline(DEFAULT_CANVAS_ID);
    expect(entries).toHaveLength(2);

    const note = entries.find((e) => e.kind === "note")!;
    expect(note.content).toBe("A wizard");
    expect(note.parent_item_id).toBe(item.id);
    expect(note.parent_item_type).toBe("person");
    expect(note.parent_item_title).toBe("Gandalf");

    const photo = entries.find((e) => e.kind === "photo")!;
    expect(photo.photo_url).toContain("/api/photos/");
    expect(photo.original_name).toBe("gandalf.png");
    expect(photo.parent_item_id).toBe(item.id);
    expect(photo.parent_item_type).toBe("person");
  });

  it("only returns entries for the specified canvas", async () => {
    const otherCanvas = await createCanvas("Other", TEST_USER_ID);
    const item1 = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);
    const item2 = await createItem({ type: "place", title: "Mordor" }, otherCanvas.id);

    await createNote(item1.id, { content: "Default canvas note" });
    await createNote(item2.id, { content: "Other canvas note" });

    const defaultEntries = await getTimeline(DEFAULT_CANVAS_ID);
    expect(defaultEntries).toHaveLength(1);
    expect(defaultEntries[0]!.content).toBe("Default canvas note");

    const otherEntries = await getTimeline(otherCanvas.id);
    expect(otherEntries).toHaveLength(1);
    expect(otherEntries[0]!.content).toBe("Other canvas note");
  });

  it("sorts by created_at descending by default", async () => {
    const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);

    await createNote(item.id, { content: "First" });
    await new Promise((r) => setTimeout(r, 50));
    await createNote(item.id, { content: "Second" });

    const entries = await getTimeline(DEFAULT_CANVAS_ID);
    expect(entries[0]!.content).toBe("Second");
    expect(entries[1]!.content).toBe("First");
  });

  it("sorts by updated_at when requested", async () => {
    const item = await createItem({ type: "person", title: "Gandalf" }, DEFAULT_CANVAS_ID);

    const older = await createNote(item.id, { content: "Older note" });
    await new Promise((r) => setTimeout(r, 50));
    await createNote(item.id, { content: "Newer note" });
    await new Promise((r) => setTimeout(r, 50));
    // Update the older note so its updated_at becomes the most recent
    await updateNote(older.id, { content: "Older note edited" });

    const entries = await getTimeline(DEFAULT_CANVAS_ID, "updated_at");
    expect(entries[0]!.content).toBe("Older note edited");
  });
});
