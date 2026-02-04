import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type { Node, NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import { memo, useState } from "react";
import type { CanvasItemType } from "shared";
import { CANVAS_ITEM_TYPE_LABELS } from "../../../constants";
import { getContrastText } from "../../../utils/getContrastText";
import type { PreviewSegment } from "../../../utils/previewParser";
import { parsePreviewContent } from "../../../utils/previewParser";

export type CanvasItemNodeData = {
  itemId: string;
  type: CanvasItemType;
  title: string;
  content: string;
  selectedPhotoUrl?: string;
  mentionLabels: Record<string, string>;
  onMentionClick: (sourceItemId: string, targetItemId: string) => void;
};

type CanvasItemNodeType = Node<CanvasItemNodeData, "canvasItem">;

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
  itemId: string,
  onMentionClick: (sourceItemId: string, targetItemId: string) => void,
): React.ReactNode {
  switch (segment.type) {
    case "mention-clickable":
      return (
        <MentionSpan
          key={index}
          label={segment.text}
          onClick={(e) => {
            e.stopPropagation();
            onMentionClick(itemId, segment.targetId);
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

function CanvasItemNodeComponent({ data }: NodeProps<CanvasItemNodeType>) {
  const theme = useTheme();
  // TODO: Map canvas item types to theme colors - stub for now
  const color = theme.palette.nodeTypes.npc.light;
  const label = CANVAS_ITEM_TYPE_LABELS[data.type];
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
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Selected photo thumbnail */}
        {data.selectedPhotoUrl && (
          <Box
            component="img"
            src={data.selectedPhotoUrl}
            alt=""
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.15,
              pointerEvents: "none",
            }}
          />
        )}
        <Box sx={{ position: "relative", zIndex: 1 }}>
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
              {segments.map((seg, i) => renderSegment(seg, i, data.itemId, data.onMentionClick))}
            </Typography>
          )}
        </Box>
      </Paper>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

export default memo(CanvasItemNodeComponent);
