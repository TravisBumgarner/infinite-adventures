import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useRef } from "react";
import {
  useCreateQuickNote,
  useDeleteQuickNote,
  useUpdateQuickNote,
} from "../../../hooks/mutations";
import { useQuickNotes } from "../../../hooks/queries";
import { useDraggable } from "../../../hooks/useDraggable";
import { useCanvasStore } from "../../../stores/canvasStore";
import { useQuickNotesStore } from "../../../stores/quickNotesStore";

function QuickNoteItem({
  id,
  content,
  canvasId,
}: {
  id: string;
  content: string;
  canvasId: string;
}) {
  const updateMutation = useUpdateQuickNote(canvasId);
  const deleteMutation = useDeleteQuickNote(canvasId);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateMutation.mutate({ id, content: newContent });
      }, 600);
    },
    [id, updateMutation],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <Box sx={{ display: "flex", gap: 0.5, alignItems: "flex-start" }}>
      <TextField
        defaultValue={content}
        onChange={handleChange}
        multiline
        minRows={1}
        maxRows={4}
        fullWidth
        size="small"
        placeholder="Type a note..."
        variant="standard"
        InputProps={{ disableUnderline: true }}
        sx={{
          "& .MuiInputBase-root": {
            fontSize: 13,
            py: 0.5,
            px: 1,
            bgcolor: "var(--color-surface0)",
            borderRadius: 1,
          },
        }}
      />
      <Tooltip title="Delete">
        <IconButton
          size="small"
          onClick={() => deleteMutation.mutate(id)}
          sx={{ color: "var(--color-overlay0)", mt: 0.25 }}
        >
          <DeleteIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
    </Box>
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

  const { handleMouseDown } = useDraggable({ position, onPositionChange: setPosition });

  if (!isOpen || !activeCanvasId) return null;

  return (
    <Paper
      elevation={8}
      sx={{
        position: "fixed",
        top: position.y,
        left: position.x,
        width: 320,
        zIndex: 100,
        bgcolor: "var(--color-chrome-bg)",
        backdropFilter: "blur(8px)",
        border: "1px solid var(--color-surface1)",
        borderRadius: 2,
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
            <IconButton size="small" onClick={() => createMutation.mutate()}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={toggle}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Notes list */}
      <Box sx={{ p: 1.5, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
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
              canvasId={activeCanvasId}
            />
          ))
        )}
      </Box>
    </Paper>
  );
}
