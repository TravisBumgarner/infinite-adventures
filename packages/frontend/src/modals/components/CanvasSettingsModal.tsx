import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useModalStore } from "../store";
import type { CanvasSettingsModalProps } from "../types";
import BaseModal from "./BaseModal";

export default function CanvasSettingsModal({
  canvasName,
  onRename,
  onDelete,
  canDelete,
}: CanvasSettingsModalProps) {
  const closeModal = useModalStore((s) => s.closeModal);
  const [name, setName] = useState(canvasName);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showDeleteSection, setShowDeleteSection] = useState(false);

  const hasNameChanged = name.trim() !== canvasName && name.trim() !== "";
  const deleteConfirmMatch = deleteConfirmText === canvasName;

  const handleSave = () => {
    if (hasNameChanged) {
      onRename(name.trim());
    }
    closeModal();
  };

  const handleDelete = () => {
    onDelete();
    closeModal();
  };

  return (
    <BaseModal title="Canvas Settings" paperSx={{ width: 500 }}>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Rename Section */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, color: "var(--color-subtext0)" }}>
            Canvas Name
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter canvas name"
          />
        </Box>

        <Divider />

        {/* Danger Zone */}
        <Box>
          <Typography
            variant="subtitle2"
            sx={{ mb: 1, color: "var(--color-red)", fontWeight: 600 }}
          >
            Danger Zone
          </Typography>

          {!showDeleteSection ? (
            <Button
              variant="outlined"
              color="error"
              fullWidth
              disabled={!canDelete}
              onClick={() => setShowDeleteSection(true)}
            >
              {canDelete ? "Delete This Canvas" : "Cannot delete (only canvas)"}
            </Button>
          ) : (
            <Box
              sx={{
                border: "1px solid var(--color-red)",
                p: 2,
                bgcolor: "rgba(255,0,0,0.05)",
              }}
            >
              <Typography variant="body2" sx={{ mb: 2 }}>
                This will permanently delete the canvas and all its items, notes, photos, and
                connections. This action cannot be undone.
              </Typography>
              <Typography variant="body2" sx={{ mb: 1.5 }}>
                Type <strong>{canvasName}</strong> to confirm:
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={canvasName}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setShowDeleteSection(false);
                    setDeleteConfirmText("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  disabled={!deleteConfirmMatch}
                  onClick={handleDelete}
                >
                  Delete Canvas
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={closeModal}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!hasNameChanged}>
          Save Changes
        </Button>
      </DialogActions>
    </BaseModal>
  );
}
