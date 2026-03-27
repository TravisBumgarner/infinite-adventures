import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RestoreIcon from "@mui/icons-material/Restore";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import type { ContentHistoryEntry } from "shared";
import { getNotePreview } from "../utils/getNotePreview";

/** Convert markdown bold/italic/links to HTML while preserving existing HTML structure. */
function renderRichContent(content: string): string {
  let html = content;
  // Convert plain-text newlines to <br> (only those not already inside tags)
  html = html.replace(/\n/g, "<br>");
  // Markdown links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--color-blue)">$1</a>',
  );
  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // Italic
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return html;
}

interface NoteHistoryModalProps {
  open: boolean;
  onClose: () => void;
  entries: ContentHistoryEntry[];
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
  entry: ContentHistoryEntry;
  expanded: boolean;
  onToggle: () => void;
  onCopy: () => void;
  onRevert: () => void;
}) {
  const date = new Date(entry.snapshotAt);
  const timestamp = date.toLocaleString();
  const preview = getNotePreview(entry.content, undefined, 80);

  return (
    <Box
      sx={{
        border: "1px solid var(--color-surface1)",
        p: 1.5,
        mb: 1,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ flex: 1, cursor: "pointer", minWidth: 0 }} onClick={onToggle}>
          <Typography variant="caption" sx={{ color: "var(--color-subtext0)", display: "block" }}>
            {timestamp}
          </Typography>
          {!expanded && (
            <Box
              sx={{
                color: "var(--color-text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: "0.8rem",
              }}
              dangerouslySetInnerHTML={{ __html: preview }}
            />
          )}
        </Box>
        <Tooltip title="Copy">
          <IconButton size="small" aria-label="Copy" onClick={onCopy}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Revert">
          <IconButton size="small" aria-label="Revert" onClick={onRevert}>
            <RestoreIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      {expanded && (
        <Box
          sx={{
            mt: 1,
            p: 1,
            maxHeight: 200,
            overflow: "auto",
            fontSize: "0.85rem",
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            "& p": { margin: "0 0 0.25em 0" },
            "& ul, & ol": { paddingLeft: "1.5em", margin: "0.25em 0" },
            "& li": { margin: "0.1em 0" },
            "& a": {
              color: "var(--color-blue)",
              textDecoration: "underline",
            },
          }}
          dangerouslySetInnerHTML={{ __html: renderRichContent(entry.content) }}
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
  const [revertContent, setRevertContent] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <>
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
              height: "80vh",
              maxHeight: "80vh",
            },
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          <Box component="span" sx={{ flex: 1 }}>
            Note History
          </Box>
          <IconButton size="small" onClick={onClose} aria-label="Close">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ overflowY: "auto" }}>
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
                onRevert={() => setRevertContent(entry.content)}
              />
            ))}
        </DialogContent>
      </Dialog>

      <Dialog open={revertContent !== null} onClose={() => setRevertContent(null)}>
        <DialogTitle>Revert Note</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to revert to this snapshot? Your current content will be replaced.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevertContent(null)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => {
              onRevert(revertContent!);
              setRevertContent(null);
            }}
          >
            Revert
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
