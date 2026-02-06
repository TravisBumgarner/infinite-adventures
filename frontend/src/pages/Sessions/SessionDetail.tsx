import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import StarIcon from "@mui/icons-material/Star";
import StarOutlineIcon from "@mui/icons-material/StarOutline";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import InputBase from "@mui/material/InputBase";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import { useTheme } from "@mui/material/styles";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CanvasItem, Note, Photo, TaggedItem } from "shared";
import * as api from "../../api/client";
import { CANVAS_ITEM_TYPES } from "../../constants";
import { useAutoSave } from "../../hooks/useAutoSave";
import { MODAL_ID, useModalStore } from "../../modals";
import { useCanvasStore } from "../../stores/canvasStore";
import { getContrastText } from "../../utils/getContrastText";
import { statusLabel } from "../Canvas/components/CanvasItemPanel";
import MentionEditor from "../Canvas/components/MentionEditor";

const MIN_LEFT_WIDTH = 400;
const MIN_RIGHT_WIDTH = 280;

type DetailTab = "notes" | "photos";

interface SessionDetailProps {
  sessionId: string;
  initialSessionDate: string;
  onBack: () => void;
}

export default function SessionDetail({
  sessionId,
  initialSessionDate,
  onBack,
}: SessionDetailProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const itemsCache = useCanvasStore((s) => s.itemsCache);
  const openModal = useModalStore((s) => s.openModal);

  // Item state
  const [item, setItem] = useState<CanvasItem | null>(null);
  const [title, setTitle] = useState("");
  const [sessionDate, setSessionDate] = useState(initialSessionDate);
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>("notes");

  // Tagged items
  const [taggedItems, setTaggedItems] = useState<TaggedItem[]>([]);

  // Resizable divider
  const [leftWidth, setLeftWidth] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Refs for auto-save
  const titleRef = useRef(title);
  titleRef.current = title;
  const sessionDateRef = useRef(sessionDate);
  sessionDateRef.current = sessionDate;
  const noteContentRef = useRef(noteContent);
  noteContentRef.current = noteContent;
  const editingNoteIdRef = useRef(editingNoteId);
  editingNoteIdRef.current = editingNoteId;
  const sessionIdRef = useRef(sessionId);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Save function for title
  const saveTitleFn = useCallback(async () => {
    await api.updateItem(sessionIdRef.current, { title: titleRef.current });
  }, []);

  // Save function for date
  const saveDateFn = useCallback(async () => {
    await api.updateItem(sessionIdRef.current, {
      session_date: sessionDateRef.current,
    });
  }, []);

  // Save function for note content
  const saveNoteFn = useCallback(async () => {
    if (!editingNoteIdRef.current) return;
    await api.updateNote(editingNoteIdRef.current, {
      content: noteContentRef.current,
    });
    const refreshed = await api.fetchItem(sessionIdRef.current);
    setItem(refreshed);
    setNotes(refreshed.notes);
  }, []);

  const {
    status: titleStatus,
    markDirty: markTitleDirty,
    flush: flushTitle,
  } = useAutoSave({ saveFn: saveTitleFn });
  const { markDirty: markDateDirty, flush: flushDate } = useAutoSave({
    saveFn: saveDateFn,
  });
  const {
    status: noteStatus,
    markDirty: markNoteDirty,
    flush: flushNote,
  } = useAutoSave({ saveFn: saveNoteFn });

  void titleStatus;

  // Flush on unmount
  useEffect(() => {
    return () => {
      flushTitle();
      flushDate();
      flushNote();
    };
  }, [flushTitle, flushDate, flushNote]);

  // Fetch item on mount
  useEffect(() => {
    sessionIdRef.current = sessionId;
    api.fetchItem(sessionId).then((i) => {
      setItem(i);
      setTitle(i.title);
      setNotes(i.notes);
      setPhotos(i.photos);
      setEditingNoteId(null);
      setNoteContent("");
    });
  }, [sessionId]);

  // Fetch tagged items
  useEffect(() => {
    api
      .fetchTaggedItems(sessionId)
      .then(setTaggedItems)
      .catch(() => setTaggedItems([]));
  }, [sessionId]);

  // Re-fetch tagged items when notes change (mentions may have changed)
  const prevNotesRef = useRef(notes);
  useEffect(() => {
    if (prevNotesRef.current !== notes && prevNotesRef.current.length > 0) {
      api
        .fetchTaggedItems(sessionId)
        .then(setTaggedItems)
        .catch(() => setTaggedItems([]));
    }
    prevNotesRef.current = notes;
  }, [notes, sessionId]);

  // Drag handling for resizable divider
  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalWidth = rect.width;
      let newLeftWidth = e.clientX - rect.left;

      // Enforce min widths
      if (newLeftWidth < MIN_LEFT_WIDTH) newLeftWidth = MIN_LEFT_WIDTH;
      if (totalWidth - newLeftWidth - 8 < MIN_RIGHT_WIDTH) {
        newLeftWidth = totalWidth - MIN_RIGHT_WIDTH - 8;
      }

      setLeftWidth(newLeftWidth);
    }

    function handleMouseUp() {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Title editing
  function handleTitleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      setIsEditingTitle(false);
    } else if (e.key === "Escape") {
      setTitle(item?.title ?? "");
      setIsEditingTitle(false);
    }
  }

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Note handlers
  async function handleAddNote() {
    const newNote = await api.createNote(sessionId, { content: "" });
    const refreshed = await api.fetchItem(sessionId);
    setItem(refreshed);
    setNotes(refreshed.notes);
    setEditingNoteId(newNote.id);
    setNoteContent("");
  }

  function handleSelectNote(note: Note) {
    flushNote();
    setEditingNoteId(note.id);
    setNoteContent(note.content);
  }

  async function handleDeleteNote(noteId: string) {
    if (!confirm("Delete this note?")) return;
    await api.deleteNote(noteId);
    const refreshed = await api.fetchItem(sessionId);
    setItem(refreshed);
    setNotes(refreshed.notes);
    if (editingNoteId === noteId) {
      setEditingNoteId(null);
      setNoteContent("");
    }
  }

  function handleBackToNoteList() {
    flushNote();
    setEditingNoteId(null);
    setNoteContent("");
  }

  // Photo handlers
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const photo = await api.uploadPhoto(sessionId, file);
    setPhotos((prev) => [...prev, photo]);
    const updated = await api.fetchItem(sessionId);
    setItem(updated);
    setPhotos(updated.photos);
  }

  async function handlePhotoDelete(photoId: string) {
    await api.deletePhoto(photoId);
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    const updated = await api.fetchItem(sessionId);
    setItem(updated);
  }

  async function handlePhotoSelect(photoId: string) {
    await api.selectPhoto(photoId);
    const updated = await api.fetchItem(sessionId);
    setItem(updated);
    setPhotos(updated.photos);
  }

  function handleOpenLightbox(index: number) {
    openModal({
      id: MODAL_ID.LIGHTBOX,
      photos,
      initialIndex: index,
    });
  }

  // Create mention item
  async function handleCreateMentionItem(
    mentionTitle: string,
  ): Promise<{ id: string; title: string } | null> {
    if (!activeCanvasId || !item) return null;
    try {
      const newItem = await api.createItem(activeCanvasId, {
        type: "person",
        title: mentionTitle,
        canvas_x: item.canvas_x + 220,
        canvas_y: item.canvas_y,
      });
      return { id: newItem.id, title: newItem.title };
    } catch {
      return null;
    }
  }

  function getNotePreview(content: string): string {
    let text = content.replace(/<[^>]*>/g, "").trim();
    text = text.replace(/@\{([^}]+)\}/g, (_match, id) => {
      const cached = itemsCache.get(id);
      return cached ? `@${cached.title}` : "@mention";
    });
    if (!text) return "Empty note";
    return text.length > 300 ? `${text.slice(0, 300)}...` : text;
  }

  // Navigate to tagged item on canvas
  function handleTaggedItemClick(itemId: string) {
    navigate("/canvas");
    // Set the editing item so it opens in the panel
    useCanvasStore.getState().setEditingItemId(itemId);
  }

  if (!item) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          color: "var(--color-subtext0)",
        }}
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        display: "flex",
        height: "calc(100vh - 100px)",
        gap: 0,
      }}
    >
      {/* Left column - Session content */}
      <Box
        sx={{
          width: leftWidth ?? "60%",
          minWidth: MIN_LEFT_WIDTH,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Back button and title */}
        <Box sx={{ p: 2, pb: 0 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => {
              flushTitle();
              flushDate();
              flushNote();
              onBack();
            }}
            sx={{ textTransform: "none", mb: 1.5, color: "var(--color-subtext0)" }}
          >
            Back to Sessions
          </Button>

          {/* Editable title */}
          <Box sx={{ mb: 1.5 }}>
            {isEditingTitle ? (
              <InputBase
                inputRef={titleInputRef}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  markTitleDirty();
                }}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={handleTitleKeyDown}
                sx={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  width: "100%",
                  "& input": { padding: 0 },
                }}
              />
            ) : (
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "var(--color-text)",
                  "&:hover": { color: "var(--color-subtext0)" },
                }}
                onClick={() => setIsEditingTitle(true)}
              >
                {title}
              </Typography>
            )}
          </Box>

          {/* Date picker */}
          <TextField
            label="Session Date"
            type="date"
            value={sessionDate}
            onChange={(e) => {
              setSessionDate(e.target.value);
              markDateDirty();
            }}
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ mb: 2, width: 200 }}
          />
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
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
        </Tabs>

        {/* Tab content */}
        {activeTab === "notes" && !editingNoteId && (
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", p: 2, overflow: "hidden" }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              fullWidth
              onClick={handleAddNote}
              sx={{ mb: 2, alignSelf: "flex-start" }}
            >
              Add Note
            </Button>
            <Box sx={{ flex: 1, overflowY: "auto" }}>
              {notes.length === 0 ? (
                <Typography
                  variant="body2"
                  sx={{ color: "var(--color-overlay0)", textAlign: "center", py: 3 }}
                >
                  No notes yet
                </Typography>
              ) : (
                <List sx={{ p: 0 }}>
                  {notes.map((note) => (
                    <ListItemButton
                      key={note.id}
                      onClick={() => handleSelectNote(note)}
                      sx={{
                        mb: 1,
                        py: 1.5,
                        px: 2,
                        bgcolor: "var(--color-surface0)",
                        border: "1px solid var(--color-surface1)",
                        "&:hover": { bgcolor: "var(--color-surface1)" },
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                        >
                          {getNotePreview(note.content)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "var(--color-subtext0)" }}>
                          Last edited on {new Date(note.updated_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        sx={{ color: "var(--color-subtext0)", ml: 1, minWidth: 0, p: 0.5 }}
                      >
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </Button>
                    </ListItemButton>
                  ))}
                </List>
              )}
            </Box>
          </Box>
        )}

        {activeTab === "notes" && editingNoteId && (
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", p: 2, overflow: "hidden" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ArrowBackIcon />}
                fullWidth
                onClick={handleBackToNoteList}
                sx={{ alignSelf: "flex-start" }}
              >
                Back to Notes
              </Button>
            </Box>
            <MentionEditor
              value={noteContent}
              onChange={(val: string) => {
                setNoteContent(val);
                markNoteDirty();
              }}
              itemsCache={itemsCache}
              canvasId={activeCanvasId ?? ""}
              onCreate={handleCreateMentionItem}
              containerStyle={{ flex: 1, minHeight: 0 }}
              style={{
                background: "var(--color-surface0)",
                border: "1px solid var(--color-surface1)",
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
                {statusLabel(noteStatus)}
              </Typography>
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => handleDeleteNote(editingNoteId)}
              >
                Delete Note
              </Button>
            </Box>
          </Box>
        )}

        {activeTab === "photos" && (
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
                    onClick={() => handleOpenLightbox(index)}
                  />
                  <Button
                    size="small"
                    onClick={() => handlePhotoSelect(photo.id)}
                    sx={{
                      position: "absolute",
                      bottom: 2,
                      left: 2,
                      bgcolor: "rgba(0,0,0,0.5)",
                      color: photo.is_selected ? "var(--color-yellow)" : "white",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                      width: 20,
                      height: 20,
                      minWidth: 0,
                      p: 0,
                    }}
                  >
                    {photo.is_selected ? (
                      <StarIcon sx={{ fontSize: 14 }} />
                    ) : (
                      <StarOutlineIcon sx={{ fontSize: 14 }} />
                    )}
                  </Button>
                  <Button
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
                      minWidth: 0,
                      p: 0,
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </Button>
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
                Click a photo to view it. Click the star to set as preview.
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Draggable divider */}
      <Box
        onMouseDown={handleMouseDown}
        sx={{
          width: 8,
          cursor: "col-resize",
          bgcolor: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          "&:hover": { bgcolor: "var(--color-surface0)" },
        }}
      >
        <Box
          sx={{
            width: 2,
            height: 40,
            bgcolor: "var(--color-surface1)",
            borderRadius: 1,
          }}
        />
      </Box>

      {/* Right column - Tagged items */}
      <Box
        sx={{
          flex: 1,
          minWidth: MIN_RIGHT_WIDTH,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderLeft: "1px solid var(--color-surface0)",
        }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "var(--color-text)" }}>
            Tagged Items
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--color-subtext0)" }}>
            Items @mentioned in this session's notes
          </Typography>
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", p: 2, pt: 1 }}>
          {taggedItems.length === 0 ? (
            <Typography
              variant="body2"
              sx={{ color: "var(--color-overlay0)", textAlign: "center", py: 3 }}
            >
              No tagged items yet. Use @mentions in your notes to tag items.
            </Typography>
          ) : (
            <List sx={{ p: 0 }}>
              {taggedItems.map((tagged) => {
                const typeInfo = CANVAS_ITEM_TYPES.find((t) => t.value === tagged.type);
                const bgColor = theme.palette.canvasItemTypes[tagged.type]?.light ?? "#585b70";
                return (
                  <ListItemButton
                    key={tagged.id}
                    onClick={() => handleTaggedItemClick(tagged.id)}
                    sx={{
                      mb: 1,
                      borderRadius: 1.5,
                      border: "1px solid var(--color-surface1)",
                      bgcolor: "var(--color-base)",
                      "&:hover": { bgcolor: "var(--color-surface0)" },
                      gap: 1.5,
                      py: 1.5,
                    }}
                  >
                    {/* Photo thumbnail */}
                    {tagged.selected_photo_url && (
                      <Box
                        component="img"
                        src={tagged.selected_photo_url}
                        alt={tagged.title}
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {tagged.title}
                      </Typography>
                    </Box>
                    <Chip
                      label={typeInfo?.label ?? tagged.type}
                      size="small"
                      sx={{
                        bgcolor: bgColor,
                        color: getContrastText(bgColor),
                        fontSize: 10,
                        fontWeight: 600,
                        height: 20,
                        flexShrink: 0,
                      }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </Box>
      </Box>
    </Box>
  );
}
