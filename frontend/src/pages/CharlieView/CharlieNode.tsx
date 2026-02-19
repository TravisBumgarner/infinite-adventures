import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type { Node, NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import { memo } from "react";
import type { CanvasItemType } from "shared";
import { CANVAS_ITEM_TYPE_LABELS } from "../../constants";
import { getContrastText } from "../../utils/getContrastText";

export type CharlieNodeData = {
  type: CanvasItemType;
  title: string;
  photoUrl?: string;
  photoAspectRatio?: number;
};

export type CharlieNodeType = Node<CharlieNodeData, "charlie">;

function seededRotation(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return (hash % 600) / 100 - 3; // range: -3 to +3
}

function CharlieNode({ id, data }: NodeProps<CharlieNodeType>) {
  const theme = useTheme();
  const color = theme.palette.canvasItemTypes[data.type].light;
  const label = CANVAS_ITEM_TYPE_LABELS[data.type];
  const rotation = seededRotation(id);

  // Clamp aspect ratio to between 2:3 and 3:2
  const BASE = 180;
  const raw = data.photoAspectRatio ?? 1;
  const clamped = Math.min(3 / 2, Math.max(2 / 3, raw));
  const cardWidth = data.photoUrl ? BASE * Math.max(1, clamped) : BASE;
  const photoHeight = data.photoUrl ? cardWidth / clamped : 0;

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        style={{ visibility: "hidden" }}
        isConnectable={false}
      />
      <Box
        sx={{
          transform: `rotate(${rotation}deg)`,
          width: cardWidth,
          bgcolor: "#f5f0e1",
          boxShadow: "2px 3px 8px rgba(0,0,0,0.3)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Thumbtack pin */}
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            bgcolor: "#cc2200",
            position: "absolute",
            top: 4,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1,
            boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
          }}
        />

        {data.photoUrl && (
          <Box
            component="img"
            src={data.photoUrl}
            alt={data.title}
            sx={{
              width: "100%",
              height: photoHeight,
              objectFit: "cover",
              display: "block",
            }}
          />
        )}

        <Box sx={{ p: 1, pt: data.photoUrl ? 1 : 2.5 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: "#333",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: 12,
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
              fontSize: 10,
              fontWeight: 600,
              height: 18,
              mt: 0.5,
            }}
          />
        </Box>
      </Box>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ visibility: "hidden" }}
        isConnectable={false}
      />
    </>
  );
}

export default memo(CharlieNode);
