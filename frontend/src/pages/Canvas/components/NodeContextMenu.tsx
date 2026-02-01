import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useEffect } from "react";

interface NodeContextMenuProps {
  x: number;
  y: number;
  noteId: string;
  selectedCount: number;
  onEdit: (noteId: string) => void;
  onBrowseConnections: (noteId: string) => void;
  onExport: (noteId: string) => void;
  onDelete: (noteId: string) => void;
  onDeleteSelected: () => void;
  onClose: () => void;
}

export default function NodeContextMenu({
  x,
  y,
  noteId,
  selectedCount,
  onEdit,
  onBrowseConnections,
  onExport,
  onDelete,
  onDeleteSelected,
  onClose,
}: NodeContextMenuProps) {
  useEffect(() => {
    function handleScroll() {
      onClose();
    }
    document.addEventListener("wheel", handleScroll, { passive: true });
    return () => document.removeEventListener("wheel", handleScroll);
  }, [onClose]);

  const isMulti = selectedCount > 1;

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
            minWidth: 120,
          },
        },
      }}
    >
      {!isMulti && (
        <MenuItem
          onClick={() => {
            onEdit(noteId);
            onClose();
          }}
        >
          Edit
        </MenuItem>
      )}
      {!isMulti && (
        <MenuItem
          onClick={() => {
            onBrowseConnections(noteId);
            onClose();
          }}
        >
          Browse Connections
        </MenuItem>
      )}
      {!isMulti && (
        <MenuItem
          onClick={() => {
            onExport(noteId);
            onClose();
          }}
        >
          Export as Text
        </MenuItem>
      )}
      <MenuItem
        onClick={() => {
          if (isMulti) {
            if (confirm(`Delete ${selectedCount} selected notes? This cannot be undone.`)) {
              onDeleteSelected();
            }
          } else {
            if (confirm("Delete this note? This cannot be undone.")) {
              onDelete(noteId);
            }
          }
          onClose();
        }}
        sx={{ color: "error.main" }}
      >
        {isMulti ? `Delete Selected (${selectedCount})` : "Delete"}
      </MenuItem>
    </Menu>
  );
}
