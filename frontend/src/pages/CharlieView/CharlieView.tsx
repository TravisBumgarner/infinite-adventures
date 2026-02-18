import { Background, BackgroundVariant, ReactFlow } from "@xyflow/react";
import { useMemo } from "react";
import { useCanvasStore } from "../../stores/canvasStore";
import CharlieNodeComponent from "./CharlieNode";
import RedStringEdge from "./RedStringEdge";
import { useCharlieLayout } from "./useCharlieLayout";

const nodeTypes = { charlie: CharlieNodeComponent };
const edgeTypes = { redString: RedStringEdge };

export default function CharlieView() {
  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const { nodes, edges, loading } = useCharlieLayout(activeCanvasId);

  const defaultEdgeOptions = useMemo(
    () => ({
      style: { stroke: "#cc2200", strokeWidth: 2 },
    }),
    [],
  );

  if (loading) {
    return null;
  }

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <style>{`.charlie-flow .react-flow__edges { z-index: 1 !important; }`}</style>
      <ReactFlow
        className="charlie-flow"
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        deleteKeyCode={null}
        minZoom={0.1}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="#8b6040"
          gap={20}
          style={{ backgroundColor: "#b08050" }}
        />
      </ReactFlow>
    </div>
  );
}
