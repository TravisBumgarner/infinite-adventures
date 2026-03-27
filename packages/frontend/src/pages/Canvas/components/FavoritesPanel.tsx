import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import MapIcon from "@mui/icons-material/Map";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import { useTheme } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CanvasItemType } from "shared";
import { CanvasItemTypeBadge } from "../../../sharedComponents/LabelBadge";
import { useCanvasStore } from "../../../stores/canvasStore";
import { useFavoritesStore } from "../../../stores/favoritesStore";
import { FONT_SIZES } from "../../../styles/styleConsts";

export default function FavoritesButton() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const navigate = useNavigate();

  const favorites = useFavoritesStore((s) => s.favorites);
  const removeFavorite = useFavoritesStore((s) => s.removeFavorite);

  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const itemsCache = useCanvasStore((s) => s.itemsCache);
  const setEditingItemId = useCanvasStore((s) => s.setEditingItemId);

  const theme = useTheme();
  const canvasId = activeCanvasId ?? "";
  const ids = favorites[canvasId] ?? [];
  const open = Boolean(anchorEl);

  const typeOrder: Record<string, number> = {
    person: 0,
    place: 1,
    thing: 2,
    session: 3,
    event: 4,
  };

  const favoriteItems = ids
    .map((id) => itemsCache.get(id))
    .filter((item) => item != null)
    .sort(
      (a, b) =>
        (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99) || a.title.localeCompare(b.title),
    );

  function handleClose() {
    setAnchorEl(null);
  }

  const iconSx = {
    fontSize: FONT_SIZES.md,
    color: "var(--color-overlay0)",
  };
  const actionBtnSx = {
    p: 0.25,
    "&:hover": { color: "var(--color-text)" },
  };

  return (
    <>
      <Tooltip title="Favorites">
        <IconButton
          size="small"
          onClick={(e) => setAnchorEl(anchorEl ? null : e.currentTarget)}
          sx={{
            color: open ? "var(--color-blue)" : undefined,
            "&:hover": { bgcolor: "var(--color-surface0)", color: "var(--color-text)" },
          }}
        >
          <BookmarkBorderIcon />
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        slotProps={{
          paper: {
            sx: {
              width: 340,
              maxHeight: 420,
              bgcolor: "var(--color-base)",
              border: "1px solid var(--color-surface1)",
              mt: 0.5,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            },
          },
        }}
      >
        <Box sx={{ flex: 1, overflowY: "auto", minHeight: 60 }}>
          {favoriteItems.length === 0 ? (
            <Typography
              variant="body2"
              sx={{
                color: "var(--color-overlay0)",
                textAlign: "center",
                py: 3,
                px: 2,
                fontSize: FONT_SIZES.sm,
              }}
            >
              No favorites yet. Bookmark items from the panel to add them here.
            </Typography>
          ) : (
            favoriteItems.map((item) => {
              const accentColor =
                theme.palette.canvasItemTypes[item.type as CanvasItemType]?.light || "#585b70";
              return (
                <Box
                  key={item.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    px: 1,
                    py: 0.5,
                    cursor: "pointer",
                    "&:hover": { bgcolor: "var(--color-surface0)" },
                  }}
                  onClick={() => {
                    setEditingItemId(item.id);
                    handleClose();
                  }}
                >
                  <Tooltip title="Remove from favorites" placement="left">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFavorite(canvasId, item.id);
                      }}
                      sx={{ p: 0.25, color: "var(--color-blue)" }}
                    >
                      <BookmarkIcon sx={{ fontSize: FONT_SIZES.md }} />
                    </IconButton>
                  </Tooltip>
                  <CanvasItemTypeBadge type={item.type} accentColor={accentColor} height={18} />
                  <Typography
                    variant="body2"
                    sx={{
                      flex: 1,
                      fontSize: FONT_SIZES.sm,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.25, flexShrink: 0 }}>
                    <Tooltip title="Open on canvas">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/canvas?item=${item.id}`);
                          handleClose();
                        }}
                        sx={actionBtnSx}
                      >
                        <MapIcon sx={iconSx} />
                      </IconButton>
                    </Tooltip>
                    {item.type === "session" && (
                      <Tooltip title="Open in session viewer">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/sessions/${item.id}`);
                            handleClose();
                          }}
                          sx={actionBtnSx}
                        >
                          <CalendarMonthIcon sx={iconSx} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="View in gallery">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/gallery?parentItemId=${item.id}`);
                          handleClose();
                        }}
                        sx={actionBtnSx}
                      >
                        <PhotoLibraryIcon sx={iconSx} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      </Popover>
    </>
  );
}
