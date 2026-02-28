import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CanvasItem, CanvasItemType, Note, Photo } from "shared";
import NoteHistoryModal from "../../../components/NoteHistoryModal";
import {
  CANVAS_ITEM_TYPE_LABELS,
  CANVAS_ITEM_TYPES,
  DRAFT_NOTE_ID,
  SIDEBAR_WIDTH,
} from "../../../constants";
import {
  useCreateItem,
  useCreateNote,
  useDeleteItem,
  useUpdateItem,
  useUpdateNote,
} from "../../../hooks/mutations";
import { useItem, useNoteHistory } from "../../../hooks/queries";
import { useAutoSave } from "../../../hooks/useAutoSave";
import { useNoteHandlers } from "../../../hooks/useNoteHandlers";
import { usePhotoHandlers } from "../../../hooks/usePhotoHandlers";
import { MODAL_ID, useModalStore } from "../../../modals";
import NotesTab from "../../../sharedComponents/NotesTab";
import PhotosTab from "../../../sharedComponents/PhotosTab";
import { useCanvasStore } from "../../../stores/canvasStore";
import { FONT_SIZES } from "../../../styles/styleConsts";
import { getNotePreview } from "../../../utils/getNotePreview";
import { formatItemMarkdown, printItemHtml } from "../../../utils/noteExport";
import { shouldSnapshot } from "../../../utils/shouldSnapshot";
import PanelConnectionsTab from "./PanelConnectionsTab";
import PanelHeader from "./PanelHeader";
import PanelTagsSection from "./PanelTagsSection";

interface CanvasItemPanelProps {
  itemId: string;
  onClose: () => void;
  onSaved?: (item: CanvasItem) => void;
  onDeleted?: (itemId: string) => void;
  onNavigate?: (itemId: string) => void;
  itemsCache?: Map<string, CanvasItem>;
}

export default function CanvasItemPanel({
  itemId,
  onClose,
  onSaved,
  onDeleted,
  onNavigate,
  itemsCache: itemsCacheProp,
}: CanvasItemPanelProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const panelTab = useCanvasStore((s) => s.panelTab);
  const setPanelTab = useCanvasStore((s) => s.setPanelTab);
  const highlightNoteId = useCanvasStore((s) => s.highlightNoteId);
  const setHighlightNoteId = useCanvasStore((s) => s.setHighlightNoteId);
  const setEditingItemId = useCanvasStore((s) => s.setEditingItemId);
  const storeItemsCache = useCanvasStore((s) => s.itemsCache);
  const itemsCache = itemsCacheProp ?? storeItemsCache;

  const handleSaved = useMemo(() => onSaved ?? (() => {}), [onSaved]);
  const handleDeleted = useMemo(
    () => onDeleted ?? (() => setEditingItemId(null)),
    [onDeleted, setEditingItemId],
  );
  const handleNavigate = useMemo(
    () => onNavigate ?? ((targetId: string) => setEditingItemId(targetId)),
    [onNavigate, setEditingItemId],
  );

  // Fetch item via React Query
  const { data: queryItem, refetch: refetchItem, error: itemError } = useItem(itemId);

  // Local editable state
  const [item, setItem] = useState<CanvasItem | null>(null);
  const [title, setTitle] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [summary, setSummary] = useState("");
  const [sessionDate, setSessionDate] = useState("");

  // Note history state
  const [historyNoteId, setHistoryNoteId] = useState<string | null>(null);
  const lastSnapshotAtRef = useRef<Map<string, number>>(new Map());

  // Modal store
  const openModal = useModalStore((s) => s.openModal);

  // Mutation hooks
  const updateItemMutation = useUpdateItem(activeCanvasId ?? "");
  const deleteItemMutation = useDeleteItem(activeCanvasId ?? "");
  const createNoteMutation = useCreateNote(itemId);
  const updateNoteMutation = useUpdateNote(itemId);
  const createItemMutation = useCreateItem(activeCanvasId ?? "");

  const titleRef = useRef(title);
  titleRef.current = title;
  const summaryRef = useRef(summary);
  summaryRef.current = summary;
  const sessionDateRef = useRef(sessionDate);
  sessionDateRef.current = sessionDate;
  const noteContentRef = useRef(noteContent);
  noteContentRef.current = noteContent;
  const noteTitleRef = useRef(noteTitle);
  noteTitleRef.current = noteTitle;
  const editingNoteIdRef = useRef(editingNoteId);
  editingNoteIdRef.current = editingNoteId;
  const itemIdRef = useRef(itemId);

  // Save functions
  const saveTitleFn = useCallback(async () => {
    await updateItemMutation.mutateAsync({
      id: itemIdRef.current,
      input: { title: titleRef.current },
    });
    const { data: refreshed } = await refetchItem();
    if (refreshed) handleSaved(refreshed);
  }, [handleSaved, updateItemMutation, refetchItem]);

  const saveSummaryFn = useCallback(async () => {
    await updateItemMutation.mutateAsync({
      id: itemIdRef.current,
      input: { summary: summaryRef.current },
    });
    const { data: refreshed } = await refetchItem();
    if (refreshed) handleSaved(refreshed);
  }, [handleSaved, updateItemMutation, refetchItem]);

  const saveDateFn = useCallback(async () => {
    await updateItemMutation.mutateAsync({
      id: itemIdRef.current,
      input: { sessionDate: sessionDateRef.current },
    });
    const { data: refreshed } = await refetchItem();
    if (refreshed) handleSaved(refreshed);
  }, [handleSaved, updateItemMutation, refetchItem]);

  const saveNoteFn = useCallback(async () => {
    if (!editingNoteIdRef.current) return;
    const noteId = editingNoteIdRef.current;

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
      handleSaved(refreshed);
    }
  }, [handleSaved, createNoteMutation, updateNoteMutation, refetchItem]);

  const {
    status: titleStatus,
    markDirty: markTitleDirty,
    flush: flushTitle,
  } = useAutoSave({ saveFn: saveTitleFn });
  const {
    status: summaryStatus,
    markDirty: markSummaryDirty,
    flush: flushSummary,
  } = useAutoSave({ saveFn: saveSummaryFn });
  const { markDirty: markDateDirty, flush: flushDate } = useAutoSave({ saveFn: saveDateFn });
  const { markDirty: markNoteDirty, flush: flushNote } = useAutoSave({ saveFn: saveNoteFn });

  // titleStatus and summaryStatus are used implicitly by saving on blur/Enter
  void titleStatus;
  void summaryStatus;

  useEffect(() => {
    return () => {
      flushTitle();
      flushSummary();
      flushDate();
      flushNote();
    };
  }, [flushTitle, flushSummary, flushDate, flushNote]);

  // Extracted note handlers
  const { handleAddNote, handleSelectNote, handleDeleteNote, handleCloseNote } = useNoteHandlers({
    itemId,
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
      handleSaved(refreshed);
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
    itemId,
    canvasId: activeCanvasId ?? "",
    setPhotos,
    refetchItem,
    onItemUpdated: (updated) => {
      setItem(updated);
      handleSaved(updated);
    },
  });

  // Sync local state from React Query data
  const prevItemIdRef = useRef<string | null>(null);
  useEffect(() => {
    itemIdRef.current = itemId;
    if (queryItem) {
      setItem(queryItem);
      setTitle(queryItem.title);
      setSummary(queryItem.summary);
      setSessionDate(queryItem.sessionDate ?? "");
      // Skip notes sync while editing a draft — the draft card handles display,
      // and the server-sorted list would cause a duplicate.
      if (editingNoteId !== DRAFT_NOTE_ID) {
        setNotes(queryItem.notes);
      }
      setPhotos(queryItem.photos);
      // Only reset editing state when switching to a different item,
      // not on refetches (which happen after auto-save)
      if (prevItemIdRef.current !== itemId) {
        prevItemIdRef.current = itemId;
        setEditingNoteId(null);
        setNoteContent("");
        setNoteTitle("");
      }
    }
  }, [itemId, queryItem, editingNoteId]);

  async function handleDeleteItem() {
    await deleteItemMutation.mutateAsync(itemId);
    handleDeleted(itemId);
  }

  function handleOpenLightbox(index: number) {
    openModal({ id: MODAL_ID.LIGHTBOX, photos, initialIndex: index });
  }

  function handleOpenDeleteModal() {
    openModal({
      id: MODAL_ID.DELETE_ITEM,
      itemId,
      itemTitle: title,
      onConfirm: handleDeleteItem,
    });
  }

  function handleDownloadPdf() {
    if (!item) return;
    printItemHtml(item, notes, photos, itemsCache);
  }

  function handleDownloadMarkdown() {
    if (!item) return;
    const markdown = formatItemMarkdown(item, notes, itemsCache);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.title || "untitled"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

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
      handleSaved(newItem);
      return { id: newItem.id, title: newItem.title };
    } catch {
      return null;
    }
  }

  const notePreview = useCallback(
    (content: string) => getNotePreview(content, itemsCache, 0),
    [itemsCache],
  );

  async function handleToggleImportant(noteId: string, isImportant: boolean) {
    await updateNoteMutation.mutateAsync({ noteId, input: { isImportant } });
    const { data: refreshed } = await refetchItem();
    if (refreshed) {
      setItem(refreshed);
      setNotes(refreshed.notes);
      handleSaved(refreshed);
    }
  }

  // Note history
  const { data: historyEntries = [], isLoading: historyLoading } = useNoteHistory(historyNoteId);

  async function handleRevertNote(content: string) {
    if (!historyNoteId) return;
    await updateNoteMutation.mutateAsync({ noteId: historyNoteId, input: { content } });
    const { data: refreshed } = await refetchItem();
    if (refreshed) {
      setItem(refreshed);
      setNotes(refreshed.notes);
      handleSaved(refreshed);
      if (editingNoteId === historyNoteId) {
        setNoteContent(content);
      }
    }
    setHistoryNoteId(null);
  }

  function handleItemUpdated(updated: CanvasItem) {
    setItem(updated);
    handleSaved(updated);
  }

  const typeInfo = item ? CANVAS_ITEM_TYPES.find((t) => t.value === item.type) : null;
  const typeBgColor = item ? theme.palette.canvasItemTypes[item.type].light : "";

  if (itemError || !item) {
    return (
      <Box
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          borderLeft: "1px solid var(--color-surface0)",
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          pt: 4,
        }}
      >
        {itemError ? (
          <>
            <Typography sx={{ color: "var(--color-subtext0)" }}>Item not found</Typography>
            <Button variant="outlined" size="small" onClick={onClose}>
              Close
            </Button>
          </>
        ) : (
          <Typography sx={{ color: "var(--color-subtext0)" }}>Loading...</Typography>
        )}
      </Box>
    );
  }

  return (
    <Box
      data-tour="item-panel"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        borderLeft: "1px solid var(--color-surface0)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <PanelHeader
        item={item}
        title={title}
        typeBgColor={typeBgColor}
        typeLabel={typeInfo?.label ?? item.type}
        onTitleChange={(value) => {
          setTitle(value);
          markTitleDirty();
        }}
        onClose={onClose}
        onDownloadPdf={handleDownloadPdf}
        onDownloadMarkdown={handleDownloadMarkdown}
        onDeleteItem={handleOpenDeleteModal}
      />

      <PanelTagsSection item={item} itemId={itemId} onItemUpdated={handleItemUpdated} />

      {/* Summary */}
      <Box sx={{ px: 2, py: 1, borderBottom: "1px solid var(--color-surface0)" }}>
        <TextField
          label="Summary"
          size="small"
          fullWidth
          multiline
          minRows={1}
          maxRows={3}
          value={summary}
          onChange={(e) => {
            setSummary(e.target.value);
            markSummaryDirty();
          }}
          variant="standard"
          InputProps={{ disableUnderline: true }}
          InputLabelProps={{ shrink: true }}
          placeholder="Brief description..."
          sx={{
            "& .MuiInputBase-root": {
              fontSize: FONT_SIZES.sm,
              color: "var(--color-subtext0)",
            },
          }}
        />
      </Box>

      {/* Tabs */}
      <Tabs
        value={panelTab}
        onChange={(_, newValue) => setPanelTab(newValue)}
        sx={{ borderBottom: "1px solid var(--color-surface0)", px: 2 }}
      >
        <Tab label="Notes" value="notes" />
        <Tab label="Photos" value="photos" />
        <Tab label="Connections" value="connections" />
        <Tab label={CANVAS_ITEM_TYPE_LABELS[item.type]} value="details" />
      </Tabs>

      {/* Tab Content */}
      {panelTab === "notes" && (
        <NotesTab
          notes={notes}
          editingNoteId={editingNoteId}
          noteContent={noteContent}
          noteTitle={noteTitle}
          itemsCache={itemsCache}
          canvasId={activeCanvasId ?? ""}
          highlightNoteId={highlightNoteId}
          onHighlightComplete={() => setHighlightNoteId(null)}
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
          onMentionClick={handleNavigate}
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

      {panelTab === "photos" && (
        <PhotosTab
          photos={photos}
          onUpload={handlePhotoUpload}
          onDelete={handlePhotoDelete}
          onSelect={handlePhotoSelect}
          onToggleImportant={handleTogglePhotoImportant}
          onOpenLightbox={handleOpenLightbox}
          onFileDrop={handleFileDrop}
          onUpdateCaption={handleUpdateCaption}
        />
      )}

      {panelTab === "connections" && (
        <PanelConnectionsTab item={item} onNavigate={handleNavigate} />
      )}

      {panelTab === "details" && (
        <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
          {item.type === "session" ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Session Date"
                type="date"
                size="small"
                fullWidth
                value={sessionDate}
                onChange={(e) => {
                  setSessionDate(e.target.value);
                  markDateDirty();
                }}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<OpenInNewIcon />}
                onClick={() => {
                  flushTitle();
                  flushSummary();
                  flushDate();
                  flushNote();
                  navigate(`/sessions/${itemId}`);
                }}
                sx={{ textTransform: "none", alignSelf: "flex-start" }}
              >
                Open in Session Viewer
              </Button>
            </Box>
          ) : (
            <Typography
              variant="body2"
              sx={{ color: "var(--color-overlay0)", textAlign: "center", py: 3 }}
            >
              No type-specific metadata
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
