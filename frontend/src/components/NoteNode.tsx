import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps, Node } from "@xyflow/react";
import type { NoteType } from "../types";

const TYPE_COLORS: Record<NoteType, string> = {
  pc: "#4a90d9",
  npc: "#d94a4a",
  item: "#d9a74a",
  quest: "#8b5cf6",
  location: "#22c55e",
  goal: "#ec4899",
  session: "#6b7280",
};

const TYPE_LABELS: Record<NoteType, string> = {
  pc: "PC",
  npc: "NPC",
  item: "Item",
  quest: "Quest",
  location: "Location",
  goal: "Goal",
  session: "Session",
};

export type NoteNodeData = {
  noteId: string;
  type: NoteType;
  title: string;
  content: string;
};

type NoteNodeType = Node<NoteNodeData, "note">;

/**
 * Render content preview with @mentions styled as highlighted spans.
 */
function renderPreview(content: string) {
  const preview = content.length > 80 ? content.slice(0, 80) + "..." : content;
  // Match @[Multi Word] or @SingleWord
  const parts = preview.split(/(@\[[^\]]+\]|@[\w-]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      return (
        <span key={i} style={{ color: "#89b4fa", fontWeight: 600 }}>
          {part}
        </span>
      );
    }
    return part;
  });
}

function NoteNodeComponent({ data }: NodeProps<NoteNodeType>) {
  const color = TYPE_COLORS[data.type];
  const label = TYPE_LABELS[data.type];

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div
        style={{
          background: "#1e1e2e",
          border: `2px solid ${color}`,
          borderRadius: 8,
          padding: 12,
          minWidth: 180,
          maxWidth: 240,
          color: "#cdd6f4",
          fontFamily: "system-ui, sans-serif",
          cursor: "pointer",
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
        {data.content && (
          <div style={{ fontSize: 12, color: "#a6adc8", marginTop: 4 }}>
            {renderPreview(data.content)}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

export default memo(NoteNodeComponent);
