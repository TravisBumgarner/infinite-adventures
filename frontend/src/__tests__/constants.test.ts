import { describe, it, expect } from "vitest";
import { NOTE_TEMPLATES, NOTE_TYPES } from "../constants";

describe("NOTE_TEMPLATES", () => {
  it("has an entry for every note type", () => {
    const templateKeys = Object.keys(NOTE_TEMPLATES).sort();
    const typeValues = NOTE_TYPES.map((t) => t.value).sort();
    expect(templateKeys).toEqual(typeValues);
  });

  it("has non-empty template for types that should have one", () => {
    const typesWithTemplates = ["pc", "npc", "item", "quest", "location", "session"] as const;
    for (const type of typesWithTemplates) {
      expect(NOTE_TEMPLATES[type].length, `${type} should have a non-empty template`).toBeGreaterThan(0);
    }
  });

});
