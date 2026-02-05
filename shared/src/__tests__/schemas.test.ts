import { describe, expect, it } from "vitest";
import {
  CanvasSchema,
  CanvasSummarySchema,
  CreateCanvasInputSchema,
  UpdateCanvasInputSchema,
} from "../index";

describe("CanvasSummarySchema", () => {
  const valid = { id: "canvas-1", name: "My Canvas" };

  it("accepts a valid CanvasSummary", () => {
    expect(CanvasSummarySchema.parse(valid)).toEqual(valid);
  });

  it("rejects when name is missing", () => {
    const { name: _, ...rest } = valid;
    expect(() => CanvasSummarySchema.parse(rest)).toThrow();
  });
});

describe("CanvasSchema", () => {
  const valid = {
    id: "canvas-1",
    name: "My Canvas",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  };

  it("accepts a valid Canvas", () => {
    expect(CanvasSchema.parse(valid)).toEqual(valid);
  });

  it("rejects when created_at is missing", () => {
    const { created_at: _, ...rest } = valid;
    expect(() => CanvasSchema.parse(rest)).toThrow();
  });

  it("rejects when updated_at is missing", () => {
    const { updated_at: _, ...rest } = valid;
    expect(() => CanvasSchema.parse(rest)).toThrow();
  });
});

describe("CreateCanvasInputSchema", () => {
  it("accepts with name only", () => {
    const result = CreateCanvasInputSchema.parse({ name: "Adventure Map" });
    expect(result.name).toBe("Adventure Map");
  });

  it("rejects when name is missing", () => {
    expect(() => CreateCanvasInputSchema.parse({})).toThrow();
  });
});

describe("UpdateCanvasInputSchema", () => {
  it("accepts a name update", () => {
    const result = UpdateCanvasInputSchema.parse({ name: "Renamed Canvas" });
    expect(result.name).toBe("Renamed Canvas");
  });

  it("accepts an empty object (all fields optional)", () => {
    expect(UpdateCanvasInputSchema.parse({})).toEqual({});
  });
});
