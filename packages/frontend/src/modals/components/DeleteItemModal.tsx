import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import { useModalStore } from "../store";
import type { DeleteItemModalProps } from "../types";
import BaseModal from "./BaseModal";

export default function DeleteItemModal({ itemTitle, onConfirm }: DeleteItemModalProps) {
  const closeModal = useModalStore((s) => s.closeModal);

  const handleConfirm = () => {
    onConfirm();
    closeModal();
  };

  return (
    <BaseModal title="Delete Item?" showCloseButton={false}>
      <DialogContent>
        <DialogContentText sx={{ color: "var(--color-text)" }}>
          Are you sure you want to delete "{itemTitle}"? This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeModal}>Cancel</Button>
        <Button onClick={handleConfirm} color="error" variant="contained">
          Delete
        </Button>
      </DialogActions>
    </BaseModal>
  );
}
