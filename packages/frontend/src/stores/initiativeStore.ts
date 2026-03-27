import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Combatant {
  id: string;
  name: string;
  initiative: number;
}

interface InitiativeState {
  isOpen: boolean;
  position: { x: number; y: number };
  combatants: Combatant[];
  activeTurnIndex: number;
  round: number;
  toggle: () => void;
  setPosition: (position: { x: number; y: number }) => void;
  addCombatant: (name: string, initiative: number) => void;
  removeCombatant: (id: string) => void;
  nextTurn: () => void;
  previousTurn: () => void;
  clearAll: () => void;
}

let nextId = 0;

export const useInitiativeStore = create<InitiativeState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      position: { x: 80, y: 360 },
      combatants: [],
      activeTurnIndex: 0,
      round: 1,

      toggle: () => set((s) => ({ isOpen: !s.isOpen })),

      setPosition: (position) => set({ position }),

      addCombatant: (name, initiative) => {
        const maxId = get().combatants.reduce((max, c) => Math.max(max, Number(c.id) || 0), nextId);
        nextId = maxId + 1;
        set((s) => ({
          combatants: [...s.combatants, { id: String(nextId), name, initiative }],
        }));
      },

      removeCombatant: (id) => {
        const { combatants, activeTurnIndex } = get();
        const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative);
        const removedSortedIndex = sorted.findIndex((c) => c.id === id);
        const remaining = combatants.filter((c) => c.id !== id);

        let newIndex = activeTurnIndex;
        if (remaining.length === 0) {
          newIndex = 0;
        } else if (removedSortedIndex < activeTurnIndex) {
          newIndex = activeTurnIndex - 1;
        } else if (activeTurnIndex >= remaining.length) {
          newIndex = 0;
        }

        set({ combatants: remaining, activeTurnIndex: newIndex });
      },

      nextTurn: () => {
        const { combatants, activeTurnIndex, round } = get();
        if (combatants.length === 0) return;
        const lastIndex = combatants.length - 1;
        if (activeTurnIndex >= lastIndex) {
          set({ activeTurnIndex: 0, round: round + 1 });
        } else {
          set({ activeTurnIndex: activeTurnIndex + 1 });
        }
      },

      previousTurn: () => {
        const { combatants, activeTurnIndex, round } = get();
        if (combatants.length === 0) return;
        if (activeTurnIndex <= 0) {
          const newRound = Math.max(1, round - 1);
          set({
            activeTurnIndex: combatants.length - 1,
            round: newRound,
          });
        } else {
          set({ activeTurnIndex: activeTurnIndex - 1 });
        }
      },

      clearAll: () => set({ combatants: [], activeTurnIndex: 0, round: 1 }),
    }),
    {
      name: "initiative-tracker",
      partialize: (state) => ({
        combatants: state.combatants,
        activeTurnIndex: state.activeTurnIndex,
        round: state.round,
        position: state.position,
      }),
    },
  ),
);
