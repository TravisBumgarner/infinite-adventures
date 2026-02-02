import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import { useState } from "react";
import type { CanvasSummary } from "shared";

export interface CanvasPickerProps {
  canvases: CanvasSummary[];
  activeCanvasId: string;
  onSwitch: (canvasId: string) => void;
  onCreate: () => void;
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
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const activeCanvas = canvases.find((c) => c.id === activeCanvasId);

  const handleStartRename = () => {
    setRenameValue(activeCanvas?.name ?? "");
    setRenaming(true);
  };

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== activeCanvas?.name) {
      onRename(activeCanvasId, trimmed);
    }
    setRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRenameSubmit();
    } else if (e.key === "Escape") {
      setRenaming(false);
    }
  };

  const handleDeleteClick = () => {
    setConfirmingDelete(true);
  };

  const handleConfirmDelete = () => {
    onDelete(activeCanvasId);
    setConfirmingDelete(false);
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      {renaming ? (
        <TextField
          size="small"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={handleRenameKeyDown}
          onBlur={handleRenameSubmit}
          autoFocus
          sx={{ width: 160 }}
        />
      ) : (
        <Select
          size="small"
          value={activeCanvasId}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "__new__") {
              onCreate();
            } else {
              onSwitch(value);
            }
          }}
          sx={{
            minWidth: 140,
            bgcolor: "var(--color-base)",
            color: "var(--color-text)",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--color-surface1)",
            },
          }}
        >
          {canvases.map((canvas) => (
            <MenuItem key={canvas.id} value={canvas.id}>
              {canvas.name}
            </MenuItem>
          ))}
          <MenuItem value="__new__">
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <AddIcon fontSize="small" />
              New Canvas
            </Box>
          </MenuItem>
        </Select>
      )}

      {!renaming && (
        <>
          <IconButton size="small" onClick={handleStartRename} title="Rename canvas">
            <EditIcon fontSize="small" />
          </IconButton>

          {confirmingDelete ? (
            <Button size="small" color="error" onClick={handleConfirmDelete}>
              Confirm
            </Button>
          ) : (
            <IconButton
              size="small"
              onClick={handleDeleteClick}
              title="Delete canvas"
              disabled={canvases.length <= 1}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </>
      )}
    </Box>
  );
}
