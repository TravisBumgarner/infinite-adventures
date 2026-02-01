import Router from "./components/Router";
import { AppThemeProvider } from "./styles/Theme";

function App() {
  return (
    <AppThemeProvider>
      <Router />
    </AppThemeProvider>
  );
}

export default App;
