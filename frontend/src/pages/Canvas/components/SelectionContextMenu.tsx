import DeleteIcon from "@mui/icons-material/Delete";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { useEffect } from "react";
import { MODAL_ID, useModalStore } from "../../../modals";

interface SelectionContextMenuProps {
  x: number;
  y: number;
  nodeIds: string[];
  onBulkDelete: () => void;
  onClose: () => void;
}

export default function SelectionContextMenu({
  x,
  y,
  nodeIds,
  onBulkDelete,
  onClose,
}: SelectionContextMenuProps) {
  const openModal = useModalStore((s) => s.openModal);

  useEffect(() => {
    function handleScroll() {
      onClose();
    }
    document.addEventListener("wheel", handleScroll, { passive: true });
    return () => document.removeEventListener("wheel", handleScroll);
  }, [onClose]);

  const handleDeleteClick = () => {
    onClose();
    openModal({
      id: MODAL_ID.BULK_DELETE,
      itemCount: nodeIds.length,
      onConfirm: onBulkDelete,
    });
  };

  return (
    <Menu
      open
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={{ top: y, left: x }}
      slotProps={{
        paper: {
          sx: {
            bgcolor: "var(--color-base)",
            border: "1px solid var(--color-surface1)",
            boxShadow: "0 8px 24px var(--color-backdrop)",
            minWidth: 160,
          },
        },
      }}
    >
      <MenuItem disabled sx={{ opacity: 1 }}>
        <Typography variant="caption" sx={{ color: "var(--color-subtext0)" }}>
          {nodeIds.length} item{nodeIds.length !== 1 ? "s" : ""} selected
        </Typography>
      </MenuItem>
      <MenuItem onClick={handleDeleteClick} sx={{ color: "var(--color-red)" }}>
        <ListItemIcon sx={{ color: "inherit" }}>
          <DeleteIcon fontSize="small" />
        </ListItemIcon>
        Delete Selected
      </MenuItem>
    </Menu>
  );
}
