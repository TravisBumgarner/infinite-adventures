import { create } from "zustand";

interface QuickNotesState {
  isOpen: boolean;
  position: { x: number; y: number };
  toggle: () => void;
  setPosition: (position: { x: number; y: number }) => void;
}

export const useQuickNotesStore = create<QuickNotesState>((set) => ({
  isOpen: false,
  position: { x: 80, y: 200 },
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  setPosition: (position) => set({ position }),
}));
