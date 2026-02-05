import { describe, expect, it } from "vitest";
import { CANVAS_ITEM_TYPE_LABELS, CANVAS_ITEM_TYPES } from "../constants";

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
