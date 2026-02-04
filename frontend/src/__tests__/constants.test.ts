import { describe, expect, it } from "vitest";
import {
  CANVAS_ITEM_TYPE_LABELS,
  CANVAS_ITEM_TYPES,
  NOTE_TEMPLATES,
  NOTE_TYPES,
} from "../constants";

describe("NOTE_TEMPLATES", () => {
  it("has an entry for every note type", () => {
    const templateKeys = Object.keys(NOTE_TEMPLATES).sort();
    const typeValues = NOTE_TYPES.map((t) => t.value).sort();
    expect(templateKeys).toEqual(typeValues);
  });

  it("has non-empty template for types that should have one", () => {
    const typesWithTemplates = ["pc", "npc", "item", "quest", "location", "session"] as const;
    for (const type of typesWithTemplates) {
      expect(
        NOTE_TEMPLATES[type].length,
        `${type} should have a non-empty template`,
      ).toBeGreaterThan(0);
    }
  });
});

describe("CANVAS_ITEM_TYPE_LABELS", () => {
  it("has labels for all canvas item types", () => {
    const expectedTypes = ["person", "place", "thing", "session", "event"];
    const labelKeys = Object.keys(CANVAS_ITEM_TYPE_LABELS).sort();
    expect(labelKeys).toEqual(expectedTypes.sort());
  });

  it("has human-readable labels for each type", () => {
    expect(CANVAS_ITEM_TYPE_LABELS.person).toBe("Person");
    expect(CANVAS_ITEM_TYPE_LABELS.place).toBe("Place");
    expect(CANVAS_ITEM_TYPE_LABELS.thing).toBe("Thing");
    expect(CANVAS_ITEM_TYPE_LABELS.session).toBe("Session");
    expect(CANVAS_ITEM_TYPE_LABELS.event).toBe("Event");
  });
});

describe("CANVAS_ITEM_TYPES", () => {
  it("has entries matching CANVAS_ITEM_TYPE_LABELS", () => {
    const labelKeys = Object.keys(CANVAS_ITEM_TYPE_LABELS).sort();
    const typeValues = CANVAS_ITEM_TYPES.map((t) => t.value).sort();
    expect(typeValues).toEqual(labelKeys);
  });

  it("has consistent labels between array and record", () => {
    for (const item of CANVAS_ITEM_TYPES) {
      expect(item.label).toBe(CANVAS_ITEM_TYPE_LABELS[item.value]);
    }
  });
});
