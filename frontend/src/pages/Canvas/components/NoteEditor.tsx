import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Drawer from "@mui/material/Drawer";
import FormLabel from "@mui/material/FormLabel";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Note, NoteType } from "shared";
import * as api from "../../../api/client";
import { NOTE_TYPES, SIDEBAR_WIDTH } from "../../../constants";
import type { SaveStatus } from "../../../hooks/useAutoSave";
import { useAutoSave } from "../../../hooks/useAutoSave";
import MentionEditor from "./MentionEditor";

function statusLabel(status: SaveStatus): string {
  switch (status) {
    case "saving":
      return "Saving...";
    case "saved":
      return "Saved";
    case "unsaved":
      return "Unsaved changes";
    case "error":
      return "Save failed";
    default:
      return "";
  }
}

interface NoteEditorProps {
  noteId: string;
  onClose: () => void;
  onSaved: (note: Note) => void;
  onDeleted: (noteId: string) => void;
  onNavigate: (noteId: string) => void;
  notesCache: Map<string, Note>;
}

export default function NoteEditor({
  noteId,
  onClose,
  onSaved,
  onDeleted,
  onNavigate,
  notesCache,
}: NoteEditorProps) {
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<NoteType>("npc");
  const [content, setContent] = useState("");

  const titleRef = useRef(title);
  titleRef.current = title;
  const typeRef = useRef(type);
  typeRef.current = type;
  const contentRef = useRef(content);
  contentRef.current = content;
  const noteIdRef = useRef(noteId);

  const saveFn = useCallback(async () => {
    const updated = await api.updateNote(noteIdRef.current, {
      title: titleRef.current,
      type: typeRef.current,
      content: contentRef.current,
    });
    onSaved(updated);
  }, [onSaved]);

  const { status, markDirty, flush } = useAutoSave({ saveFn });

  useEffect(() => {
    return () => {
      flush();
    };
  }, [flush]);

  useEffect(() => {
    noteIdRef.current = noteId;
    api.fetchNote(noteId).then((n) => {
      setNote(n);
      setTitle(n.title);
      setType(n.type);
      setContent(n.content);
    });
  }, [noteId]);

  async function handleDelete() {
    if (!confirm("Delete this note? This cannot be undone.")) return;
    await api.deleteNote(noteId);
    onDeleted(noteId);
  }

  if (!note) {
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
      sx={{
        "& .MuiDrawer-paper": {
          width: SIDEBAR_WIDTH,
          bgcolor: "var(--color-base)",
          borderLeft: "1px solid var(--color-surface0)",
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          overflowY: "auto",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">Edit Note</Typography>
        <IconButton onClick={onClose} sx={{ color: "var(--color-text)" }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <FormLabel sx={{ fontSize: 13, color: "var(--color-subtext0)" }}>Title</FormLabel>
        <TextField
          size="small"
          fullWidth
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            markDirty();
          }}
        />
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <FormLabel sx={{ fontSize: 13, color: "var(--color-subtext0)" }}>Type</FormLabel>
        <Select
          size="small"
          fullWidth
          value={type}
          onChange={(e) => {
            setType(e.target.value as NoteType);
            markDirty();
          }}
        >
          {NOTE_TYPES.map((t) => (
            <MenuItem key={t.value} value={t.value}>
              {t.label}
            </MenuItem>
          ))}
        </Select>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <FormLabel sx={{ fontSize: 13, color: "var(--color-subtext0)" }}>
          Start typing or @ mention another note
        </FormLabel>
        <MentionEditor
          value={content}
          onChange={(val: string) => {
            setContent(val);
            markDirty();
          }}
          notesCache={notesCache}
          style={{
            background: "var(--color-surface0)",
            border: "1px solid var(--color-surface1)",
            borderRadius: "0 0 6px 6px",
            padding: "8px 10px",
            color: "var(--color-text)",
            fontSize: 14,
            minHeight: 200,
          }}
        />
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
        <Typography variant="caption" sx={{ flex: 1, color: "var(--color-subtext0)" }}>
          {statusLabel(status)}
        </Typography>
      </Box>

      <Button
        variant="outlined"
        color="error"
        onClick={handleDelete}
        sx={{ alignSelf: "flex-start" }}
      >
        Delete
      </Button>

      {(note.links_to.length > 0 || note.linked_from.length > 0) && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
          {note.links_to.length > 0 && (
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "var(--color-overlay0)",
                  mb: 0.5,
                  display: "block",
                }}
              >
                Links to:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {note.links_to.map((link) => (
                  <Chip
                    key={link.id}
                    label={`@${link.title}`}
                    size="small"
                    clickable
                    onClick={() => onNavigate(link.id)}
                    sx={{ color: "var(--color-blue)" }}
                  />
                ))}
              </Box>
            </Box>
          )}
          {note.linked_from.length > 0 && (
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "var(--color-overlay0)",
                  mb: 0.5,
                  display: "block",
                }}
              >
                Linked from:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {note.linked_from.map((link) => (
                  <Chip
                    key={link.id}
                    label={`@${link.title}`}
                    size="small"
                    clickable
                    onClick={() => onNavigate(link.id)}
                    sx={{ color: "var(--color-blue)" }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Drawer>
  );
}
