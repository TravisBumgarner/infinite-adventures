import type { Note, NoteType } from "shared";
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

interface CanvasState {
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
