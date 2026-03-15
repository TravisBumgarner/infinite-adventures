import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Router from "./components/Router";
import { queryClient } from "./lib/queryClient";
import { ModalRenderer } from "./modals";
import Toast from "./sharedComponents/Toast";
import { useAppStore } from "./stores/appStore";
import { AppThemeProvider } from "./styles/Theme";

function App() {
  const toastMessage = useAppStore((s) => s.toastMessage);
  const clearToast = useAppStore((s) => s.clearToast);

  useEffect(() => {
    useAppStore.getState().refreshUser();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
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
