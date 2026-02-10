import type { EdgeTypes, NodeTypes } from "@xyflow/react";
import { Background, BackgroundVariant, MiniMap, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Box, Stack, useTheme } from "@mui/material";
import { toPng } from "html-to-image";
import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SIDEBAR_WIDTH } from "../../constants";
import {
  useCreateCanvas,
  useDeleteCanvas,
  useDeleteItem,
  useUpdateCanvas,
} from "../../hooks/mutations";
import { useCanvases } from "../../hooks/queries";
import { MODAL_ID, useModalStore } from "../../modals";
import { useCanvasStore } from "../../stores/canvasStore";
import type { CanvasItemNodeData } from "./components/CanvasItemNode";
import CanvasItemNodeComponent from "./components/CanvasItemNode";
import CanvasItemPanel from "./components/CanvasItemPanel";
import CanvasPicker from "./components/CanvasPicker";
import ContextMenu from "./components/ContextMenu";
import DeletableEdge from "./components/DeletableEdge";
import FilterBar from "./components/FilterBar";
import NodeContextMenu from "./components/NodeContextMenu";
import SearchBar from "./components/SearchBar";
import SelectionContextMenu from "./components/SelectionContextMenu";
import Toolbar from "./components/Toolbar";
import { useCanvasActions } from "./hooks/useCanvasActions";

const nodeTypes: NodeTypes = {
  canvasItem: CanvasItemNodeComponent,
};

const edgeTypes: EdgeTypes = {
  deletable: DeletableEdge,
};

export default function Canvas() {
  const theme = useTheme();
  const navigate = useNavigate();

  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const setActiveCanvasId = useCanvasStore((s) => s.setActiveCanvasId);
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

  // Fetch canvases via React Query and initialize the active canvas
  const { data: canvases = [] } = useCanvases();
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
    onConnect,
    onPaneContextMenu,
    onNodeClick,
    onNodeContextMenu,
    onSelectionContextMenu,
    onNodeDragStop,
    onMoveEnd,
    onPaneClick,
    handleBulkDelete,
    viewportKey,
    onDrop,
    onDragOver,
    onEdgeMouseEnter,
    onEdgeMouseLeave,
  } = useCanvasActions();

  // Canvas mutations
  const createCanvasMutation = useCreateCanvas();
  const updateCanvasMutation = useUpdateCanvas();
  const deleteCanvasMutation = useDeleteCanvas();
  const deleteItemMutation = useDeleteItem(activeCanvasId ?? "");

  // Canvas picker handlers
  const handleSwitchCanvas = useCallback(
    (canvasId: string) => {
      setActiveCanvasId(canvasId);
    },
    [setActiveCanvasId],
  );

  const handleCreateCanvas = useCallback(
    async (name: string) => {
      const canvas = await createCanvasMutation.mutateAsync({ name });
      setActiveCanvasId(canvas.id);
    },
    [createCanvasMutation, setActiveCanvasId],
  );

  const handleRenameCanvas = useCallback(
    async (canvasId: string, newName: string) => {
      await updateCanvasMutation.mutateAsync({ id: canvasId, input: { name: newName } });
    },
    [updateCanvasMutation],
  );

  const handleDeleteCanvas = useCallback(
    async (canvasId: string) => {
      await deleteCanvasMutation.mutateAsync(canvasId);
      if (activeCanvasId === canvasId) {
        const remaining = canvases.filter((c) => c.id !== canvasId);
        if (remaining.length > 0) {
          setActiveCanvasId(remaining[0].id);
        }
      }
    },
    [deleteCanvasMutation, activeCanvasId, canvases, setActiveCanvasId],
  );

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
      console.error("Failed to export canvas:", error);
    }
  }, [canvases, activeCanvasId]);

  // Modal store
  const openModal = useModalStore((s) => s.openModal);

  // Refs to avoid stale closures in keyboard handler
  const filteredNodesRef = useRef(filteredNodes);
  filteredNodesRef.current = filteredNodes;
  const handleBulkDeleteRef = useRef(handleBulkDelete);
  handleBulkDeleteRef.current = handleBulkDelete;

  // Keyboard handler for delete
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

  // Don't render until we have an active canvas
  if (!activeCanvasId) return null;

  return (
    <div
      role="application"
      style={{
        width: editingItemId || showSettings ? `calc(100vw - ${SIDEBAR_WIDTH}px)` : "100vw",
        height: "100vh",
        marginLeft: showSettings ? SIDEBAR_WIDTH : 0,
      }}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
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
        onConnect={onConnect}
        onMoveEnd={onMoveEnd}
        onEdgeMouseEnter={onEdgeMouseEnter}
        onEdgeMouseLeave={onEdgeMouseLeave}
        selectionOnDrag
        panOnDrag={[1, 2]}
        deleteKeyCode={null}
        selectionKeyCode={null}
        multiSelectionKeyCode={null}
        minZoom={0.1}
        fitView={!localStorage.getItem(viewportKey)}
        proOptions={{ hideAttribution: true }}
      >
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

      <Box
        sx={{
          position: "fixed",
          top: 72,
          left: showSettings ? SIDEBAR_WIDTH : 0,
          right: editingItemId ? SIDEBAR_WIDTH : 0,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
          transition: "left 0.2s, right 0.2s",
          zIndex: 50,
          "& > *": { pointerEvents: "auto" },
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <SearchBar canvasId={activeCanvasId} onNavigate={navigateToItem} />
          <FilterBar />
        </Stack>
      </Box>
      <Toolbar onCreate={handleToolbarCreate} />

      <Box
        sx={{
          position: "fixed",
          bottom: 16,
          left: showSettings ? SIDEBAR_WIDTH + 16 : 16,
          zIndex: 50,
          pointerEvents: "auto",
          transition: "left 0.2s",
        }}
      >
        <Box
          sx={{
            bgcolor: "var(--color-chrome-bg)",
            backdropFilter: "blur(8px)",
            border: "1px solid var(--color-surface1)",
            borderRadius: 2,
          }}
        >
          <CanvasPicker
            canvases={canvases}
            activeCanvasId={activeCanvasId}
            onSwitch={handleSwitchCanvas}
            onCreate={handleCreateCanvas}
            onRename={handleRenameCanvas}
            onDelete={handleDeleteCanvas}
          />
        </Box>
      </Box>

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
          onDelete={async () => {
            await deleteItemMutation.mutateAsync(nodeContextMenu.nodeId);
            handleDeleted(nodeContextMenu.nodeId);
          }}
          onOpenInSessionViewer={() => navigate(`/sessions/${nodeContextMenu.nodeId}`)}
          onClose={() => setNodeContextMenu(null)}
        />
      )}

      {selectionContextMenu && (
        <SelectionContextMenu
          x={selectionContextMenu.x}
          y={selectionContextMenu.y}
          nodeIds={selectionContextMenu.nodeIds}
          onBulkDelete={() => handleBulkDelete(selectionContextMenu.nodeIds)}
          onClose={() => setSelectionContextMenu(null)}
        />
      )}

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
