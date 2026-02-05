import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Drawer from "@mui/material/Drawer";
import FormLabel from "@mui/material/FormLabel";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CanvasItem, Photo } from "shared";
import * as api from "../../../api/client";
import { CANVAS_ITEM_TYPES, SIDEBAR_WIDTH } from "../../../constants";
import type { SaveStatus } from "../../../hooks/useAutoSave";
import { useAutoSave } from "../../../hooks/useAutoSave";
import { useCanvasStore } from "../../../stores/canvasStore";
import MentionEditor from "./MentionEditor";

export function statusLabel(status: SaveStatus): string {
  switch (status) {
    case "saving":
      return "Saving...";
    case "saved":
      return "Saved";
    case "unsaved":
      return "Unsaved changes";
    case "error":
      return "Save failed";
    default:
      return "";
  }
}

interface CanvasItemEditorProps {
  itemId: string;
  onClose: () => void;
  onSaved: (item: CanvasItem) => void;
  onDeleted: (itemId: string) => void;
  onNavigate: (itemId: string) => void;
  itemsCache: Map<string, CanvasItem>;
}

export default function CanvasItemEditor({
  itemId,
  onClose,
  onSaved,
  onDeleted,
  onNavigate,
  itemsCache,
}: CanvasItemEditorProps) {
  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const [item, setItem] = useState<CanvasItem | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);

  const titleRef = useRef(title);
  titleRef.current = title;
  const notesRef = useRef(notes);
  notesRef.current = notes;
  const itemIdRef = useRef(itemId);

  const saveFn = useCallback(async () => {
    const updated = await api.updateItem(itemIdRef.current, {
      title: titleRef.current,
      notes: notesRef.current,
    });
    onSaved(updated);
  }, [onSaved]);

  const { status, markDirty, flush } = useAutoSave({ saveFn });

  useEffect(() => {
    return () => {
      flush();
    };
  }, [flush]);

  useEffect(() => {
    itemIdRef.current = itemId;
    api.fetchItem(itemId).then((i) => {
      setItem(i);
      setTitle(i.title);
      setNotes(i.content.notes);
      setPhotos(i.photos);
    });
  }, [itemId]);

  async function handleDelete() {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    await api.deleteItem(itemId);
    onDeleted(itemId);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const photo = await api.uploadPhoto(itemId, file);
    setPhotos((prev) => [...prev, photo]);
    // Refresh item to get updated selected photo
    const updated = await api.fetchItem(itemId);
    setItem(updated);
    setPhotos(updated.photos);
    onSaved(updated);
  }

  async function handlePhotoDelete(photoId: string) {
    await api.deletePhoto(photoId);
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    const updated = await api.fetchItem(itemId);
    setItem(updated);
    onSaved(updated);
  }

  async function handlePhotoSelect(photoId: string) {
    await api.selectPhoto(photoId);
    const updated = await api.fetchItem(itemId);
    setItem(updated);
    setPhotos(updated.photos);
    onSaved(updated);
  }

  if (!item) {
    return (
      <Drawer
        variant="persistent"
        anchor="right"
        open
        sx={{
          "& .MuiDrawer-paper": {
            width: SIDEBAR_WIDTH,
            bgcolor: "var(--color-base)",
            borderLeft: "1px solid var(--color-surface0)",
            p: 2.5,
          },
        }}
      >
        <Typography>Loading...</Typography>
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="persistent"
      anchor="right"
      open
      sx={{
        "& .MuiDrawer-paper": {
          width: SIDEBAR_WIDTH,
          bgcolor: "var(--color-base)",
          borderLeft: "1px solid var(--color-surface0)",
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          overflowY: "auto",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">Edit Item</Typography>
        <IconButton onClick={onClose} sx={{ color: "var(--color-text)" }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <FormLabel sx={{ fontSize: 13, color: "var(--color-subtext0)" }}>Title</FormLabel>
        <TextField
          size="small"
          fullWidth
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            markDirty();
          }}
        />
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <FormLabel sx={{ fontSize: 13, color: "var(--color-subtext0)" }}>Type</FormLabel>
        <Select size="small" fullWidth value={item.type} disabled>
          {CANVAS_ITEM_TYPES.map((t) => (
            <MenuItem key={t.value} value={t.value}>
              {t.label}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {/* Photo management section */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <FormLabel sx={{ fontSize: 13, color: "var(--color-subtext0)" }}>Photos</FormLabel>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {photos.map((photo) => (
            <Box
              key={photo.id}
              sx={{
                position: "relative",
                width: 80,
                height: 80,
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
                onClick={() => handlePhotoSelect(photo.id)}
              />
              <IconButton
                size="small"
                onClick={() => handlePhotoDelete(photo.id)}
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
          <Button component="label" variant="outlined" sx={{ width: 80, height: 80, minWidth: 0 }}>
            +
            <input type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <FormLabel sx={{ fontSize: 13, color: "var(--color-subtext0)" }}>
          Start typing or @ mention another item
        </FormLabel>
        <MentionEditor
          value={notes}
          onChange={(val: string) => {
            setNotes(val);
            markDirty();
          }}
          itemsCache={itemsCache}
          canvasId={activeCanvasId ?? ""}
          style={{
            background: "var(--color-surface0)",
            border: "1px solid var(--color-surface1)",
            borderRadius: "0 0 6px 6px",
            padding: "8px 10px",
            color: "var(--color-text)",
            fontSize: 14,
            minHeight: 200,
          }}
        />
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
        <Typography variant="caption" sx={{ flex: 1, color: "var(--color-subtext0)" }}>
          {statusLabel(status)}
        </Typography>
      </Box>

      <Button
        variant="outlined"
        color="error"
        onClick={handleDelete}
        sx={{ alignSelf: "flex-start" }}
      >
        Delete
      </Button>

      {(item.links_to.length > 0 || item.linked_from.length > 0) && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
          {item.links_to.length > 0 && (
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "var(--color-overlay0)",
                  mb: 0.5,
                  display: "block",
                }}
              >
                Links to:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {item.links_to.map((link) => (
                  <Chip
                    key={link.id}
                    label={`@${link.title}`}
                    size="small"
                    clickable
                    onClick={() => onNavigate(link.id)}
                    sx={{ color: "var(--color-blue)" }}
                  />
                ))}
              </Box>
            </Box>
          )}
          {item.linked_from.length > 0 && (
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "var(--color-overlay0)",
                  mb: 0.5,
                  display: "block",
                }}
              >
                Mentioned in:
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                {item.linked_from.map((link) => (
                  <Box key={link.id}>
                    <Chip
                      label={`@${link.title}`}
                      size="small"
                      clickable
                      onClick={() => onNavigate(link.id)}
                      sx={{ color: "var(--color-blue)" }}
                    />
                    {link.snippet && (
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          ml: 1,
                          mt: 0.25,
                          color: "var(--color-subtext0)",
                          fontStyle: "italic",
                        }}
                      >
                        "...{link.snippet}..."
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Drawer>
  );
}
