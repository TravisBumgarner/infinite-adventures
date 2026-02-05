import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type { Node, NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import { memo } from "react";
import type { CanvasItemType } from "shared";
import { CANVAS_ITEM_TYPE_LABELS } from "../../../constants";
import { getContrastText } from "../../../utils/getContrastText";

export type CanvasItemNodeData = {
  itemId: string;
  type: CanvasItemType;
  title: string;
  content: string;
  selectedPhotoUrl?: string;
  mentionLabels: Record<string, string>;
  onMentionClick: (sourceItemId: string, targetItemId: string) => void;
  notesCount: number;
  photosCount: number;
  connectionsCount: number;
  isFocused?: boolean;
};

type CanvasItemNodeType = Node<CanvasItemNodeData, "canvasItem">;

function CanvasItemNodeComponent({ data }: NodeProps<CanvasItemNodeType>) {
  const theme = useTheme();
  const color = theme.palette.canvasItemTypes[data.type].light;
  const label = CANVAS_ITEM_TYPE_LABELS[data.type];

  // Build metadata string
  const metaText = [
    `${data.notesCount} Note${data.notesCount !== 1 ? "s" : ""}`,
    `${data.photosCount} Photo${data.photosCount !== 1 ? "s" : ""}`,
    `${data.connectionsCount} Connection${data.connectionsCount !== 1 ? "s" : ""}`,
  ].join(" · ");

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <Paper
        sx={{
          bgcolor: "var(--color-base)",
          border: `${data.isFocused ? 3 : 2}px solid ${color}`,
          borderRadius: 2,
          p: 1.5,
          minWidth: 210,
          maxWidth: 270,
          color: "var(--color-text)",
          boxShadow: data.isFocused ? `0 0 12px 2px ${color}` : "none",
          transform: data.isFocused ? "scale(1.02)" : "none",
          transition: "box-shadow 0.2s, transform 0.2s, border 0.2s",
        }}
      >
        {/* Row 1: Title (left) + Type pill (right) */}
        <Box
          sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
            }}
          >
            {data.title}
          </Typography>
          <Chip
            label={label}
            size="small"
            sx={{
              bgcolor: color,
              color: getContrastText(color),
              fontSize: 11,
              fontWeight: 600,
              height: 20,
              flexShrink: 0,
            }}
          />
        </Box>

        {/* Row 2: Image (if present) */}
        {data.selectedPhotoUrl && (
          <Box
            sx={{
              width: "100%",
              maxHeight: 280,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              borderRadius: 1,
              mt: 1,
            }}
          >
            <Box
              component="img"
              src={data.selectedPhotoUrl}
              alt=""
              sx={{
                width: "100%",
                height: "auto",
              }}
            />
          </Box>
        )}

        {/* Row 3: Metadata */}
        <Box
          sx={{
            bgcolor: "var(--color-surface0)",
            borderRadius: 1,
            px: 1,
            py: 0.5,
            mt: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "var(--color-subtext0)",
              display: "block",
            }}
          >
            {metaText}
          </Typography>
        </Box>
      </Paper>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

export default memo(CanvasItemNodeComponent);
