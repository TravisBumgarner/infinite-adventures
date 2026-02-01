import { describe, it, expect } from "vitest";
import {
  NoteTypeSchema,
  NoteSummarySchema,
  NoteLinkSchema,
  NoteSchema,
  CreateNoteInputSchema,
  UpdateNoteInputSchema,
  SearchResultSchema,
} from "../index";

describe("NoteTypeSchema", () => {
  it("accepts all valid note types", () => {
    const types = ["pc", "npc", "item", "quest", "location", "goal", "session"];
    for (const t of types) {
      expect(NoteTypeSchema.parse(t)).toBe(t);
    }
  });

  it("rejects invalid note type", () => {
    expect(() => NoteTypeSchema.parse("monster")).toThrow();
  });
});

describe("NoteSummarySchema", () => {
  const valid = {
    id: "abc-123",
    type: "npc",
    title: "Gandalf",
    canvas_x: 100,
    canvas_y: 200,
  };

  it("accepts a valid NoteSummary", () => {
    expect(NoteSummarySchema.parse(valid)).toEqual(valid);
  });

  it("rejects when id is missing", () => {
    const { id: _, ...rest } = valid;
    expect(() => NoteSummarySchema.parse(rest)).toThrow();
  });

  it("rejects invalid type value", () => {
    expect(() => NoteSummarySchema.parse({ ...valid, type: "dragon" })).toThrow();
  });
});

describe("NoteLinkSchema", () => {
  const valid = { id: "link-1", title: "Sword", type: "item" };

  it("accepts a valid NoteLink", () => {
    expect(NoteLinkSchema.parse(valid)).toEqual(valid);
  });

  it("rejects when title is missing", () => {
    const { title: _, ...rest } = valid;
    expect(() => NoteLinkSchema.parse(rest)).toThrow();
  });
});

describe("NoteSchema", () => {
  const valid = {
    id: "note-1",
    type: "pc",
    title: "Hero",
    content: "A brave hero",
    canvas_x: 0,
    canvas_y: 0,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    links_to: [{ id: "l1", title: "Sword", type: "item" }],
    linked_from: [],
  };

  it("accepts a valid Note", () => {
    expect(NoteSchema.parse(valid)).toEqual(valid);
  });

  it("rejects when content is missing", () => {
    const { content: _, ...rest } = valid;
    expect(() => NoteSchema.parse(rest)).toThrow();
  });

  it("rejects when links_to contains invalid entries", () => {
    expect(() =>
      NoteSchema.parse({ ...valid, links_to: [{ id: "x" }] })
    ).toThrow();
  });
});

describe("CreateNoteInputSchema", () => {
  it("accepts with required fields only", () => {
    const input = { type: "quest", title: "Find the ring" };
    const result = CreateNoteInputSchema.parse(input);
    expect(result.type).toBe("quest");
    expect(result.title).toBe("Find the ring");
  });

  it("accepts with all optional fields", () => {
    const input = {
      type: "location",
      title: "Shire",
      content: "A peaceful place",
      canvas_x: 50,
      canvas_y: 75,
    };
    expect(CreateNoteInputSchema.parse(input)).toEqual(input);
  });

  it("rejects when title is missing", () => {
    expect(() => CreateNoteInputSchema.parse({ type: "npc" })).toThrow();
  });
});

describe("UpdateNoteInputSchema", () => {
  it("accepts an empty object (all fields optional)", () => {
    expect(UpdateNoteInputSchema.parse({})).toEqual({});
  });

  it("accepts partial updates", () => {
    const input = { title: "Updated Title", canvas_x: 999 };
    expect(UpdateNoteInputSchema.parse(input)).toEqual(input);
  });

  it("rejects invalid type value", () => {
    expect(() => UpdateNoteInputSchema.parse({ type: "invalid" })).toThrow();
  });
});

describe("SearchResultSchema", () => {
  const valid = {
    id: "sr-1",
    type: "goal",
    title: "Defeat Sauron",
    snippet: "...the dark lord...",
  };

  it("accepts a valid SearchResult", () => {
    expect(SearchResultSchema.parse(valid)).toEqual(valid);
  });

  it("rejects when snippet is missing", () => {
    const { snippet: _, ...rest } = valid;
    expect(() => SearchResultSchema.parse(rest)).toThrow();
  });
});
