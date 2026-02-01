import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import Router from "./components/Router";
import { useAppStore } from "./stores/appStore";
import { AppThemeProvider } from "./styles/Theme";

function App() {
  useEffect(() => {
    useAppStore.getState().refreshUser();
  }, []);

  return (
    <BrowserRouter>
      <AppThemeProvider>
        <Router />
      </AppThemeProvider>
    </BrowserRouter>
  );
}

export default App;
