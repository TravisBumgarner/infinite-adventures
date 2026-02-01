import { useState } from "react";
import type { NoteType } from "../types";
import { NOTE_TYPES, TYPE_COLORS } from "../constants";

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
                background: active ? TYPE_COLORS[value] : "transparent",
                borderColor: TYPE_COLORS[value],
                color: active ? "#fff" : "#a6adc8",
              }}
              onClick={() => onToggleType(value)}
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
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  toggleButton: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 10,
    background: "#1e1e2e",
    border: "1px solid #45475a",
    borderRadius: 6,
    color: "#cdd6f4",
    padding: "6px 12px",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
  },
  bar: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 10,
    background: "#1e1e2e",
    border: "1px solid #45475a",
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
    background: "#313244",
    border: "1px solid #45475a",
    borderRadius: 4,
    color: "#cdd6f4",
    padding: "4px 8px",
    fontSize: 13,
    fontFamily: "system-ui, sans-serif",
    outline: "none",
    width: 180,
  },
  closeButton: {
    background: "none",
    border: "none",
    color: "#a6adc8",
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
