import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import StarIcon from "@mui/icons-material/Star";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GalleryEntry, Photo } from "shared";
import { CANVAS_ITEM_TYPES, SIDEBAR_WIDTH } from "../../constants";
import { useCreateCanvas, useDeleteCanvas, useUpdateCanvas } from "../../hooks/mutations";
import { useCanvases, useGallery } from "../../hooks/queries";
import { MODAL_ID, useModalStore } from "../../modals";
import BlurImage from "../../sharedComponents/BlurImage";
import { useCanvasStore } from "../../stores/canvasStore";
import { getContrastText } from "../../utils/getContrastText";
import CanvasPicker from "../Canvas/components/CanvasPicker";

export default function Gallery() {
  const theme = useTheme();
  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const setActiveCanvasId = useCanvasStore((s) => s.setActiveCanvasId);
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
  const createCanvasMutation = useCreateCanvas();
  const updateCanvasMutation = useUpdateCanvas();
  const deleteCanvasMutation = useDeleteCanvas();

  // Canvas picker handlers
  const handleSwitchCanvas = useCallback(
    (canvasId: string) => setActiveCanvasId(canvasId),
    [setActiveCanvasId],
  );

  const handleCreateCanvas = useCallback(
    async (name: string) => {
      const canvas = await createCanvasMutation.mutateAsync({ name });
      setActiveCanvasId(canvas.id);
    },
    [createCanvasMutation, setActiveCanvasId],
  );

  const handleRenameCanvas = useCallback(
    async (canvasId: string, newName: string) => {
      await updateCanvasMutation.mutateAsync({ id: canvasId, input: { name: newName } });
    },
    [updateCanvasMutation],
  );

  const handleDeleteCanvas = useCallback(
    async (canvasId: string) => {
      await deleteCanvasMutation.mutateAsync(canvasId);
      if (activeCanvasId === canvasId) {
        const remaining = canvases.filter((c) => c.id !== canvasId);
        if (remaining.length > 0) {
          setActiveCanvasId(remaining[0].id);
        }
      }
    },
    [deleteCanvasMutation, activeCanvasId, canvases, setActiveCanvasId],
  );

  // Open lightbox
  function handleOpenLightbox(_entry: GalleryEntry, index: number) {
    // Build Photo[] from all entries for lightbox navigation
    const photos: Photo[] = allEntries.map((e) => ({
      id: e.id,
      url: e.url,
      original_name: e.original_name,
      aspect_ratio: e.aspect_ratio,
      blurhash: e.blurhash,
      is_main_photo: e.is_main_photo,
      is_important: e.is_important,
      created_at: e.created_at,
      updated_at: e.created_at,
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
      {/* Canvas picker */}
      <Box
        sx={{
          position: "fixed",
          bottom: 16,
          left: showSettings ? SIDEBAR_WIDTH + 16 : 16,
          zIndex: 50,
          pointerEvents: "auto",
          transition: "left 0.2s",
        }}
      >
        <Box
          sx={{
            bgcolor: "var(--color-chrome-bg)",
            backdropFilter: "blur(8px)",
            border: "1px solid var(--color-surface1)",
            borderRadius: 2,
          }}
        >
          <CanvasPicker
            canvases={canvases}
            activeCanvasId={activeCanvasId}
            onSwitch={handleSwitchCanvas}
            onCreate={handleCreateCanvas}
            onRename={handleRenameCanvas}
            onDelete={handleDeleteCanvas}
          />
        </Box>
      </Box>

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
            label="Important only"
            icon={<StarIcon sx={{ fontSize: 14 }} />}
            size="small"
            onClick={() => setImportantOnly(!importantOnly)}
            sx={{
              bgcolor: importantOnly ? "var(--color-yellow)" : "transparent",
              color: importantOnly ? "var(--color-base)" : "var(--color-subtext0)",
              border: importantOnly ? "none" : "1px solid var(--color-surface1)",
              fontWeight: 600,
              fontSize: 11,
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
              const typeColors = theme.palette.canvasItemTypes[entry.parent_item_type];
              const typeLabel =
                CANVAS_ITEM_TYPES.find((t) => t.value === entry.parent_item_type)?.label ??
                entry.parent_item_type;
              return (
                <Box
                  key={entry.id}
                  onClick={() => handleOpenLightbox(entry, idx)}
                  sx={{
                    position: "relative",
                    borderRadius: 2,
                    overflow: "hidden",
                    border: "1px solid var(--color-surface1)",
                    cursor: "pointer",
                    "&:hover .gallery-overlay": { opacity: 1 },
                  }}
                >
                  <BlurImage
                    src={entry.url}
                    alt={entry.original_name}
                    blurhash={entry.blurhash}
                    sx={{
                      width: "100%",
                      aspectRatio: entry.aspect_ratio ? String(entry.aspect_ratio) : "1",
                      minHeight: 140,
                      maxHeight: 300,
                    }}
                  />

                  {/* Star badge */}
                  {entry.is_important && (
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
                      <StarIcon sx={{ fontSize: 14, color: "var(--color-yellow)" }} />
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
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <Chip
                      label={typeLabel}
                      size="small"
                      sx={{
                        bgcolor: typeColors.light,
                        color: getContrastText(typeColors.light),
                        fontSize: 9,
                        fontWeight: 600,
                        height: 18,
                      }}
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
                      {entry.parent_item_title}
                    </Typography>
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
