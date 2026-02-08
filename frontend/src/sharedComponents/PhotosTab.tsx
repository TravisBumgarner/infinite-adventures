import CloseIcon from "@mui/icons-material/Close";
import StarIcon from "@mui/icons-material/Star";
import StarOutlineIcon from "@mui/icons-material/StarOutline";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import type { Photo } from "shared";

interface PhotosTabProps {
  photos: Photo[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: (photoId: string) => void;
  onSelect: (photoId: string) => void;
  onOpenLightbox: (index: number) => void;
}

export default function PhotosTab({
  photos,
  onUpload,
  onDelete,
  onSelect,
  onOpenLightbox,
}: PhotosTabProps) {
  return (
    <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {photos.map((photo, index) => (
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
            }}
          >
            <Box
              component="img"
              src={photo.url}
              alt={photo.original_name}
              sx={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
              onClick={() => onOpenLightbox(index)}
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
              }}
            >
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        ))}
        <Button component="label" variant="outlined" sx={{ width: 100, height: 100, minWidth: 0 }}>
          +
          <input type="file" accept="image/*" hidden onChange={onUpload} />
        </Button>
      </Box>
      {photos.length > 0 && (
        <Typography
          variant="caption"
          sx={{ display: "block", mt: 1.5, color: "var(--color-subtext0)" }}
        >
          Click a photo to view it. Click the star to set as preview.
        </Typography>
      )}
    </Box>
  );
}
