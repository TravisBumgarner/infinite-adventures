import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import { useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import type { CanvasItem, CanvasItemType } from "shared";
import { CANVAS_ITEM_TYPES } from "../../../constants";
import { canvasItemTypeIcon, LabelBadge } from "../../../sharedComponents/LabelBadge";
import { buildConnectionEntries, filterConnections } from "../../../utils/connectionFilter";
import { getContrastText } from "../../../utils/getContrastText";
import { getNotePreview } from "../../../utils/getNotePreview";

interface PanelConnectionsTabProps {
  item: CanvasItem;
  onNavigate: (itemId: string) => void;
}

export default function PanelConnectionsTab({ item, onNavigate }: PanelConnectionsTabProps) {
  const theme = useTheme();
  const [search, setSearch] = useState("");
  const [activeTypes, setActiveTypes] = useState<Set<CanvasItemType>>(new Set());

  const allEntries = useMemo(
    () => buildConnectionEntries(item.linksTo, item.linkedFrom),
    [item.linksTo, item.linkedFrom],
  );

  const filtered = useMemo(
    () => filterConnections(allEntries, activeTypes, search),
    [allEntries, activeTypes, search],
  );

  const handleToggleType = (type: CanvasItemType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

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
        placeholder="Search connections..."
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
                fontSize: 11,
                "&:hover": {
                  bgcolor: active ? bgColor : "transparent",
                },
              }}
            />
          );
        })}
      </Box>

      <List sx={{ flex: 1, overflowY: "auto", p: 0 }}>
        {filtered.length === 0 ? (
          <Typography
            variant="body2"
            sx={{
              color: "var(--color-overlay0)",
              py: 1.5,
              textAlign: "center",
            }}
          >
            No connections found
          </Typography>
        ) : (
          filtered.map((entry) => {
            const entryTypeBgColor = theme.palette.canvasItemTypes[entry.link.type].light;
            const snippet = "snippet" in entry.link ? entry.link.snippet : undefined;
            return (
              <ListItemButton
                key={`${entry.direction}-${entry.link.id}`}
                onClick={() => onNavigate(entry.link.id)}
                sx={{
                  gap: 1,
                  py: 1,
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                  <Chip
                    label={entry.direction === "outgoing" ? "\u2192" : "\u2190"}
                    size="small"
                    sx={{
                      bgcolor:
                        entry.direction === "outgoing"
                          ? "var(--color-surface1)"
                          : "var(--color-surface0)",
                      color: "var(--color-subtext0)",
                      fontSize: 12,
                      height: 24,
                      minWidth: 28,
                    }}
                  />
                  <LabelBadge
                    label={entry.link.type.toUpperCase()}
                    accentColor={entryTypeBgColor}
                    icon={canvasItemTypeIcon(entry.link.type)}
                    fontSize={10}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                    }}
                  >
                    {entry.link.title}
                  </Typography>
                </Box>
                {snippet && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--color-subtext0)",
                      fontStyle: "italic",
                      pl: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      width: "100%",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: `"${getNotePreview(snippet, undefined, 80)}"`,
                    }}
                  />
                )}
              </ListItemButton>
            );
          })
        )}
      </List>
    </Box>
  );
}
