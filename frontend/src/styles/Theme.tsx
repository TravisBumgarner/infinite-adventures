import { CssBaseline, createTheme, ThemeProvider } from "@mui/material";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CanvasItemType } from "shared";
import { STORAGE_KEY_THEME } from "../constants";
import { applyCssVars } from "./cssVars";
import type { EffectiveMode, ThemePreference } from "./styleConsts";
import { BORDER_RADIUS, FONT_SIZES, getPalette, resolveThemeMode, SPACING } from "./styleConsts";

// Augment MUI theme types with canvasItemTypes palette
declare module "@mui/material/styles" {
  interface Palette {
    canvasItemTypes: Record<CanvasItemType, { light: string; dark: string }>;
  }
  interface PaletteOptions {
    canvasItemTypes?: Record<CanvasItemType, { light: string; dark: string }>;
  }
}

const STORAGE_KEY = STORAGE_KEY_THEME;

const CANVAS_ITEM_TYPES_PALETTE: Record<CanvasItemType, { light: string; dark: string }> = {
  person: { light: "#4a90d9", dark: "#2a5a8a" }, // Blue - for people (PCs, NPCs)
  place: { light: "#22c55e", dark: "#167a3a" }, // Green - for locations
  thing: { light: "#d9a74a", dark: "#8a6a2a" }, // Gold - for items
  session: { light: "#6b7280", dark: "#434950" }, // Gray - for sessions
  event: { light: "#8b5cf6", dark: "#5a3a9e" }, // Purple - for events (quests, goals)
};

function buildTheme(mode: EffectiveMode) {
  const p = getPalette(mode);
  return createTheme({
    palette: {
      mode,
      background: {
        default: p.base,
        paper: p.mantle,
      },
      text: {
        primary: p.text,
        secondary: p.subtext0,
      },
      primary: { main: p.blue },
      secondary: { main: p.mauve },
      error: { main: p.red },
      warning: { main: p.peach },
      info: { main: p.sapphire },
      success: { main: p.green },
      divider: p.surface1,
      canvasItemTypes: CANVAS_ITEM_TYPES_PALETTE,
    },
    typography: {
      h1: { fontSize: FONT_SIZES.xl, fontWeight: 700 },
      h3: { fontSize: FONT_SIZES.xl, fontWeight: 700 },
      h4: { fontSize: FONT_SIZES.xl, fontWeight: 600 },
      h5: { fontSize: FONT_SIZES.lg, fontWeight: 600 },
      h6: { fontSize: FONT_SIZES.lg, fontWeight: 600 },
      body1: { fontSize: FONT_SIZES.md },
      body2: { fontSize: FONT_SIZES.sm },
      subtitle2: { fontSize: FONT_SIZES.sm, fontWeight: 600 },
      caption: { fontSize: FONT_SIZES.xs },
    },
    shape: {
      borderRadius: BORDER_RADIUS.none,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { colorScheme: mode },
        },
      },
      MuiButtonBase: {
        defaultProps: { disableRipple: true },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            boxShadow: "none",
            "&:hover": { boxShadow: "none" },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 0,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: "none",
            backgroundImage: "none",
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: "none",
            minWidth: 0,
            minHeight: 40,
            paddingLeft: SPACING.md,
            paddingRight: SPACING.md,
            paddingTop: SPACING.sm,
            paddingBottom: SPACING.sm,
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            minHeight: 40,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: "var(--color-base)",
            borderColor: "var(--color-surface0)",
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: "var(--color-base)",
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontSize: FONT_SIZES.lg,
            fontWeight: 600,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: "var(--color-subtext0)",
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            paddingTop: SPACING.sm,
            paddingBottom: SPACING.sm,
            gap: 12,
            "&:hover": {
              backgroundColor: "var(--color-surface0)",
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontSize: FONT_SIZES.xs,
          },
        },
      },
      MuiAutocomplete: {
        styleOverrides: {
          inputRoot: {
            paddingTop: 0,
            paddingBottom: 0,
            fontSize: FONT_SIZES.sm,
          },
          option: {
            paddingLeft: SPACING.sm,
            paddingRight: SPACING.sm,
            paddingTop: SPACING.xs,
            paddingBottom: SPACING.xs,
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
          },
        },
      },
    },
  });
}

interface ThemePreferenceContextValue {
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  effectiveMode: EffectiveMode;
}

const ThemePreferenceContext = createContext<ThemePreferenceContextValue>({
  preference: "system",
  setPreference: () => {},
  effectiveMode: "dark",
});

export function useThemePreference() {
  return useContext(ThemePreferenceContext);
}

function readStoredPreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference);
  const [effectiveMode, setEffectiveMode] = useState<EffectiveMode>(() =>
    resolveThemeMode(readStoredPreference()),
  );

  const setPreference = useCallback((pref: ThemePreference) => {
    localStorage.setItem(STORAGE_KEY, pref);
    setPreferenceState(pref);
  }, []);

  // Listen for OS theme changes when preference is "system"
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    function update() {
      const mode = resolveThemeMode(preference);
      setEffectiveMode(mode);
      applyCssVars(mode);
    }

    update();

    if (preference === "system") {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }
  }, [preference]);

  const theme = useMemo(() => buildTheme(effectiveMode), [effectiveMode]);

  const ctx = useMemo<ThemePreferenceContextValue>(
    () => ({ preference, setPreference, effectiveMode }),
    [preference, setPreference, effectiveMode],
  );

  return (
    <ThemePreferenceContext.Provider value={ctx}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemePreferenceContext.Provider>
  );
}
