import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CanvasItem, CanvasItemType, Note, Photo } from "shared";

import NoteHistoryModal from "../../components/NoteHistoryModal";
import { DRAFT_NOTE_ID } from "../../constants";
import { useCreateItem, useCreateNote, useUpdateItem, useUpdateNote } from "../../hooks/mutations";
import { useItem, useItems, useNoteHistory } from "../../hooks/queries";
import { useAutoSave } from "../../hooks/useAutoSave";
import { useNoteHandlers } from "../../hooks/useNoteHandlers";
import { usePhotoHandlers } from "../../hooks/usePhotoHandlers";
import { MODAL_ID, useModalStore } from "../../modals";
import NotesTab from "../../sharedComponents/NotesTab";
import PhotosTab from "../../sharedComponents/PhotosTab";
import QueryErrorDisplay from "../../sharedComponents/QueryErrorDisplay";
import { useCanvasStore } from "../../stores/canvasStore";

import { FONT_SIZES } from "../../styles/styleConsts";
import { getNotePreview } from "../../utils/getNotePreview";
import { shouldSnapshot } from "../../utils/shouldSnapshot";

type DetailTab = "notes" | "photos";

interface SessionDetailProps {
  sessionId: string;
}

export default function SessionDetail({ sessionId }: SessionDetailProps) {
  const navigate = useNavigate();
  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const itemsCache = useCanvasStore((s) => s.itemsCache);
  const setItemsCache = useCanvasStore((s) => s.setItemsCache);
  const setEditingItemId = useCanvasStore((s) => s.setEditingItemId);
  const openModal = useModalStore((s) => s.openModal);

  // Fetch item via React Query
  const { data: queryItem, refetch: refetchItem, error: itemError } = useItem(sessionId);

  // Populate itemsCache if empty (e.g. navigated directly to sessions page)
  const { data: itemSummaries } = useItems(
    itemsCache.size === 0 ? (activeCanvasId ?? undefined) : undefined,
  );
  useEffect(() => {
    if (itemSummaries && itemsCache.size === 0) {
      const cache = new Map(itemSummaries.map((s) => [s.id, s as unknown as CanvasItem]));
      setItemsCache(cache);
    }
  }, [itemSummaries, itemsCache.size, setItemsCache]);

  // Local editable state
  const [item, setItem] = useState<CanvasItem | null>(null);
  const [title, setTitle] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>("notes");

  // Note history state
  const [historyNoteId, setHistoryNoteId] = useState<string | null>(null);
  const lastSnapshotAtRef = useRef<Map<string, number>>(new Map());
  const [photoColumns, setPhotoColumns] = useState(4);

  // Mutation hooks
  const updateItemMutation = useUpdateItem(activeCanvasId ?? "");
  const createNoteMutation = useCreateNote(sessionId);
  const updateNoteMutation = useUpdateNote(sessionId);
  const createItemMutation = useCreateItem(activeCanvasId ?? "");

  // Refs for auto-save
  const titleRef = useRef(title);
  titleRef.current = title;
  const sessionDateRef = useRef(sessionDate);
  sessionDateRef.current = sessionDate;
  const noteContentRef = useRef(noteContent);
  noteContentRef.current = noteContent;
  const noteTitleRef = useRef(noteTitle);
  noteTitleRef.current = noteTitle;
  const editingNoteIdRef = useRef(editingNoteId);
  editingNoteIdRef.current = editingNoteId;
  const sessionIdRef = useRef(sessionId);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Save function for title
  const saveTitleFn = useCallback(async () => {
    await updateItemMutation.mutateAsync({
      id: sessionIdRef.current,
      input: { title: titleRef.current },
    });
  }, [updateItemMutation]);

  // Save function for date
  const saveDateFn = useCallback(async () => {
    await updateItemMutation.mutateAsync({
      id: sessionIdRef.current,
      input: { sessionDate: sessionDateRef.current },
    });
  }, [updateItemMutation]);

  // Save function for note content (with snapshot throttling)
  const saveNoteFn = useCallback(async () => {
    if (!editingNoteIdRef.current) return;
    const noteId = editingNoteIdRef.current;

    // Draft note — create on server for the first time.
    // Keep editingNoteId as DRAFT_NOTE_ID so the draft card stays in place;
    // store the real ID in the ref so subsequent saves use updateNote.
    if (noteId === DRAFT_NOTE_ID) {
      const newNote = await createNoteMutation.mutateAsync({
        content: noteContentRef.current,
        title: noteTitleRef.current,
      });
      editingNoteIdRef.current = newNote.id;
      return;
    }

    const snapshot = shouldSnapshot(lastSnapshotAtRef.current.get(noteId));
    await updateNoteMutation.mutateAsync({
      noteId,
      input: { content: noteContentRef.current, title: noteTitleRef.current, snapshot },
    });
    if (snapshot) {
      lastSnapshotAtRef.current.set(noteId, Date.now());
    }
    const { data: refreshed } = await refetchItem();
    if (refreshed) {
      setItem(refreshed);
      setNotes(refreshed.notes);
    }
  }, [createNoteMutation, updateNoteMutation, refetchItem]);

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

  // Extracted note handlers
  const { handleAddNote, handleSelectNote, handleDeleteNote, handleCloseNote } = useNoteHandlers({
    itemId: sessionId,
    getEditingNoteId: () => editingNoteIdRef.current,
    getRealNoteId: () => editingNoteIdRef.current,
    setEditingNoteId,
    setNoteContent,
    setNoteTitle,
    setNotes,
    flushNote,
    refetchItem,
    onItemUpdated: (refreshed) => {
      setItem(refreshed);
    },
  });

  // Extracted photo handlers
  const {
    handlePhotoUpload,
    handlePhotoDelete,
    handlePhotoSelect,
    handleTogglePhotoImportant,
    handleFileDrop,
    handleUpdateCaption,
  } = usePhotoHandlers({
    itemId: sessionId,
    canvasId: activeCanvasId ?? "",
    setPhotos,
    refetchItem,
    onItemUpdated: (updated) => {
      setItem(updated);
    },
  });

  // Sync local state from React Query data
  const prevSessionIdRef = useRef<string | null>(null);
  useEffect(() => {
    sessionIdRef.current = sessionId;
    if (queryItem) {
      setItem(queryItem);
      setTitle(queryItem.title);
      setSessionDate(queryItem.sessionDate ?? "");
      setNotes(queryItem.notes);
      setPhotos(queryItem.photos);
      // Only reset editing state when switching to a different session,
      // not on refetches (which happen after auto-save)
      if (prevSessionIdRef.current !== sessionId) {
        prevSessionIdRef.current = sessionId;
        setEditingNoteId(null);
        setNoteContent("");
        setNoteTitle("");
      }
    }
  }, [sessionId, queryItem]);

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

  async function handleToggleImportant(noteId: string, isImportant: boolean) {
    await updateNoteMutation.mutateAsync({
      noteId,
      input: { isImportant },
    });
    const { data: refreshed } = await refetchItem();
    if (refreshed) {
      setItem(refreshed);
      setNotes(refreshed.notes);
    }
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
    type: CanvasItemType,
  ): Promise<{ id: string; title: string } | null> {
    if (!activeCanvasId || !item) return null;
    try {
      const newItem = await createItemMutation.mutateAsync({
        type,
        title: mentionTitle,
        canvasX: item.canvasX + 220,
        canvasY: item.canvasY,
      });
      // Add to itemsCache so mention previews resolve instead of showing "@mention"
      const nextCache = new Map(useCanvasStore.getState().itemsCache);
      nextCache.set(newItem.id, newItem as unknown as CanvasItem);
      setItemsCache(nextCache);
      return { id: newItem.id, title: newItem.title };
    } catch {
      return null;
    }
  }

  const notePreview = useCallback(
    (content: string) => getNotePreview(content, itemsCache, 0),
    [itemsCache],
  );

  // Note history
  const { data: historyEntries = [], isLoading: historyLoading } = useNoteHistory(historyNoteId);

  async function handleRevertNote(content: string) {
    if (!historyNoteId) return;
    await updateNoteMutation.mutateAsync({
      noteId: historyNoteId,
      input: { content },
    });
    const { data: refreshed } = await refetchItem();
    if (refreshed) {
      setItem(refreshed);
      setNotes(refreshed.notes);
      if (editingNoteId === historyNoteId) {
        setNoteContent(content);
      }
    }
    setHistoryNoteId(null);
  }

  const handleMentionClick = useCallback(
    (itemId: string) => {
      setEditingItemId(itemId);
    },
    [setEditingItemId],
  );

  if (itemError) return <QueryErrorDisplay error={itemError} onRetry={refetchItem} />;
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
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", pl: 7 }}>
      {/* Header row — back + title | date */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
          borderBottom: "1px solid var(--color-surface0)",
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flex: 1 }}>
          <IconButton
            size="small"
            onClick={() => {
              flushTitle();
              flushDate();
              flushNote();
              navigate("/sessions");
            }}
            sx={{ color: "var(--color-subtext0)", flexShrink: 0 }}
          >
            <ArrowBackIcon />
          </IconButton>
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
                fontSize: FONT_SIZES.xl,
                fontWeight: 600,
                flex: 1,
                "& input": { padding: 0 },
              }}
            />
          ) : (
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                cursor: "pointer",
                color: "var(--color-text)",
                "&:hover": { color: "var(--color-subtext0)" },
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              onClick={() => setIsEditingTitle(true)}
            >
              {title}
            </Typography>
          )}
        </Box>
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
          sx={{ width: 200, flexShrink: 0 }}
        />
      </Box>

      {/* Session content */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            borderBottom: "1px solid var(--color-surface0)",
            px: 2,
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
            noteTitle={noteTitle}
            noteStatus={noteStatus}
            itemsCache={itemsCache}
            canvasId={activeCanvasId ?? ""}
            onAddNote={handleAddNote}
            onSelectNote={handleSelectNote}
            onDeleteNote={handleDeleteNote}
            onCloseNote={handleCloseNote}
            onNoteContentChange={(val) => {
              setNoteContent(val);
              markNoteDirty();
            }}
            onNoteTitleChange={(val) => {
              setNoteTitle(val);
              markNoteDirty();
            }}
            onToggleImportant={handleToggleImportant}
            onCreateMentionItem={handleCreateMentionItem}
            getNotePreview={notePreview}
            onMentionClick={handleMentionClick}
            onHistoryNote={setHistoryNoteId}
          />
        )}

        <NoteHistoryModal
          open={historyNoteId !== null}
          onClose={() => setHistoryNoteId(null)}
          entries={historyEntries}
          loading={historyLoading}
          onRevert={handleRevertNote}
        />

        {activeTab === "photos" && (
          <PhotosTab
            photos={photos}
            onUpload={handlePhotoUpload}
            onDelete={handlePhotoDelete}
            onSelect={handlePhotoSelect}
            onToggleImportant={handleTogglePhotoImportant}
            onOpenLightbox={handleOpenLightbox}
            onFileDrop={handleFileDrop}
            onUpdateCaption={handleUpdateCaption}
            columns={photoColumns}
            onColumnsChange={setPhotoColumns}
          />
        )}
      </Box>
    </Box>
  );
}
