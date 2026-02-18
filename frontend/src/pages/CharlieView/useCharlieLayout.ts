import type { Edge, Node } from "@xyflow/react";
import { useCallback, useEffect, useState } from "react";
import { fetchItem, fetchItems } from "../../api/client";
import { buildEdges } from "../../utils/buildEdges";
import type { CharlieNodeData } from "./CharlieNode";
import { PEPE_NODES } from "./pepeNodes";

const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;
const PADDING = 12;

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

/**
 * Pack nodes into a tight grid then jitter positions randomly
 * so it looks like someone frantically pinned them to a board.
 */
function scatterLayout(count: number, rand: () => number): { x: number; y: number }[] {
  const cols = Math.ceil(Math.sqrt(count));
  const cellW = NODE_WIDTH + PADDING;
  const cellH = NODE_HEIGHT + PADDING;

  return Array.from({ length: count }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const jitterX = (rand() - 0.5) * 48;
    const jitterY = (rand() - 0.5) * 48;
    return {
      x: col * cellW + jitterX,
      y: row * cellH + jitterY,
    };
  });
}

export function useCharlieLayout(canvasId: string | null) {
  const [nodes, setNodes] = useState<Node<CharlieNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);

  const computeLayout = useCallback(async (canvasId: string) => {
    setLoading(true);

    const summaries = await fetchItems(canvasId);
    const fullItems = await Promise.all(summaries.map((s) => fetchItem(s.id)));
    const rawEdges = buildEdges(fullItems);

    const rand = seededRandom(42);

    // Connect pepe nodes to random real nodes
    const pepeEdges: Edge[] = [];
    if (fullItems.length > 0) {
      for (const p of PEPE_NODES) {
        const target = fullItems[Math.floor(rand() * fullItems.length)];
        pepeEdges.push({
          id: `${p.id}<->${target.id}`,
          source: p.id,
          target: target.id,
          type: "redString",
        });
      }
    }

    const allEdges = [...rawEdges, ...pepeEdges];

    // Shuffle all items together so pepe nodes are interspersed
    const allItems = [
      ...fullItems.map((item) => ({ kind: "real" as const, item })),
      ...PEPE_NODES.map((p) => ({ kind: "pepe" as const, item: p })),
    ];
    // Fisher-Yates shuffle with seeded random
    for (let i = allItems.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [allItems[i], allItems[j]] = [allItems[j], allItems[i]];
    }

    const positions = scatterLayout(allItems.length, rand);

    const layoutNodes: Node<CharlieNodeData>[] = allItems.map((entry, i) => {
      const pos = positions[i];
      if (entry.kind === "real") {
        const realItem = entry.item;
        const mainPhoto = realItem.photos.find((p) => p.isMainPhoto) ?? realItem.photos[0];
        return {
          id: realItem.id,
          type: "charlie" as const,
          position: { x: pos.x, y: pos.y },
          data: {
            type: realItem.type,
            title: realItem.title,
            photoUrl: mainPhoto?.url,
            photoAspectRatio: mainPhoto?.aspectRatio,
          },
        };
      }
      const pepeItem = entry.item;
      return {
        id: pepeItem.id,
        type: "charlie" as const,
        position: { x: pos.x, y: pos.y },
        data: {
          type: pepeItem.type,
          title: pepeItem.title,
        },
      };
    });

    const layoutEdges: Edge[] = allEdges.map((e) => ({
      ...e,
      type: "redString",
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
