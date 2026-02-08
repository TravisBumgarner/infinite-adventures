import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputBase from "@mui/material/InputBase";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CanvasItem, Note, Photo } from "shared";
import * as api from "../../api/client";
import { useAutoSave } from "../../hooks/useAutoSave";
import { MODAL_ID, useModalStore } from "../../modals";
import NotesTab from "../../sharedComponents/NotesTab";
import PhotosTab from "../../sharedComponents/PhotosTab";
import { useCanvasStore } from "../../stores/canvasStore";
import TaggedItemsPanel from "./components/TaggedItemsPanel";

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
        {activeTab === "notes" && (
          <NotesTab
            notes={notes}
            editingNoteId={editingNoteId}
            noteContent={noteContent}
            noteStatus={noteStatus}
            itemsCache={itemsCache}
            canvasId={activeCanvasId ?? ""}
            onAddNote={handleAddNote}
            onSelectNote={handleSelectNote}
            onDeleteNote={handleDeleteNote}
            onBackToList={handleBackToNoteList}
            onNoteContentChange={(val) => {
              setNoteContent(val);
              markNoteDirty();
            }}
            onCreateMentionItem={handleCreateMentionItem}
            getNotePreview={getNotePreview}
          />
        )}

        {activeTab === "photos" && (
          <PhotosTab
            photos={photos}
            onUpload={handlePhotoUpload}
            onDelete={handlePhotoDelete}
            onSelect={handlePhotoSelect}
            onOpenLightbox={handleOpenLightbox}
          />
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
      <TaggedItemsPanel sessionId={sessionId} notes={notes} itemsCache={itemsCache} />
    </Box>
  );
}
