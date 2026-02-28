import { Background, ReactFlow } from "@xyflow/react";
import { useMemo } from "react";
import { useCanvasStore } from "../../stores/canvasStore";
import TreeNodeComponent from "./TreeNode";
import { useTreeLayout } from "./useTreeLayout";

const nodeTypes = { tree: TreeNodeComponent };

export default function TreeView() {
  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const { nodes, edges, loading } = useTreeLayout(activeCanvasId);

  const defaultEdgeOptions = useMemo(
    () => ({
      style: { stroke: "var(--color-surface2)", strokeWidth: 1.5 },
    }),
    [],
  );

  if (loading) {
    return null;
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        deleteKeyCode={null}
        minZoom={0.1}
      >
        <Background />
      </ReactFlow>
    </div>
  );
}
