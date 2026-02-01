import { useTheme } from "@mui/material";
import type { NoteType } from "../types";
import { TYPE_LABELS, NOTE_TYPES } from "../constants";

interface ToolbarProps {
  onCreate: (type: NoteType) => void;
}

export default function Toolbar({ onCreate }: ToolbarProps) {
  const theme = useTheme();
  return (
    <div style={styles.bar}>
      {NOTE_TYPES.map((t) => (
        <button
          key={t.value}
          style={styles.button}
          onClick={() => onCreate(t.value)}
          title={`New ${TYPE_LABELS[t.value]}`}
        >
          <span
            style={{
              ...styles.square,
              background: theme.palette.nodeTypes[t.value].light,
            }}
          />
          <span style={styles.label}>{TYPE_LABELS[t.value]}</span>
        </button>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    position: "fixed",
    bottom: 16,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: 4,
    padding: "6px 8px",
    background: "var(--color-chrome-bg)",
    backdropFilter: "blur(8px)",
    border: "1px solid var(--color-surface1)",
    borderRadius: 12,
    zIndex: 50,
    fontFamily: "system-ui, sans-serif",
  },
  button: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    background: "none",
    border: "none",
    borderRadius: 8,
    color: "var(--color-text)",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
    whiteSpace: "nowrap" as const,
  },
  square: {
    width: 12,
    height: 12,
    borderRadius: 3,
    flexShrink: 0,
  },
  label: {
    fontWeight: 500,
  },
};
