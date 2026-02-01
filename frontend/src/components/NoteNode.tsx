import { useTheme } from "@mui/material";
import type { Node, NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import { memo, useState } from "react";
import type { NoteType } from "shared";
import { TYPE_LABELS } from "../constants";
import type { PreviewSegment } from "../utils/previewParser";
import { parsePreviewContent } from "../utils/previewParser";

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
    <span
      style={{
        color: hovered ? "var(--color-lavender)" : "var(--color-blue)",
        fontWeight: 600,
        cursor: "pointer",
        textDecoration: hovered ? "underline" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      @{label}
    </span>
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
        <span key={index} style={{ color: "var(--color-blue)", fontWeight: 600 }}>
          {segment.text}
        </span>
      );
    case "bold":
      return (
        <span key={index} style={{ fontWeight: 700 }}>
          {segment.text}
        </span>
      );
    case "italic":
      return (
        <span key={index} style={{ fontStyle: "italic" }}>
          {segment.text}
        </span>
      );
    case "code":
      return (
        <code
          key={index}
          style={{
            background: "var(--color-surface0)",
            borderRadius: 3,
            padding: "1px 4px",
            fontSize: 11,
          }}
        >
          {segment.text}
        </code>
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
      <div
        style={{
          background: "var(--color-base)",
          border: `2px solid ${color}`,
          borderRadius: 8,
          padding: 12,
          minWidth: 180,
          maxWidth: 240,
          color: "var(--color-text)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span
            style={{
              background: color,
              color: "#fff",
              borderRadius: 4,
              padding: "2px 6px",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontWeight: 600,
              fontSize: 14,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {data.title}
          </span>
        </div>
        {segments.length > 0 && (
          <div style={{ fontSize: 12, color: "var(--color-subtext0)", marginTop: 4 }}>
            {segments.map((seg, i) => renderSegment(seg, i, data.noteId, data.onMentionClick))}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

export default memo(NoteNodeComponent);
