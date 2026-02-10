import * as Sentry from "@sentry/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { applyCssVars } from "./styles/cssVars";
import type { ThemePreference } from "./styles/styleConsts";
import { resolveThemeMode } from "./styles/styleConsts";

Sentry.init({
  dsn: "https://3cd53077d000fe45c543a32300226c8f@o196886.ingest.us.sentry.io/4510862830731264",
  sendDefaultPii: true,
});

// Apply CSS vars synchronously before first paint to avoid flash
const stored = localStorage.getItem("infinite-adventures-theme") as ThemePreference | null;
applyCssVars(resolveThemeMode(stored || "system"));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
