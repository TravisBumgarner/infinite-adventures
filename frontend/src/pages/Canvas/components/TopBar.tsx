import Box from "@mui/material/Box";
import type { ReactNode } from "react";

interface TopBarProps {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
}

export default function TopBar({ left, center, right }: TopBarProps) {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 16,
        left: 16,
        right: 16,
        zIndex: 50,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        pointerEvents: "none",
        "& > *": { pointerEvents: "auto" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>{left}</Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>{center}</Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>{right}</Box>
    </Box>
  );
}
