import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import DescriptionIcon from "@mui/icons-material/Description";
import EditIcon from "@mui/icons-material/Edit";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";
import type { CanvasItem } from "shared";
import { getContrastText } from "../../../utils/getContrastText";

interface PanelHeaderProps {
  item: CanvasItem;
  title: string;
  typeBgColor: string;
  typeLabel: string;
  onTitleChange: (value: string) => void;
  onClose: () => void;
  onDownloadPdf: () => void;
  onDownloadMarkdown: () => void;
  onDeleteItem: () => void;
}

export default function PanelHeader({
  item,
  title,
  typeBgColor,
  typeLabel,
  onTitleChange,
  onClose,
  onDownloadPdf,
  onDownloadMarkdown,
  onDeleteItem,
}: PanelHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [exportAnchor, setExportAnchor] = useState<HTMLElement | null>(null);
  const exportTimeout = useRef<ReturnType<typeof setTimeout>>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditing]);

  function handleTitleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      setIsEditing(false);
    } else if (e.key === "Escape") {
      onTitleChange(item.title);
      setIsEditing(false);
    }
  }

  function closeAllMenus() {
    setMenuAnchor(null);
    setExportAnchor(null);
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        p: 2,
        pb: 1,
      }}
    >
      {isEditing ? (
        <InputBase
          inputRef={titleInputRef}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={() => setIsEditing(false)}
          onKeyDown={handleTitleKeyDown}
          sx={{
            flex: 1,
            fontSize: "1.25rem",
            fontWeight: 500,
            "& input": {
              padding: 0,
            },
          }}
        />
      ) : (
        <Typography
          variant="h6"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
            cursor: "pointer",
            ...(title ? {} : { color: "text.secondary", fontStyle: "italic" }),
          }}
          onClick={() => setIsEditing(true)}
        >
          {title || "Untitled"}
        </Typography>
      )}
      <Chip
        label={typeLabel}
        size="small"
        sx={{
          bgcolor: typeBgColor,
          color: getContrastText(typeBgColor),
          fontSize: 10,
          fontWeight: 600,
          height: 22,
        }}
      />
      <IconButton
        data-tour="panel-menu"
        size="small"
        onClick={(e) => setMenuAnchor(e.currentTarget)}
        sx={{ color: "var(--color-subtext0)", p: 0.5 }}
      >
        <MoreVertIcon sx={{ fontSize: 18 }} />
      </IconButton>
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeAllMenus}
        slotProps={{
          paper: {
            sx: {
              bgcolor: "var(--color-base)",
              border: "1px solid var(--color-surface1)",
              minWidth: 180,
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            closeAllMenus();
            setIsEditing(true);
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Edit Title
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
          onClick={() => {
            closeAllMenus();
            onDeleteItem();
          }}
          sx={{ color: "var(--color-red)" }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          Delete Item
        </MenuItem>
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
            closeAllMenus();
            onDownloadPdf();
          }}
        >
          <ListItemIcon>
            <PictureAsPdfIcon fontSize="small" />
          </ListItemIcon>
          PDF
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeAllMenus();
            onDownloadMarkdown();
          }}
        >
          <ListItemIcon>
            <DescriptionIcon fontSize="small" />
          </ListItemIcon>
          Markdown
        </MenuItem>
      </Menu>
      <IconButton onClick={onClose} sx={{ color: "var(--color-text)", ml: "auto" }}>
        <CloseIcon />
      </IconButton>
    </Box>
  );
}
