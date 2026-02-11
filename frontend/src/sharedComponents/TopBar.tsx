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
        top: 0,
        left: leftSidebarOpen ? SIDEBAR_WIDTH : 0,
        right: rightSidebarOpen ? SIDEBAR_WIDTH : 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 1,
        py: 0.5,
        bgcolor: "var(--color-chrome-bg)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--color-surface1)",
        pointerEvents: "auto",
        transition: "left 0.2s, right 0.2s",
      }}
    >
      <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>{left}</Box>
      <Box sx={{ flex: 1, display: "flex", justifyContent: "center", gap: 0.5 }}>{center}</Box>
      <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>{right}</Box>
    </Box>
  );
}
