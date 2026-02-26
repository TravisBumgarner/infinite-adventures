import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import MapIcon from "@mui/icons-material/Map";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import StarIcon from "@mui/icons-material/Star";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { GalleryEntry, Photo } from "shared";
import { CANVAS_ITEM_TYPES } from "../../constants";

import { useCanvases, useGallery } from "../../hooks/queries";
import { MODAL_ID, useModalStore } from "../../modals";
import BlurImage from "../../sharedComponents/BlurImage";
import { canvasItemTypeIcon, LabelBadge } from "../../sharedComponents/LabelBadge";
import { useCanvasStore } from "../../stores/canvasStore";
import { FONT_SIZES } from "../../styles/styleConsts";

export default function Gallery() {
  const theme = useTheme();
  const navigate = useNavigate();
  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);

  const setEditingItemId = useCanvasStore((s) => s.setEditingItemId);
  const initActiveCanvas = useCanvasStore((s) => s.initActiveCanvas);
  const showSettings = useCanvasStore((s) => s.showSettings);
  const openModal = useModalStore((s) => s.openModal);

  const [importantOnly, setImportantOnly] = useState(false);

  // Fetch canvases and initialize active canvas
  const { data: canvases = [] } = useCanvases();
  useEffect(() => {
    if (canvases.length > 0) {
      initActiveCanvas(canvases);
    }
  }, [canvases, initActiveCanvas]);

  // Fetch gallery data (infinite query)
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useGallery(
    activeCanvasId ?? undefined,
    importantOnly,
  );

  // Flatten pages into entries
  const allEntries = useMemo(() => data?.pages.flatMap((p) => p.entries) ?? [], [data]);

  // Canvas mutations
  // Open lightbox
  function handleOpenLightbox(_entry: GalleryEntry, index: number) {
    // Build Photo[] from all entries for lightbox navigation
    const photos: Photo[] = allEntries.map((e) => ({
      id: e.id,
      url: e.url,
      originalName: e.originalName,
      caption: e.caption,
      aspectRatio: e.aspectRatio,
      blurhash: e.blurhash,
      isMainPhoto: e.isMainPhoto,
      isImportant: e.isImportant,
      createdAt: e.createdAt,
      updatedAt: e.createdAt,
    }));
    openModal({
      id: MODAL_ID.LIGHTBOX,
      photos,
      initialIndex: index,
    });
  }

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
    <Box sx={{ height: "100vh", overflow: "auto", bgcolor: "var(--color-base)" }}>
      {/* Main content */}
      <Box
        sx={{
          maxWidth: 1040,
          mx: "auto",
          pt: 10,
          px: 3,
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
          <Chip
            label="Pinned only"
            icon={<StarIcon sx={{ fontSize: FONT_SIZES.md }} />}
            size="small"
            onClick={() => setImportantOnly(!importantOnly)}
            sx={{
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
        {isLoading ? (
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
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 1.5,
            }}
          >
            {allEntries.map((entry, idx) => {
              const typeColors = theme.palette.canvasItemTypes[entry.parentItemType];
              const typeLabel =
                CANVAS_ITEM_TYPES.find((t) => t.value === entry.parentItemType)?.label ??
                entry.parentItemType;
              return (
                <Box
                  key={entry.id}
                  onClick={() => handleOpenLightbox(entry, idx)}
                  sx={{
                    position: "relative",
                    zIndex: 1,
                    overflow: "hidden",
                    bgcolor: "var(--color-base)",
                    border: "1px solid var(--color-surface1)",
                    cursor: "pointer",
                    transition: "transform 0.2s ease",
                    "&:hover": {
                      transform: "scale(1.2)",
                      zIndex: 10,
                      "& img": { objectFit: "contain" },
                    },
                    "&:hover .gallery-overlay": { opacity: 1 },
                  }}
                >
                  <BlurImage
                    src={entry.url}
                    alt={entry.originalName}
                    blurhash={entry.blurhash}
                    sx={{
                      width: "100%",
                      aspectRatio: "1",
                    }}
                  />

                  {/* Pin badge */}
                  {entry.isImportant && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        bgcolor: "rgba(0,0,0,0.5)",
                        borderRadius: "50%",
                        width: 24,
                        height: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <StarIcon sx={{ fontSize: FONT_SIZES.md, color: "var(--color-yellow)" }} />
                    </Box>
                  )}

                  {/* Hover overlay with parent item info */}
                  <Box
                    className="gallery-overlay"
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      px: 1,
                      py: 0.75,
                      bgcolor: "rgba(0,0,0,0.6)",
                      opacity: 0,
                      transition: "opacity 0.15s",
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.25,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <LabelBadge
                        label={typeLabel}
                        accentColor={typeColors.light}
                        icon={canvasItemTypeIcon(entry.parentItemType)}
                        height={18}
                        fontSize={FONT_SIZES.xs}
                        sx={{ color: "white" }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: "white",
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flex: 1,
                        }}
                      >
                        {entry.parentItemTitle}
                      </Typography>
                      <Tooltip title="Open in Canvas">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingItemId(entry.parentItemId);
                            navigate("/canvas");
                          }}
                          sx={{
                            color: "white",
                            "&:hover": { color: "var(--color-text)" },
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
                              "&:hover": { color: "var(--color-text)" },
                              p: 0.5,
                            }}
                          >
                            <CalendarMonthIcon sx={{ fontSize: FONT_SIZES.md }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                    {entry.caption && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: "rgba(255,255,255,0.8)",
                          fontSize: FONT_SIZES.xs,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {entry.caption}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
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
    </Box>
  );
}
