import type { EdgeProps } from "@xyflow/react";
import { BaseEdge, getStraightPath } from "@xyflow/react";

export default function RedStringEdge({ sourceX, sourceY, targetX, targetY }: EdgeProps) {
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return <BaseEdge path={edgePath} style={{ stroke: "#cc2200", strokeWidth: 2 }} />;
}
