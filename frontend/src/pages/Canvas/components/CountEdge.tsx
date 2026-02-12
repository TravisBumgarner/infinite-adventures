import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Edge, EdgeProps } from "@xyflow/react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/react";

interface CountEdgeData extends Record<string, unknown> {
  count: number;
}

type CountEdge = Edge<CountEdgeData, "count">;

export default function CountEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
}: EdgeProps<CountEdge>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} interactionWidth={20} style={style} />
      <EdgeLabelRenderer>
        <Box
          sx={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "none",
            bgcolor: "var(--color-surface2)",
            borderRadius: "50%",
            width: 20,
            height: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 600,
              color: "var(--color-text)",
              lineHeight: 1,
            }}
          >
            {data?.count ?? 0}
          </Typography>
        </Box>
      </EdgeLabelRenderer>
    </>
  );
}
