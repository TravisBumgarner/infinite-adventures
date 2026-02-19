import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import { useTheme } from "@mui/material/styles";
import type { DragEvent } from "react";
import { useRef } from "react";
import type { CanvasItemType } from "shared";
import { CANVAS_ITEM_TYPE_LABELS, CANVAS_ITEM_TYPES, SIDEBAR_WIDTH } from "../../../constants";
import { useCanvasStore } from "../../../stores/canvasStore";
import { getContrastText } from "../../../utils/getContrastText";

interface ToolbarProps {
  onCreate: (type: CanvasItemType) => void;
}

export default function Toolbar({ onCreate }: ToolbarProps) {
  const theme = useTheme();
  const dragImageRef = useRef<HTMLDivElement | null>(null);
  const editingItemId = useCanvasStore((s) => s.editingItemId);
  const showSettings = useCanvasStore((s) => s.showSettings);
  const rightSidebarOpen = Boolean(editingItemId);
  const leftSidebarOpen = showSettings;

  const handleDragStart = (e: DragEvent<HTMLDivElement>, type: CanvasItemType) => {
    e.dataTransfer.setData("application/canvas-item-type", type);
    e.dataTransfer.effectAllowed = "move";

    // Create a custom drag image matching canvas item size
    const color = theme.palette.canvasItemTypes[type].light;
    const dragImage = document.createElement("div");
    dragImage.style.cssText = `
      position: absolute;
      top: -1000px;
      left: -1000px;
      width: 210px;
      padding: 12px;
      background: var(--color-base);
      border: 2px solid ${color};
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    dragImage.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
        <div style="color: var(--color-text); font-size: 14px; font-weight: 600;">New Item</div>
        <div style="background: ${color}; color: ${getContrastText(color)}; font-size: 11px; font-weight: 600; padding: 2px 8px;">${CANVAS_ITEM_TYPE_LABELS[type]}</div>
      </div>
      <div style="margin-top: 8px; background: var(--color-surface0); padding: 4px 8px;">
        <div style="color: var(--color-subtext0); font-size: 12px;">0 Notes · 0 Photos · 0 Connections</div>
      </div>
    `;
    document.body.appendChild(dragImage);
    dragImageRef.current = dragImage;
    e.dataTransfer.setDragImage(dragImage, 105, 30);
  };

  const handleDragEnd = () => {
    if (dragImageRef.current) {
      document.body.removeChild(dragImageRef.current);
      dragImageRef.current = null;
    }
  };

  const leftOffset = leftSidebarOpen ? SIDEBAR_WIDTH : 0;
  const rightOffset = rightSidebarOpen ? SIDEBAR_WIDTH : 0;

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 16,
        left: leftOffset,
        right: rightOffset,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        transition: "left 0.2s, right 0.2s",
        zIndex: 50,
      }}
    >
      <Box
        data-tour="toolbar"
        sx={{
          display: "flex",
          gap: 1.5,
          p: "10px 14px",
          bgcolor: "var(--color-chrome-bg)",
          backdropFilter: "blur(8px)",
          border: "1px solid var(--color-surface1)",
          pointerEvents: "auto",
        }}
      >
        {CANVAS_ITEM_TYPES.map((t) => {
          const color = theme.palette.canvasItemTypes[t.value].light;
          return (
            <Paper
              key={t.value}
              draggable
              onDragStart={(e) => handleDragStart(e, t.value)}
              onDragEnd={handleDragEnd}
              onClick={() => onCreate(t.value)}
              sx={{
                bgcolor: "var(--color-base)",
                border: `2px solid ${color}`,
                p: 1,
                width: 90,
                cursor: "pointer",
                transition: "transform 0.15s, box-shadow 0.15s",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: `0 4px 12px ${color}40`,
                },
                "&:active": {
                  cursor: "grabbing",
                },
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {/* Placeholder line */}
                <Box
                  sx={{
                    width: 32,
                    height: 8,
                    bgcolor: "var(--color-surface1)",
                  }}
                />
                <Chip
                  label={CANVAS_ITEM_TYPE_LABELS[t.value]}
                  size="small"
                  sx={{
                    bgcolor: color,
                    color: getContrastText(color),
                    fontSize: 9,
                    fontWeight: 600,
                    height: 16,
                    "& .MuiChip-label": { px: 0.75 },
                  }}
                />
              </Box>
              {/* Placeholder lines for content */}
              <Box sx={{ mt: 0.75, display: "flex", flexDirection: "column", gap: 0.5 }}>
                <Box
                  sx={{
                    width: "100%",
                    height: 6,
                    bgcolor: "var(--color-surface0)",
                  }}
                />
                <Box
                  sx={{
                    width: "70%",
                    height: 6,
                    bgcolor: "var(--color-surface0)",
                  }}
                />
              </Box>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}
