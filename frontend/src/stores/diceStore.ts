import { create } from "zustand";

interface Die {
  id: string;
  sides: number;
}

interface RollResult {
  sides: number;
  result: number;
}

interface HistoryEntry {
  id: string;
  dice: RollResult[];
  total: number;
  timestamp: number;
}

interface DiceState {
  isOpen: boolean;
  position: { x: number; y: number };
  dice: Die[];
  lastRoll: RollResult[] | null;
  history: HistoryEntry[];
  activeTab: "roller" | "history";
  toggle: () => void;
  setPosition: (position: { x: number; y: number }) => void;
  addDie: (sides: number) => void;
  removeDie: (id: string) => void;
  clearDice: () => void;
  roll: () => void;
  clearHistory: () => void;
  setActiveTab: (tab: "roller" | "history") => void;
}

let nextId = 0;

export const useDiceStore = create<DiceState>((set, get) => ({
  isOpen: false,
  position: { x: 80, y: 120 },
  dice: [],
  lastRoll: null,
  history: [],
  activeTab: "roller",

  toggle: () => set((s) => ({ isOpen: !s.isOpen })),

  setPosition: (position) => set({ position }),

  addDie: (sides) =>
    set((s) => ({
      dice: [...s.dice, { id: String(++nextId), sides }],
      lastRoll: null,
    })),

  removeDie: (id) =>
    set((s) => ({
      dice: s.dice.filter((d) => d.id !== id),
      lastRoll: null,
    })),

  clearDice: () => set({ dice: [], lastRoll: null }),

  roll: () => {
    const { dice } = get();
    if (dice.length === 0) return;
    const results = dice.map((d) => ({
      sides: d.sides,
      result: Math.floor(Math.random() * d.sides) + 1,
    }));
    const total = results.reduce((sum, r) => sum + r.result, 0);
    set((s) => ({
      lastRoll: results,
      history: [
        { id: String(++nextId), dice: results, total, timestamp: Date.now() },
        ...s.history,
      ],
    }));
  },

  clearHistory: () => set({ history: [] }),

  setActiveTab: (tab) => set({ activeTab: tab }),
}));
