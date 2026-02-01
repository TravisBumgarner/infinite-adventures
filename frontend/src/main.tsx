import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { applyCssVars } from "./styles/cssVars";
import type { ThemePreference } from "./styles/styleConsts";
import { resolveThemeMode } from "./styles/styleConsts";

// Apply CSS vars synchronously before first paint to avoid flash
const stored = localStorage.getItem("infinite-adventures-theme") as ThemePreference | null;
applyCssVars(resolveThemeMode(stored || "system"));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
