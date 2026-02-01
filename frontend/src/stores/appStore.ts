import { create } from "zustand";
import type { AuthUser } from "../auth/service.js";
import { getUser } from "../auth/service.js";

interface AppState {
  user: AuthUser | null;
  authLoading: boolean;
  toastMessage: string | null;
  refreshUser: () => Promise<void>;
  clearUser: () => void;
  showToast: (message: string) => void;
  clearToast: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  authLoading: true,
  toastMessage: null,

  refreshUser: async () => {
    const result = await getUser();
    if (result.success) {
      set({ user: result.data, authLoading: false });
    } else {
      set({ user: null, authLoading: false });
    }
  },

  clearUser: () => set({ user: null }),

  showToast: (message) => set({ toastMessage: message }),

  clearToast: () => set({ toastMessage: null }),
}));
