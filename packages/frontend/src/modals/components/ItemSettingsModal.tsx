import DeleteIcon from "@mui/icons-material/Delete";
import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import { useModalStore } from "../store";
import type { ItemSettingsModalProps } from "../types";
import BaseModal from "./BaseModal";

export default function ItemSettingsModal({ onDeleteClick }: ItemSettingsModalProps) {
  const closeModal = useModalStore((s) => s.closeModal);

  const handleDeleteClick = () => {
    closeModal();
    onDeleteClick();
  };

  return (
    <BaseModal title="Item Settings" maxWidth="xs">
      <DialogContent>
        <Button
          variant="outlined"
          color="error"
          fullWidth
          startIcon={<DeleteIcon />}
          onClick={handleDeleteClick}
        >
          Delete Item
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeModal}>Close</Button>
      </DialogActions>
    </BaseModal>
  );
}
