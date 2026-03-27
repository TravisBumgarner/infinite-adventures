import { QueryClient } from "@tanstack/react-query";
import { useAppStore } from "../stores/appStore";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: () => {
        useAppStore.getState().showToast("Something went wrong. Please try again.");
      },
    },
  },
});
