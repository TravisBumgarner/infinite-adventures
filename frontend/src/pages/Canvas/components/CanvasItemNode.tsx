import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type { Node, NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import { memo, useMemo } from "react";
import type { CanvasItemType } from "shared";
import { CANVAS_ITEM_TYPE_LABELS } from "../../../constants";
import BlurImage from "../../../sharedComponents/BlurImage";
import { canvasItemTypeIcon, LabelBadge, TagBadge } from "../../../sharedComponents/LabelBadge";
import { useTagStore } from "../../../stores/tagStore";

export type CanvasItemNodeData = {
  itemId: string;
  type: CanvasItemType;
  title: string;
  summary: string;
  content: string;
  selectedPhotoUrl?: string;
  selectedPhotoAspectRatio?: number;
  selectedPhotoCropX?: number;
  selectedPhotoCropY?: number;
  mentionLabels: Record<string, string>;
  onMentionClick: (sourceItemId: string, targetItemId: string) => void;
  notesCount: number;
  photosCount: number;
  connectionsCount: number;
  isFocused?: boolean;
  tagIds: string[];
};

type CanvasItemNodeType = Node<CanvasItemNodeData, "canvasItem">;

function CanvasItemNodeComponent({ data }: NodeProps<CanvasItemNodeType>) {
  const theme = useTheme();
  const color = theme.palette.canvasItemTypes[data.type].light;
  const label = CANVAS_ITEM_TYPE_LABELS[data.type];
  const tagsById = useTagStore((s) => s.tags);

  const tags = useMemo(
    () => data.tagIds.map((id) => tagsById[id]).filter(Boolean),
    [data.tagIds, tagsById],
  );

  // Build metadata string
  const metaText = [
    `${data.notesCount} Note${data.notesCount !== 1 ? "s" : ""}`,
    `${data.photosCount} Photo${data.photosCount !== 1 ? "s" : ""}`,
    `${data.connectionsCount} Connection${data.connectionsCount !== 1 ? "s" : ""}`,
  ].join(" · ");

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
          border: `${data.isFocused ? 3 : 2}px solid ${color}`,
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
          <LabelBadge
            label={label}
            accentColor={color}
            icon={canvasItemTypeIcon(data.type)}
            sx={{ flexShrink: 0 }}
          />
        </Box>

        {/* Row 2: Summary (if present) */}
        {data.summary && (
          <Typography
            variant="caption"
            sx={{
              color: "var(--color-subtext0)",
              whiteSpace: "pre-wrap",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              mt: 0.5,
            }}
          >
            {data.summary}
          </Typography>
        )}

        {/* Row 3: Tags (if any) */}
        {tags.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.75 }}>
            {tags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} compact />
            ))}
          </Box>
        )}

        {/* Row 4: Image (if present) — square crop */}
        {data.selectedPhotoUrl && (
          <BlurImage
            src={data.selectedPhotoUrl}
            alt=""
            cropX={data.selectedPhotoCropX}
            cropY={data.selectedPhotoCropY}
            aspectRatio={data.selectedPhotoAspectRatio}
            sx={{
              width: "100%",
              aspectRatio: "1",
              mt: 1,
              borderRadius: 0.5,
            }}
          />
        )}

        {/* Row 5: Metadata */}
        <Box
          sx={{
            borderTop: "1px solid var(--color-surface1)",
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
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ visibility: "hidden" }}
        isConnectable={false}
      />
    </>
  );
}

export default memo(CanvasItemNodeComponent);
