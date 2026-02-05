import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import type { Edge, EdgeProps } from "@xyflow/react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/react";
import { MODAL_ID, useModalStore } from "../../../modals";

interface DeletableEdgeData extends Record<string, unknown> {
  onDelete: (sourceId: string, targetId: string) => void;
  sourceTitle: string;
  targetTitle: string;
  isHovered?: boolean;
}

type DeletableEdge = Edge<DeletableEdgeData, "deletable">;

export default function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  source,
  target,
  data,
  style,
  selected,
}: EdgeProps<DeletableEdge>) {
  const openModal = useModalStore((s) => s.openModal);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    openModal({
      id: MODAL_ID.DELETE_LINK,
      sourceTitle: data?.sourceTitle ?? "Unknown",
      targetTitle: data?.targetTitle ?? "Unknown",
      onConfirm: () => data?.onDelete?.(source, target),
    });
  };

  const showButton = data?.isHovered || selected;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        interactionWidth={20}
        style={{
          ...(style ?? {}),
          stroke: showButton ? "var(--color-red)" : style?.stroke,
          strokeWidth: showButton ? 2 : (style?.strokeWidth ?? 1.5),
        }}
      />
      {showButton && (
        <EdgeLabelRenderer>
          <IconButton
            size="small"
            onClick={handleDelete}
            sx={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
              bgcolor: "var(--color-red)",
              color: "var(--color-base)",
              width: 20,
              height: 20,
              "&:hover": {
                bgcolor: "var(--color-red)",
              },
            }}
          >
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
