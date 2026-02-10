import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import BlurImage from "../../sharedComponents/BlurImage";
import { useModalStore } from "../store";
import type { LightboxModalProps } from "../types";

export default function LightboxModal({ photos, initialIndex }: LightboxModalProps) {
  const closeModal = useModalStore((s) => s.closeModal);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handlePrev = () => {
    setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : photos.length - 1);
  };

  const handleNext = () => {
    setCurrentIndex(currentIndex < photos.length - 1 ? currentIndex + 1 : 0);
  };

  const currentPhoto = photos[currentIndex];
  if (!currentPhoto) return null;

  return (
    <Dialog
      open
      onClose={closeModal}
      maxWidth={false}
      slotProps={{
        paper: {
          sx: {
            bgcolor: "rgba(0, 0, 0, 0.95)",
            width: "80vw",
            height: "80vh",
            maxWidth: "80vw",
            maxHeight: "80vh",
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

        {/* Blurhash backdrop + Image */}
        <Box
          sx={{
            position: "relative",
            maxWidth: "calc(100% - 120px)",
            maxHeight: "calc(100% - 60px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BlurImage
            src={currentPhoto.url}
            alt={currentPhoto.originalName}
            blurhash={currentPhoto.blurhash}
            sx={{
              maxWidth: "100%",
              maxHeight: "calc(80vh - 60px)",
              borderRadius: 1,
            }}
          />
        </Box>

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

        {/* Photo counter */}
        <Typography
          variant="caption"
          sx={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            transform: "translateX(-50%)",
            color: "white",
            bgcolor: "rgba(0,0,0,0.5)",
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            zIndex: 2,
          }}
        >
          {currentIndex + 1} / {photos.length}
        </Typography>
      </Box>
    </Dialog>
  );
}
