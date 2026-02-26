import type { Edge, Node } from "@xyflow/react";
import ELK from "elkjs/lib/elk.bundled.js";
import { useCallback, useEffect, useState } from "react";
import { fetchItem, fetchItems } from "../../api/index";
import { buildEdges } from "../../utils/buildEdges";
import type { TreeNodeData } from "./TreeNode";

const elk = new ELK();

const ELK_OPTIONS = {
  "elk.algorithm": "layered",
  "elk.direction": "DOWN",
  "elk.spacing.nodeNode": "60",
  "elk.layered.spacing.nodeNodeBetweenLayers": "80",
};

const NODE_WIDTH = 200;
const NODE_HEIGHT = 50;

export function useTreeLayout(canvasId: string | null) {
  const [nodes, setNodes] = useState<Node<TreeNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);

  const computeLayout = useCallback(async (canvasId: string) => {
    setLoading(true);

    const summaries = await fetchItems(canvasId);
    const fullItems = await Promise.all(summaries.map((s) => fetchItem(s.id)));
    const rawEdges = buildEdges(fullItems);

    const graph = {
      id: "root",
      layoutOptions: ELK_OPTIONS,
      children: fullItems.map((item) => ({
        id: item.id,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      })),
      edges: rawEdges.map((e) => ({
        id: e.id,
        sources: [e.source],
        targets: [e.target],
      })),
    };

    const layout = await elk.layout(graph);

    const layoutNodes: Node<TreeNodeData>[] = (layout.children ?? []).map((child) => {
      const item = fullItems.find((i) => i.id === child.id)!;
      return {
        id: child.id,
        type: "tree",
        position: { x: child.x ?? 0, y: child.y ?? 0 },
        data: { type: item.type, title: item.title },
      };
    });

    const layoutEdges: Edge[] = rawEdges.map((e) => ({
      ...e,
      type: "default",
    }));

    setNodes(layoutNodes);
    setEdges(layoutEdges);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (canvasId) {
      computeLayout(canvasId);
    }
  }, [canvasId, computeLayout]);

  return { nodes, edges, loading };
}
