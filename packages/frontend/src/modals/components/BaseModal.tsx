import CloseIcon from "@mui/icons-material/Close";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { useModalStore } from "../store";

interface BaseModalProps {
  title?: string;
  children: ReactNode;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | false;
  showCloseButton?: boolean;
  paperSx?: SxProps<Theme>;
  onClose?: () => void;
}

export default function BaseModal({
  title,
  children,
  maxWidth = "sm",
  showCloseButton = true,
  paperSx,
  onClose,
}: BaseModalProps) {
  const closeModal = useModalStore((s) => s.closeModal);

  const handleClose = () => {
    onClose?.();
    closeModal();
  };

  return (
    <Dialog
      open
      onClose={handleClose}
      maxWidth={maxWidth}
      slotProps={{
        paper: {
          sx: {
            bgcolor: "var(--color-base)",
            border: "1px solid var(--color-surface1)",
            ...paperSx,
          },
        },
      }}
    >
      {(title || showCloseButton) && (
        <DialogTitle sx={{ display: "flex", alignItems: "center", pr: showCloseButton ? 6 : 2 }}>
          {title}
          {showCloseButton && (
            <IconButton
              onClick={handleClose}
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
                color: "var(--color-subtext0)",
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
      )}
      {children}
    </Dialog>
  );
}
