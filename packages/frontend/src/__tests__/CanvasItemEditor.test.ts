import { describe, expect, it } from "vitest";
import { statusLabel } from "../utils/statusLabel";

describe("statusLabel", () => {
  it("returns 'Saving...' for saving status", () => {
    expect(statusLabel("saving")).toBe("Saving...");
  });

  it("returns 'Saved' for saved status", () => {
    expect(statusLabel("saved")).toBe("Saved");
  });

  it("returns 'Unsaved changes' for unsaved status", () => {
    expect(statusLabel("unsaved")).toBe("Unsaved changes");
  });

  it("returns 'Save failed' for error status", () => {
    expect(statusLabel("error")).toBe("Save failed");
  });
});
