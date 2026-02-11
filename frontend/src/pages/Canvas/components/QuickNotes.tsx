import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import StarIcon from "@mui/icons-material/Star";
import StarOutlineIcon from "@mui/icons-material/StarOutline";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  useCreateQuickNote,
  useDeleteQuickNote,
  useToggleQuickNoteImportant,
  useUpdateQuickNote,
} from "../../../hooks/mutations";
import { useQuickNotes } from "../../../hooks/queries";
import { useAutoSave } from "../../../hooks/useAutoSave";
import { useDraggable } from "../../../hooks/useDraggable";
import { useCanvasStore } from "../../../stores/canvasStore";
import { useQuickNotesStore } from "../../../stores/quickNotesStore";
import { getNotePreview } from "../../../utils/getNotePreview";
import { statusLabel } from "../../../utils/statusLabel";
import MentionEditor from "./MentionEditor";

function QuickNoteItem({
  id,
  content,
  isImportant,
  canvasId,
  isEditing,
  onStartEdit,
  onStopEdit,
}: {
  id: string;
  content: string;
  isImportant: boolean;
  canvasId: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
}) {
  const updateMutation = useUpdateQuickNote(canvasId);
  const deleteMutation = useDeleteQuickNote(canvasId);
  const toggleImportantMutation = useToggleQuickNoteImportant(canvasId);
  const itemsCache = useCanvasStore((s) => s.itemsCache);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const localContentRef = useRef(content);

  const { status: saveStatus, markDirty } = useAutoSave({
    saveFn: async () => {
      await updateMutation.mutateAsync({ id, content: localContentRef.current });
    },
  });

  const handleChange = useCallback(
    (newContent: string) => {
      localContentRef.current = newContent;
      markDirty();
    },
    [markDirty],
  );

  // Preserve line breaks: convert block/br tags to newlines before getNotePreview strips them,
  // then convert back to <br> for rendering
  const preprocessed = content.replace(/<\/p>/gi, "\n").replace(/<br\s*\/?>/gi, "\n");
  const previewHtml = getNotePreview(preprocessed, itemsCache, 120).replace(/\n/g, "<br>");

  return (
    <>
      <Box
        sx={{
          display: "flex",
          gap: 0.5,
          alignItems: "flex-start",
          bgcolor: isImportant ? "var(--color-surface1)" : "transparent",
          border: isImportant ? "1px solid var(--color-yellow)" : "1px solid transparent",
          borderRadius: 0,
          p: isImportant ? 0.5 : 0,
        }}
      >
        {isEditing ? (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <MentionEditor
              value={content}
              onChange={handleChange}
              itemsCache={itemsCache}
              canvasId={canvasId}
              containerStyle={{ flex: 1, minWidth: 0 }}
              style={{
                background: "var(--color-mantle)",
                border: "1px solid var(--color-surface1)",
                borderRadius: 0,
                padding: "4px 8px",
                color: "var(--color-text)",
                fontSize: 13,
                maxHeight: 120,
                overflow: "auto",
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: "var(--color-subtext0)",
                minHeight: "1.2em",
                display: "block",
                mt: 0.25,
              }}
            >
              {statusLabel(saveStatus) || "\u00A0"}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              minHeight: 66,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              alignItems: "center",
              py: 0.5,
              px: 1,
              fontSize: 13,
              color: "var(--color-text)",
              bgcolor: "var(--color-surface0)",
              overflow: "hidden",
              wordBreak: "break-word",
            }}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        )}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {isEditing ? (
            <Tooltip title="Close">
              <IconButton
                size="small"
                onClick={onStopEdit}
                sx={{ color: "var(--color-overlay0)", p: 0.25 }}
              >
                <CloseIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={onStartEdit}
                sx={{ color: "var(--color-overlay0)", p: 0.25 }}
              >
                <EditIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={isImportant ? "Unpin" : "Pin"}>
            <IconButton
              size="small"
              onClick={() => toggleImportantMutation.mutate(id)}
              sx={{
                color: isImportant ? "var(--color-yellow)" : "var(--color-overlay0)",
                p: 0.25,
              }}
            >
              {isImportant ? (
                <StarIcon sx={{ fontSize: 14 }} />
              ) : (
                <StarOutlineIcon sx={{ fontSize: 14 }} />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => setConfirmDeleteOpen(true)}
              sx={{ color: "var(--color-overlay0)", p: 0.25 }}
            >
              <DeleteIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>Delete Quick Note</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this quick note? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => {
              deleteMutation.mutate(id);
              setConfirmDeleteOpen(false);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function QuickNotes() {
  const isOpen = useQuickNotesStore((s) => s.isOpen);
  const position = useQuickNotesStore((s) => s.position);
  const setPosition = useQuickNotesStore((s) => s.setPosition);
  const toggle = useQuickNotesStore((s) => s.toggle);
  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);

  const { data: notes = [] } = useQuickNotes(activeCanvasId ?? undefined);
  const createMutation = useCreateQuickNote(activeCanvasId ?? "");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const handleCreate = useCallback(() => {
    createMutation.mutate(undefined, {
      onSuccess: (newNote) => {
        setEditingNoteId(newNote.id);
      },
    });
  }, [createMutation]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { handleMouseDown } = useDraggable({ position, onPositionChange: setPosition });

  // Close editor when clicking outside the editing note
  useEffect(() => {
    if (!editingNoteId) return;
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setEditingNoteId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editingNoteId]);

  if (!isOpen || !activeCanvasId) return null;

  return (
    <Paper
      ref={wrapperRef}
      elevation={8}
      sx={{
        position: "fixed",
        top: position.y,
        left: position.x,
        width: 400,
        zIndex: 100,
        bgcolor: "var(--color-chrome-bg)",
        backdropFilter: "blur(8px)",
        border: "1px solid var(--color-surface1)",
        borderRadius: 0,
        overflow: "hidden",
        maxHeight: "60vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Drag handle / title bar */}
      <Box
        onMouseDown={handleMouseDown}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.5,
          py: 0.75,
          cursor: "grab",
          borderBottom: "1px solid var(--color-surface1)",
          "&:active": { cursor: "grabbing" },
          flexShrink: 0,
        }}
      >
        <Typography variant="subtitle2" fontWeight={600}>
          Quick Notes
        </Typography>
        <Box sx={{ display: "flex", gap: 0.25 }}>
          <Tooltip title="Add note">
            <span>
              <IconButton size="small" onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <CircularProgress size={18} />
                ) : (
                  <AddIcon fontSize="small" />
                )}
              </IconButton>
            </span>
          </Tooltip>
          <IconButton size="small" onClick={toggle}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Notes list */}
      <Box sx={{ p: 1.5, overflowY: "auto", display: "flex", flexDirection: "column", gap: 0.5 }}>
        {notes.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: "var(--color-overlay0)", textAlign: "center", py: 2 }}
          >
            No quick notes yet
          </Typography>
        ) : (
          notes.map((note) => (
            <QuickNoteItem
              key={note.id}
              id={note.id}
              content={note.content}
              isImportant={note.isImportant}
              canvasId={activeCanvasId}
              isEditing={editingNoteId === note.id}
              onStartEdit={() => setEditingNoteId(note.id)}
              onStopEdit={() => setEditingNoteId(null)}
            />
          ))
        )}
      </Box>
    </Paper>
  );
}
