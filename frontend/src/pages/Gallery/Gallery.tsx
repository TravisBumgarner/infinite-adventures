import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DeleteIcon from "@mui/icons-material/Delete";
import FilterListIcon from "@mui/icons-material/FilterList";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MapIcon from "@mui/icons-material/Map";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import StarIcon from "@mui/icons-material/Star";
import Masonry from "@mui/lab/Masonry";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { deletePhoto } from "../../api/photos";
import { useCanvases, useGallery, useItems } from "../../hooks/queries";
import BlurImage from "../../sharedComponents/BlurImage";
import ConfirmDeleteDialog from "../../sharedComponents/ConfirmDeleteDialog";
import { canvasItemTypeIcon, LabelBadge } from "../../sharedComponents/LabelBadge";
import QueryErrorDisplay from "../../sharedComponents/QueryErrorDisplay";
import { useCanvasStore } from "../../stores/canvasStore";
import { FONT_SIZES } from "../../styles/styleConsts";

export default function Gallery() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const parentItemId = searchParams.get("parentItemId") ?? undefined;

  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const initActiveCanvas = useCanvasStore((s) => s.initActiveCanvas);
  const showSettings = useCanvasStore((s) => s.showSettings);
  const setEditingItemId = useCanvasStore((s) => s.setEditingItemId);

  const qc = useQueryClient();
  const [importantOnly, setImportantOnly] = useState(false);
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null);

  // Fetch canvases and initialize active canvas
  const { data: canvases = [] } = useCanvases();
  useEffect(() => {
    if (canvases.length > 0) {
      initActiveCanvas(canvases);
    }
  }, [canvases, initActiveCanvas]);

  // Fetch items for filter autocomplete
  const { data: rawItems = [] } = useItems(activeCanvasId ?? undefined);
  const items = useMemo(
    () =>
      [...rawItems].sort(
        (a, b) =>
          a.type.localeCompare(b.type) ||
          a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
      ),
    [rawItems],
  );

  // Fetch gallery data (infinite query)
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, error, refetch } =
    useGallery(activeCanvasId ?? undefined, importantOnly, parentItemId);

  // Flatten pages into entries
  const allEntries = useMemo(() => data?.pages.flatMap((p) => p.entries) ?? [], [data]);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!activeCanvasId) return null;

  return (
    <Box sx={{ height: "100%", overflow: "auto", bgcolor: "var(--color-base)" }}>
      {/* Main content */}
      <Box
        sx={{
          maxWidth: 1040,
          mx: "auto",
          px: 3,
          pt: 2,
          ml: showSettings ? "calc((100vw - 1040px) / 2 + 180px)" : "auto",
          transition: "margin-left 0.2s",
        }}
      >
        {/* Controls bar */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 3,
          }}
        >
          <Autocomplete
            size="small"
            options={items}
            getOptionLabel={(opt) => opt.title}
            value={items.find((i) => i.id === parentItemId) ?? null}
            onChange={(_e, item) => {
              if (item) {
                searchParams.set("parentItemId", item.id);
              } else {
                searchParams.delete("parentItemId");
              }
              setSearchParams(searchParams, { replace: true });
            }}
            renderOption={(props, option) => {
              const colors = theme.palette.canvasItemTypes[option.type];
              return (
                <li
                  {...props}
                  key={option.id}
                  style={{
                    ...props.style,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  <LabelBadge
                    label={option.type}
                    accentColor={colors.light}
                    icon={canvasItemTypeIcon(option.type)}
                    height={18}
                    fontSize={FONT_SIZES.xs}
                    sx={{ mr: 1, flexShrink: 0, textTransform: "capitalize" }}
                  />
                  <span
                    style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {option.title}
                  </span>
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="All items"
                variant="outlined"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <FilterListIcon
                        sx={{ fontSize: FONT_SIZES.lg, color: "var(--color-overlay0)", mr: 0.5 }}
                      />
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
              />
            )}
            sx={{
              minWidth: 250,
              maxWidth: 350,
              "& .MuiInputBase-root": {
                py: 0,
                height: 32,
                fontSize: FONT_SIZES.xs,
                "& input": { py: 0 },
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "var(--color-surface1)",
              },
            }}
            blurOnSelect
            clearOnBlur={false}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
          />
          <Chip
            label="Pinned only"
            icon={<StarIcon sx={{ fontSize: FONT_SIZES.md }} />}
            onClick={() => setImportantOnly(!importantOnly)}
            sx={{
              height: 32,
              bgcolor: importantOnly ? "var(--color-yellow)" : "transparent",
              color: importantOnly ? "var(--color-base)" : "var(--color-subtext0)",
              border: importantOnly ? "none" : "1px solid var(--color-surface1)",
              fontWeight: 600,
              fontSize: FONT_SIZES.xs,
              cursor: "pointer",
              "&:hover": { opacity: 0.8 },
            }}
          />
        </Box>

        {/* Gallery grid */}
        {error ? (
          <QueryErrorDisplay error={error} onRetry={refetch} />
        ) : isLoading ? (
          <Typography sx={{ color: "var(--color-subtext0)", textAlign: "center", mt: 4 }}>
            Loading gallery...
          </Typography>
        ) : allEntries.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, color: "var(--color-subtext0)" }}>
            <PhotoLibraryIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              No photos yet
            </Typography>
            <Typography variant="body2">Photos from your canvas items will appear here.</Typography>
          </Box>
        ) : (
          <Masonry columns={{ xs: 2, sm: 3, md: 4 }} spacing={1.5}>
            {allEntries.map((entry) => {
              return (
                <Box
                  key={entry.id}
                  onClick={() =>
                    navigate(`/gallery/${entry.id}`, {
                      state: { photos: allEntries, index: allEntries.indexOf(entry) },
                    })
                  }
                  sx={{
                    position: "relative",
                    overflow: "hidden",
                    bgcolor: "var(--color-base)",
                    border: "1px solid var(--color-surface1)",
                    cursor: "pointer",
                    "&:hover .gallery-overlay": { opacity: 1 },
                    "&:hover .gallery-delete": { opacity: 1 },
                  }}
                >
                  <BlurImage
                    src={entry.url}
                    alt={entry.originalName}
                    blurhash={entry.blurhash}
                    sx={{
                      width: "100%",
                      display: "block",
                    }}
                  />

                  {/* Pin badge — always visible */}
                  {entry.isImportant && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        zIndex: 2,
                      }}
                    >
                      <StarIcon
                        sx={{
                          fontSize: FONT_SIZES.md,
                          color: "var(--color-yellow)",
                          filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.8))",
                        }}
                      />
                    </Box>
                  )}

                  {/* Delete — top right, hover only */}
                  <Tooltip title="Delete" placement="top">
                    <IconButton
                      className="gallery-delete"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletePhotoId(entry.id);
                      }}
                      sx={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        bgcolor: "rgba(0,0,0,0.5)",
                        color: "white",
                        "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                        opacity: 0,
                        transition: "opacity 0.15s",
                        p: 0.5,
                        zIndex: 2,
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: FONT_SIZES.md }} />
                    </IconButton>
                  </Tooltip>

                  {/* Bottom overlay — title + icons, appears on hover */}
                  <Box
                    className="gallery-overlay"
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      px: 1,
                      py: 0.75,
                      bgcolor: "rgba(0,0,0,0.65)",
                      opacity: 0,
                      transition: "opacity 0.15s",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "white",
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          display: "block",
                          lineHeight: 1.3,
                        }}
                      >
                        {entry.parentItemTitle}
                      </Typography>
                      {entry.caption && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: "rgba(255,255,255,0.7)",
                            fontSize: FONT_SIZES.xs,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            display: "block",
                          }}
                        >
                          {entry.caption}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: "flex", gap: 0.25, flexShrink: 0 }}>
                      <Tooltip title="Open in Canvas">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/canvas?focus=${entry.parentItemId}`);
                          }}
                          sx={{
                            color: "white",
                            "&:hover": { color: "var(--color-blue)" },
                            p: 0.5,
                          }}
                        >
                          <MapIcon sx={{ fontSize: FONT_SIZES.md }} />
                        </IconButton>
                      </Tooltip>
                      {entry.parentItemType === "session" && (
                        <Tooltip title="Open in Session Viewer">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/sessions/${entry.parentItemId}`);
                            }}
                            sx={{
                              color: "white",
                              "&:hover": { color: "var(--color-blue)" },
                              p: 0.5,
                            }}
                          >
                            <CalendarMonthIcon sx={{ fontSize: FONT_SIZES.md }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Item Details">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingItemId(entry.parentItemId);
                          }}
                          sx={{
                            color: "white",
                            "&:hover": { color: "var(--color-blue)" },
                            p: 0.5,
                          }}
                        >
                          <InfoOutlinedIcon sx={{ fontSize: FONT_SIZES.md }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Masonry>
        )}

        {/* Infinite scroll sentinel */}
        <Box ref={sentinelRef} sx={{ height: 1 }} />

        {/* Loading indicator for next page */}
        {isFetchingNextPage && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>

      <ConfirmDeleteDialog
        open={deletePhotoId !== null}
        onClose={() => setDeletePhotoId(null)}
        onConfirm={async () => {
          if (!deletePhotoId || !activeCanvasId) return;
          await deletePhoto(deletePhotoId);
          qc.invalidateQueries({ queryKey: ["canvases", activeCanvasId, "gallery"] });
          setDeletePhotoId(null);
        }}
        title="Delete Photo"
        message="Are you sure you want to delete this photo? This cannot be undone."
      />
    </Box>
  );
}
