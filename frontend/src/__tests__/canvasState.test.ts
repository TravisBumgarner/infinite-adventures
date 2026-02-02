// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getViewportKey, useCanvasStore } from "../stores/canvasStore";

const canvas1 = { id: "c1", name: "Default" };
const canvas2 = { id: "c2", name: "Battle Map" };

beforeEach(() => {
  localStorage.clear();
  useCanvasStore.setState({
    canvases: [],
    activeCanvasId: null,
  });
});

afterEach(() => {
  localStorage.clear();
});

describe("getViewportKey", () => {
  it("returns a canvas-specific viewport key", () => {
    expect(getViewportKey("c1")).toBe("infinite-adventures-viewport-c1");
  });
});

describe("canvasStore active canvas", () => {
  describe("initActiveCanvas", () => {
    it("uses the first canvas when no saved preference exists", () => {
      const result = useCanvasStore.getState().initActiveCanvas([canvas1, canvas2]);

      expect(result).toBe("c1");
      expect(useCanvasStore.getState().activeCanvasId).toBe("c1");
    });

    it("restores saved canvas ID from localStorage", () => {
      localStorage.setItem("infinite-adventures-active-canvas", "c2");

      const result = useCanvasStore.getState().initActiveCanvas([canvas1, canvas2]);

      expect(result).toBe("c2");
      expect(useCanvasStore.getState().activeCanvasId).toBe("c2");
    });

    it("falls back to first canvas if saved ID no longer exists", () => {
      localStorage.setItem("infinite-adventures-active-canvas", "deleted-id");

      const result = useCanvasStore.getState().initActiveCanvas([canvas1, canvas2]);

      expect(result).toBe("c1");
    });

    it("stores the canvases list in state", () => {
      useCanvasStore.getState().initActiveCanvas([canvas1, canvas2]);

      expect(useCanvasStore.getState().canvases).toEqual([canvas1, canvas2]);
    });
  });

  describe("setActiveCanvasId", () => {
    it("updates state and persists to localStorage", () => {
      useCanvasStore.getState().setActiveCanvasId("c2");

      expect(useCanvasStore.getState().activeCanvasId).toBe("c2");
      expect(localStorage.getItem("infinite-adventures-active-canvas")).toBe("c2");
    });
  });
});
