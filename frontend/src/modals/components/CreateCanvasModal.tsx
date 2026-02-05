import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import TextField from "@mui/material/TextField";
import { useState } from "react";
import { useModalStore } from "../store";
import type { CreateCanvasModalProps } from "../types";
import BaseModal from "./BaseModal";

export default function CreateCanvasModal({ onCreate }: CreateCanvasModalProps) {
  const closeModal = useModalStore((s) => s.closeModal);
  const [name, setName] = useState("");

  const handleCreate = () => {
    const trimmed = name.trim();
    if (trimmed) {
      onCreate(trimmed);
      closeModal();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && name.trim()) {
      handleCreate();
    }
  };

  return (
    <BaseModal title="Create New Canvas">
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          size="small"
          label="Canvas Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="My Canvas"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={closeModal}>Cancel</Button>
        <Button onClick={handleCreate} variant="contained" disabled={!name.trim()}>
          Create
        </Button>
      </DialogActions>
    </BaseModal>
  );
}
