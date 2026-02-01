import { useEffect } from "react";

interface NodeContextMenuProps {
  x: number;
  y: number;
  noteId: string;
  selectedCount: number;
  onEdit: (noteId: string) => void;
  onBrowseConnections: (noteId: string) => void;
  onDelete: (noteId: string) => void;
  onDeleteSelected: () => void;
  onClose: () => void;
}

export default function NodeContextMenu({
  x,
  y,
  noteId,
  selectedCount,
  onEdit,
  onBrowseConnections,
  onDelete,
  onDeleteSelected,
  onClose,
}: NodeContextMenuProps) {
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

  const isMulti = selectedCount > 1;

  return (
    <div style={styles.backdrop} onMouseDown={onClose}>
      <div
        style={{ ...styles.menu, left: x, top: y }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {!isMulti && (
          <button
            style={styles.editItem}
            onClick={() => {
              onEdit(noteId);
              onClose();
            }}
          >
            Edit
          </button>
        )}
        {!isMulti && (
          <button
            style={styles.editItem}
            onClick={() => {
              onBrowseConnections(noteId);
              onClose();
            }}
          >
            Browse Connections
          </button>
        )}
        {isMulti ? (
          <button
            style={styles.item}
            onClick={() => {
              if (
                confirm(
                  `Delete ${selectedCount} selected notes? This cannot be undone.`
                )
              ) {
                onDeleteSelected();
              }
              onClose();
            }}
          >
            Delete Selected ({selectedCount})
          </button>
        ) : (
          <button
            style={styles.item}
            onClick={() => {
              if (confirm("Delete this note? This cannot be undone.")) {
                onDelete(noteId);
              }
              onClose();
            }}
          >
            Delete
          </button>
        )}
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
    background: "#1e1e2e",
    border: "1px solid #45475a",
    borderRadius: 8,
    padding: "4px 0",
    minWidth: 120,
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
  },
  editItem: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "8px 12px",
    background: "none",
    border: "none",
    color: "#cdd6f4",
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
  },
  item: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "8px 12px",
    background: "none",
    border: "none",
    color: "#d94a4a",
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "system-ui, sans-serif",
  },
};
