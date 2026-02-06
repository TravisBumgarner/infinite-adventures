import Box from "@mui/material/Box";
import type { ReactNode } from "react";
import { SIDEBAR_WIDTH } from "../../../constants";
import { useCanvasStore } from "../../../stores/canvasStore";

interface TopBarProps {
  left: ReactNode;
  right: ReactNode;
}

export default function TopBar({ left, right }: TopBarProps) {
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
      <Box>{left}</Box>
      <Box>{right}</Box>
    </Box>
  );
}
