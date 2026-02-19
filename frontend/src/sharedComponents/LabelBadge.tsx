import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CategoryIcon from "@mui/icons-material/Category";
import LabelIcon from "@mui/icons-material/Label";
import PersonIcon from "@mui/icons-material/Person";
import PlaceIcon from "@mui/icons-material/Place";
import StarIcon from "@mui/icons-material/Star";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ComponentType } from "react";
import type { CanvasItemType, Tag } from "shared";
import { ICON_MAP } from "../utils/iconMap";

const CANVAS_ITEM_TYPE_ICONS: Record<CanvasItemType, ComponentType<{ sx?: SxProps<Theme> }>> = {
  person: PersonIcon,
  place: PlaceIcon,
  thing: CategoryIcon,
  session: CalendarMonthIcon,
  event: StarIcon,
};

interface LabelBadgeProps {
  label: string | number;
  accentColor: string;
  icon?: ComponentType<{ sx?: SxProps<Theme> }>;
  height?: number;
  fontSize?: number;
  onDelete?: () => void;
  sx?: SxProps<Theme>;
}

export function LabelBadge({
  label,
  accentColor,
  icon: Icon,
  height = 20,
  fontSize = 11,
  onDelete,
  sx,
}: LabelBadgeProps) {
  const iconSize = fontSize + 3;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        borderLeft: `3px solid ${accentColor}`,
        borderTop: `1px solid ${accentColor}`,
        borderRight: `1px solid ${accentColor}`,
        borderBottom: `1px solid ${accentColor}`,
        bgcolor: "transparent",
        color: "var(--color-text)",
        px: 0.75,
        height,
        fontSize,
        fontWeight: 600,
        lineHeight: 1,
        whiteSpace: "nowrap",
        ...((sx ?? {}) as Record<string, unknown>),
      }}
    >
      {Icon && <Icon sx={{ fontSize: iconSize, color: accentColor }} />}
      {label}
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

interface TagBadgeProps {
  tag: Tag;
  compact?: boolean;
  onDelete?: () => void;
}

export function TagBadge({ tag, compact, onDelete }: TagBadgeProps) {
  const Icon = ICON_MAP[tag.icon] ?? LabelIcon;
  return (
    <LabelBadge
      label={tag.name}
      accentColor={tag.color}
      icon={Icon}
      height={compact ? 18 : 26}
      fontSize={compact ? 10 : 13}
      onDelete={onDelete}
    />
  );
}

export function canvasItemTypeIcon(type: CanvasItemType): ComponentType<{ sx?: SxProps<Theme> }> {
  return CANVAS_ITEM_TYPE_ICONS[type];
}
