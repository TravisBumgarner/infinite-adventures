import DeleteIcon from "@mui/icons-material/Delete";
import LabelIcon from "@mui/icons-material/Label";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";
import type { Tag } from "shared";
import { MODAL_ID, useModalStore } from "../../../modals";
import { TagBadge } from "../../../sharedComponents/LabelBadge";

interface SelectionContextMenuProps {
  x: number;
  y: number;
  nodeIds: string[];
  tags: Tag[];
  onBulkDelete: () => void;
  onBulkAddTag: (tagId: string) => void;
  onClose: () => void;
}

export default function SelectionContextMenu({
  x,
  y,
  nodeIds,
  tags,
  onBulkDelete,
  onBulkAddTag,
  onClose,
}: SelectionContextMenuProps) {
  const openModal = useModalStore((s) => s.openModal);
  const [tagMenuOpen, setTagMenuOpen] = useState(false);
  const tagMenuAnchor = useRef<HTMLLIElement>(null);

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
    <>
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
        <MenuItem ref={tagMenuAnchor} onClick={() => setTagMenuOpen(true)}>
          <ListItemIcon>
            <LabelIcon fontSize="small" />
          </ListItemIcon>
          Add Tag
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: "var(--color-red)" }}>
          <ListItemIcon sx={{ color: "inherit" }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          Delete Selected
        </MenuItem>
      </Menu>
      <Menu
        open={tagMenuOpen}
        onClose={() => setTagMenuOpen(false)}
        anchorEl={tagMenuAnchor.current}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              bgcolor: "var(--color-base)",
              border: "1px solid var(--color-surface1)",
              boxShadow: "0 8px 24px var(--color-backdrop)",
              minWidth: 140,
              maxHeight: 300,
            },
          },
        }}
      >
        {tags.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" sx={{ color: "var(--color-subtext0)" }}>
              No tags available
            </Typography>
          </MenuItem>
        ) : (
          tags.map((tag) => (
            <MenuItem
              key={tag.id}
              onClick={() => {
                onBulkAddTag(tag.id);
                onClose();
              }}
            >
              <TagBadge tag={tag} compact />
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
}
