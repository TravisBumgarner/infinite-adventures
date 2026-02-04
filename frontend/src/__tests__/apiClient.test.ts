import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../auth/service.js", () => ({
  getToken: vi.fn(),
}));

import {
  createCanvas,
  createItem,
  deleteCanvas,
  deleteItem,
  deletePhoto,
  fetchCanvases,
  fetchItem,
  fetchItems,
  searchItems,
  selectPhoto,
  updateCanvas,
  updateItem,
  uploadPhoto,
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
      const items = [
        { id: "1", type: "person", title: "Gandalf", canvas_x: 0, canvas_y: 0, created_at: "" },
      ];
      mockOkResponse(items);

      const result = await fetchItems("canvas-1");
      expect(result).toEqual(items);
    });

    it("unwraps { success: true, data } envelope from get endpoint", async () => {
      const item = {
        id: "1",
        type: "person",
        title: "Gandalf",
        canvas_x: 0,
        canvas_y: 0,
        created_at: "",
        updated_at: "",
        content: { id: "c1", notes: "" },
        photos: [],
        links_to: [],
        linked_from: [],
      };
      mockOkResponse(item);

      const result = await fetchItem("1");
      expect(result.id).toBe("1");
      expect(result.title).toBe("Gandalf");
    });
  });

  describe("error responses", () => {
    it("throws error with errorCode when response has success: false", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ success: false, errorCode: "CANVAS_ITEM_NOT_FOUND" }),
      });

      await expect(fetchItem("nonexistent")).rejects.toThrow("CANVAS_ITEM_NOT_FOUND");
    });

    it("throws error with HTTP status when response body has no errorCode", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      await expect(fetchItem("1")).rejects.toThrow("500");
    });
  });

  describe("auth headers", () => {
    it("includes Authorization header when token is available", async () => {
      mockGetToken.mockResolvedValue({ success: true, data: "jwt-token-123" });
      mockOkResponse([]);

      await fetchItems("canvas-1");

      const headers = getCalledOptions()?.headers;
      expect(headers).toMatchObject({ Authorization: "Bearer jwt-token-123" });
    });

    it("omits Authorization header when no token is available", async () => {
      mockGetToken.mockResolvedValue({ success: false, error: "no session" });
      mockOkResponse([]);

      await fetchItems("canvas-1");

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

describe("canvas item API functions", () => {
  describe("fetchItems", () => {
    it("calls GET /canvases/:canvasId/items", async () => {
      mockOkResponse([]);

      await fetchItems("canvas-123");

      expect(getCalledUrl()).toContain("/canvases/canvas-123/items");
      expect(getCalledOptions()?.method).toBeUndefined();
    });

    it("returns array of canvas item summaries", async () => {
      const items = [
        { id: "1", type: "person", title: "Gandalf", canvas_x: 10, canvas_y: 20, created_at: "" },
      ];
      mockOkResponse(items);

      const result = await fetchItems("canvas-123");

      expect(result).toEqual(items);
    });
  });

  describe("fetchItem", () => {
    it("calls GET /items/:id", async () => {
      mockOkResponse({
        id: "1",
        type: "person",
        title: "Gandalf",
        canvas_x: 0,
        canvas_y: 0,
        created_at: "",
        updated_at: "",
        content: { id: "c1", notes: "" },
        photos: [],
        links_to: [],
        linked_from: [],
      });

      await fetchItem("item-123");

      expect(getCalledUrl()).toContain("/items/item-123");
    });

    it("returns canvas item with content and photos", async () => {
      const item = {
        id: "1",
        type: "person",
        title: "Gandalf",
        canvas_x: 0,
        canvas_y: 0,
        created_at: "",
        updated_at: "",
        content: { id: "c1", notes: "A wizard" },
        photos: [
          { id: "p1", url: "/api/photos/p1.jpg", original_name: "gandalf.jpg", is_selected: true },
        ],
        links_to: [],
        linked_from: [],
      };
      mockOkResponse(item);

      const result = await fetchItem("1");

      expect(result.content.notes).toBe("A wizard");
      expect(result.photos).toHaveLength(1);
    });
  });

  describe("createItem", () => {
    it("calls POST /canvases/:canvasId/items with input in body", async () => {
      mockOkResponse({ id: "1", type: "person", title: "Gandalf" });

      await createItem("canvas-123", { type: "person", title: "Gandalf" });

      expect(getCalledUrl()).toContain("/canvases/canvas-123/items");
      expect(getCalledOptions().method).toBe("POST");
      expect(JSON.parse(getCalledOptions().body as string)).toEqual({
        type: "person",
        title: "Gandalf",
      });
    });
  });

  describe("updateItem", () => {
    it("calls PUT /items/:id with input in body", async () => {
      mockOkResponse({ id: "1", type: "person", title: "Gandalf the Grey" });

      await updateItem("item-123", { title: "Gandalf the Grey" });

      expect(getCalledUrl()).toContain("/items/item-123");
      expect(getCalledOptions().method).toBe("PUT");
      expect(JSON.parse(getCalledOptions().body as string)).toEqual({
        title: "Gandalf the Grey",
      });
    });
  });

  describe("deleteItem", () => {
    it("calls DELETE /items/:id", async () => {
      mockOkResponse(undefined);

      await deleteItem("item-123");

      expect(getCalledUrl()).toContain("/items/item-123");
      expect(getCalledOptions().method).toBe("DELETE");
    });
  });

  describe("searchItems", () => {
    it("calls GET /canvases/:canvasId/items/search with query param", async () => {
      mockOkResponse({ results: [] });

      await searchItems("wizard", "canvas-123");

      expect(getCalledUrl()).toContain("/canvases/canvas-123/items/search");
      expect(getCalledUrl()).toContain("q=wizard");
    });

    it("encodes special characters in query", async () => {
      mockOkResponse({ results: [] });

      await searchItems("hello world", "canvas-123");

      expect(getCalledUrl()).toContain("q=hello%20world");
    });

    it("returns array of search results", async () => {
      const results = [{ id: "1", type: "person", title: "Gandalf", snippet: "...a wizard..." }];
      mockOkResponse({ results });

      const result = await searchItems("wizard", "canvas-123");

      expect(result).toEqual(results);
    });
  });
});

describe("photo API functions", () => {
  describe("uploadPhoto", () => {
    it("calls POST /items/:itemId/photos with FormData", async () => {
      mockOkResponse({
        id: "p1",
        url: "/api/photos/p1.jpg",
        original_name: "test.jpg",
        is_selected: false,
      });

      const file = new File(["test content"], "test.jpg", { type: "image/jpeg" });
      await uploadPhoto("item-123", file);

      expect(getCalledUrl()).toContain("/items/item-123/photos");
      expect(getCalledOptions().method).toBe("POST");
    });

    it("sends file in FormData body", async () => {
      mockOkResponse({
        id: "p1",
        url: "/api/photos/p1.jpg",
        original_name: "test.jpg",
        is_selected: false,
      });

      const file = new File(["test content"], "test.jpg", { type: "image/jpeg" });
      await uploadPhoto("item-123", file);

      const body = getCalledOptions().body;
      expect(body).toBeInstanceOf(FormData);
      expect((body as FormData).get("photo")).toBeInstanceOf(File);
    });

    it("does not include Content-Type header (browser sets it for FormData)", async () => {
      mockOkResponse({
        id: "p1",
        url: "/api/photos/p1.jpg",
        original_name: "test.jpg",
        is_selected: false,
      });

      const file = new File(["test content"], "test.jpg", { type: "image/jpeg" });
      await uploadPhoto("item-123", file);

      const headers = getCalledOptions().headers as Record<string, string>;
      expect(headers["Content-Type"]).toBeUndefined();
    });

    it("returns uploaded photo info", async () => {
      const photo = {
        id: "p1",
        url: "/api/photos/p1.jpg",
        original_name: "gandalf.jpg",
        is_selected: false,
      };
      mockOkResponse(photo);

      const file = new File(["test content"], "gandalf.jpg", { type: "image/jpeg" });
      const result = await uploadPhoto("item-123", file);

      expect(result.id).toBe("p1");
      expect(result.original_name).toBe("gandalf.jpg");
    });
  });

  describe("deletePhoto", () => {
    it("calls DELETE /photos/:id", async () => {
      mockOkResponse(undefined);

      await deletePhoto("photo-123");

      expect(getCalledUrl()).toContain("/photos/photo-123");
      expect(getCalledOptions().method).toBe("DELETE");
    });
  });

  describe("selectPhoto", () => {
    it("calls PUT /photos/:id/select", async () => {
      mockOkResponse({
        id: "p1",
        url: "/api/photos/p1.jpg",
        original_name: "test.jpg",
        is_selected: true,
      });

      await selectPhoto("photo-123");

      expect(getCalledUrl()).toContain("/photos/photo-123/select");
      expect(getCalledOptions().method).toBe("PUT");
    });

    it("returns photo with is_selected true", async () => {
      const photo = {
        id: "p1",
        url: "/api/photos/p1.jpg",
        original_name: "test.jpg",
        is_selected: true,
      };
      mockOkResponse(photo);

      const result = await selectPhoto("photo-123");

      expect(result.is_selected).toBe(true);
    });
  });
});
