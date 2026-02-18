import AddIcon from "@mui/icons-material/Add";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import { useTheme } from "@mui/material/styles";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CanvasItem, Note, Photo, Tag } from "shared";
import NoteHistoryModal from "../../../components/NoteHistoryModal";
import { CANVAS_ITEM_TYPE_LABELS, CANVAS_ITEM_TYPES, SIDEBAR_WIDTH } from "../../../constants";
import {
  useAddTagToItem,
  useCreateItem,
  useCreateNote,
  useDeleteItem,
  useDeleteNote,
  useDeletePhoto,
  useRemoveTagFromItem,
  useSelectPhoto,
  useTogglePhotoImportant,
  useUpdateItem,
  useUpdateNote,
  useUpdatePhotoCaption,
  useUploadPhoto,
} from "../../../hooks/mutations";
import { useItem, useNoteHistory } from "../../../hooks/queries";
import { useAutoSave } from "../../../hooks/useAutoSave";
import { MODAL_ID, useModalStore } from "../../../modals";
import NotesTab from "../../../sharedComponents/NotesTab";
import PhotosTab from "../../../sharedComponents/PhotosTab";
import { TagPill } from "../../../sharedComponents/TagPill";
import { useAppStore } from "../../../stores/appStore";
import { useCanvasStore } from "../../../stores/canvasStore";
import { useTagStore } from "../../../stores/tagStore";
import { getNotePreview } from "../../../utils/getNotePreview";
import { formatItemMarkdown } from "../../../utils/noteExport";
import { shouldSnapshot } from "../../../utils/shouldSnapshot";
import { statusLabel } from "../../../utils/statusLabel";
import PanelConnectionsTab from "./PanelConnectionsTab";
import PanelHeader from "./PanelHeader";

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
  const navigate = useNavigate();
  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const panelTab = useCanvasStore((s) => s.panelTab);
  const setPanelTab = useCanvasStore((s) => s.setPanelTab);
  const highlightNoteId = useCanvasStore((s) => s.highlightNoteId);
  const setHighlightNoteId = useCanvasStore((s) => s.setHighlightNoteId);
  const setShowSettings = useCanvasStore((s) => s.setShowSettings);
  const tagsById = useTagStore((s) => s.tags);
  const allTags = useMemo(() => Object.values(tagsById), [tagsById]);
  const showToast = useAppStore((s) => s.showToast);

  // Fetch item via React Query
  const { data: queryItem, refetch: refetchItem } = useItem(itemId);

  // Local editable state
  const [item, setItem] = useState<CanvasItem | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);

  // Note history state
  const [historyNoteId, setHistoryNoteId] = useState<string | null>(null);
  const lastSnapshotAtRef = useRef<Map<string, number>>(new Map());

  // Summary state
  const [summary, setSummary] = useState("");

  // Details tab state
  const [sessionDate, setSessionDate] = useState("");

  // Modal store
  const openModal = useModalStore((s) => s.openModal);

  // Mutation hooks
  const updateItemMutation = useUpdateItem(activeCanvasId ?? "");
  const deleteItemMutation = useDeleteItem(activeCanvasId ?? "");
  const createNoteMutation = useCreateNote(itemId);
  const updateNoteMutation = useUpdateNote(itemId);
  const deleteNoteMutation = useDeleteNote(itemId);
  const uploadPhotoMutation = useUploadPhoto(itemId, activeCanvasId ?? "");
  const deletePhotoMutation = useDeletePhoto(itemId, activeCanvasId ?? "");
  const selectPhotoMutation = useSelectPhoto(itemId, activeCanvasId ?? "");
  const togglePhotoImportantMutation = useTogglePhotoImportant(itemId, activeCanvasId ?? "");
  const updatePhotoCaptionMutation = useUpdatePhotoCaption(itemId, activeCanvasId ?? "");
  const createItemMutation = useCreateItem(activeCanvasId ?? "");
  const addTagMutation = useAddTagToItem(itemId, activeCanvasId ?? "");
  const removeTagMutation = useRemoveTagFromItem(itemId, activeCanvasId ?? "");

  const titleRef = useRef(title);
  titleRef.current = title;
  const summaryRef = useRef(summary);
  summaryRef.current = summary;
  const sessionDateRef = useRef(sessionDate);
  sessionDateRef.current = sessionDate;
  const noteContentRef = useRef(noteContent);
  noteContentRef.current = noteContent;
  const editingNoteIdRef = useRef(editingNoteId);
  editingNoteIdRef.current = editingNoteId;
  const itemIdRef = useRef(itemId);

  // Save function for title
  const saveTitleFn = useCallback(async () => {
    await updateItemMutation.mutateAsync({
      id: itemIdRef.current,
      input: { title: titleRef.current },
    });
    const { data: refreshed } = await refetchItem();
    if (refreshed) onSaved(refreshed);
  }, [onSaved, updateItemMutation, refetchItem]);

  // Save function for summary
  const saveSummaryFn = useCallback(async () => {
    await updateItemMutation.mutateAsync({
      id: itemIdRef.current,
      input: { summary: summaryRef.current },
    });
    const { data: refreshed } = await refetchItem();
    if (refreshed) onSaved(refreshed);
  }, [onSaved, updateItemMutation, refetchItem]);

  // Save function for session date
  const saveDateFn = useCallback(async () => {
    await updateItemMutation.mutateAsync({
      id: itemIdRef.current,
      input: { sessionDate: sessionDateRef.current },
    });
    const { data: refreshed } = await refetchItem();
    if (refreshed) onSaved(refreshed);
  }, [onSaved, updateItemMutation, refetchItem]);

  // Save function for note content (with snapshot throttling)
  const saveNoteFn = useCallback(async () => {
    if (!editingNoteIdRef.current) return;
    const noteId = editingNoteIdRef.current;
    const snapshot = shouldSnapshot(lastSnapshotAtRef.current.get(noteId));
    if (snapshot) {
      lastSnapshotAtRef.current.set(noteId, Date.now());
    }
    await updateNoteMutation.mutateAsync({
      noteId,
      input: { content: noteContentRef.current, snapshot },
    });
    const { data: refreshed } = await refetchItem();
    if (refreshed) {
      setItem(refreshed);
      setNotes(refreshed.notes);
      onSaved(refreshed);
    }
  }, [onSaved, updateNoteMutation, refetchItem]);

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
  const {
    status: dateStatus,
    markDirty: markDateDirty,
    flush: flushDate,
  } = useAutoSave({ saveFn: saveDateFn });
  const {
    status: noteStatus,
    markDirty: markNoteDirty,
    flush: flushNote,
  } = useAutoSave({ saveFn: saveNoteFn });

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

  // Sync local state from React Query data
  const prevItemIdRef = useRef<string | null>(null);
  useEffect(() => {
    itemIdRef.current = itemId;
    if (queryItem) {
      setItem(queryItem);
      setTitle(queryItem.title);
      setSummary(queryItem.summary);
      setSessionDate(queryItem.sessionDate ?? "");
      setNotes(queryItem.notes);
      setPhotos(queryItem.photos);
      // Only reset editing state when switching to a different item,
      // not on refetches (which happen after auto-save)
      if (prevItemIdRef.current !== itemId) {
        prevItemIdRef.current = itemId;
        setEditingNoteId(null);
        setNoteContent("");
      }
    }
  }, [itemId, queryItem]);

  async function handleDeleteItem() {
    await deleteItemMutation.mutateAsync(itemId);
    onDeleted(itemId);
  }

  async function handleFileUpload(file: File) {
    await uploadPhotoMutation.mutateAsync(file);
    const { data: updated } = await refetchItem();
    if (updated) {
      setItem(updated);
      setPhotos(updated.photos);
      onSaved(updated);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFileUpload(file);
  }

  async function handlePhotoDelete(photoId: string) {
    await deletePhotoMutation.mutateAsync(photoId);
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    const { data: updated } = await refetchItem();
    if (updated) {
      setItem(updated);
      onSaved(updated);
    }
  }

  async function handlePhotoSelect(photoId: string) {
    await selectPhotoMutation.mutateAsync(photoId);
    const { data: updated } = await refetchItem();
    if (updated) {
      setItem(updated);
      setPhotos(updated.photos);
      onSaved(updated);
    }
  }

  async function handleTogglePhotoImportant(photoId: string) {
    await togglePhotoImportantMutation.mutateAsync(photoId);
    const { data: updated } = await refetchItem();
    if (updated) {
      setItem(updated);
      setPhotos(updated.photos);
      onSaved(updated);
    }
  }

  async function handleUpdateCaption(photoId: string, caption: string) {
    await updatePhotoCaptionMutation.mutateAsync({ photoId, caption });
    const { data: updated } = await refetchItem();
    if (updated) {
      setItem(updated);
      setPhotos(updated.photos);
      onSaved(updated);
    }
  }

  function handleOpenLightbox(index: number) {
    openModal({
      id: MODAL_ID.LIGHTBOX,
      photos,
      initialIndex: index,
    });
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

    const connections = [
      ...(item.linksTo?.map((l) => ({ ...l, direction: "outgoing" as const })) ?? []),
      ...(item.linkedFrom?.map((l) => ({ ...l, direction: "incoming" as const })) ?? []),
    ];

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${item.title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #333; }
          h1 { margin-bottom: 8px; }
          .type-badge { display: inline-block; background: #666; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 24px; }
          h2 { border-bottom: 2px solid #eee; padding-bottom: 8px; margin-top: 32px; }
          .note { background: #f5f5f5; padding: 16px; border-radius: 8px; margin-bottom: 16px; white-space: pre-wrap; }
          .note-date { font-size: 12px; color: #888; margin-top: 8px; }
          .photos { display: flex; flex-wrap: wrap; gap: 12px; }
          .photo { width: 200px; height: 200px; object-fit: cover; border-radius: 8px; }
          .connection { padding: 8px 0; border-bottom: 1px solid #eee; }
          .connection:last-child { border-bottom: none; }
          .direction { color: #888; font-size: 14px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>${item.title}</h1>
        <span class="type-badge">${item.type}</span>

        <h2>Notes (${notes.length})</h2>
        ${
          notes.length === 0
            ? '<p style="color: #888;">No notes</p>'
            : notes
                .map(
                  (note) => `
          <div class="note">
            ${note.content.replace(/<[^>]*>/g, "").replace(/@\{([^}]+)\}/g, (_, id) => {
              const linked = itemsCache.get(id);
              return linked ? `@${linked.title}` : "@mention";
            })}
            <div class="note-date">Last edited: ${new Date(note.updatedAt).toLocaleDateString()}</div>
          </div>
        `,
                )
                .join("")
        }

        <h2>Photos (${photos.length})</h2>
        ${photos.length === 0 ? '<p style="color: #888;">No photos</p>' : `<div class="photos">${photos.map((photo) => `<img class="photo" src="${photo.url}" alt="${photo.originalName}" />`).join("")}</div>`}

        <h2>Connections (${connections.length})</h2>
        ${
          connections.length === 0
            ? '<p style="color: #888;">No connections</p>'
            : connections
                .map(
                  (c) => `
          <div class="connection">
            <span class="direction">${c.direction === "outgoing" ? "\u2192" : "\u2190"}</span>
            <strong>${c.title}</strong>
            <span style="color: #888; font-size: 12px; margin-left: 8px;">${c.type}</span>
          </div>
        `,
                )
                .join("")
        }
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
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

  async function handleAddNote() {
    const newNote = await createNoteMutation.mutateAsync({ content: "" });
    const { data: refreshed } = await refetchItem();
    if (refreshed) {
      setItem(refreshed);
      setNotes(refreshed.notes);
      onSaved(refreshed);
    }
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
    await deleteNoteMutation.mutateAsync(noteId);
    const { data: refreshed } = await refetchItem();
    if (refreshed) {
      setItem(refreshed);
      setNotes(refreshed.notes);
      onSaved(refreshed);
    }
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

  async function handleCreateMentionItem(
    mentionTitle: string,
  ): Promise<{ id: string; title: string } | null> {
    if (!activeCanvasId || !item) return null;
    try {
      const newItem = await createItemMutation.mutateAsync({
        type: "person",
        title: mentionTitle,
        canvasX: item.canvasX + 220,
        canvasY: item.canvasY,
      });
      onSaved(newItem);
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
    await updateNoteMutation.mutateAsync({
      noteId,
      input: { isImportant },
    });
    const { data: refreshed } = await refetchItem();
    if (refreshed) {
      setItem(refreshed);
      setNotes(refreshed.notes);
      onSaved(refreshed);
    }
  }

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
      onSaved(refreshed);
      // If the reverted note is currently being edited, refresh editor content
      if (editingNoteId === historyNoteId) {
        setNoteContent(content);
      }
    }
    setHistoryNoteId(null);
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    markTitleDirty();
  }

  // Tags
  const assignedTagIds = useMemo(() => new Set(item?.tags.map((t) => t.id) ?? []), [item?.tags]);
  const availableTags = useMemo(
    () => allTags.filter((t) => !assignedTagIds.has(t.id)),
    [allTags, assignedTagIds],
  );

  async function handleAddTag(tag: Tag) {
    if (!item) return;
    try {
      await addTagMutation.mutateAsync(tag.id);
      const updated = { ...item, tags: [...item.tags, tag] };
      setItem(updated);
      onSaved(updated);
    } catch {
      showToast("Failed to add tag");
    }
  }

  async function handleRemoveTag(tagId: string) {
    if (!item) return;
    try {
      await removeTagMutation.mutateAsync(tagId);
      const updated = { ...item, tags: item.tags.filter((t) => t.id !== tagId) };
      setItem(updated);
      onSaved(updated);
    } catch {
      showToast("Failed to remove tag");
    }
  }

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
      slotProps={{ paper: { "data-tour": "item-panel" } as Record<string, string> }}
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
      <PanelHeader
        item={item}
        title={title}
        typeBgColor={typeBgColor}
        typeLabel={typeInfo?.label ?? item.type}
        onTitleChange={handleTitleChange}
        onClose={onClose}
        onDownloadPdf={handleDownloadPdf}
        onDownloadMarkdown={handleDownloadMarkdown}
        onDeleteItem={handleOpenDeleteModal}
      />

      {/* Tags */}
      <Box sx={{ px: 2, py: 1, borderBottom: "1px solid var(--color-surface0)" }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.5 }}>
          {item.tags.map((tag) => (
            <TagPill key={tag.id} tag={tag} onDelete={() => handleRemoveTag(tag.id)} />
          ))}
          {availableTags.length > 0 && (
            <Autocomplete
              size="small"
              options={availableTags}
              getOptionLabel={(opt) => opt.name}
              onChange={(_e, tag) => {
                if (tag) handleAddTag(tag);
              }}
              value={null}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <TagPill tag={option} />
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Add tag"
                  variant="standard"
                  InputProps={{
                    ...params.InputProps,
                    disableUnderline: true,
                    startAdornment: (
                      <AddIcon sx={{ fontSize: 16, color: "var(--color-overlay0)" }} />
                    ),
                  }}
                />
              )}
              slotProps={{
                paper: {
                  sx: {
                    "& .MuiAutocomplete-option": {
                      px: 1,
                      py: 0.5,
                    },
                  },
                },
              }}
              sx={{
                minWidth: 120,
                "& .MuiInputBase-root": {
                  py: 0,
                  fontSize: 13,
                },
              }}
              fullWidth
              blurOnSelect
              clearOnBlur
            />
          )}
          <Box
            onClick={() => setShowSettings(true)}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              height: 26,
              px: 1,
              borderRadius: "4px",
              border: "1px dashed var(--color-overlay0)",
              color: "var(--color-overlay0)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              "&:hover": {
                borderColor: "var(--color-text)",
                color: "var(--color-text)",
              },
            }}
          >
            <AddIcon sx={{ fontSize: 16 }} />
            New
          </Box>
        </Box>
      </Box>

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
              fontSize: 13,
              color: "var(--color-subtext0)",
            },
          }}
        />
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
        <Tab label={CANVAS_ITEM_TYPE_LABELS[item.type]} value="details" />
      </Tabs>

      {/* Tab Content */}
      {panelTab === "notes" && (
        <NotesTab
          notes={notes}
          editingNoteId={editingNoteId}
          noteContent={noteContent}
          noteStatus={noteStatus}
          itemsCache={itemsCache}
          canvasId={activeCanvasId ?? ""}
          highlightNoteId={highlightNoteId}
          onHighlightComplete={() => setHighlightNoteId(null)}
          onAddNote={handleAddNote}
          onSelectNote={handleSelectNote}
          onDeleteNote={handleDeleteNote}
          onBackToList={handleBackToNoteList}
          onNoteContentChange={(val) => {
            setNoteContent(val);
            markNoteDirty();
          }}
          onToggleImportant={handleToggleImportant}
          onCreateMentionItem={handleCreateMentionItem}
          getNotePreview={notePreview}
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
          onFileDrop={handleFileUpload}
          onUpdateCaption={handleUpdateCaption}
        />
      )}

      {panelTab === "connections" && <PanelConnectionsTab item={item} onNavigate={onNavigate} />}

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
              <Typography variant="caption" sx={{ color: "var(--color-subtext0)" }}>
                {statusLabel(dateStatus)}
              </Typography>
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
    </Drawer>
  );
}
