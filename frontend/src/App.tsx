import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import Router from "./components/Router";
import { queryClient } from "./lib/queryClient";
import { ModalRenderer } from "./modals";
import { useAppStore } from "./stores/appStore";
import { AppThemeProvider } from "./styles/Theme";

function App() {
  useEffect(() => {
    useAppStore.getState().refreshUser();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppThemeProvider>
          <Router />
          <ModalRenderer />
        </AppThemeProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
