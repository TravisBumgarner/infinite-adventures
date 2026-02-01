import { useState, useEffect } from "react";
import type { Note, NoteType } from "../types";
import * as api from "../api/client";
import MentionEditor from "./MentionEditor";
import { NOTE_TYPES, SIDEBAR_WIDTH } from "../constants";

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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.fetchNote(noteId).then((n) => {
      setNote(n);
      setTitle(n.title);
      setType(n.type);
      setContent(n.content);
    });
  }, [noteId]);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await api.updateNote(noteId, { title, type, content });
      onSaved(updated);
    } finally {
      setSaving(false);
    }
  }

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
          onChange={(e) => setTitle(e.target.value)}
          style={styles.input}
        />
      </label>

      <label style={styles.label}>
        Type
        <select
          value={type}
          onChange={(e) => setType(e.target.value as NoteType)}
          style={styles.input}
        >
          {NOTE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <label style={styles.label}>
        Start typing or @ mention another note
        <MentionEditor
          value={content}
          onChange={setContent}
          notesCache={notesCache}
          style={{ ...styles.input, minHeight: 200, resize: "vertical" }}
        />
      </label>

      <div style={styles.actions}>
        <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
          {saving ? "Saving..." : "Save"}
        </button>
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
    background: "#1e1e2e",
    borderLeft: "1px solid #313244",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    zIndex: 100,
    overflowY: "auto",
    color: "#cdd6f4",
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
    color: "#cdd6f4",
    fontSize: 24,
    cursor: "pointer",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    fontSize: 13,
    color: "#a6adc8",
  },
  input: {
    background: "#313244",
    border: "1px solid #45475a",
    borderRadius: 6,
    padding: "8px 10px",
    color: "#cdd6f4",
    fontSize: 14,
    outline: "none",
  },
  actions: {
    display: "flex",
    gap: 8,
    marginTop: 8,
  },
  saveBtn: {
    flex: 1,
    padding: "8px 12px",
    background: "#4a90d9",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
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
    color: "#6c7086",
    marginBottom: 4,
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: "#89b4fa",
    cursor: "pointer",
    fontSize: 13,
    padding: "2px 4px",
    textAlign: "left" as const,
  },
};
