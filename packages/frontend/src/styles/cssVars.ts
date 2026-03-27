import type { EffectiveMode } from "./styleConsts";
import { getPalette } from "./styleConsts";

/**
 * Set CSS custom properties on :root for the active theme mode.
 * Components reference these vars (e.g. `var(--color-base)`) in their
 * inline style objects so they react to theme changes without re-render.
 */
export function applyCssVars(mode: EffectiveMode): void {
  const palette = getPalette(mode);
  const root = document.documentElement;

  for (const [key, value] of Object.entries(palette)) {
    root.style.setProperty(`--color-${key}`, value);
  }

  // Semantic vars that differ by mode (rgba values)
  if (mode === "dark") {
    root.style.setProperty("--color-chrome-bg", "rgba(30,30,46,0.85)");
    root.style.setProperty("--color-backdrop", "rgba(0,0,0,0.4)");
    root.style.setProperty("--color-mention-bg", "rgba(137,180,250,0.1)");
  } else {
    root.style.setProperty("--color-chrome-bg", "rgba(239,241,245,0.85)");
    root.style.setProperty("--color-backdrop", "rgba(0,0,0,0.15)");
    root.style.setProperty("--color-mention-bg", "rgba(30,102,245,0.1)");
  }
}
