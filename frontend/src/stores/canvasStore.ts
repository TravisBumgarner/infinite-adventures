import type { CanvasSummary, Note, NoteType } from "shared";
import { create } from "zustand";

interface ContextMenuState {
  x: number;
  y: number;
  flowX: number;
  flowY: number;
}

interface NodeContextMenuState {
  x: number;
  y: number;
  noteId: string;
  selectedIds: string[];
}

const ACTIVE_CANVAS_KEY = "infinite-adventures-active-canvas";

export function getViewportKey(canvasId: string): string {
  return `infinite-adventures-viewport-${canvasId}`;
}

interface CanvasState {
  canvases: CanvasSummary[];
  setCanvases: (canvases: CanvasSummary[]) => void;

  activeCanvasId: string | null;
  setActiveCanvasId: (id: string) => void;
  initActiveCanvas: (canvases: CanvasSummary[]) => string;

  notesCache: Map<string, Note>;
  setNotesCache: (cache: Map<string, Note>) => void;
  updateCachedNote: (note: Note) => void;
  removeCachedNote: (noteId: string) => void;

  editingNoteId: string | null;
  setEditingNoteId: (id: string | null) => void;

  browsingNoteId: string | null;
  setBrowsingNoteId: (id: string | null) => void;

  showSettings: boolean;
  setShowSettings: (show: boolean) => void;

  closeAllPanels: () => void;

  contextMenu: ContextMenuState | null;
  setContextMenu: (menu: ContextMenuState | null) => void;

  nodeContextMenu: NodeContextMenuState | null;
  setNodeContextMenu: (menu: NodeContextMenuState | null) => void;

  activeTypes: Set<NoteType>;
  toggleType: (type: NoteType) => void;

  filterSearch: string;
  setFilterSearch: (search: string) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  canvases: [],
  setCanvases: (canvases) => set({ canvases }),

  activeCanvasId: null,
  setActiveCanvasId: (id) => {
    localStorage.setItem(ACTIVE_CANVAS_KEY, id);
    set({ activeCanvasId: id });
  },
  initActiveCanvas: (canvases) => {
    const saved = localStorage.getItem(ACTIVE_CANVAS_KEY);
    const match = canvases.find((c) => c.id === saved);
    const activeId = match ? match.id : canvases[0]?.id ?? "";
    localStorage.setItem(ACTIVE_CANVAS_KEY, activeId);
    set({ canvases, activeCanvasId: activeId });
    return activeId;
  },

  notesCache: new Map(),
  setNotesCache: (cache) => set({ notesCache: cache }),
  updateCachedNote: (note) =>
    set((state) => {
      const next = new Map(state.notesCache);
      next.set(note.id, note);
      return { notesCache: next };
    }),
  removeCachedNote: (noteId) =>
    set((state) => {
      const next = new Map(state.notesCache);
      next.delete(noteId);
      return { notesCache: next };
    }),

  editingNoteId: null,
  setEditingNoteId: (id) => set({ editingNoteId: id }),

  browsingNoteId: null,
  setBrowsingNoteId: (id) => set({ browsingNoteId: id }),

  showSettings: false,
  setShowSettings: (show) => set({ showSettings: show }),

  closeAllPanels: () =>
    set({
      editingNoteId: null,
      browsingNoteId: null,
      contextMenu: null,
      nodeContextMenu: null,
      showSettings: false,
    }),

  contextMenu: null,
  setContextMenu: (menu) => set({ contextMenu: menu }),

  nodeContextMenu: null,
  setNodeContextMenu: (menu) => set({ nodeContextMenu: menu }),

  activeTypes: new Set(),
  toggleType: (type) =>
    set((state) => {
      const next = new Set(state.activeTypes);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return { activeTypes: next };
    }),

  filterSearch: "",
  setFilterSearch: (search) => set({ filterSearch: search }),
}));
