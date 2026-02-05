import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import { useModalStore } from "../store";
import type { DeleteLinkModalProps } from "../types";
import BaseModal from "./BaseModal";

export default function DeleteLinkModal({
  sourceTitle,
  targetTitle,
  onConfirm,
}: DeleteLinkModalProps) {
  const closeModal = useModalStore((s) => s.closeModal);

  const handleConfirm = () => {
    onConfirm();
    closeModal();
  };

  return (
    <BaseModal title="Delete Connection?" showCloseButton={false}>
      <DialogContent>
        <DialogContentText sx={{ color: "var(--color-text)" }}>
          Are you sure you want to delete the connection between "{sourceTitle}" and "{targetTitle}
          "?
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
