import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeDb, initDb } from "../db/connection.js";
import { createFeedback, ValidationError } from "../services/feedbackService.js";

describe("feedbackService", () => {
  beforeEach(() => {
    initDb(":memory:");
  });

  afterEach(() => {
    closeDb();
  });

  describe("createFeedback", () => {
    it("creates feedback with a valid message", () => {
      const result = createFeedback("Great app!");

      expect(result.id).toBeDefined();
      expect(result.message).toBe("Great app!");
      expect(result.created_at).toBeDefined();
    });

    it("throws ValidationError for empty message", () => {
      expect(() => createFeedback("")).toThrow(ValidationError);
    });

    it("throws ValidationError for whitespace-only message", () => {
      expect(() => createFeedback("   ")).toThrow(ValidationError);
    });
  });
});
