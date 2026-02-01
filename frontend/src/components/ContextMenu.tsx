import { useEffect, useState } from "react";
import { useTheme } from "@mui/material";
import type { NoteType } from "shared";
import { TYPE_LABELS, NOTE_TYPES } from "../constants";

interface ContextMenuProps {
  x: number;
  y: number;
  onSelect: (type: NoteType) => void;
  onViewAll: () => void;
  onUnstack: () => void;
  onClose: () => void;
}

export default function ContextMenu({ x, y, onSelect, onViewAll, onUnstack, onClose }: ContextMenuProps) {
  const theme = useTheme();
  const [showSubmenu, setShowSubmenu] = useState(false);
  const [showUtilities, setShowUtilities] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function handleScroll() {
      onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("wheel", handleScroll, { passive: true });
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("wheel", handleScroll);
    };
  }, [onClose]);

  return (
    <div style={styles.backdrop} onMouseDown={onClose}>
      <div
        style={{ ...styles.menu, left: x, top: y }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          style={styles.item}
          onMouseEnter={() => setShowSubmenu(true)}
          onMouseLeave={() => setShowSubmenu(false)}
        >
          <span>New Note</span>
          <span style={styles.arrow}>&#9656;</span>
          {showSubmenu && (
            <div style={styles.submenu}>
              {NOTE_TYPES.map((t) => (
                <button
                  key={t.value}
                  style={styles.submenuItem}
                  onClick={() => onSelect(t.value)}
                >
                  <span
                    style={{
                      ...styles.dot,
                      background: theme.palette.nodeTypes[t.value].light,
                    }}
                  />
                  {TYPE_LABELS[t.value]}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          style={styles.item}
          onClick={() => {
            onViewAll();
            onClose();
          }}
        >
          View All
        </button>
        <div style={styles.divider} />
        <div
          style={styles.item}
          onMouseEnter={() => setShowUtilities(true)}
          onMouseLeave={() => setShowUtilities(false)}
        >
          <span>Utilities</span>
          <span style={styles.arrow}>&#9656;</span>
          {showUtilities && (
            <div style={styles.submenu}>
              <button
                style={styles.submenuItem}
                onClick={() => {
                  onUnstack();
                  onClose();
                }}
              >
                Unstack Overlapping Notes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 200,
  },
  menu: {
    position: "absolute",
    background: "var(--color-base)",
    border: "1px solid var(--color-surface1)",
    borderRadius: 8,
    padding: "4px 0",
    minWidth: 160,
    boxShadow: "0 8px 24px var(--color-backdrop)",
  },
  item: {
    position: "relative" as const,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "8px 12px",
    background: "none",
    border: "none",
    color: "var(--color-text)",
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
  },
  divider: {
    height: 1,
    background: "var(--color-surface1)",
    margin: "4px 0",
  },
  arrow: {
    fontSize: 10,
    color: "var(--color-overlay0)",
    marginLeft: 8,
  },
  submenu: {
    position: "absolute" as const,
    left: "100%",
    top: 0,
    background: "var(--color-base)",
    border: "1px solid var(--color-surface1)",
    borderRadius: 8,
    padding: "4px 0",
    minWidth: 150,
    boxShadow: "0 8px 24px var(--color-backdrop)",
  },
  submenuItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "8px 12px",
    background: "none",
    border: "none",
    color: "var(--color-text)",
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    flexShrink: 0,
  },
};
