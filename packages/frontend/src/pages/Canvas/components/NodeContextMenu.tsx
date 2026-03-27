import DeleteIcon from "@mui/icons-material/Delete";
import LabelIcon from "@mui/icons-material/Label";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ShareIcon from "@mui/icons-material/Share";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";
import type { Tag } from "shared";
import { MODAL_ID, useModalStore } from "../../../modals";
import { TagBadge } from "../../../sharedComponents/LabelBadge";

interface NodeContextMenuProps {
  x: number;
  y: number;
  nodeId: string;
  nodeTitle: string;
  nodeType?: string;
  tags: Tag[];
  onDelete: () => void;
  onAddTag: (tagId: string) => void;
  onOpenInSessionViewer?: () => void;
  onShare?: () => void;
  onClose: () => void;
}

export default function NodeContextMenu({
  x,
  y,
  nodeId,
  nodeTitle,
  nodeType,
  tags,
  onDelete,
  onAddTag,
  onOpenInSessionViewer,
  onShare,
  onClose,
}: NodeContextMenuProps) {
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
      id: MODAL_ID.DELETE_ITEM,
      itemId: nodeId,
      itemTitle: nodeTitle,
      onConfirm: onDelete,
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
        {onShare && (
          <MenuItem
            onClick={() => {
              onShare();
              onClose();
            }}
          >
            <ListItemIcon>
              <ShareIcon fontSize="small" />
            </ListItemIcon>
            Share
          </MenuItem>
        )}
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
          Delete
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
                onAddTag(tag.id);
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
