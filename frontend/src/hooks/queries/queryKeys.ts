export const queryKeys = {
  canvases: {
    all: ["canvases"] as const,
  },
  items: {
    list: (canvasId: string) => ["canvases", canvasId, "items"] as const,
    detail: (itemId: string) => ["items", itemId] as const,
    search: (canvasId: string, query: string) =>
      ["canvases", canvasId, "items", "search", query] as const,
  },
  sessions: {
    list: (canvasId: string) => ["canvases", canvasId, "sessions"] as const,
  },
  tags: {
    list: (canvasId: string) => ["canvases", canvasId, "tags"] as const,
  },
};
