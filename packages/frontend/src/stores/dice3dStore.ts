import { create } from "zustand";

interface Dice3dState {
  isOpen: boolean;
  position: { x: number; y: number };
  tray: string[];
  results: { type: string; value: number }[] | null;
  rolling: boolean;
  toggle: () => void;
  setPosition: (position: { x: number; y: number }) => void;
  addDie: (type: string) => void;
  removeDie: (type: string) => void;
  clearTray: () => void;
  setResults: (results: { type: string; value: number }[] | null) => void;
  setRolling: (rolling: boolean) => void;
}

export const useDice3dStore = create<Dice3dState>((set) => ({
  isOpen: false,
  position: { x: 120, y: 160 },
  tray: [],
  results: null,
  rolling: false,

  toggle: () => set((s) => ({ isOpen: !s.isOpen })),

  setPosition: (position) => set({ position }),

  addDie: (type) => set((s) => ({ tray: [...s.tray, type], results: null })),

  removeDie: (type) =>
    set((s) => {
      const idx = s.tray.lastIndexOf(type);
      if (idx < 0) return s;
      const next = [...s.tray];
      next.splice(idx, 1);
      return { tray: next, results: null };
    }),

  clearTray: () => set({ tray: [], results: null }),

  setResults: (results) => set({ results }),

  setRolling: (rolling) => set({ rolling }),
}));
