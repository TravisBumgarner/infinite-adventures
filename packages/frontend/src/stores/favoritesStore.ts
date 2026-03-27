import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoritesState {
  /** Map of canvasId → array of item IDs */
  favorites: Record<string, string[]>;
  addFavorite: (canvasId: string, itemId: string) => void;
  removeFavorite: (canvasId: string, itemId: string) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({
      favorites: {},
      addFavorite: (canvasId, itemId) =>
        set((s) => {
          const current = s.favorites[canvasId] ?? [];
          if (current.includes(itemId)) return s;
          return { favorites: { ...s.favorites, [canvasId]: [...current, itemId] } };
        }),
      removeFavorite: (canvasId, itemId) =>
        set((s) => {
          const current = s.favorites[canvasId] ?? [];
          return {
            favorites: { ...s.favorites, [canvasId]: current.filter((id) => id !== itemId) },
          };
        }),
    }),
    { name: "favorites-store" },
  ),
);
