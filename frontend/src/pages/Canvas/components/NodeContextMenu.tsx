import DeleteIcon from "@mui/icons-material/Delete";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useEffect } from "react";
import { MODAL_ID, useModalStore } from "../../../modals";

interface NodeContextMenuProps {
  x: number;
  y: number;
  nodeId: string;
  nodeTitle: string;
  nodeType?: string;
  onDelete: () => void;
  onOpenInSessionViewer?: () => void;
  onClose: () => void;
}

export default function NodeContextMenu({
  x,
  y,
  nodeId,
  nodeTitle,
  nodeType,
  onDelete,
  onOpenInSessionViewer,
  onClose,
}: NodeContextMenuProps) {
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
      id: MODAL_ID.DELETE_ITEM,
      itemId: nodeId,
      itemTitle: nodeTitle,
      onConfirm: onDelete,
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
            minWidth: 140,
          },
        },
      }}
    >
      {nodeType === "session" && onOpenInSessionViewer && (
        <MenuItem
          onClick={() => {
            onOpenInSessionViewer();
            onClose();
          }}
        >
          <ListItemIcon>
            <OpenInNewIcon fontSize="small" />
          </ListItemIcon>
          Open in Session Viewer
        </MenuItem>
      )}
      <MenuItem onClick={handleDeleteClick} sx={{ color: "var(--color-red)" }}>
        <ListItemIcon sx={{ color: "inherit" }}>
          <DeleteIcon fontSize="small" />
        </ListItemIcon>
        Delete
      </MenuItem>
    </Menu>
  );
}
