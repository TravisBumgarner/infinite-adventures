import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type { Node, NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import { memo } from "react";
import type { CanvasItemType } from "shared";
import { CANVAS_ITEM_TYPE_LABELS } from "../../constants";
import { getContrastText } from "../../utils/getContrastText";

export type TreeNodeData = {
  type: CanvasItemType;
  title: string;
};

export type TreeNodeType = Node<TreeNodeData, "tree">;

function TreeNode({ data }: NodeProps<TreeNodeType>) {
  const theme = useTheme();
  const color = theme.palette.canvasItemTypes[data.type].light;
  const label = CANVAS_ITEM_TYPE_LABELS[data.type];

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        style={{ visibility: "hidden" }}
        isConnectable={false}
      />
      <Paper
        sx={{
          bgcolor: "var(--color-base)",
          border: `2px solid ${color}`,
          p: 1.5,
          width: 200,
          color: "var(--color-text)",
        }}
      >
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
      </Paper>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ visibility: "hidden" }}
        isConnectable={false}
      />
    </>
  );
}

export default memo(TreeNode);
