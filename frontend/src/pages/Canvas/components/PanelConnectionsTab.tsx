import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import { useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useCallback, useMemo, useState } from "react";
import type { CanvasItem, CanvasItemType } from "shared";
import { CANVAS_ITEM_TYPES } from "../../../constants";
import { CanvasItemTypeBadge } from "../../../sharedComponents/LabelBadge";
import { FONT_SIZES } from "../../../styles/styleConsts";
import { getContrastText } from "../../../utils/getContrastText";

interface PanelConnectionsTabProps {
  item: CanvasItem;
  onNavigate: (targetId: string, mentionedItemId?: string) => void;
}

export default function PanelConnectionsTab({ item, onNavigate }: PanelConnectionsTabProps) {
  const theme = useTheme();
  const [search, setSearch] = useState("");
  const [activeTypes, setActiveTypes] = useState<Set<CanvasItemType>>(new Set());

  const handleToggleType = (type: CanvasItemType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const filterAndSort = useCallback(
    <T extends { type: CanvasItemType; title: string }>(links: T[]): T[] =>
      links
        .filter((link) => {
          if (activeTypes.size > 0 && !activeTypes.has(link.type)) return false;
          if (search && !link.title.toLowerCase().includes(search.toLowerCase())) return false;
          return true;
        })
        .sort((a, b) => a.type.localeCompare(b.type) || a.title.localeCompare(b.title)),
    [activeTypes, search],
  );

  const filteredIncoming = useMemo(
    () => filterAndSort(item.linkedFrom),
    [item.linkedFrom, filterAndSort],
  );

  const filteredOutgoing = useMemo(
    () => filterAndSort(item.linksTo),
    [item.linksTo, filterAndSort],
  );

  const hasAny = filteredIncoming.length > 0 || filteredOutgoing.length > 0;

  return (
    <Box
      sx={{
        flex: 1,
        overflowY: "auto",
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      <TextField
        size="small"
        fullWidth
        placeholder="Search references..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
        {CANVAS_ITEM_TYPES.map(({ value, label }) => {
          const active = activeTypes.has(value);
          const bgColor = theme.palette.canvasItemTypes[value].light;
          return (
            <Chip
              key={value}
              label={label}
              size="small"
              onClick={() => handleToggleType(value)}
              variant={active ? "filled" : "outlined"}
              sx={{
                bgcolor: active ? bgColor : "transparent",
                borderColor: bgColor,
                color: active ? getContrastText(bgColor) : "var(--color-subtext0)",
                fontWeight: 600,
                fontSize: FONT_SIZES.xs,
                "&:hover": {
                  bgcolor: active ? bgColor : "transparent",
                },
              }}
            />
          );
        })}
      </Box>

      {!hasAny && (
        <Typography
          variant="body2"
          sx={{ color: "var(--color-overlay0)", py: 1.5, textAlign: "center" }}
        >
          No references found
        </Typography>
      )}

      {/* Incoming: items that mention this item in their notes */}
      {filteredIncoming.length > 0 && (
        <Box>
          <Typography
            variant="caption"
            sx={{
              color: "var(--color-subtext0)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontSize: FONT_SIZES.xs,
            }}
          >
            Referenced by ({filteredIncoming.length})
          </Typography>
          <List sx={{ p: 0, mt: 0.5 }}>
            {filteredIncoming.map((link) => {
              const bgColor = theme.palette.canvasItemTypes[link.type].light;
              return (
                <ListItemButton
                  key={link.id}
                  onClick={() => onNavigate(link.id, item.id)}
                  sx={{
                    flexDirection: "column",
                    alignItems: "flex-start",
                    px: 1.5,
                    py: 1,
                    mb: 0.5,
                    border: "1px solid var(--color-surface1)",
                    borderRadius: 1,
                    "&:hover": { borderColor: "var(--color-overlay0)" },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                    <CanvasItemTypeBadge type={link.type} accentColor={bgColor} />
                    <Typography
                      variant="body2"
                      sx={{
                        flex: 1,
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {link.title}
                    </Typography>
                  </Box>
                  {link.snippet && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: "var(--color-subtext0)",
                        fontStyle: "italic",
                        mt: 0.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical" as const,
                        overflow: "hidden",
                        lineHeight: 1.4,
                      }}
                    >
                      &ldquo;{link.snippet}&rdquo;
                    </Typography>
                  )}
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      )}

      {filteredIncoming.length > 0 && filteredOutgoing.length > 0 && <Divider />}

      {/* Outgoing: items this item mentions in its own notes */}
      {filteredOutgoing.length > 0 && (
        <Box>
          <Typography
            variant="caption"
            sx={{
              color: "var(--color-subtext0)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontSize: FONT_SIZES.xs,
            }}
          >
            References ({filteredOutgoing.length})
          </Typography>
          <List sx={{ p: 0, mt: 0.5 }}>
            {filteredOutgoing.map((link) => {
              const bgColor = theme.palette.canvasItemTypes[link.type].light;
              return (
                <ListItemButton
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  sx={{
                    flexDirection: "column",
                    alignItems: "flex-start",
                    px: 1.5,
                    py: 1,
                    mb: 0.5,
                    border: "1px solid var(--color-surface1)",
                    borderRadius: 1,
                    "&:hover": { borderColor: "var(--color-overlay0)" },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                    <CanvasItemTypeBadge type={link.type} accentColor={bgColor} />
                    <Typography
                      variant="body2"
                      sx={{
                        flex: 1,
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {link.title}
                    </Typography>
                  </Box>
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      )}
    </Box>
  );
}
