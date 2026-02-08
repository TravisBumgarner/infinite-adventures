import LabelIcon from "@mui/icons-material/Label";
import Box from "@mui/material/Box";
import type { Tag } from "shared";
import { getContrastText } from "../utils/getContrastText";
import { ICON_MAP } from "../utils/iconMap";

interface TagPillProps {
  tag: Tag;
  compact?: boolean;
  onDelete?: () => void;
}

export function TagPill({ tag, compact, onDelete }: TagPillProps) {
  const Icon = ICON_MAP[tag.icon] ?? LabelIcon;
  const textColor = getContrastText(tag.color);
  const fontSize = compact ? 11 : 13;
  const iconSize = compact ? 14 : 16;
  const height = compact ? 20 : 26;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        bgcolor: tag.color,
        color: textColor,
        borderRadius: "4px",
        px: 0.75,
        height,
        fontSize,
        fontWeight: 600,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      <Icon sx={{ fontSize: iconSize }} />
      {tag.name}
      {onDelete && (
        <Box
          component="span"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          sx={{
            cursor: "pointer",
            ml: 0.25,
            fontSize: iconSize,
            lineHeight: 1,
            opacity: 0.7,
            "&:hover": { opacity: 1 },
          }}
        >
          ×
        </Box>
      )}
    </Box>
  );
}
