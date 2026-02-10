import CloseIcon from "@mui/icons-material/Close";
import StarIcon from "@mui/icons-material/Star";
import StarOutlineIcon from "@mui/icons-material/StarOutline";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useCallback, useMemo, useState } from "react";
import type { Photo } from "shared";
import { blurhashToDataURL } from "../utils/blurhashToDataURL";

interface PhotosTabProps {
  photos: Photo[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: (photoId: string) => void;
  onSelect: (photoId: string) => void;
  onOpenLightbox: (index: number) => void;
  onFileDrop?: (file: File) => void;
}

export default function PhotosTab({
  photos,
  onUpload,
  onDelete,
  onSelect,
  onOpenLightbox,
  onFileDrop,
}: PhotosTabProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!onFileDrop) return;
      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find((f) => f.type.startsWith("image/"));
      if (imageFile) {
        onFileDrop(imageFile);
      }
    },
    [onFileDrop],
  );

  // Starred photos first, then the rest. Both groups keep the API's
  // original order, which is creation date (oldest first).
  const sortedPhotos = useMemo(() => {
    const selected = photos.filter((p) => p.is_selected);
    const rest = photos.filter((p) => !p.is_selected);
    return [...selected, ...rest];
  }, [photos]);

  return (
    <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
      {/* Upload / drop zone */}
      <Button
        component="label"
        variant="outlined"
        sx={{
          width: "100%",
          minHeight: 60,
          mb: 1.5,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          textTransform: "none",
          borderStyle: isDragging ? "dashed" : "solid",
          borderColor: isDragging ? "var(--color-blue)" : undefined,
          bgcolor: isDragging ? "rgba(137, 180, 250, 0.08)" : undefined,
        }}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging ? (
          <Typography sx={{ color: "var(--color-blue)", fontWeight: 600, fontSize: 13 }}>
            Drop image here
          </Typography>
        ) : (
          <Typography sx={{ color: "var(--color-subtext0)", fontSize: 13 }}>
            Click to select or drop photo here
          </Typography>
        )}
        <input type="file" accept="image/*" hidden onChange={onUpload} />
      </Button>

      {/* Photo grid */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {sortedPhotos.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: "var(--color-overlay0)", textAlign: "center", py: 3, width: "100%" }}
          >
            No photos yet
          </Typography>
        ) : (
          sortedPhotos.map((photo) => {
            const originalIndex = photos.indexOf(photo);
            return (
              <Box
                key={photo.id}
                sx={{
                  position: "relative",
                  width: 100,
                  height: 100,
                  border: photo.is_selected
                    ? "2px solid var(--color-blue)"
                    : "1px solid var(--color-surface1)",
                  borderRadius: 1,
                  overflow: "hidden",
                  backgroundImage: photo.blurhash
                    ? `url(${blurhashToDataURL(photo.blurhash)})`
                    : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <Box
                  component="img"
                  src={photo.url}
                  alt={photo.original_name}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    cursor: "pointer",
                  }}
                  onClick={() => onOpenLightbox(originalIndex)}
                />
                <IconButton
                  size="small"
                  onClick={() => onSelect(photo.id)}
                  sx={{
                    position: "absolute",
                    bottom: 2,
                    left: 2,
                    bgcolor: "rgba(0,0,0,0.5)",
                    color: photo.is_selected ? "var(--color-yellow)" : "white",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                    width: 20,
                    height: 20,
                    zIndex: 2,
                  }}
                >
                  {photo.is_selected ? (
                    <StarIcon sx={{ fontSize: 14 }} />
                  ) : (
                    <StarOutlineIcon sx={{ fontSize: 14 }} />
                  )}
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onDelete(photo.id)}
                  sx={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    bgcolor: "rgba(0,0,0,0.5)",
                    color: "white",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                    width: 20,
                    height: 20,
                    zIndex: 2,
                  }}
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}
