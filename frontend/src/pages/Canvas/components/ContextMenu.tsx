import DescriptionIcon from "@mui/icons-material/Description";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ShareIcon from "@mui/icons-material/Share";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";
import type { CanvasItemType } from "shared";
import { CANVAS_ITEM_TYPE_LABELS, CANVAS_ITEM_TYPES } from "../../../constants";

interface ContextMenuProps {
  x: number;
  y: number;
  onSelect: (type: CanvasItemType) => void;
  onViewAll: () => void;
  onUnstack: () => void;
  onExportPdf: () => void;
  onExportMarkdown?: () => void;
  onShare: () => void;
  onClose: () => void;
}

export default function ContextMenu({
  x,
  y,
  onSelect,
  onViewAll,
  onUnstack,
  onExportPdf,
  onExportMarkdown,
  onShare,
  onClose,
}: ContextMenuProps) {
  const theme = useTheme();
  const [itemAnchor, setItemAnchor] = useState<HTMLElement | null>(null);
  const [utilsAnchor, setUtilsAnchor] = useState<HTMLElement | null>(null);
  const [exportAnchor, setExportAnchor] = useState<HTMLElement | null>(null);
  const itemTimeout = useRef<ReturnType<typeof setTimeout>>(null);
  const utilsTimeout = useRef<ReturnType<typeof setTimeout>>(null);
  const exportTimeout = useRef<ReturnType<typeof setTimeout>>(null);

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
            if (itemTimeout.current) clearTimeout(itemTimeout.current);
            setItemAnchor(e.currentTarget);
          }}
          onMouseLeave={() => {
            itemTimeout.current = setTimeout(() => setItemAnchor(null), 150);
          }}
          sx={{ justifyContent: "space-between" }}
        >
          New Item
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
          onClick={() => {
            onShare();
            onClose();
          }}
        >
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          Share Canvas
        </MenuItem>
        <MenuItem
          onMouseEnter={(e) => {
            if (exportTimeout.current) clearTimeout(exportTimeout.current);
            setExportAnchor(e.currentTarget);
          }}
          onMouseLeave={() => {
            exportTimeout.current = setTimeout(() => setExportAnchor(null), 150);
          }}
        >
          <ListItemIcon>
            <FileDownloadIcon fontSize="small" />
          </ListItemIcon>
          Export
          <Typography variant="body2" sx={{ color: "var(--color-overlay0)", ml: "auto" }}>
            ▸
          </Typography>
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

      {/* New Item submenu */}
      <Menu
        open={Boolean(itemAnchor)}
        anchorEl={itemAnchor}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        onClose={() => setItemAnchor(null)}
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
              if (itemTimeout.current) clearTimeout(itemTimeout.current);
            },
            onMouseLeave: () => setItemAnchor(null),
          },
        }}
        disableAutoFocus
      >
        {CANVAS_ITEM_TYPES.map((t) => (
          <MenuItem key={t.value} onClick={() => onSelect(t.value)} sx={{ gap: 1 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: theme.palette.canvasItemTypes[t.value].light,
                flexShrink: 0,
              }}
            />
            {CANVAS_ITEM_TYPE_LABELS[t.value]}
          </MenuItem>
        ))}
      </Menu>

      {/* Export submenu */}
      <Menu
        open={Boolean(exportAnchor)}
        anchorEl={exportAnchor}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        onClose={() => setExportAnchor(null)}
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
              if (exportTimeout.current) clearTimeout(exportTimeout.current);
            },
            onMouseLeave: () => setExportAnchor(null),
          },
        }}
        disableAutoFocus
      >
        <MenuItem
          onClick={() => {
            onExportPdf();
            onClose();
          }}
        >
          <ListItemIcon>
            <PictureAsPdfIcon fontSize="small" />
          </ListItemIcon>
          Canvas as Image
        </MenuItem>
        {onExportMarkdown && (
          <MenuItem
            onClick={() => {
              onExportMarkdown();
              onClose();
            }}
          >
            <ListItemIcon>
              <DescriptionIcon fontSize="small" />
            </ListItemIcon>
            Markdown
          </MenuItem>
        )}
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
          Unstack Overlapping Items
        </MenuItem>
      </Menu>
    </>
  );
}
