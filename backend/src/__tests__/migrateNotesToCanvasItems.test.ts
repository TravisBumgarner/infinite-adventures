import { describe, expect, it } from "vitest";
import { mapNoteTypeToCanvasItemType } from "../db/migrations/migrate-notes-to-canvas-items.js";

describe("mapNoteTypeToCanvasItemType", () => {
  it("maps 'pc' to 'person'", () => {
    expect(mapNoteTypeToCanvasItemType("pc")).toBe("person");
  });

  it("maps 'npc' to 'person'", () => {
    expect(mapNoteTypeToCanvasItemType("npc")).toBe("person");
  });

  it("maps 'item' to 'thing'", () => {
    expect(mapNoteTypeToCanvasItemType("item")).toBe("thing");
  });

  it("maps 'quest' to 'event'", () => {
    expect(mapNoteTypeToCanvasItemType("quest")).toBe("event");
  });

  it("maps 'goal' to 'event'", () => {
    expect(mapNoteTypeToCanvasItemType("goal")).toBe("event");
  });

  it("maps 'location' to 'place'", () => {
    expect(mapNoteTypeToCanvasItemType("location")).toBe("place");
  });

  it("maps 'session' to 'session'", () => {
    expect(mapNoteTypeToCanvasItemType("session")).toBe("session");
  });

  it("throws for unknown type", () => {
    expect(() => mapNoteTypeToCanvasItemType("unknown")).toThrow();
  });
});
