import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import type { ReactNode } from "react";
import type { NoteType } from "../types";
import { PALETTE, BORDER_RADIUS } from "./styleConsts";

// Augment MUI theme types with nodeTypes palette
declare module "@mui/material/styles" {
  interface Palette {
    nodeTypes: Record<NoteType, { light: string; dark: string }>;
  }
  interface PaletteOptions {
    nodeTypes?: Record<NoteType, { light: string; dark: string }>;
  }
}

const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: PALETTE.base,
      paper: PALETTE.mantle,
    },
    text: {
      primary: PALETTE.text,
      secondary: PALETTE.subtext0,
    },
    primary: {
      main: PALETTE.blue,
    },
    secondary: {
      main: PALETTE.mauve,
    },
    error: {
      main: PALETTE.red,
    },
    warning: {
      main: PALETTE.peach,
    },
    info: {
      main: PALETTE.sapphire,
    },
    success: {
      main: PALETTE.green,
    },
    divider: PALETTE.surface1,
    nodeTypes: {
      pc: { light: "#4a90d9", dark: "#2a5a8a" },
      npc: { light: "#d94a4a", dark: "#8a2a2a" },
      item: { light: "#d9a74a", dark: "#8a6a2a" },
      quest: { light: "#8b5cf6", dark: "#5a3a9e" },
      location: { light: "#22c55e", dark: "#167a3a" },
      goal: { light: "#ec4899", dark: "#9a2d62" },
      session: { light: "#6b7280", dark: "#434950" },
    },
  },
  shape: {
    borderRadius: BORDER_RADIUS.none,
  },
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
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
  },
});

export { theme };

export function AppThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
