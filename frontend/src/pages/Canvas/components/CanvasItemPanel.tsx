import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import { useTheme } from "@mui/material/styles";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CanvasItem, CanvasItemType, Note, Photo } from "shared";
import * as api from "../../../api/client";
import { CANVAS_ITEM_TYPES, SIDEBAR_WIDTH } from "../../../constants";
import type { SaveStatus } from "../../../hooks/useAutoSave";
import { useAutoSave } from "../../../hooks/useAutoSave";
import { useCanvasStore } from "../../../stores/canvasStore";
import { buildConnectionEntries, filterConnections } from "../../../utils/connectionFilter";
import { getContrastText } from "../../../utils/getContrastText";
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

interface CanvasItemPanelProps {
  itemId: string;
  onClose: () => void;
  onSaved: (item: CanvasItem) => void;
  onDeleted: (itemId: string) => void;
  onNavigate: (itemId: string) => void;
  itemsCache: Map<string, CanvasItem>;
}

export default function CanvasItemPanel({
  itemId,
  onClose,
  onSaved,
  onDeleted,
  onNavigate,
  itemsCache,
}: CanvasItemPanelProps) {
  const theme = useTheme();
  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const panelTab = useCanvasStore((s) => s.panelTab);
  const setPanelTab = useCanvasStore((s) => s.setPanelTab);

  // Item state
  const [item, setItem] = useState<CanvasItem | null>(null);
  const [title, setTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Connections tab state
  const [search, setSearch] = useState("");
  const [activeTypes, setActiveTypes] = useState<Set<CanvasItemType>>(new Set());

  const titleRef = useRef(title);
  titleRef.current = title;
  const noteContentRef = useRef(noteContent);
  noteContentRef.current = noteContent;
  const currentNoteRef = useRef(currentNote);
  currentNoteRef.current = currentNote;
  const itemIdRef = useRef(itemId);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const saveFn = useCallback(async () => {
    // Save title
    await api.updateItem(itemIdRef.current, {
      title: titleRef.current,
    });

    // Save note content
    if (currentNoteRef.current) {
      // Update existing note
      await api.updateNote(currentNoteRef.current.id, {
        content: noteContentRef.current,
      });
    } else if (noteContentRef.current.trim()) {
      // Create new note if there's content
      const newNote = await api.createNote(itemIdRef.current, {
        content: noteContentRef.current,
      });
      setCurrentNote(newNote);
    }

    // Refresh the item to get updated data
    const refreshed = await api.fetchItem(itemIdRef.current);
    onSaved(refreshed);
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
      // Use first note's content or empty string
      const firstNote = i.notes[0] ?? null;
      setCurrentNote(firstNote);
      setNoteContent(firstNote?.content ?? "");
      setPhotos(i.photos);
    });
    // Reset connections filters when item changes
    setSearch("");
    setActiveTypes(new Set());
    setIsEditingTitle(false);
  }, [itemId]);

  // Focus the title input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

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

  function handleTitleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      setIsEditingTitle(false);
    } else if (e.key === "Escape") {
      setTitle(item?.title ?? "");
      setIsEditingTitle(false);
    }
  }

  // Connections data
  const allEntries = useMemo(() => {
    if (!item) return [];
    return buildConnectionEntries(item.links_to, item.linked_from);
  }, [item]);

  const filtered = useMemo(
    () => filterConnections(allEntries, activeTypes, search),
    [allEntries, activeTypes, search],
  );

  const handleToggleType = (type: CanvasItemType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // Get type label and color
  const typeInfo = item ? CANVAS_ITEM_TYPES.find((t) => t.value === item.type) : null;
  const typeBgColor = item ? theme.palette.canvasItemTypes[item.type].light : "";

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
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          p: 2,
          pb: 1,
        }}
      >
        {isEditingTitle ? (
          <InputBase
            inputRef={titleInputRef}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              markDirty();
            }}
            onBlur={() => setIsEditingTitle(false)}
            onKeyDown={handleTitleKeyDown}
            sx={{
              flex: 1,
              fontSize: "1.25rem",
              fontWeight: 500,
              "& input": {
                padding: 0,
              },
            }}
          />
        ) : (
          <Typography
            variant="h6"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
              cursor: "pointer",
            }}
            onClick={() => setIsEditingTitle(true)}
          >
            {title}
          </Typography>
        )}
        <IconButton
          size="small"
          onClick={() => setIsEditingTitle(true)}
          sx={{ color: "var(--color-subtext0)", p: 0.5 }}
        >
          <EditIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <Chip
          label={typeInfo?.label ?? item.type}
          size="small"
          sx={{
            bgcolor: typeBgColor,
            color: getContrastText(typeBgColor),
            fontSize: 10,
            fontWeight: 600,
            height: 22,
          }}
        />
        <IconButton onClick={onClose} sx={{ color: "var(--color-text)", ml: "auto" }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Tabs */}
      <Tabs
        value={panelTab}
        onChange={(_, newValue) => setPanelTab(newValue)}
        sx={{
          borderBottom: "1px solid var(--color-surface0)",
          px: 2,
          minHeight: 40,
          "& .MuiTab-root": {
            textTransform: "none",
            minWidth: 0,
            minHeight: 40,
            px: 2,
            py: 1,
          },
        }}
      >
        <Tab label="Notes" value="notes" />
        <Tab label="Photos" value="photos" />
        <Tab label="Connections" value="connections" />
      </Tabs>

      {/* Tab Content */}
      {panelTab === "notes" && (
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", p: 2, overflow: "hidden" }}>
          <MentionEditor
            value={noteContent}
            onChange={(val: string) => {
              setNoteContent(val);
              markDirty();
            }}
            itemsCache={itemsCache}
            canvasId={activeCanvasId ?? ""}
            containerStyle={{ flex: 1, minHeight: 0 }}
            style={{
              background: "var(--color-surface0)",
              border: "1px solid var(--color-surface1)",
              borderRadius: "0 0 6px 6px",
              padding: "8px 10px",
              color: "var(--color-text)",
              fontSize: 14,
              overflow: "auto",
            }}
          />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mt: 1.5,
              flexShrink: 0,
            }}
          >
            <Typography variant="caption" sx={{ color: "var(--color-subtext0)" }}>
              {statusLabel(status)}
            </Typography>
            <Button variant="outlined" color="error" size="small" onClick={handleDelete}>
              Delete
            </Button>
          </Box>
        </Box>
      )}

      {panelTab === "photos" && (
        <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {photos.map((photo) => (
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
            <Button
              component="label"
              variant="outlined"
              sx={{ width: 100, height: 100, minWidth: 0 }}
            >
              +
              <input type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
            </Button>
          </Box>
          {photos.length > 0 && (
            <Typography
              variant="caption"
              sx={{ display: "block", mt: 1.5, color: "var(--color-subtext0)" }}
            >
              Click a photo to set it as the preview image
            </Typography>
          )}
        </Box>
      )}

      {panelTab === "connections" && (
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          <TextField
            size="small"
            fullWidth
            placeholder="Search connections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {CANVAS_ITEM_TYPES.map(({ value, label }) => {
              const active = activeTypes.has(value);
              const bgColor = theme.palette.canvasItemTypes[value].light;
              return (
                <Chip
                  key={value}
                  label={label}
                  size="small"
                  onClick={() => handleToggleType(value)}
                  variant={active ? "filled" : "outlined"}
                  sx={{
                    bgcolor: active ? bgColor : "transparent",
                    borderColor: bgColor,
                    color: active ? getContrastText(bgColor) : "var(--color-subtext0)",
                    fontWeight: 600,
                    fontSize: 11,
                    "&:hover": {
                      bgcolor: active ? bgColor : "transparent",
                    },
                  }}
                />
              );
            })}
          </Box>

          <List sx={{ flex: 1, overflowY: "auto", p: 0 }}>
            {filtered.length === 0 ? (
              <Typography
                variant="body2"
                sx={{
                  color: "var(--color-overlay0)",
                  py: 1.5,
                  textAlign: "center",
                }}
              >
                No connections found
              </Typography>
            ) : (
              filtered.map((entry) => {
                const entryTypeBgColor = theme.palette.canvasItemTypes[entry.link.type].light;
                const snippet = "snippet" in entry.link ? entry.link.snippet : undefined;
                return (
                  <ListItemButton
                    key={`${entry.direction}-${entry.link.id}`}
                    onClick={() => onNavigate(entry.link.id)}
                    sx={{
                      borderRadius: 1.5,
                      gap: 1,
                      py: 1,
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                      <Chip
                        label={entry.direction === "outgoing" ? "→" : "←"}
                        size="small"
                        sx={{
                          bgcolor:
                            entry.direction === "outgoing"
                              ? "var(--color-surface1)"
                              : "var(--color-surface0)",
                          color: "var(--color-subtext0)",
                          fontSize: 12,
                          height: 24,
                          minWidth: 28,
                        }}
                      />
                      <Chip
                        label={entry.link.type.toUpperCase()}
                        size="small"
                        sx={{
                          bgcolor: entryTypeBgColor,
                          color: getContrastText(entryTypeBgColor),
                          fontSize: 10,
                          fontWeight: 600,
                          height: 20,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flex: 1,
                        }}
                      >
                        {entry.link.title}
                      </Typography>
                    </Box>
                    {snippet && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: "var(--color-subtext0)",
                          fontStyle: "italic",
                          pl: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          width: "100%",
                        }}
                      >
                        "{snippet}"
                      </Typography>
                    )}
                  </ListItemButton>
                );
              })
            )}
          </List>
        </Box>
      )}
    </Drawer>
  );
}
