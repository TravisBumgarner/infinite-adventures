import Box from "@mui/material/Box";
import type { ReactNode } from "react";

interface TopBarProps {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
}

export default function TopBar({ left, center, right }: TopBarProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 1,
        py: 0.5,
        flexShrink: 0,
        bgcolor: "var(--color-chrome-bg)",
        borderBottom: "1px solid var(--color-surface1)",
        zIndex: 50,
      }}
    >
      <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>{left}</Box>
      <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5, whiteSpace: "nowrap" }}>
        {center}
      </Box>
      <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>{right}</Box>
    </Box>
  );
}
