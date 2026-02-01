import { describe, it, expect } from "vitest";
import { getContrastText } from "../utils/getContrastText";

describe("getContrastText", () => {
  it("returns white for a dark background", () => {
    expect(getContrastText("#1e1e2e")).toBe("#fff");
  });

  it("returns white for pure black", () => {
    expect(getContrastText("#000000")).toBe("#fff");
  });

  it("returns black for a light background", () => {
    expect(getContrastText("#ffffff")).toBe("#000");
  });

  it("returns black for a bright yellow", () => {
    expect(getContrastText("#f9e2af")).toBe("#000");
  });

  it("returns white for a mid-dark blue", () => {
    expect(getContrastText("#2a5a8a")).toBe("#fff");
  });

  it("handles 3-digit hex shorthand", () => {
    expect(getContrastText("#fff")).toBe("#000");
    expect(getContrastText("#000")).toBe("#fff");
  });
});
