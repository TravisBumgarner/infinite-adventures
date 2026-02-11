import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import StarIcon from "@mui/icons-material/Star";
import StarOutlineIcon from "@mui/icons-material/StarOutline";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import { keyframes } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";
import type { CanvasItem, Note } from "shared";
import type { SaveStatus } from "../hooks/useAutoSave";
import MentionEditor from "../pages/Canvas/components/MentionEditor";
import { statusLabel } from "../utils/statusLabel";
import LinkTooltip from "./LinkTooltip";

const flashNote = keyframes`
  0%, 100% { border-color: var(--color-surface1); background-color: var(--color-surface0); }
  25%, 75% { border-color: var(--color-blue); background-color: color-mix(in srgb, var(--color-blue) 15%, var(--color-surface0)); }
`;

interface NotesTabProps {
  notes: Note[];
  editingNoteId: string | null;
  noteContent: string;
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
  onToggleImportant: (noteId: string, isImportant: boolean) => void;
  onCreateMentionItem: (title: string) => Promise<{ id: string; title: string } | null>;
  getNotePreview: (content: string) => string;
  onMentionClick?: (itemId: string) => void;
}

export default function NotesTab({
  notes,
  editingNoteId,
  noteContent,
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
  onToggleImportant,
  onCreateMentionItem,
  getNotePreview,
  onMentionClick,
}: NotesTabProps) {
  const notesListRef = useRef<HTMLDivElement>(null);
  const noteRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [flashingNoteId, setFlashingNoteId] = useState<string | null>(null);

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
        <MentionEditor
          value={noteContent}
          onChange={onNoteContentChange}
          itemsCache={itemsCache}
          canvasId={canvasId}
          onCreate={onCreateMentionItem}
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
        <Box sx={{ mt: 1.5, flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => onDeleteNote(editingNoteId)}
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
        onClick={(e) => {
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
              <ListItemButton
                key={note.id}
                ref={(el: HTMLElement | null) => {
                  if (el) {
                    noteRefs.current.set(note.id, el);
                  } else {
                    noteRefs.current.delete(note.id);
                  }
                }}
                onClick={() => onSelectNote(note)}
                sx={{
                  mb: 1,
                  py: 1.5,
                  px: 2,
                  flexDirection: "column",
                  alignItems: "stretch",
                  bgcolor: note.isImportant ? "var(--color-surface1)" : "var(--color-surface0)",
                  border: note.isImportant
                    ? "1px solid var(--color-yellow)"
                    : "1px solid var(--color-surface1)",
                  "&:hover": {
                    bgcolor: "var(--color-surface1)",
                  },
                  ...(flashingNoteId === note.id && {
                    animation: `${flashNote} 0.6s ease-in-out 2`,
                  }),
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.25,
                    mb: 0.5,
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleImportant(note.id, !note.isImportant);
                    }}
                    sx={{
                      color: note.isImportant ? "var(--color-yellow)" : "var(--color-subtext0)",
                      p: 0.25,
                    }}
                  >
                    {note.isImportant ? (
                      <StarIcon sx={{ fontSize: 16 }} />
                    ) : (
                      <StarOutlineIcon sx={{ fontSize: 16 }} />
                    )}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNote(note.id);
                    }}
                    sx={{ color: "var(--color-subtext0)", p: 0.25 }}
                  >
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                  dangerouslySetInnerHTML={{ __html: getNotePreview(note.content) }}
                />
                <Typography variant="caption" sx={{ color: "var(--color-subtext0)", mt: 0.5 }}>
                  Last edited on {new Date(note.updatedAt).toLocaleDateString()}
                </Typography>
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
}
