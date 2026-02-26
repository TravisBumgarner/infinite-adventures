import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import SettingsIcon from "@mui/icons-material/Settings";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useState } from "react";
import type { CanvasSummary } from "shared";
import { MODAL_ID, useModalStore } from "../../../modals";
import { FONT_SIZES } from "../../../styles/styleConsts";

export interface CanvasPickerProps {
  canvases: CanvasSummary[];
  activeCanvasId: string;
  onSwitch: (canvasId: string) => void;
  onCreate: (name: string) => void;
  onRename: (canvasId: string, newName: string) => void;
  onDelete: (canvasId: string) => void;
}

export default function CanvasPicker({
  canvases,
  activeCanvasId,
  onSwitch,
  onCreate,
  onRename,
  onDelete,
}: CanvasPickerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const openModal = useModalStore((s) => s.openModal);

  const activeCanvas = canvases.find((c) => c.id === activeCanvasId);

  const handleOpenSettings = () => {
    setAnchorEl(null);
    if (!activeCanvas) return;
    openModal({
      id: MODAL_ID.CANVAS_SETTINGS,
      canvasId: activeCanvasId,
      canvasName: activeCanvas.name,
      onRename: (newName) => onRename(activeCanvasId, newName),
      onDelete: () => onDelete(activeCanvasId),
      canDelete: canvases.length > 1,
    });
  };

  const handleCanvasSelect = (canvasId: string) => {
    setAnchorEl(null);
    if (canvasId !== activeCanvasId) {
      onSwitch(canvasId);
    }
  };

  const handleCreate = () => {
    setAnchorEl(null);
    openModal({
      id: MODAL_ID.CREATE_CANVAS,
      onCreate,
    });
  };

  return (
    <Box>
      <Button
        onClick={(e) => setAnchorEl(e.currentTarget)}
        endIcon={<KeyboardArrowDownIcon />}
        sx={{
          color: "var(--color-text)",
          textTransform: "none",
          fontWeight: 600,
          fontSize: FONT_SIZES.sm,
          px: 1,
          "&:hover": {
            bgcolor: "var(--color-surface0)",
          },
        }}
      >
        {activeCanvas?.name ?? "Select Canvas"}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        slotProps={{
          paper: {
            sx: {
              bgcolor: "var(--color-base)",
              border: "1px solid var(--color-surface1)",
              minWidth: 200,
              maxHeight: 400,
            },
          },
        }}
      >
        {canvases.map((canvas) => (
          <MenuItem
            key={canvas.id}
            onClick={() => handleCanvasSelect(canvas.id)}
            selected={canvas.id === activeCanvasId}
          >
            <ListItemIcon sx={{ visibility: canvas.id === activeCanvasId ? "visible" : "hidden" }}>
              <CheckIcon fontSize="small" />
            </ListItemIcon>
            {canvas.name}
          </MenuItem>
        ))}

        <Divider />

        <MenuItem onClick={handleCreate}>
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          New Canvas
        </MenuItem>

        <MenuItem onClick={handleOpenSettings}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Canvas Settings
        </MenuItem>
      </Menu>
    </Box>
  );
}
