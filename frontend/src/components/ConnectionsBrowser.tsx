import { useState, useMemo } from "react";
import type { Note, NoteType } from "../types";
import { NOTE_TYPES, TYPE_COLORS, SIDEBAR_WIDTH } from "../constants";
import { buildConnectionEntries, filterConnections } from "../utils/connectionFilter";

interface ConnectionsBrowserProps {
  noteId: string;
  notesCache: Map<string, Note>;
  onNavigate: (noteId: string) => void;
  onClose: () => void;
}

export default function ConnectionsBrowser({
  noteId,
  notesCache,
  onNavigate,
  onClose,
}: ConnectionsBrowserProps) {
  const [search, setSearch] = useState("");
  const [activeTypes, setActiveTypes] = useState<Set<NoteType>>(new Set());

  const note = notesCache.get(noteId);

  const allEntries = useMemo(() => {
    if (!note) return [];
    return buildConnectionEntries(note.links_to, note.linked_from);
  }, [note]);

  const filtered = useMemo(
    () => filterConnections(allEntries, activeTypes, search),
    [allEntries, activeTypes, search]
  );

  const handleToggleType = (type: NoteType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  if (!note) return <div style={styles.panel}>Note not found</div>;

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h3 style={styles.headerTitle}>Connections</h3>
        <button onClick={onClose} style={styles.closeBtn}>
          &times;
        </button>
      </div>

      <div style={styles.noteTitle}>{note.title}</div>

      <input
        type="text"
        placeholder="Search connections..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={styles.input}
      />

      <div style={styles.chips}>
        {NOTE_TYPES.map(({ value, label }) => {
          const active = activeTypes.has(value);
          return (
            <button
              key={value}
              style={{
                ...styles.chip,
                background: active ? TYPE_COLORS[value] : "transparent",
                borderColor: TYPE_COLORS[value],
                color: active ? "#fff" : "#a6adc8",
              }}
              onClick={() => handleToggleType(value)}
            >
              <span
                style={{
                  ...styles.dot,
                  background: TYPE_COLORS[value],
                  opacity: active ? 0 : 1,
                }}
              />
              {label}
            </button>
          );
        })}
      </div>

      <div style={styles.list}>
        {filtered.length === 0 ? (
          <div style={styles.empty}>No connections found</div>
        ) : (
          filtered.map((entry) => (
            <button
              key={`${entry.direction}-${entry.link.id}`}
              style={styles.connectionItem}
              onClick={() => onNavigate(entry.link.id)}
            >
              <span
                style={{
                  ...styles.directionBadge,
                  background: entry.direction === "outgoing" ? "#45475a" : "#313244",
                }}
              >
                {entry.direction === "outgoing" ? "→" : "←"}
              </span>
              <span
                style={{
                  ...styles.typeBadge,
                  background: TYPE_COLORS[entry.link.type],
                }}
              >
                {entry.link.type.toUpperCase()}
              </span>
              <span style={styles.connectionTitle}>{entry.link.title}</span>
            </button>
          ))
        )}
      </div>
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
  noteTitle: {
    fontSize: 14,
    color: "#a6adc8",
    paddingBottom: 4,
    borderBottom: "1px solid #313244",
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
  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 4,
  },
  chip: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 8px",
    borderRadius: 12,
    border: "1px solid",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    flex: 1,
    overflowY: "auto",
  },
  empty: {
    fontSize: 13,
    color: "#6c7086",
    padding: "12px 0",
    textAlign: "center",
  },
  connectionItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    background: "none",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    color: "#cdd6f4",
    fontSize: 13,
    fontFamily: "system-ui, sans-serif",
    textAlign: "left",
  },
  directionBadge: {
    fontSize: 12,
    padding: "2px 6px",
    borderRadius: 4,
    color: "#a6adc8",
    flexShrink: 0,
  },
  typeBadge: {
    fontSize: 10,
    padding: "1px 4px",
    borderRadius: 3,
    color: "#fff",
    fontWeight: 600,
    flexShrink: 0,
  },
  connectionTitle: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
};
