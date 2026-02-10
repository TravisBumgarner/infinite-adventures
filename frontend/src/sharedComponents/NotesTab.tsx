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
import Typography from "@mui/material/Typography";
import { useRef } from "react";
import type { CanvasItem, Note } from "shared";
import type { SaveStatus } from "../hooks/useAutoSave";
import MentionEditor from "../pages/Canvas/components/MentionEditor";
import { statusLabel } from "../utils/statusLabel";
import LinkTooltip from "./LinkTooltip";

interface NotesTabProps {
  notes: Note[];
  editingNoteId: string | null;
  noteContent: string;
  noteStatus: SaveStatus;
  itemsCache: Map<string, CanvasItem>;
  canvasId: string;
  onAddNote: () => void;
  onSelectNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  onBackToList: () => void;
  onNoteContentChange: (value: string) => void;
  onToggleImportant: (noteId: string, isImportant: boolean) => void;
  onCreateMentionItem: (title: string) => Promise<{ id: string; title: string } | null>;
  getNotePreview: (content: string) => string;
}

export default function NotesTab({
  notes,
  editingNoteId,
  noteContent,
  noteStatus,
  itemsCache,
  canvasId,
  onAddNote,
  onSelectNote,
  onDeleteNote,
  onBackToList,
  onNoteContentChange,
  onToggleImportant,
  onCreateMentionItem,
  getNotePreview,
}: NotesTabProps) {
  const notesListRef = useRef<HTMLDivElement>(null);

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
      <Box ref={notesListRef} sx={{ flex: 1, overflowY: "auto" }}>
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
                onClick={() => onSelectNote(note)}
                sx={{
                  mb: 1,
                  py: 1.5,
                  px: 2,
                  bgcolor: "var(--color-surface0)",
                  border: "1px solid var(--color-surface1)",
                  "&:hover": {
                    bgcolor: "var(--color-surface1)",
                  },
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                    dangerouslySetInnerHTML={{ __html: getNotePreview(note.content) }}
                  />
                  <Typography variant="caption" sx={{ color: "var(--color-subtext0)" }}>
                    Last edited on {new Date(note.updatedAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleImportant(note.id, !note.isImportant);
                  }}
                  sx={{ color: "var(--color-subtext0)", ml: 1 }}
                >
                  {note.isImportant ? (
                    <StarIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <StarOutlineIcon sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNote(note.id);
                  }}
                  sx={{ color: "var(--color-subtext0)" }}
                >
                  <DeleteIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
}
