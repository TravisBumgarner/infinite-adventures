import { describe, it, expect } from "vitest";
import { appendMentionIfNew } from "../utils/edgeConnect";

describe("appendMentionIfNew", () => {
  it("appends @{targetId} to empty content", () => {
    const result = appendMentionIfNew("", "abc-123");
    expect(result).toBe("\n@{abc-123}");
  });

  it("appends @{targetId} to existing content", () => {
    const result = appendMentionIfNew("Some text here", "abc-123");
    expect(result).toBe("Some text here\n@{abc-123}");
  });

  it("returns null when mention already exists", () => {
    const result = appendMentionIfNew("Links to @{abc-123} already", "abc-123");
    expect(result).toBeNull();
  });

  it("returns null when mention exists at end of content", () => {
    const result = appendMentionIfNew("See @{abc-123}", "abc-123");
    expect(result).toBeNull();
  });

  it("does not treat partial ID matches as duplicates", () => {
    const result = appendMentionIfNew("Links to @{abc-12}", "abc-123");
    expect(result).toBe("Links to @{abc-12}\n@{abc-123}");
  });
});
