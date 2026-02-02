import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../auth/service.js", () => ({
  getToken: vi.fn(),
}));

import {
  createCanvas,
  createNote,
  deleteCanvas,
  fetchCanvases,
  fetchNote,
  fetchNotes,
  searchNotes,
  updateCanvas,
} from "../api/client";
import { getToken } from "../auth/service.js";

const mockFetch = vi.fn();
const mockGetToken = vi.mocked(getToken);

beforeEach(() => {
  mockFetch.mockClear();
  vi.stubGlobal("fetch", mockFetch);
  mockGetToken.mockResolvedValue({ success: false, error: "no session" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function mockOkResponse(data: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ success: true, data }),
  });
}

function getCalledUrl(): string {
  return mockFetch.mock.calls[0][0];
}

function getCalledOptions(): RequestInit {
  return mockFetch.mock.calls[0][1];
}

describe("API client request handling", () => {
  describe("successful responses", () => {
    it("unwraps { success: true, data } envelope from list endpoint", async () => {
      const notes = [{ id: "1", type: "npc", title: "Gandalf", canvas_x: 0, canvas_y: 0 }];
      mockOkResponse(notes);

      const result = await fetchNotes("canvas-1");
      expect(result).toEqual(notes);
    });

    it("unwraps { success: true, data } envelope from get endpoint", async () => {
      const note = {
        id: "1",
        type: "npc",
        title: "Gandalf",
        content: "",
        canvas_x: 0,
        canvas_y: 0,
        created_at: "",
        updated_at: "",
        links_to: [],
        linked_from: [],
      };
      mockOkResponse(note);

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

  describe("auth headers", () => {
    it("includes Authorization header when token is available", async () => {
      mockGetToken.mockResolvedValue({ success: true, data: "jwt-token-123" });
      mockOkResponse([]);

      await fetchNotes("canvas-1");

      const headers = getCalledOptions()?.headers;
      expect(headers).toMatchObject({ Authorization: "Bearer jwt-token-123" });
    });

    it("omits Authorization header when no token is available", async () => {
      mockGetToken.mockResolvedValue({ success: false, error: "no session" });
      mockOkResponse([]);

      await fetchNotes("canvas-1");

      const headers = getCalledOptions()?.headers;
      expect(headers).not.toHaveProperty("Authorization");
    });
  });
});

describe("canvas API functions", () => {
  describe("fetchCanvases", () => {
    it("calls GET /canvases", async () => {
      mockOkResponse([{ id: "c1", name: "Default" }]);

      await fetchCanvases();

      expect(getCalledUrl()).toContain("/canvases");
      expect(getCalledOptions()?.method).toBeUndefined();
    });
  });

  describe("createCanvas", () => {
    it("calls POST /canvases with name in body", async () => {
      mockOkResponse({ id: "c1", name: "New Map", created_at: "", updated_at: "" });

      await createCanvas({ name: "New Map" });

      expect(getCalledUrl()).toContain("/canvases");
      expect(getCalledOptions().method).toBe("POST");
      expect(JSON.parse(getCalledOptions().body as string)).toEqual({ name: "New Map" });
    });
  });

  describe("updateCanvas", () => {
    it("calls PUT /canvases/:id with input in body", async () => {
      mockOkResponse({ id: "c1", name: "Renamed", created_at: "", updated_at: "" });

      await updateCanvas("c1", { name: "Renamed" });

      expect(getCalledUrl()).toContain("/canvases/c1");
      expect(getCalledOptions().method).toBe("PUT");
      expect(JSON.parse(getCalledOptions().body as string)).toEqual({ name: "Renamed" });
    });
  });

  describe("deleteCanvas", () => {
    it("calls DELETE /canvases/:id", async () => {
      mockOkResponse(undefined);

      await deleteCanvas("c1");

      expect(getCalledUrl()).toContain("/canvases/c1");
      expect(getCalledOptions().method).toBe("DELETE");
    });
  });
});

describe("canvas-scoped note functions", () => {
  describe("fetchNotes", () => {
    it("calls GET /canvases/:canvasId/notes", async () => {
      mockOkResponse([]);

      await fetchNotes("canvas-123");

      expect(getCalledUrl()).toContain("/canvases/canvas-123/notes");
    });
  });

  describe("createNote", () => {
    it("calls POST /canvases/:canvasId/notes with input in body", async () => {
      mockOkResponse({ id: "n1", type: "npc", title: "Gandalf" });

      await createNote("canvas-123", { type: "npc", title: "Gandalf" });

      expect(getCalledUrl()).toContain("/canvases/canvas-123/notes");
      expect(getCalledOptions().method).toBe("POST");
      expect(JSON.parse(getCalledOptions().body as string)).toEqual({
        type: "npc",
        title: "Gandalf",
      });
    });
  });

  describe("searchNotes", () => {
    it("calls GET /canvases/:canvasId/notes/search with query param", async () => {
      mockOkResponse({ results: [] });

      await searchNotes("wizard", "canvas-123");

      expect(getCalledUrl()).toContain("/canvases/canvas-123/notes/search");
      expect(getCalledUrl()).toContain("q=wizard");
    });

    it("encodes special characters in query", async () => {
      mockOkResponse({ results: [] });

      await searchNotes("hello world", "canvas-123");

      expect(getCalledUrl()).toContain("q=hello%20world");
    });
  });
});
