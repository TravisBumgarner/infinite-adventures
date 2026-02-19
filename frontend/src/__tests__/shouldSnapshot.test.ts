import { describe, expect, it } from "vitest";
import { SNAPSHOT_THRESHOLD_MS, shouldSnapshot } from "../utils/shouldSnapshot";

describe("shouldSnapshot", () => {
  const now = 1_000_000;

  it("returns true when no previous snapshot exists", () => {
    expect(shouldSnapshot(undefined, now)).toBe(true);
  });

  it("returns true when threshold time has elapsed", () => {
    const lastSnapshot = now - SNAPSHOT_THRESHOLD_MS - 1;
    expect(shouldSnapshot(lastSnapshot, now)).toBe(true);
  });

  it("returns false when within threshold", () => {
    const lastSnapshot = now - SNAPSHOT_THRESHOLD_MS + 1000;
    expect(shouldSnapshot(lastSnapshot, now)).toBe(false);
  });
});
