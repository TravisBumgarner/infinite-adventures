import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type { Node, NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import { memo, useState } from "react";
import type { NoteType } from "shared";
import { TYPE_LABELS } from "../../../constants";
import { getContrastText } from "../../../utils/getContrastText";
import type { PreviewSegment } from "../../../utils/previewParser";
import { parsePreviewContent } from "../../../utils/previewParser";

export type NoteNodeData = {
  noteId: string;
  type: NoteType;
  title: string;
  content: string;
  mentionLabels: Record<string, string>;
  onMentionClick: (sourceNoteId: string, targetNoteId: string) => void;
};

type NoteNodeType = Node<NoteNodeData, "note">;

function MentionSpan({
  label,
  onClick,
}: {
  label: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Typography
      component="span"
      sx={{
        color: hovered ? "var(--color-lavender)" : "var(--color-blue)",
        fontWeight: 600,
        cursor: "pointer",
        textDecoration: hovered ? "underline" : "none",
        fontSize: "inherit",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      @{label}
    </Typography>
  );
}

function renderSegment(
  segment: PreviewSegment,
  index: number,
  noteId: string,
  onMentionClick: (sourceNoteId: string, targetNoteId: string) => void,
): React.ReactNode {
  switch (segment.type) {
    case "mention-clickable":
      return (
        <MentionSpan
          key={index}
          label={segment.text}
          onClick={(e) => {
            e.stopPropagation();
            onMentionClick(noteId, segment.targetId);
          }}
        />
      );
    case "mention-static":
      return (
        <Typography
          key={index}
          component="span"
          sx={{
            color: "var(--color-blue)",
            fontWeight: 600,
            fontSize: "inherit",
          }}
        >
          {segment.text}
        </Typography>
      );
    case "bold":
      return (
        <Typography key={index} component="span" sx={{ fontWeight: 700, fontSize: "inherit" }}>
          {segment.text}
        </Typography>
      );
    case "italic":
      return (
        <Typography key={index} component="span" sx={{ fontStyle: "italic", fontSize: "inherit" }}>
          {segment.text}
        </Typography>
      );
    case "code":
      return (
        <Typography
          key={index}
          component="code"
          sx={{
            bgcolor: "var(--color-surface0)",
            borderRadius: "3px",
            px: 0.5,
            fontSize: 11,
          }}
        >
          {segment.text}
        </Typography>
      );
    case "text":
      return <span key={index}>{segment.text}</span>;
  }
}

function NoteNodeComponent({ data }: NodeProps<NoteNodeType>) {
  const theme = useTheme();
  const color = theme.palette.nodeTypes[data.type].light;
  const label = TYPE_LABELS[data.type];
  const segments = data.content ? parsePreviewContent(data.content, data.mentionLabels) : [];

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <Paper
        sx={{
          bgcolor: "var(--color-base)",
          border: `2px solid ${color}`,
          borderRadius: 2,
          p: 1.5,
          minWidth: 180,
          maxWidth: 240,
          color: "var(--color-text)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <Chip
            label={label}
            size="small"
            sx={{
              bgcolor: color,
              color: getContrastText(color),
              fontSize: 11,
              fontWeight: 600,
              height: 20,
            }}
          />
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {data.title}
          </Typography>
        </Box>
        {segments.length > 0 && (
          <Typography
            variant="caption"
            component="div"
            sx={{
              color: "var(--color-subtext0)",
              mt: 0.5,
              whiteSpace: "pre-line",
            }}
          >
            {segments.map((seg, i) => renderSegment(seg, i, data.noteId, data.onMentionClick))}
          </Typography>
        )}
      </Paper>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

export default memo(NoteNodeComponent);
