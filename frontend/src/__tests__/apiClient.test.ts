import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchNotes, fetchNote } from "../api/client";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("API client request handling", () => {
  describe("successful responses", () => {
    it("unwraps { success: true, data } envelope from list endpoint", async () => {
      const notes = [{ id: "1", type: "npc", title: "Gandalf", canvas_x: 0, canvas_y: 0 }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: notes }),
      });

      const result = await fetchNotes();
      expect(result).toEqual(notes);
    });

    it("unwraps { success: true, data } envelope from get endpoint", async () => {
      const note = { id: "1", type: "npc", title: "Gandalf", content: "", canvas_x: 0, canvas_y: 0, created_at: "", updated_at: "", links_to: [], linked_from: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: note }),
      });

      const result = await fetchNote("1");
      expect(result.id).toBe("1");
      expect(result.title).toBe("Gandalf");
    });
  });

  describe("error responses", () => {
    it("throws error with errorCode when response has success: false", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ success: false, errorCode: "NOTE_NOT_FOUND" }),
      });

      await expect(fetchNote("nonexistent")).rejects.toThrow("NOTE_NOT_FOUND");
    });

    it("throws error with HTTP status when response body has no errorCode", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      await expect(fetchNote("1")).rejects.toThrow("500");
    });
  });
});
