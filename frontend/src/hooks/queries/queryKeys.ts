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
  timeline: {
    list: (canvasId: string, sort: string, parentItemId?: string) =>
      ["canvases", canvasId, "timeline", sort, parentItemId] as const,
    counts: (canvasId: string, start: string, end: string, parentItemId?: string) =>
      ["canvases", canvasId, "timeline", "counts", start, end, parentItemId] as const,
  },
  gallery: {
    list: (canvasId: string, importantOnly: boolean, parentItemId?: string) =>
      ["canvases", canvasId, "gallery", importantOnly, parentItemId] as const,
  },
  sessions: {
    list: (canvasId: string) => ["canvases", canvasId, "sessions"] as const,
  },
  tags: {
    list: (canvasId: string) => ["canvases", canvasId, "tags"] as const,
  },
  taggedItems: {
    list: (itemId: string) => ["items", itemId, "taggedItems"] as const,
  },
  quickNotes: {
    list: (canvasId: string) => ["canvases", canvasId, "quickNotes"] as const,
  },
  noteHistory: {
    list: (noteId: string) => ["notes", noteId, "history"] as const,
  },
  shares: {
    list: (canvasId: string) => ["canvases", canvasId, "shares"] as const,
  },
  quickNoteHistory: {
    list: (canvasId: string, quickNoteId: string) =>
      ["canvases", canvasId, "quickNotes", quickNoteId, "history"] as const,
  },
};
