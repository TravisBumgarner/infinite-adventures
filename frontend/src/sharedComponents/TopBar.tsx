import Box from "@mui/material/Box";
import type { ReactNode } from "react";
import { SIDEBAR_WIDTH } from "../constants";
import { useCanvasStore } from "../stores/canvasStore";

interface TopBarProps {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
}

export default function TopBar({ left, center, right }: TopBarProps) {
  const editingItemId = useCanvasStore((s) => s.editingItemId);
  const showSettings = useCanvasStore((s) => s.showSettings);
  const rightSidebarOpen = Boolean(editingItemId);
  const leftSidebarOpen = showSettings;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 16,
        left: leftSidebarOpen ? SIDEBAR_WIDTH + 16 : 16,
        right: rightSidebarOpen ? SIDEBAR_WIDTH + 16 : 16,
        zIndex: 50,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        pointerEvents: "none",
        transition: "left 0.2s, right 0.2s",
        "& > *": { pointerEvents: "auto" },
      }}
    >
      <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>{left}</Box>
      <Box sx={{ flex: 1, display: "flex", justifyContent: "center", gap: 1 }}>{center}</Box>
      <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>{right}</Box>
    </Box>
  );
}
