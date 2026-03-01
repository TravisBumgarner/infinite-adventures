import DeleteIcon from "@mui/icons-material/Delete";
import PhotoSizeSelectActualIcon from "@mui/icons-material/PhotoSizeSelectActual";
import PhotoSizeSelectActualOutlinedIcon from "@mui/icons-material/PhotoSizeSelectActualOutlined";
import StarIcon from "@mui/icons-material/Star";
import StarOutlineIcon from "@mui/icons-material/StarOutline";
import Masonry from "@mui/lab/Masonry";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Photo } from "shared";
import { FONT_SIZES } from "../styles/styleConsts";
import { blurhashToDataURL } from "../utils/blurhashToDataURL";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";

interface PhotosTabProps {
  photos: Photo[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: (photoId: string) => void;
  onSelect: (photoId: string) => void;
  onToggleImportant: (photoId: string) => void;
  onOpenLightbox: (index: number) => void;
  onFileDrop?: (file: File) => void;
  onUpdateCaption?: (photoId: string, caption: string) => void;
  columns?: number;
}

export default function PhotosTab({
  photos,
  onUpload,
  onDelete,
  onSelect,
  onToggleImportant,
  onOpenLightbox,
  onFileDrop,
  onUpdateCaption: _onUpdateCaption,
  columns: columnsProp,
}: PhotosTabProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoColumns, setAutoColumns] = useState(3);
  const [isDragging, setIsDragging] = useState(false);
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null);

  useEffect(() => {
    if (columnsProp != null) return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (width < 200) setAutoColumns(1);
      else if (width < 400) setAutoColumns(2);
      else setAutoColumns(3);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [columnsProp]);

  const columns = columnsProp ?? autoColumns;

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
    const selected = photos.filter((p) => p.isMainPhoto);
    const rest = photos.filter((p) => !p.isMainPhoto);
    return [...selected, ...rest];
  }, [photos]);

  return (
    <Box ref={containerRef} sx={{ flex: 1, overflowY: "auto", p: 2 }}>
      {/* Upload / drop zone */}
      <Button
        component="label"
        variant="outlined"
        size="small"
        fullWidth
        sx={{
          mb: 2,
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
        {isDragging ? "Drop image here" : "Upload Photo"}
        <input type="file" accept="image/*" hidden onChange={onUpload} />
      </Button>

      {/* Photo grid */}
      {sortedPhotos.length === 0 ? (
        <Typography
          variant="body2"
          sx={{
            color: "var(--color-overlay0)",
            textAlign: "center",
            py: 3,
          }}
        >
          No photos yet
        </Typography>
      ) : (
        <Masonry columns={columns} spacing={1}>
          {sortedPhotos.map((photo) => {
            const originalIndex = photos.indexOf(photo);
            return (
              <Box
                key={photo.id}
                sx={{
                  position: "relative",
                  overflow: "hidden",
                  border: photo.isMainPhoto
                    ? "2px solid var(--color-blue)"
                    : "1px solid var(--color-surface1)",
                  cursor: "pointer",
                  backgroundImage: photo.blurhash
                    ? `url(${blurhashToDataURL(photo.blurhash)})`
                    : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  "&:hover .photo-overlay": { opacity: 1 },
                  "&:hover .photo-delete": { opacity: 1 },
                }}
                onClick={() => onOpenLightbox(originalIndex)}
              >
                <Box
                  component="img"
                  src={photo.url}
                  alt={photo.originalName}
                  sx={{ width: "100%", display: "block" }}
                />

                {/* Pin badge — always visible */}
                {photo.isImportant && (
                  <Box sx={{ position: "absolute", top: 8, left: 8, zIndex: 2 }}>
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
                    className="photo-delete"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletePhotoId(photo.id);
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

                {/* Bottom overlay — caption left, buttons right, hover only */}
                <Box
                  className="photo-overlay"
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
                    {photo.caption && (
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
                        {photo.caption}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: "flex", gap: 0.25, flexShrink: 0 }}>
                    <Tooltip title="Set as main photo">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(photo.id);
                        }}
                        sx={{
                          color: photo.isMainPhoto ? "var(--color-blue)" : "white",
                          "&:hover": { color: "var(--color-blue)" },
                          p: 0.5,
                        }}
                      >
                        {photo.isMainPhoto ? (
                          <PhotoSizeSelectActualIcon sx={{ fontSize: FONT_SIZES.md }} />
                        ) : (
                          <PhotoSizeSelectActualOutlinedIcon sx={{ fontSize: FONT_SIZES.md }} />
                        )}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={photo.isImportant ? "Unpin" : "Pin"}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleImportant(photo.id);
                        }}
                        sx={{
                          color: photo.isImportant ? "var(--color-yellow)" : "white",
                          "&:hover": { color: "var(--color-yellow)" },
                          p: 0.5,
                        }}
                      >
                        {photo.isImportant ? (
                          <StarIcon sx={{ fontSize: FONT_SIZES.md }} />
                        ) : (
                          <StarOutlineIcon sx={{ fontSize: FONT_SIZES.md }} />
                        )}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Masonry>
      )}

      <ConfirmDeleteDialog
        open={deletePhotoId !== null}
        onClose={() => setDeletePhotoId(null)}
        onConfirm={() => {
          onDelete(deletePhotoId!);
          setDeletePhotoId(null);
        }}
        title="Delete Photo"
        message="Are you sure you want to delete this photo? This cannot be undone."
      />
    </Box>
  );
}
