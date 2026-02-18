import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RestoreIcon from "@mui/icons-material/Restore";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import type { NoteHistoryEntry } from "shared";

interface NoteHistoryModalProps {
  open: boolean;
  onClose: () => void;
  entries: NoteHistoryEntry[];
  loading: boolean;
  onRevert: (content: string) => void;
}

function HistoryEntry({
  entry,
  expanded,
  onToggle,
  onCopy,
  onRevert,
}: {
  entry: NoteHistoryEntry;
  expanded: boolean;
  onToggle: () => void;
  onCopy: () => void;
  onRevert: () => void;
}) {
  const date = new Date(entry.snapshotAt);
  const timestamp = date.toLocaleString();

  return (
    <Box
      sx={{
        border: "1px solid var(--color-surface1)",
        borderRadius: 1,
        p: 1.5,
        mb: 1,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography
          variant="caption"
          sx={{
            color: "var(--color-subtext0)",
            cursor: "pointer",
            flex: 1,
          }}
          onClick={onToggle}
        >
          {timestamp}
        </Typography>
        <IconButton size="small" aria-label="Copy" onClick={onCopy}>
          <ContentCopyIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" aria-label="Revert" onClick={onRevert}>
          <RestoreIcon fontSize="small" />
        </IconButton>
      </Box>
      {expanded && (
        <Box
          sx={{
            mt: 1,
            p: 1,
            bgcolor: "var(--color-surface0)",
            borderRadius: 1,
            maxHeight: 200,
            overflow: "auto",
            fontSize: "0.85rem",
            "& p": { margin: 0 },
          }}
          dangerouslySetInnerHTML={{ __html: entry.content }}
        />
      )}
    </Box>
  );
}

export default function NoteHistoryModal({
  open,
  onClose,
  entries,
  loading,
  onRevert,
}: NoteHistoryModalProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: "var(--color-base)",
            border: "1px solid var(--color-surface1)",
            maxHeight: "80vh",
          },
        },
      }}
    >
      <DialogTitle>Note History</DialogTitle>
      <DialogContent>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        )}
        {!loading && entries.length === 0 && (
          <Typography sx={{ color: "var(--color-subtext0)", textAlign: "center", py: 4 }}>
            No history available
          </Typography>
        )}
        {!loading &&
          entries.map((entry) => (
            <HistoryEntry
              key={entry.id}
              entry={entry}
              expanded={expandedId === entry.id}
              onToggle={() => handleToggle(entry.id)}
              onCopy={() => navigator.clipboard.writeText(entry.content)}
              onRevert={() => onRevert(entry.content)}
            />
          ))}
      </DialogContent>
    </Dialog>
  );
}
