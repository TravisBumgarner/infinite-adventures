import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";
import type { NoteType } from "shared";
import { NOTE_TYPES, TYPE_LABELS } from "../../../constants";

interface ContextMenuProps {
  x: number;
  y: number;
  onSelect: (type: NoteType) => void;
  onViewAll: () => void;
  onUnstack: () => void;
  onClose: () => void;
}

export default function ContextMenu({
  x,
  y,
  onSelect,
  onViewAll,
  onUnstack,
  onClose,
}: ContextMenuProps) {
  const theme = useTheme();
  const [noteAnchor, setNoteAnchor] = useState<HTMLElement | null>(null);
  const [utilsAnchor, setUtilsAnchor] = useState<HTMLElement | null>(null);
  const noteTimeout = useRef<ReturnType<typeof setTimeout>>(null);
  const utilsTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    function handleScroll() {
      onClose();
    }
    document.addEventListener("wheel", handleScroll, { passive: true });
    return () => document.removeEventListener("wheel", handleScroll);
  }, [onClose]);

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
        <MenuItem
          onMouseEnter={(e) => {
            if (noteTimeout.current) clearTimeout(noteTimeout.current);
            setNoteAnchor(e.currentTarget);
          }}
          onMouseLeave={() => {
            noteTimeout.current = setTimeout(() => setNoteAnchor(null), 150);
          }}
          sx={{ justifyContent: "space-between" }}
        >
          New Note
          <Typography variant="body2" sx={{ color: "var(--color-overlay0)", ml: 1 }}>
            ▸
          </Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            onViewAll();
            onClose();
          }}
        >
          View All
        </MenuItem>
        <Divider />
        <MenuItem
          onMouseEnter={(e) => {
            if (utilsTimeout.current) clearTimeout(utilsTimeout.current);
            setUtilsAnchor(e.currentTarget);
          }}
          onMouseLeave={() => {
            utilsTimeout.current = setTimeout(() => setUtilsAnchor(null), 150);
          }}
          sx={{ justifyContent: "space-between" }}
        >
          Utilities
          <Typography variant="body2" sx={{ color: "var(--color-overlay0)", ml: 1 }}>
            ▸
          </Typography>
        </MenuItem>
      </Menu>

      {/* New Note submenu */}
      <Menu
        open={Boolean(noteAnchor)}
        anchorEl={noteAnchor}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        onClose={() => setNoteAnchor(null)}
        sx={{ pointerEvents: "none" }}
        slotProps={{
          paper: {
            sx: {
              pointerEvents: "auto",
              bgcolor: "var(--color-base)",
              border: "1px solid var(--color-surface1)",
              boxShadow: "0 8px 24px var(--color-backdrop)",
              minWidth: 150,
            },
            onMouseEnter: () => {
              if (noteTimeout.current) clearTimeout(noteTimeout.current);
            },
            onMouseLeave: () => setNoteAnchor(null),
          },
        }}
        disableAutoFocus
      >
        {NOTE_TYPES.map((t) => (
          <MenuItem key={t.value} onClick={() => onSelect(t.value)} sx={{ gap: 1 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: theme.palette.nodeTypes[t.value].light,
                flexShrink: 0,
              }}
            />
            {TYPE_LABELS[t.value]}
          </MenuItem>
        ))}
      </Menu>

      {/* Utilities submenu */}
      <Menu
        open={Boolean(utilsAnchor)}
        anchorEl={utilsAnchor}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        onClose={() => setUtilsAnchor(null)}
        sx={{ pointerEvents: "none" }}
        slotProps={{
          paper: {
            sx: {
              pointerEvents: "auto",
              bgcolor: "var(--color-base)",
              border: "1px solid var(--color-surface1)",
              boxShadow: "0 8px 24px var(--color-backdrop)",
              minWidth: 150,
            },
            onMouseEnter: () => {
              if (utilsTimeout.current) clearTimeout(utilsTimeout.current);
            },
            onMouseLeave: () => setUtilsAnchor(null),
          },
        }}
        disableAutoFocus
      >
        <MenuItem
          onClick={() => {
            onUnstack();
            onClose();
          }}
        >
          Unstack Overlapping Notes
        </MenuItem>
      </Menu>
    </>
  );
}
