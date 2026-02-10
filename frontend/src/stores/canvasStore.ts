import type { CanvasItem, CanvasItemType, CanvasSummary } from "shared";
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
  nodeId: string;
}

interface SelectionContextMenuState {
  x: number;
  y: number;
  nodeIds: string[];
}

const ACTIVE_CANVAS_KEY = "infinite-adventures-active-canvas";
export const ONBOARDING_COMPLETE_KEY = "infinite-adventures-onboarding-complete";

export function getViewportKey(canvasId: string): string {
  return `infinite-adventures-viewport-${canvasId}`;
}

type PanelTab = "notes" | "photos" | "connections" | "details";

interface CanvasState {
  canvases: CanvasSummary[];
  setCanvases: (canvases: CanvasSummary[]) => void;

  activeCanvasId: string | null;
  setActiveCanvasId: (id: string) => void;
  initActiveCanvas: (canvases: CanvasSummary[]) => string;

  itemsCache: Map<string, CanvasItem>;
  setItemsCache: (cache: Map<string, CanvasItem>) => void;
  updateCachedItem: (item: CanvasItem) => void;
  removeCachedItem: (itemId: string) => void;

  editingItemId: string | null;
  setEditingItemId: (id: string | null) => void;

  panelTab: PanelTab;
  setPanelTab: (tab: PanelTab) => void;

  showSettings: boolean;
  setShowSettings: (show: boolean) => void;

  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;

  closeAllPanels: () => void;

  contextMenu: ContextMenuState | null;
  setContextMenu: (menu: ContextMenuState | null) => void;

  nodeContextMenu: NodeContextMenuState | null;
  setNodeContextMenu: (menu: NodeContextMenuState | null) => void;

  selectionContextMenu: SelectionContextMenuState | null;
  setSelectionContextMenu: (menu: SelectionContextMenuState | null) => void;

  activeTypes: Set<CanvasItemType>;
  toggleType: (type: CanvasItemType) => void;

  activeTags: Set<string>;
  toggleTag: (tagId: string) => void;

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
    const activeId = match ? match.id : (canvases[0]?.id ?? "");
    localStorage.setItem(ACTIVE_CANVAS_KEY, activeId);
    set({ canvases, activeCanvasId: activeId });
    return activeId;
  },

  itemsCache: new Map(),
  setItemsCache: (cache) => set({ itemsCache: cache }),
  updateCachedItem: (item) =>
    set((state) => {
      const next = new Map(state.itemsCache);
      next.set(item.id, item);
      return { itemsCache: next };
    }),
  removeCachedItem: (itemId) =>
    set((state) => {
      const next = new Map(state.itemsCache);
      next.delete(itemId);
      return { itemsCache: next };
    }),

  editingItemId: null,
  setEditingItemId: (id) => set({ editingItemId: id }),

  panelTab: "notes",
  setPanelTab: (tab) => set({ panelTab: tab }),

  showSettings: false,
  setShowSettings: (show) => set({ showSettings: show }),

  showOnboarding: false,
  setShowOnboarding: (_show) => {},

  closeAllPanels: () =>
    set({
      editingItemId: null,
      contextMenu: null,
      nodeContextMenu: null,
      selectionContextMenu: null,
      showSettings: false,
    }),

  contextMenu: null,
  setContextMenu: (menu) => set({ contextMenu: menu }),

  nodeContextMenu: null,
  setNodeContextMenu: (menu) => set({ nodeContextMenu: menu }),

  selectionContextMenu: null,
  setSelectionContextMenu: (menu) => set({ selectionContextMenu: menu }),

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

  activeTags: new Set(),
  toggleTag: (tagId) =>
    set((state) => {
      const next = new Set(state.activeTags);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return { activeTags: next };
    }),

  filterSearch: "",
  setFilterSearch: (search) => set({ filterSearch: search }),
}));
