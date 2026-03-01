import type { EdgeTypes, NodeTypes } from "@xyflow/react";
import { Background, BackgroundVariant, MiniMap, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useTheme } from "@mui/material";
import { toPng } from "html-to-image";
import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SIDEBAR_WIDTH } from "../../constants";
import { useDeleteItem } from "../../hooks/mutations";
import { useCanvases } from "../../hooks/queries";
import { logger } from "../../lib/logger";
import { MODAL_ID, useModalStore } from "../../modals";
import QueryErrorDisplay from "../../sharedComponents/QueryErrorDisplay";
import { useCanvasStore } from "../../stores/canvasStore";
import { useTagStore } from "../../stores/tagStore";
import type { CanvasItemNodeData } from "./components/CanvasItemNode";
import CanvasItemNodeComponent from "./components/CanvasItemNode";
import CanvasItemPanel from "./components/CanvasItemPanel";
import ContextMenu from "./components/ContextMenu";
import CountEdge from "./components/CountEdge";
import NodeContextMenu from "./components/NodeContextMenu";
import SelectionSync from "./components/SelectionBox";
import SelectionContextMenu from "./components/SelectionContextMenu";
import Toolbar from "./components/Toolbar";
import { useCanvasActions } from "./hooks/useCanvasActions";

const nodeTypes: NodeTypes = {
  canvasItem: CanvasItemNodeComponent,
};

const edgeTypes: EdgeTypes = {
  count: CountEdge,
};

export default function Canvas() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const initActiveCanvas = useCanvasStore((s) => s.initActiveCanvas);
  const editingItemId = useCanvasStore((s) => s.editingItemId);
  const showSettings = useCanvasStore((s) => s.showSettings);
  const contextMenu = useCanvasStore((s) => s.contextMenu);
  const nodeContextMenu = useCanvasStore((s) => s.nodeContextMenu);
  const selectionContextMenu = useCanvasStore((s) => s.selectionContextMenu);
  const itemsCache = useCanvasStore((s) => s.itemsCache);
  const setEditingItemId = useCanvasStore((s) => s.setEditingItemId);
  const setContextMenu = useCanvasStore((s) => s.setContextMenu);
  const setNodeContextMenu = useCanvasStore((s) => s.setNodeContextMenu);
  const setSelectionContextMenu = useCanvasStore((s) => s.setSelectionContextMenu);

  // Clear editing panel when leaving Canvas
  useEffect(() => {
    return () => setEditingItemId(null);
  }, [setEditingItemId]);

  // Fetch canvases via React Query and initialize the active canvas
  const { data: canvases = [], error: canvasesError, refetch: refetchCanvases } = useCanvases();
  useEffect(() => {
    if (canvases.length > 0) {
      initActiveCanvas(canvases);
    }
  }, [canvases, initActiveCanvas]);

  const {
    filteredNodes,
    filteredEdges,
    onNodesChange,
    onEdgesChange,
    handleSaved,
    handleDeleted,
    navigateToItem,
    createItemAtPosition,
    handleToolbarCreate,
    handleViewAll,
    handleUnstack,
    onPaneContextMenu,
    onNodeClick,
    onNodeContextMenu,
    onSelectionContextMenu,
    onNodeDragStop,
    onMoveEnd,
    onPaneClick,
    handleBulkDelete,
    handleAddTag,
    handleBulkAddTag,
    clearSelection,
    viewportKey,
    onDrop,
    onDragOver,
  } = useCanvasActions();

  // Navigate to a specific item when arriving via ?focus=<itemId>
  const focusId = searchParams.get("focus");
  useEffect(() => {
    if (!focusId || filteredNodes.length === 0) return;
    navigateToItem(focusId);
    setSearchParams({}, { replace: true });
  }, [focusId, filteredNodes.length, navigateToItem, setSearchParams]);

  const deleteItemMutation = useDeleteItem(activeCanvasId ?? "");

  const handleExportPdf = useCallback(async () => {
    // Find the ReactFlow viewport (contains the actual nodes)
    const viewport = document.querySelector(".react-flow__viewport") as HTMLElement;
    if (!viewport) return;

    try {
      // Capture using html-to-image which handles transforms better
      const dataUrl = await toPng(viewport, {
        backgroundColor: "#1e1e2e",
        pixelRatio: 2,
        filter: (node) => {
          // Filter out minimap and controls
          const className = node.className?.toString() || "";
          return (
            !className.includes("react-flow__minimap") &&
            !className.includes("react-flow__controls")
          );
        },
      });

      // Open in new window for printing
      const canvasName = canvases.find((c) => c.id === activeCanvasId)?.name ?? "Canvas";
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(
          "<!DOCTYPE html><html><head><title>" +
            canvasName +
            "</title><style>" +
            "body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }" +
            "img { max-width: 100%; height: auto; }" +
            "@media print { body { background: #fff; } img { max-width: 100%; } }" +
            "</style></head><body>" +
            '<img id="canvas-img" src="' +
            dataUrl +
            '" />' +
            "<script>document.getElementById('canvas-img').onload = function() { window.print(); };</script>" +
            "</body></html>",
        );
        printWindow.document.close();
      }
    } catch (error) {
      logger.error("Failed to export canvas", error);
    }
  }, [canvases, activeCanvasId]);

  // Modal store
  const openModal = useModalStore((s) => s.openModal);

  // Refs to avoid stale closures in keyboard handler
  const filteredNodesRef = useRef(filteredNodes);
  filteredNodesRef.current = filteredNodes;
  const handleBulkDeleteRef = useRef(handleBulkDelete);
  handleBulkDeleteRef.current = handleBulkDelete;
  const clearSelectionRef = useRef(clearSelection);
  clearSelectionRef.current = clearSelection;

  // Keyboard handler for delete and escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key === "Escape") {
        clearSelectionRef.current();
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        const selectedNodes = filteredNodesRef.current.filter((n) => n.selected);
        if (selectedNodes.length > 0) {
          e.preventDefault();
          openModal({
            id: MODAL_ID.BULK_DELETE,
            itemCount: selectedNodes.length,
            onConfirm: () => handleBulkDeleteRef.current(selectedNodes.map((n) => n.id)),
          });
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openModal]);

  if (canvasesError) return <QueryErrorDisplay error={canvasesError} onRetry={refetchCanvases} />;
  // Don't render until we have an active canvas
  if (!activeCanvasId) return null;

  return (
    <div
      role="application"
      style={{
        display: "flex",
        width: showSettings ? `calc(100vw - ${SIDEBAR_WIDTH}px)` : "100vw",
        height: "100%",
        marginLeft: showSettings ? SIDEBAR_WIDTH : 0,
      }}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <div style={{ flex: 1, position: "relative" }}>
        <ReactFlow
          nodes={filteredNodes}
          edges={filteredEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onPaneClick={onPaneClick}
          onPaneContextMenu={onPaneContextMenu}
          onNodeClick={onNodeClick}
          onNodeContextMenu={onNodeContextMenu}
          onSelectionContextMenu={onSelectionContextMenu}
          onNodeDragStop={onNodeDragStop}
          onMoveEnd={onMoveEnd}
          selectionOnDrag
          panOnDrag={[1, 2]}
          deleteKeyCode={null}
          selectionKeyCode={null}
          multiSelectionKeyCode="Meta"
          minZoom={0.1}
          fitView={!localStorage.getItem(viewportKey)}
          proOptions={{ hideAttribution: true }}
        >
          <SelectionSync />
          <Background variant={BackgroundVariant.Dots} gap={20} color="var(--color-surface0)" />
          <MiniMap
            style={{ background: "var(--color-mantle)" }}
            nodeColor={(node) =>
              theme.palette.canvasItemTypes[(node.data as CanvasItemNodeData).type]?.light ||
              "#4a90d9"
            }
            maskColor="var(--color-backdrop)"
            pannable
            zoomable
          />
        </ReactFlow>

        <Toolbar onCreate={handleToolbarCreate} />

        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onSelect={(type) => {
              createItemAtPosition(type, contextMenu.flowX, contextMenu.flowY);
              setContextMenu(null);
            }}
            onViewAll={handleViewAll}
            onUnstack={handleUnstack}
            onExportPdf={handleExportPdf}
            onShare={() => {
              if (activeCanvasId) {
                openModal({ id: MODAL_ID.SHARE, canvasId: activeCanvasId });
              }
            }}
            onClose={() => setContextMenu(null)}
          />
        )}

        {nodeContextMenu && (
          <NodeContextMenu
            x={nodeContextMenu.x}
            y={nodeContextMenu.y}
            nodeId={nodeContextMenu.nodeId}
            nodeTitle={itemsCache.get(nodeContextMenu.nodeId)?.title ?? "this item"}
            nodeType={itemsCache.get(nodeContextMenu.nodeId)?.type}
            tags={(() => {
              const allTags = Object.values(useTagStore.getState().tags);
              const nodeTagIds = new Set(
                itemsCache.get(nodeContextMenu.nodeId)?.tags.map((t) => t.id) ?? [],
              );
              return allTags.filter((t) => !nodeTagIds.has(t.id));
            })()}
            onDelete={async () => {
              await deleteItemMutation.mutateAsync(nodeContextMenu.nodeId);
              handleDeleted(nodeContextMenu.nodeId);
            }}
            onAddTag={(tagId) => handleAddTag(nodeContextMenu.nodeId, tagId)}
            onOpenInSessionViewer={() => navigate(`/sessions/${nodeContextMenu.nodeId}`)}
            onShare={() => {
              if (activeCanvasId) {
                const item = itemsCache.get(nodeContextMenu.nodeId);
                openModal({
                  id: MODAL_ID.SHARE,
                  canvasId: activeCanvasId,
                  itemId: nodeContextMenu.nodeId,
                  itemTitle: item?.title,
                });
              }
            }}
            onClose={() => setNodeContextMenu(null)}
          />
        )}

        {selectionContextMenu && (
          <SelectionContextMenu
            x={selectionContextMenu.x}
            y={selectionContextMenu.y}
            nodeIds={selectionContextMenu.nodeIds}
            tags={Object.values(useTagStore.getState().tags)}
            onBulkDelete={() => handleBulkDelete(selectionContextMenu.nodeIds)}
            onBulkAddTag={(tagId) => handleBulkAddTag(selectionContextMenu.nodeIds, tagId)}
            onClose={() => setSelectionContextMenu(null)}
          />
        )}
      </div>
      {editingItemId && (
        <CanvasItemPanel
          itemId={editingItemId}
          onClose={() => setEditingItemId(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
          onNavigate={navigateToItem}
          itemsCache={itemsCache}
        />
      )}
    </div>
  );
}
