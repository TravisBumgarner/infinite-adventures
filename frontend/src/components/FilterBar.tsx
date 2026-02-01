import { useState } from "react";
import { useTheme } from "@mui/material";
import type { NoteType } from "../types";
import { NOTE_TYPES } from "../constants";

interface FilterBarProps {
  activeTypes: Set<NoteType>;
  search: string;
  onToggleType: (type: NoteType) => void;
  onSearchChange: (search: string) => void;
}

export default function FilterBar({
  activeTypes,
  search,
  onToggleType,
  onSearchChange,
}: FilterBarProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const hasFilters = activeTypes.size > 0 || search.length > 0;

  if (!expanded) {
    return (
      <button
        style={styles.toggleButton}
        onClick={() => setExpanded(true)}
      >
        Filter{hasFilters ? " *" : ""}
      </button>
    );
  }

  return (
    <div style={styles.bar}>
      <div style={styles.row}>
        <input
          type="text"
          placeholder="Filter by text..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={styles.input}
        />
        <button
          style={styles.closeButton}
          onClick={() => setExpanded(false)}
        >
          X
        </button>
      </div>
      <div style={styles.chips}>
        {NOTE_TYPES.map(({ value, label }) => {
          const active = activeTypes.has(value);
          return (
            <button
              key={value}
              style={{
                ...styles.chip,
                background: active ? theme.palette.nodeTypes[value].light : "transparent",
                borderColor: theme.palette.nodeTypes[value].light,
                color: active ? "#fff" : "var(--color-subtext0)",
              }}
              onClick={() => onToggleType(value)}
            >
              <span
                style={{
                  ...styles.dot,
                  background: theme.palette.nodeTypes[value].light,
                  opacity: active ? 0 : 1,
                }}
              />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  toggleButton: {
    position: "fixed",
    top: 20,
    left: 344,
    zIndex: 50,
    background: "var(--color-base)",
    border: "1px solid var(--color-surface1)",
    borderRadius: 6,
    color: "var(--color-text)",
    padding: "6px 12px",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
  },
  bar: {
    position: "fixed",
    top: 16,
    left: 344,
    zIndex: 50,
    background: "var(--color-base)",
    border: "1px solid var(--color-surface1)",
    borderRadius: 8,
    padding: 8,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  row: {
    display: "flex",
    gap: 6,
    alignItems: "center",
  },
  input: {
    background: "var(--color-surface0)",
    border: "1px solid var(--color-surface1)",
    borderRadius: 4,
    color: "var(--color-text)",
    padding: "4px 8px",
    fontSize: 13,
    fontFamily: "system-ui, sans-serif",
    outline: "none",
    width: 180,
  },
  closeButton: {
    background: "none",
    border: "none",
    color: "var(--color-subtext0)",
    cursor: "pointer",
    fontSize: 13,
    padding: "4px 6px",
    fontFamily: "system-ui, sans-serif",
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
};
