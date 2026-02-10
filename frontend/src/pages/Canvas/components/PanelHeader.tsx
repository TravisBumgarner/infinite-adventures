import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
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
  onDeleteItem,
}: PanelHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
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
        onClose={() => setMenuAnchor(null)}
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
            setMenuAnchor(null);
            setIsEditing(true);
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Edit Title
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            onDownloadPdf();
          }}
        >
          <ListItemIcon>
            <PictureAsPdfIcon fontSize="small" />
          </ListItemIcon>
          Download PDF
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
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
      <IconButton onClick={onClose} sx={{ color: "var(--color-text)", ml: "auto" }}>
        <CloseIcon />
      </IconButton>
    </Box>
  );
}
