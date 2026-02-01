import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider.js";
import Router from "./components/Router";
import { AppThemeProvider } from "./styles/Theme";

function App() {
  return (
    <BrowserRouter>
      <AppThemeProvider>
        <AuthProvider>
          <Router />
        </AuthProvider>
      </AppThemeProvider>
    </BrowserRouter>
  );
}

export default App;
