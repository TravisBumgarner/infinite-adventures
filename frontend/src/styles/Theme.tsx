import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import type { ReactNode } from "react";
import { PALETTE, BORDER_RADIUS } from "./styleConsts";

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

export function AppThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
