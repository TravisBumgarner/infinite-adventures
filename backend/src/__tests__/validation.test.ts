import { describe, expect, it } from "vitest";
import { isValidUUID } from "../routes/shared/validation.js";

describe("isValidUUID", () => {
  it("accepts a valid UUID v4", () => {
    expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("accepts uppercase UUID v4", () => {
    expect(isValidUUID("550E8400-E29B-41D4-A716-446655440000")).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(isValidUUID("")).toBe(false);
  });

  it("rejects a random string", () => {
    expect(isValidUUID("not-a-uuid")).toBe(false);
  });

  it("rejects a UUID with wrong version digit", () => {
    // version digit (position 13) must be 4 for v4
    expect(isValidUUID("550e8400-e29b-31d4-a716-446655440000")).toBe(false);
  });

  it("rejects a UUID with wrong variant digit", () => {
    // variant digit (position 17) must be 8, 9, a, or b
    expect(isValidUUID("550e8400-e29b-41d4-0716-446655440000")).toBe(false);
  });
});
