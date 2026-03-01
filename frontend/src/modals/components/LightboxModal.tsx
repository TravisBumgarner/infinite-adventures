import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import PhotoSizeSelectActualIcon from "@mui/icons-material/PhotoSizeSelectActual";
import PhotoSizeSelectActualOutlinedIcon from "@mui/icons-material/PhotoSizeSelectActualOutlined";
import StarIcon from "@mui/icons-material/Star";
import StarOutlineIcon from "@mui/icons-material/StarOutline";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useState } from "react";
import { useModalStore } from "../store";
import type { LightboxModalProps } from "../types";

export default function LightboxModal({
  photos,
  initialIndex,
  onDelete,
  onSelect,
  onToggleImportant,
}: LightboxModalProps) {
  const closeModal = useModalStore((s) => s.closeModal);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handlePrev = useCallback(() => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
  }, [photos.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((i) => (i < photos.length - 1 ? i + 1 : 0));
  }, [photos.length]);

  // Arrow key navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowRight") handleNext();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext]);

  const currentPhoto = photos[currentIndex];
  if (!currentPhoto) return null;

  const hasActions = onDelete || onSelect || onToggleImportant;

  return (
    <Dialog
      open
      onClose={closeModal}
      maxWidth={false}
      slotProps={{
        paper: {
          sx: {
            bgcolor: "rgba(0, 0, 0, 0.95)",
            width: "95vw",
            height: "95vh",
            maxWidth: "95vw",
            maxHeight: "95vh",
            m: 2,
          },
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
        }}
      >
        {/* Close button */}
        <IconButton
          onClick={closeModal}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            color: "white",
            bgcolor: "rgba(0,0,0,0.5)",
            "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
            zIndex: 2,
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Previous button */}
        {photos.length > 1 && (
          <IconButton
            onClick={handlePrev}
            sx={{
              position: "absolute",
              left: 16,
              color: "white",
              bgcolor: "rgba(0,0,0,0.5)",
              "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
              zIndex: 2,
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: 32 }} />
          </IconButton>
        )}

        {/* Image */}
        <Box
          component="img"
          src={currentPhoto.url}
          alt={currentPhoto.originalName}
          sx={{
            maxWidth: "calc(100% - 120px)",
            maxHeight: "calc(100% - 60px)",
            objectFit: "contain",
            display: "block",
          }}
        />

        {/* Next button */}
        {photos.length > 1 && (
          <IconButton
            onClick={handleNext}
            sx={{
              position: "absolute",
              right: 16,
              color: "white",
              bgcolor: "rgba(0,0,0,0.5)",
              "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
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
          {/* Left: caption */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {currentPhoto.caption && (
              <Typography
                variant="body2"
                sx={{
                  color: "white",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {currentPhoto.caption}
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
          {hasActions && (
            <Box sx={{ display: "flex", gap: 0.25, flexShrink: 0 }}>
              {onSelect && (
                <Tooltip title="Set as main photo">
                  <IconButton
                    size="small"
                    onClick={() => onSelect(currentPhoto.id)}
                    sx={{
                      color: currentPhoto.isMainPhoto ? "var(--color-blue)" : "white",
                      "&:hover": { color: "var(--color-blue)" },
                      p: 0.5,
                    }}
                  >
                    {currentPhoto.isMainPhoto ? (
                      <PhotoSizeSelectActualIcon />
                    ) : (
                      <PhotoSizeSelectActualOutlinedIcon />
                    )}
                  </IconButton>
                </Tooltip>
              )}
              {onToggleImportant && (
                <Tooltip title={currentPhoto.isImportant ? "Unpin" : "Pin"}>
                  <IconButton
                    size="small"
                    onClick={() => onToggleImportant(currentPhoto.id)}
                    sx={{
                      color: currentPhoto.isImportant ? "var(--color-yellow)" : "white",
                      "&:hover": { color: "var(--color-yellow)" },
                      p: 0.5,
                    }}
                  >
                    {currentPhoto.isImportant ? <StarIcon /> : <StarOutlineIcon />}
                  </IconButton>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={() => {
                      onDelete(currentPhoto.id);
                      if (photos.length <= 1) {
                        closeModal();
                      } else if (currentIndex >= photos.length - 1) {
                        setCurrentIndex(photos.length - 2);
                      }
                    }}
                    sx={{
                      color: "white",
                      "&:hover": { color: "var(--color-red)" },
                      p: 0.5,
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Dialog>
  );
}
