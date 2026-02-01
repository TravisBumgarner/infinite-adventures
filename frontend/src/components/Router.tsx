import { ReactFlowProvider } from "@xyflow/react";
import Canvas from "../pages/Canvas/Canvas";

export default function Router() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  );
}
