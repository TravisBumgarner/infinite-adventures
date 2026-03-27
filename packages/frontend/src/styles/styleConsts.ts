/**
 * Catppuccin Mocha & Latte palettes and design tokens.
 * https://github.com/catppuccin/catppuccin
 */

export const PALETTE_MOCHA = {
  base: "#1e1e2e",
  mantle: "#181825",
  crust: "#11111b",
  surface0: "#313244",
  surface1: "#45475a",
  surface2: "#585b70",
  overlay0: "#6c7086",
  overlay1: "#7f849c",
  overlay2: "#9399b2",
  subtext0: "#a6adc8",
  subtext1: "#bac2de",
  text: "#cdd6f4",
  lavender: "#b4befe",
  blue: "#89b4fa",
  sapphire: "#74c7ec",
  sky: "#89dceb",
  teal: "#94e2d5",
  green: "#a6e3a1",
  yellow: "#f9e2af",
  peach: "#fab387",
  maroon: "#eba0ac",
  red: "#f38ba8",
  mauve: "#cba6f7",
  pink: "#f5c2e7",
  flamingo: "#f2cdcd",
  rosewater: "#f5e0dc",
} as const;

export const PALETTE_LATTE = {
  base: "#eff1f5",
  mantle: "#e6e9ef",
  crust: "#dce0e8",
  surface0: "#ccd0da",
  surface1: "#bcc0cc",
  surface2: "#acb0be",
  overlay0: "#9ca0b0",
  overlay1: "#8c8fa1",
  overlay2: "#7c7f93",
  subtext0: "#6c6f85",
  subtext1: "#5c5f77",
  text: "#4c4f69",
  lavender: "#7287fd",
  blue: "#1e66f5",
  sapphire: "#209fb5",
  sky: "#04a5e5",
  teal: "#179299",
  green: "#40a02b",
  yellow: "#df8e1d",
  peach: "#fe640b",
  maroon: "#e64553",
  red: "#d20f39",
  mauve: "#8839ef",
  pink: "#ea76cb",
  flamingo: "#dd7878",
  rosewater: "#dc8a78",
} as const;

/** Backwards-compatible alias — defaults to Mocha (dark). */
export const PALETTE = PALETTE_MOCHA;

export type ThemePreference = "system" | "light" | "dark";
export type EffectiveMode = "light" | "dark";

export function resolveThemeMode(pref: ThemePreference): EffectiveMode {
  if (pref === "light") return "light";
  if (pref === "dark") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getPalette(mode: EffectiveMode) {
  return mode === "dark" ? PALETTE_MOCHA : PALETTE_LATTE;
}

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  md: 14,
  lg: 16,
  xl: 20,
} as const;

export const BORDER_RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
} as const;
