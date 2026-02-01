import { useState, useEffect, useCallback, useRef } from "react";
import type { Note, NoteType } from "shared";
import * as api from "../api/client";
import MentionEditor from "./MentionEditor";
import { NOTE_TYPES, SIDEBAR_WIDTH } from "../constants";
import { useAutoSave } from "../hooks/useAutoSave";
import type { SaveStatus } from "../hooks/useAutoSave";

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
    case "idle":
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

  // Refs to hold latest values for the save function
  const titleRef = useRef(title);
  titleRef.current = title;
  const typeRef = useRef(type);
  typeRef.current = type;
  const contentRef = useRef(content);
  contentRef.current = content;
  // noteIdRef is updated only in the fetch effect, not during render,
  // so cleanup effects still see the previous noteId.
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

  // Flush pending saves when noteId changes (switching notes)
  useEffect(() => {
    return () => {
      flush();
    };
  }, [noteId, flush]);

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

  if (!note) return <div style={styles.panel}>Loading...</div>;

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h3 style={styles.headerTitle}>Edit Note</h3>
        <button onClick={onClose} style={styles.closeBtn}>
          &times;
        </button>
      </div>

      <label style={styles.label}>
        Title
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            markDirty();
          }}
          style={styles.input}
        />
      </label>

      <label style={styles.label}>
        Type
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as NoteType);
            markDirty();
          }}
          style={styles.input}
        >
          {NOTE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <div style={styles.label}>
        <span>Start typing or @ mention another note</span>
        <MentionEditor
          value={content}
          onChange={(val: string) => {
            setContent(val);
            markDirty();
          }}
          notesCache={notesCache}
          style={{ ...styles.input, minHeight: 200, resize: "vertical" }}
        />
      </div>

      <div style={styles.actions}>
        <span style={styles.statusIndicator}>{statusLabel(status)}</span>
        <button onClick={handleDelete} style={styles.deleteBtn}>
          Delete
        </button>
      </div>

      {(note.links_to.length > 0 || note.linked_from.length > 0) && (
        <div style={styles.linksSection}>
          {note.links_to.length > 0 && (
            <div>
              <div style={styles.linksLabel}>Links to:</div>
              {note.links_to.map((link) => (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  style={styles.linkBtn}
                >
                  @{link.title}
                </button>
              ))}
            </div>
          )}
          {note.linked_from.length > 0 && (
            <div>
              <div style={styles.linksLabel}>Linked from:</div>
              {note.linked_from.map((link) => (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  style={styles.linkBtn}
                >
                  @{link.title}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: "fixed",
    top: 0,
    right: 0,
    width: SIDEBAR_WIDTH,
    height: "100vh",
    background: "var(--color-base)",
    borderLeft: "1px solid var(--color-surface0)",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    zIndex: 100,
    overflowY: "auto",
    color: "var(--color-text)",
    fontFamily: "system-ui, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    margin: 0,
    fontSize: 18,
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "var(--color-text)",
    fontSize: 24,
    cursor: "pointer",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    fontSize: 13,
    color: "var(--color-subtext0)",
  },
  input: {
    background: "var(--color-surface0)",
    border: "1px solid var(--color-surface1)",
    borderRadius: 6,
    padding: "8px 10px",
    color: "var(--color-text)",
    fontSize: 14,
    outline: "none",
  },
  actions: {
    display: "flex",
    gap: 8,
    marginTop: 8,
  },
  statusIndicator: {
    flex: 1,
    fontSize: 13,
    color: "var(--color-subtext0)",
    alignSelf: "center",
  },
  deleteBtn: {
    padding: "8px 12px",
    background: "#d94a4a",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
  },
  linksSection: {
    marginTop: 8,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  linksLabel: {
    fontSize: 12,
    color: "var(--color-overlay0)",
    marginBottom: 4,
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: "var(--color-blue)",
    cursor: "pointer",
    fontSize: 13,
    padding: "2px 4px",
    textAlign: "left" as const,
  },
};
