import type { NodeTypes } from "@xyflow/react";
import { Background, BackgroundVariant, MiniMap, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useTheme } from "@mui/material";
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
            canvases={[]}
            activeCanvasId=""
            onSwitch={() => {}}
            onCreate={() => {}}
            onRename={() => {}}
            onDelete={() => {}}
          />
        }
        center={
          <>
            <SearchBar onNavigate={navigateToNote} />
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
