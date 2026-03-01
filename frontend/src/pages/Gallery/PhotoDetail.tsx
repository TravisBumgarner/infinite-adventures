import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MapIcon from "@mui/icons-material/Map";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { GalleryEntry } from "shared";

import { useCanvasStore } from "../../stores/canvasStore";
import { FONT_SIZES } from "../../styles/styleConsts";

export default function PhotoDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const setEditingItemId = useCanvasStore((s) => s.setEditingItemId);

  const state = location.state as { photos?: GalleryEntry[]; index?: number } | null;
  const photos = state?.photos ?? [];
  const [currentIndex, setCurrentIndex] = useState(state?.index ?? 0);

  const handlePrev = useCallback(() => {
    setCurrentIndex((i) => {
      const next = i > 0 ? i - 1 : photos.length - 1;
      window.history.replaceState(window.history.state, "", `/gallery/${photos[next]?.id}`);
      return next;
    });
  }, [photos]);

  const handleNext = useCallback(() => {
    setCurrentIndex((i) => {
      const next = i < photos.length - 1 ? i + 1 : 0;
      window.history.replaceState(window.history.state, "", `/gallery/${photos[next]?.id}`);
      return next;
    });
  }, [photos]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowRight") handleNext();
      else if (e.key === "Escape") navigate("/gallery");
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext, navigate]);

  const photo = photos[currentIndex];

  if (!photo) {
    return (
      <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box sx={{ textAlign: "center", color: "var(--color-subtext0)" }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Photo not found
          </Typography>
          <Typography
            variant="body2"
            sx={{
              cursor: "pointer",
              color: "var(--color-blue)",
              "&:hover": { textDecoration: "underline" },
            }}
            onClick={() => navigate("/gallery")}
          >
            Back to Gallery
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100%",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "var(--color-base)",
      }}
    >
      {/* Close button */}
      <IconButton
        onClick={() => navigate("/gallery")}
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          color: "var(--color-subtext0)",
          "&:hover": { color: "var(--color-text)" },
          zIndex: 2,
        }}
      >
        <CloseIcon />
      </IconButton>

      {/* Previous */}
      {photos.length > 1 && (
        <IconButton
          onClick={handlePrev}
          sx={{
            position: "absolute",
            left: 16,
            color: "var(--color-subtext0)",
            bgcolor: "var(--color-surface0)",
            "&:hover": { bgcolor: "var(--color-surface1)" },
            zIndex: 2,
          }}
        >
          <ChevronLeftIcon sx={{ fontSize: 32 }} />
        </IconButton>
      )}

      {/* Image */}
      <Box
        component="img"
        src={photo.url}
        alt={photo.originalName}
        sx={{
          maxWidth: "calc(100% - 120px)",
          maxHeight: "calc(100% - 80px)",
          objectFit: "contain",
          display: "block",
        }}
      />

      {/* Next */}
      {photos.length > 1 && (
        <IconButton
          onClick={handleNext}
          sx={{
            position: "absolute",
            right: 16,
            color: "var(--color-subtext0)",
            bgcolor: "var(--color-surface0)",
            "&:hover": { bgcolor: "var(--color-surface1)" },
            zIndex: 2,
          }}
        >
          <ChevronRightIcon sx={{ fontSize: 32 }} />
        </IconButton>
      )}

      {/* Floating bottom bar */}
      <Box
        sx={{
          position: "absolute",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 600,
          bgcolor: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(8px)",
          borderRadius: 2,
          px: 2,
          py: 1,
          display: "flex",
          alignItems: "center",
          zIndex: 2,
        }}
      >
        {/* Left: title + caption */}
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
            {photo.parentItemTitle}
          </Typography>
          {photo.caption && (
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
              {photo.caption}
            </Typography>
          )}
        </Box>

        {/* Center: counter */}
        <Typography
          variant="caption"
          sx={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          {currentIndex + 1} / {photos.length}
        </Typography>

        {/* Right: action buttons */}
        <Box sx={{ display: "flex", gap: 0.25, flexShrink: 0 }}>
          <Tooltip title="Open in Canvas">
            <IconButton
              size="small"
              onClick={() => navigate(`/canvas?focus=${photo.parentItemId}`)}
              sx={{
                color: "white",
                "&:hover": { color: "var(--color-blue)" },
                p: 0.5,
              }}
            >
              <MapIcon sx={{ fontSize: FONT_SIZES.md }} />
            </IconButton>
          </Tooltip>
          {photo.parentItemType === "session" && (
            <Tooltip title="Open in Session Viewer">
              <IconButton
                size="small"
                onClick={() => navigate(`/sessions/${photo.parentItemId}`)}
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
              onClick={() => setEditingItemId(photo.parentItemId)}
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
}
