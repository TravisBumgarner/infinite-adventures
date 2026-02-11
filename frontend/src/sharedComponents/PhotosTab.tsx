import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import PhotoSizeSelectActualIcon from "@mui/icons-material/PhotoSizeSelectActual";
import PhotoSizeSelectActualOutlinedIcon from "@mui/icons-material/PhotoSizeSelectActualOutlined";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import StarIcon from "@mui/icons-material/Star";
import StarOutlineIcon from "@mui/icons-material/StarOutline";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Photo } from "shared";
import { blurhashToDataURL } from "../utils/blurhashToDataURL";

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
  onColumnsChange?: (columns: number) => void;
}

function CaptionEditor({
  photoId,
  initialCaption,
  onSave,
}: {
  photoId: string;
  initialCaption: string;
  onSave: (photoId: string, caption: string) => void;
}) {
  const [value, setValue] = useState(initialCaption);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setValue(newVal);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSave(photoId, newVal), 600);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <InputBase
      value={value}
      onChange={handleChange}
      placeholder="Add caption..."
      onClick={(e) => e.stopPropagation()}
      sx={{
        width: "100%",
        fontSize: 11,
        color: "var(--color-subtext0)",
        "& input": { padding: "2px 0", textAlign: "center" },
      }}
    />
  );
}

export default function PhotosTab({
  photos,
  onUpload,
  onDelete,
  onSelect,
  onToggleImportant,
  onOpenLightbox,
  onFileDrop,
  onUpdateCaption,
  columns,
  onColumnsChange,
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
    const selected = photos.filter((p) => p.isMainPhoto);
    const rest = photos.filter((p) => !p.isMainPhoto);
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

      {/* Column controls */}
      {onColumnsChange && columns != null && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
          <Tooltip title="Fewer columns">
            <span>
              <IconButton
                size="small"
                disabled={columns <= 2}
                onClick={() => onColumnsChange(columns - 1)}
              >
                <RemoveCircleOutlineIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Typography variant="caption" sx={{ color: "var(--color-subtext0)" }}>
            {columns} columns
          </Typography>
          <Tooltip title="More columns">
            <span>
              <IconButton
                size="small"
                disabled={columns >= 8}
                onClick={() => onColumnsChange(columns + 1)}
              >
                <AddCircleOutlineIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      )}

      {/* Photo grid */}
      <Box
        sx={
          columns != null
            ? {
                display: "grid",
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: 1,
              }
            : { display: "flex", flexWrap: "wrap", gap: 1 }
        }
      >
        {sortedPhotos.length === 0 ? (
          <Typography
            variant="body2"
            sx={{
              color: "var(--color-overlay0)",
              textAlign: "center",
              py: 3,
              width: "100%",
              gridColumn: columns != null ? "1 / -1" : undefined,
            }}
          >
            No photos yet
          </Typography>
        ) : (
          sortedPhotos.map((photo) => {
            const originalIndex = photos.indexOf(photo);
            return (
              <Box key={photo.id} sx={{ display: "flex", flexDirection: "column" }}>
                <Box
                  sx={{
                    position: "relative",
                    width: columns != null ? "100%" : 100,
                    aspectRatio: columns != null ? "1" : undefined,
                    height: columns != null ? undefined : 100,
                    border: photo.isMainPhoto
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
                    alt={photo.originalName}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      cursor: "pointer",
                    }}
                    onClick={() => onOpenLightbox(originalIndex)}
                  />
                  <Tooltip title="Set as main photo" placement="top">
                    <IconButton
                      size="small"
                      onClick={() => onSelect(photo.id)}
                      sx={{
                        position: "absolute",
                        bottom: 2,
                        left: 2,
                        bgcolor: "rgba(0,0,0,0.5)",
                        color: photo.isMainPhoto ? "var(--color-blue)" : "white",
                        "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                        width: 20,
                        height: 20,
                        zIndex: 2,
                      }}
                    >
                      {photo.isMainPhoto ? (
                        <PhotoSizeSelectActualIcon sx={{ fontSize: 14 }} />
                      ) : (
                        <PhotoSizeSelectActualOutlinedIcon sx={{ fontSize: 14 }} />
                      )}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Mark as important" placement="top">
                    <IconButton
                      size="small"
                      onClick={() => onToggleImportant(photo.id)}
                      sx={{
                        position: "absolute",
                        bottom: 2,
                        left: 24,
                        bgcolor: "rgba(0,0,0,0.5)",
                        color: photo.isImportant ? "var(--color-yellow)" : "white",
                        "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                        width: 20,
                        height: 20,
                        zIndex: 2,
                      }}
                    >
                      {photo.isImportant ? (
                        <StarIcon sx={{ fontSize: 14 }} />
                      ) : (
                        <StarOutlineIcon sx={{ fontSize: 14 }} />
                      )}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete photo" placement="top">
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
                  </Tooltip>
                </Box>
                {onUpdateCaption && (
                  <CaptionEditor
                    photoId={photo.id}
                    initialCaption={photo.caption}
                    onSave={onUpdateCaption}
                  />
                )}
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}
