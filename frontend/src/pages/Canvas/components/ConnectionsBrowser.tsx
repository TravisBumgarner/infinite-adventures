import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import { useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import type { CanvasItem, CanvasItemType } from "shared";
import { CANVAS_ITEM_TYPES, SIDEBAR_WIDTH } from "../../../constants";
import { buildConnectionEntries, filterConnections } from "../../../utils/connectionFilter";
import { getContrastText } from "../../../utils/getContrastText";

interface ConnectionsBrowserProps {
  itemId: string;
  itemsCache: Map<string, CanvasItem>;
  onNavigate: (itemId: string) => void;
  onClose: () => void;
}

export default function ConnectionsBrowser({
  itemId,
  itemsCache,
  onNavigate,
  onClose,
}: ConnectionsBrowserProps) {
  const theme = useTheme();
  const [search, setSearch] = useState("");
  const [activeTypes, setActiveTypes] = useState<Set<CanvasItemType>>(new Set());

  const item = itemsCache.get(itemId);

  const allEntries = useMemo(() => {
    if (!item) return [];
    return buildConnectionEntries(item.links_to, item.linked_from);
  }, [item]);

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

  if (!item) {
    return (
      <Drawer
        variant="persistent"
        anchor="right"
        open
        sx={{
          "& .MuiDrawer-paper": {
            width: SIDEBAR_WIDTH,
            bgcolor: "var(--color-base)",
            borderLeft: "1px solid var(--color-surface0)",
            p: 2.5,
          },
        }}
      >
        <Typography>Item not found</Typography>
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="persistent"
      anchor="right"
      open
      sx={{
        "& .MuiDrawer-paper": {
          width: SIDEBAR_WIDTH,
          bgcolor: "var(--color-base)",
          borderLeft: "1px solid var(--color-surface0)",
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          overflowY: "auto",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">Connections</Typography>
        <IconButton onClick={onClose} sx={{ color: "var(--color-text)" }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Typography
        variant="body2"
        sx={{
          color: "var(--color-subtext0)",
          pb: 0.5,
          borderBottom: "1px solid var(--color-surface0)",
        }}
      >
        {item.title}
      </Typography>

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
            const typeBgColor = theme.palette.canvasItemTypes[entry.link.type].light;
            return (
              <ListItemButton
                key={`${entry.direction}-${entry.link.id}`}
                onClick={() => onNavigate(entry.link.id)}
                sx={{ borderRadius: 1.5, gap: 1, py: 1 }}
              >
                <Chip
                  label={entry.direction === "outgoing" ? "→" : "←"}
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
                <Chip
                  label={entry.link.type.toUpperCase()}
                  size="small"
                  sx={{
                    bgcolor: typeBgColor,
                    color: getContrastText(typeBgColor),
                    fontSize: 10,
                    fontWeight: 600,
                    height: 20,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {entry.link.title}
                </Typography>
              </ListItemButton>
            );
          })
        )}
      </List>
    </Drawer>
  );
}
