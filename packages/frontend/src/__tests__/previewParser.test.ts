import { describe, expect, it } from "vitest";
import { parsePreviewContent } from "../utils/previewParser";

describe("parsePreviewContent", () => {
  describe("plain text", () => {
    it("returns plain text as a single text segment", () => {
      const result = parsePreviewContent("Hello world", {});
      expect(result).toEqual([{ type: "text", text: "Hello world" }]);
    });

    it("truncates content longer than maxLength", () => {
      const long = "a".repeat(100);
      const result = parsePreviewContent(long, {}, 80);
      expect(result[0]).toMatchObject({ type: "text" });
      const totalText = result.map((s) => s.text).join("");
      expect(totalText.length).toBeLessThanOrEqual(83); // 80 + "..."
    });
  });

  describe("mentions", () => {
    it("parses @{id} as a clickable mention with resolved label", () => {
      const result = parsePreviewContent("Talk to @{abc-123} soon", {
        "abc-123": "Gandalf",
      });
      expect(result).toContainEqual({
        type: "mention-clickable",
        text: "Gandalf",
        targetId: "abc-123",
      });
    });

    it("uses the id as fallback label when not in mentionLabels", () => {
      const result = parsePreviewContent("See @{unknown-id}", {});
      expect(result).toContainEqual({
        type: "mention-clickable",
        text: "unknown-id",
        targetId: "unknown-id",
      });
    });

    it("parses @[Multi Word] as a static mention", () => {
      const result = parsePreviewContent("Visit @[Old Forest]", {});
      expect(result).toContainEqual({
        type: "mention-static",
        text: "@[Old Forest]",
      });
    });

    it("parses @SingleWord as a static mention", () => {
      const result = parsePreviewContent("Ask @Frodo about it", {});
      expect(result).toContainEqual({
        type: "mention-static",
        text: "@Frodo",
      });
    });
  });

  describe("markdown formatting", () => {
    it("parses **bold** text", () => {
      const result = parsePreviewContent("This is **important** info", {});
      expect(result).toContainEqual({ type: "bold", text: "important" });
    });

    it("parses *italic* text", () => {
      const result = parsePreviewContent("This is *emphasized* text", {});
      expect(result).toContainEqual({ type: "italic", text: "emphasized" });
    });

    it("parses `inline code`", () => {
      const result = parsePreviewContent("Run `npm install` first", {});
      expect(result).toContainEqual({ type: "code", text: "npm install" });
    });
  });

  describe("mixed content", () => {
    it("handles mentions and markdown together", () => {
      const result = parsePreviewContent("**Bold** and @{abc}", {
        abc: "Legolas",
      });
      const types = result.map((s) => s.type);
      expect(types).toContain("bold");
      expect(types).toContain("mention-clickable");
    });

    it("preserves segment order", () => {
      const result = parsePreviewContent("Hello **world** end", {});
      expect(result[0]).toMatchObject({ type: "text", text: "Hello " });
      expect(result[1]).toMatchObject({ type: "bold", text: "world" });
      expect(result[2]).toMatchObject({ type: "text", text: " end" });
    });
  });

  describe("edge cases", () => {
    it("returns empty array for empty string", () => {
      const result = parsePreviewContent("", {});
      expect(result).toEqual([]);
    });
  });
});
