import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import HistoryIcon from "@mui/icons-material/History";
import StarIcon from "@mui/icons-material/Star";
import StarOutlineIcon from "@mui/icons-material/StarOutline";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import List from "@mui/material/List";
import { keyframes } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";
import type { CanvasItem, CanvasItemType, Note } from "shared";
import type { SaveStatus } from "../hooks/useAutoSave";
import MentionEditor from "../pages/Canvas/components/MentionEditor";
import { FONT_SIZES } from "../styles/styleConsts";
import { statusLabel } from "../utils/statusLabel";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";
import LinkTooltip from "./LinkTooltip";

const flashNote = keyframes`
  0%, 100% { border-color: var(--color-surface1); background-color: var(--color-surface0); }
  25%, 75% { border-color: var(--color-blue); background-color: color-mix(in srgb, var(--color-blue) 15%, var(--color-surface0)); }
`;

interface NotesTabProps {
  notes: Note[];
  editingNoteId: string | null;
  noteContent: string;
  noteTitle: string;
  noteStatus: SaveStatus;
  itemsCache: Map<string, CanvasItem>;
  canvasId: string;
  highlightNoteId?: string | null;
  onHighlightComplete?: () => void;
  onAddNote: () => void;
  onSelectNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  onBackToList: () => void;
  onNoteContentChange: (value: string) => void;
  onNoteTitleChange: (value: string) => void;
  onToggleImportant: (noteId: string, isImportant: boolean) => void;
  onCreateMentionItem: (
    title: string,
    type: CanvasItemType,
  ) => Promise<{ id: string; title: string } | null>;
  getNotePreview: (content: string) => string;
  onMentionClick?: (itemId: string) => void;
  onHistoryNote?: (noteId: string) => void;
}

export default function NotesTab({
  notes,
  editingNoteId,
  noteContent,
  noteTitle,
  noteStatus,
  itemsCache,
  canvasId,
  highlightNoteId,
  onHighlightComplete,
  onAddNote,
  onSelectNote,
  onDeleteNote,
  onBackToList,
  onNoteContentChange,
  onNoteTitleChange,
  onToggleImportant,
  onCreateMentionItem,
  getNotePreview,
  onMentionClick,
  onHistoryNote,
}: NotesTabProps) {
  const notesListRef = useRef<HTMLDivElement>(null);
  const noteRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [flashingNoteId, setFlashingNoteId] = useState<string | null>(null);
  const [expandedNoteIds, setExpandedNoteIds] = useState<Set<string>>(new Set());
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

  const toggleExpanded = (noteId: string) => {
    setExpandedNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!highlightNoteId || notes.length === 0) return;

    // Small delay so the DOM has rendered the note elements
    const timer = setTimeout(() => {
      const el = noteRefs.current.get(highlightNoteId);
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      setFlashingNoteId(highlightNoteId);
      onHighlightComplete?.();
    }, 100);

    return () => clearTimeout(timer);
  }, [highlightNoteId, notes, onHighlightComplete]);

  // Clear flash after animation completes
  useEffect(() => {
    if (!flashingNoteId) return;
    const timer = setTimeout(() => setFlashingNoteId(null), 1200);
    return () => clearTimeout(timer);
  }, [flashingNoteId]);

  if (editingNoteId) {
    return (
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", p: 2, overflow: "hidden" }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ArrowBackIcon />}
            fullWidth
            onClick={onBackToList}
            sx={{ alignSelf: "flex-start" }}
          >
            Back to Notes
          </Button>
        </Box>
        <Typography
          variant="caption"
          sx={{ color: "var(--color-subtext0)", mb: 1, minHeight: "1.2em" }}
        >
          {statusLabel(noteStatus) || "\u00A0"}
        </Typography>
        <InputBase
          placeholder="Title (optional)"
          value={noteTitle}
          onChange={(e) => onNoteTitleChange(e.target.value)}
          sx={{
            mb: 1,
            px: 1,
            py: 0.5,
            fontSize: FONT_SIZES.md,
            fontWeight: 600,
            background: "var(--color-mantle)",
            border: "1px solid var(--color-surface1)",
            color: "var(--color-text)",
          }}
          fullWidth
        />
        <MentionEditor
          value={noteContent}
          onChange={onNoteContentChange}
          itemsCache={itemsCache}
          canvasId={canvasId}
          onCreate={onCreateMentionItem}
          onMentionClick={onMentionClick}
          containerStyle={{ flex: 1, minHeight: 0 }}
          style={{
            background: "var(--color-mantle)",
            border: "1px solid var(--color-surface1)",
            borderRadius: 0,
            padding: "8px 10px",
            color: "var(--color-text)",
            fontSize: FONT_SIZES.md,
            overflow: "auto",
          }}
        />
        <Box sx={{ mt: 1.5, flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => setDeleteNoteId(editingNoteId)}
          >
            Delete Note
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", p: 2, overflow: "hidden" }}>
      <Button
        variant="outlined"
        size="small"
        startIcon={<AddIcon />}
        fullWidth
        onClick={onAddNote}
        sx={{ mb: 2, alignSelf: "flex-start" }}
      >
        Add Note
      </Button>
      <Box
        ref={notesListRef}
        sx={{ flex: 1, overflowY: "auto" }}
        onClickCapture={(e) => {
          const target = (e.target as HTMLElement).closest(".mention-link") as HTMLElement | null;
          if (target && onMentionClick) {
            e.stopPropagation();
            const itemId = target.dataset.itemId;
            if (itemId) onMentionClick(itemId);
          }
        }}
      >
        <LinkTooltip containerRef={notesListRef} />
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
              <Box
                key={note.id}
                ref={(el: HTMLElement | null) => {
                  if (el) {
                    noteRefs.current.set(note.id, el);
                  } else {
                    noteRefs.current.delete(note.id);
                  }
                }}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  mb: 1,
                  border: note.isImportant
                    ? "1px solid var(--color-yellow)"
                    : "1px solid var(--color-surface1)",
                  ...(flashingNoteId === note.id && {
                    animation: `${flashNote} 0.6s ease-in-out 2`,
                  }),
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", px: 0.5 }}>
                  {note.title && (
                    <Typography
                      variant="body2"
                      sx={{
                        flex: 1,
                        fontWeight: 600,
                        wordBreak: "break-word",
                        py: 0.5,
                        px: 0.5,
                      }}
                    >
                      {note.title}
                    </Typography>
                  )}
                  {!note.title && <Box sx={{ flex: 1 }} />}
                  <Box sx={{ display: "flex", flexShrink: 0 }}>
                    <Tooltip title={expandedNoteIds.has(note.id) ? "Collapse" : "Expand"}>
                      <IconButton
                        size="small"
                        onClick={() => toggleExpanded(note.id)}
                        sx={{ color: "var(--color-overlay0)", p: 0.25 }}
                      >
                        {expandedNoteIds.has(note.id) ? (
                          <UnfoldLessIcon sx={{ fontSize: FONT_SIZES.md }} />
                        ) : (
                          <UnfoldMoreIcon sx={{ fontSize: FONT_SIZES.md }} />
                        )}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => onSelectNote(note)}
                        sx={{ color: "var(--color-overlay0)", p: 0.25 }}
                      >
                        <EditIcon sx={{ fontSize: FONT_SIZES.md }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={note.isImportant ? "Unpin" : "Pin"}>
                      <IconButton
                        size="small"
                        onClick={() => onToggleImportant(note.id, !note.isImportant)}
                        sx={{
                          color: note.isImportant ? "var(--color-yellow)" : "var(--color-overlay0)",
                          p: 0.25,
                        }}
                      >
                        {note.isImportant ? (
                          <StarIcon sx={{ fontSize: FONT_SIZES.md }} />
                        ) : (
                          <StarOutlineIcon sx={{ fontSize: FONT_SIZES.md }} />
                        )}
                      </IconButton>
                    </Tooltip>
                    {onHistoryNote && (
                      <Tooltip title="History">
                        <IconButton
                          size="small"
                          onClick={() => onHistoryNote(note.id)}
                          sx={{ color: "var(--color-overlay0)", p: 0.25 }}
                        >
                          <HistoryIcon sx={{ fontSize: FONT_SIZES.md }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => setDeleteNoteId(note.id)}
                        sx={{ color: "var(--color-overlay0)", p: 0.25 }}
                      >
                        <DeleteIcon sx={{ fontSize: FONT_SIZES.md }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                <Box
                  sx={{
                    py: 0.5,
                    px: 1,
                    fontSize: FONT_SIZES.sm,
                    color: "var(--color-text)",
                    wordBreak: "break-word",
                    ...(!expandedNoteIds.has(note.id) &&
                      !note.title && {
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical" as const,
                        overflow: "hidden",
                      }),
                  }}
                >
                  {(expandedNoteIds.has(note.id) || !note.title) && (
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                      dangerouslySetInnerHTML={{ __html: getNotePreview(note.content) }}
                    />
                  )}
                  <Typography variant="caption" sx={{ color: "var(--color-subtext0)", mt: 0.5 }}>
                    Last edited on {new Date(note.updatedAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            ))}
          </List>
        )}
      </Box>

      <ConfirmDeleteDialog
        open={deleteNoteId !== null}
        onClose={() => setDeleteNoteId(null)}
        onConfirm={() => {
          onDeleteNote(deleteNoteId!);
          setDeleteNoteId(null);
        }}
        title="Delete Note"
        message="Are you sure you want to delete this note? This cannot be undone."
      />
    </Box>
  );
}
