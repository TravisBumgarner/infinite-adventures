import type { NodeTypes } from "@xyflow/react";
import { Background, BackgroundVariant, MiniMap, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useTheme } from "@mui/material";
import { useCallback, useEffect } from "react";
import * as api from "../../api/client";
import { SIDEBAR_WIDTH } from "../../constants";
import Toast from "../../sharedComponents/Toast";
import { useAppStore } from "../../stores/appStore";
import { useCanvasStore } from "../../stores/canvasStore";
import CanvasPicker from "./components/CanvasPicker";
import ConnectionsBrowser from "./components/ConnectionsBrowser";
import ContextMenu from "./components/ContextMenu";
import FilterBar from "./components/FilterBar";
import NodeContextMenu from "./components/NodeContextMenu";
import NoteEditor from "./components/NoteEditor";
import type { NoteNodeData } from "./components/NoteNode";
import NoteNodeComponent from "./components/NoteNode";
import SearchBar from "./components/SearchBar";
import { SettingsButton, SettingsSidebar } from "./components/SettingsModal";
import Toolbar from "./components/Toolbar";
import TopBar from "./components/TopBar";
import { useCanvasActions } from "./hooks/useCanvasActions";

const nodeTypes: NodeTypes = {
  note: NoteNodeComponent,
};

export default function Canvas() {
  const theme = useTheme();

  const canvases = useCanvasStore((s) => s.canvases);
  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const setCanvases = useCanvasStore((s) => s.setCanvases);
  const setActiveCanvasId = useCanvasStore((s) => s.setActiveCanvasId);
  const initActiveCanvas = useCanvasStore((s) => s.initActiveCanvas);
  const editingNoteId = useCanvasStore((s) => s.editingNoteId);
  const browsingNoteId = useCanvasStore((s) => s.browsingNoteId);
  const showSettings = useCanvasStore((s) => s.showSettings);
  const contextMenu = useCanvasStore((s) => s.contextMenu);
  const nodeContextMenu = useCanvasStore((s) => s.nodeContextMenu);
  const notesCache = useCanvasStore((s) => s.notesCache);
  const setEditingNoteId = useCanvasStore((s) => s.setEditingNoteId);
  const setBrowsingNoteId = useCanvasStore((s) => s.setBrowsingNoteId);
  const setContextMenu = useCanvasStore((s) => s.setContextMenu);
  const setNodeContextMenu = useCanvasStore((s) => s.setNodeContextMenu);
  const setShowSettings = useCanvasStore((s) => s.setShowSettings);

  const toastMessage = useAppStore((s) => s.toastMessage);
  const clearToast = useAppStore((s) => s.clearToast);

  // Fetch canvases on mount and initialize the active canvas
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const list = await api.fetchCanvases();
        if (!cancelled) {
          initActiveCanvas(list);
        }
      } catch {
        // Auth token may not be ready yet — retry once after a short delay
        if (!cancelled) {
          await new Promise((r) => setTimeout(r, 500));
          try {
            const list = await api.fetchCanvases();
            if (!cancelled) {
              initActiveCanvas(list);
            }
          } catch {
            // Still failing — session is likely invalid
          }
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [initActiveCanvas]);

  const {
    filteredNodes,
    filteredEdges,
    onNodesChange,
    onEdgesChange,
    handleSaved,
    handleDeleted,
    handleDeleteSelected,
    navigateToNote,
    createNoteAtPosition,
    handleToolbarCreate,
    handleViewAll,
    handleUnstack,
    handleExport,
    onConnect,
    onPaneContextMenu,
    onNodeContextMenu: onNodeCtxMenu,
    onSelectionContextMenu,
    onNodeDragStop,
    onMoveEnd,
    onPaneClick,
    viewportKey,
  } = useCanvasActions();

  // Canvas picker handlers
  const handleSwitchCanvas = useCallback(
    (canvasId: string) => {
      setActiveCanvasId(canvasId);
    },
    [setActiveCanvasId],
  );

  const handleCreateCanvas = useCallback(async () => {
    const canvas = await api.createCanvas({ name: "New Canvas" });
    setCanvases([...useCanvasStore.getState().canvases, canvas]);
    setActiveCanvasId(canvas.id);
  }, [setCanvases, setActiveCanvasId]);

  const handleRenameCanvas = useCallback(
    async (canvasId: string, newName: string) => {
      const updated = await api.updateCanvas(canvasId, { name: newName });
      setCanvases(
        useCanvasStore.getState().canvases.map((c) => (c.id === updated.id ? updated : c)),
      );
    },
    [setCanvases],
  );

  const handleDeleteCanvas = useCallback(
    async (canvasId: string) => {
      await api.deleteCanvas(canvasId);
      const remaining = useCanvasStore.getState().canvases.filter((c) => c.id !== canvasId);
      setCanvases(remaining);
      if (activeCanvasId === canvasId && remaining.length > 0) {
        setActiveCanvasId(remaining[0].id);
      }
    },
    [setCanvases, setActiveCanvasId, activeCanvasId],
  );

  // Don't render until we have an active canvas
  if (!activeCanvasId) return null;

  return (
    <div
      style={{
        width:
          editingNoteId || browsingNoteId || showSettings
            ? `calc(100vw - ${SIDEBAR_WIDTH}px)`
            : "100vw",
        height: "100vh",
        marginLeft: showSettings ? SIDEBAR_WIDTH : 0,
      }}
    >
      <ReactFlow
        nodes={filteredNodes}
        edges={filteredEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onPaneClick={onPaneClick}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeCtxMenu}
        onSelectionContextMenu={onSelectionContextMenu}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onMoveEnd={onMoveEnd}
        selectionOnDrag
        multiSelectionKeyCode="Shift"
        minZoom={0.1}
        fitView={!localStorage.getItem(viewportKey)}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} color="var(--color-surface0)" />
        <MiniMap
          style={{ background: "var(--color-mantle)" }}
          nodeColor={(node) =>
            theme.palette.nodeTypes[(node.data as NoteNodeData).type]?.light || "#4a90d9"
          }
          maskColor="var(--color-backdrop)"
          pannable
          zoomable
        />
      </ReactFlow>

      <TopBar
        left={
          <CanvasPicker
            canvases={canvases}
            activeCanvasId={activeCanvasId}
            onSwitch={handleSwitchCanvas}
            onCreate={handleCreateCanvas}
            onRename={handleRenameCanvas}
            onDelete={handleDeleteCanvas}
          />
        }
        center={
          <>
            <SearchBar canvasId={activeCanvasId} onNavigate={navigateToNote} />
            <FilterBar />
          </>
        }
        right={<SettingsButton onClick={() => setShowSettings(true)} />}
      />
      <Toolbar onCreate={handleToolbarCreate} />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onSelect={(type) => {
            createNoteAtPosition(type, contextMenu.flowX, contextMenu.flowY);
            setContextMenu(null);
          }}
          onViewAll={handleViewAll}
          onUnstack={handleUnstack}
          onClose={() => setContextMenu(null)}
        />
      )}

      {nodeContextMenu && (
        <NodeContextMenu
          x={nodeContextMenu.x}
          y={nodeContextMenu.y}
          noteId={nodeContextMenu.noteId}
          selectedCount={nodeContextMenu.selectedIds.length}
          onEdit={(noteId) => {
            setBrowsingNoteId(null);
            setEditingNoteId(noteId);
          }}
          onBrowseConnections={(noteId) => {
            setEditingNoteId(null);
            setBrowsingNoteId(noteId);
          }}
          onExport={handleExport}
          onDelete={async (noteId) => {
            await api.deleteNote(noteId);
            handleDeleted(noteId);
          }}
          onDeleteSelected={async () => {
            await handleDeleteSelected(nodeContextMenu.selectedIds);
            setNodeContextMenu(null);
          }}
          onClose={() => setNodeContextMenu(null)}
        />
      )}

      {editingNoteId && !browsingNoteId && (
        <NoteEditor
          noteId={editingNoteId}
          onClose={() => setEditingNoteId(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
          onNavigate={navigateToNote}
          notesCache={notesCache}
        />
      )}

      {browsingNoteId && (
        <ConnectionsBrowser
          noteId={browsingNoteId}
          notesCache={notesCache}
          onNavigate={navigateToNote}
          onClose={() => setBrowsingNoteId(null)}
        />
      )}

      <Toast open={!!toastMessage} message={toastMessage ?? ""} onClose={clearToast} />

      {showSettings && <SettingsSidebar />}
    </div>
  );
}
