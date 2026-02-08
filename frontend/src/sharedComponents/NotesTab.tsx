import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import Typography from "@mui/material/Typography";
import type { CanvasItem, Note } from "shared";
import type { SaveStatus } from "../hooks/useAutoSave";
import MentionEditor from "../pages/Canvas/components/MentionEditor";
import { statusLabel } from "../utils/statusLabel";

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
  onCreateMentionItem,
  getNotePreview,
}: NotesTabProps) {
  if (editingNoteId) {
    return (
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", p: 2, overflow: "hidden" }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
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
                  >
                    {getNotePreview(note.content)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "var(--color-subtext0)" }}>
                    Last edited on {new Date(note.updated_at).toLocaleDateString()}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNote(note.id);
                  }}
                  sx={{ color: "var(--color-subtext0)", ml: 1 }}
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
