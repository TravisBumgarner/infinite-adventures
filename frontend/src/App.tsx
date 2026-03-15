import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Router from "./components/Router";
import posthog from "./lib/posthog.js";
import { queryClient } from "./lib/queryClient";
import { ModalRenderer } from "./modals";
import Toast from "./sharedComponents/Toast";
import { useAppStore } from "./stores/appStore";
import { AppThemeProvider } from "./styles/Theme";

function PageViewTracker() {
  const { pathname } = useLocation();
  useEffect(() => {
    posthog.capture("$pageview", { $current_url: `${window.location.origin}${pathname}` });
  }, [pathname]);
  return null;
}

function App() {
  const toastMessage = useAppStore((s) => s.toastMessage);
  const clearToast = useAppStore((s) => s.clearToast);

  useEffect(() => {
    useAppStore.getState().refreshUser();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <PageViewTracker />
        <AppThemeProvider>
          <ErrorBoundary>
            <Router />
          </ErrorBoundary>
          <ModalRenderer />
          <Toast open={!!toastMessage} message={toastMessage ?? ""} onClose={clearToast} />
        </AppThemeProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
