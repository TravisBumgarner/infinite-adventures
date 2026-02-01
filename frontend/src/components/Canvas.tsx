import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  BackgroundVariant,
} from "@xyflow/react";
import type { Node, Edge, NodeTypes, OnNodeDrag, Connection } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import NoteNodeComponent from "./NoteNode";
import type { NoteNodeData } from "./NoteNode";
import NoteEditor from "./NoteEditor";
import SearchBar from "./SearchBar";
import ContextMenu from "./ContextMenu";
import NodeContextMenu from "./NodeContextMenu";
import Toolbar from "./Toolbar";
import type { Note, NoteType } from "../types";
import * as api from "../api/client";
import { TYPE_COLORS, NOTE_TEMPLATES, SIDEBAR_WIDTH } from "../constants";
import { getSelectedNodePositions, batchDeleteNotes } from "../utils/multiSelect";
import { appendMentionIfNew } from "../utils/edgeConnect";
import { filterNodes, filterEdges } from "../utils/canvasFilter";
import FilterBar from "./FilterBar";
import ConnectionsBrowser from "./ConnectionsBrowser";

const nodeTypes: NodeTypes = {
  note: NoteNodeComponent,
};

const VIEWPORT_KEY = "infinite-adventures-viewport";

function toFlowNode(
  note: Note,
  cache: Map<string, Note>,
  onMentionClick: (sourceNoteId: string, targetNoteId: string) => void
): Node<NoteNodeData> {
  // Build mentionLabels: scan content for @{id} and map each to the cached note title
  const mentionLabels: Record<string, string> = {};
  const mentionRegex = /@\{([^}]+)\}/g;
  let match;
  while ((match = mentionRegex.exec(note.content)) !== null) {
    const id = match[1];
    const cached = cache.get(id);
    mentionLabels[id] = cached ? cached.title : id;
  }

  return {
    id: note.id,
    type: "note",
    position: { x: note.canvas_x, y: note.canvas_y },
    data: {
      noteId: note.id,
      type: note.type,
      title: note.title,
      content: note.content,
      mentionLabels,
      onMentionClick,
    },
  };
}

function buildEdges(notes: Note[]): Edge[] {
  const edges: Edge[] = [];
  for (const note of notes) {
    if (!note.links_to) continue;
    for (const link of note.links_to) {
      edges.push({
        id: `${note.id}->${link.id}`,
        source: note.id,
        target: link.id,
        style: { stroke: "#585b70", strokeWidth: 1.5 },
        animated: false,
      });
    }
  }
  return edges;
}

export default function Canvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NoteNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    flowX: number;
    flowY: number;
  } | null>(null);
  const [nodeContextMenu, setNodeContextMenu] = useState<{
    x: number;
    y: number;
    noteId: string;
    selectedIds: string[];
  } | null>(null);
  const [browsingNoteId, setBrowsingNoteId] = useState<string | null>(null);
  const [activeTypes, setActiveTypes] = useState<Set<NoteType>>(new Set());
  const [filterSearch, setFilterSearch] = useState("");
  const reactFlowInstance = useReactFlow();
  const initialized = useRef(false);
  const notesCache = useRef<Map<string, Note>>(new Map());

  // Compute filtered nodes and edges for display
  const filteredNodes = useMemo(
    () => filterNodes(nodes, activeTypes, filterSearch),
    [nodes, activeTypes, filterSearch]
  );
  const visibleNodeIds = useMemo(
    () => new Set(filteredNodes.map((n) => n.id)),
    [filteredNodes]
  );
  const filteredEdges = useMemo(
    () => filterEdges(edges, visibleNodeIds),
    [edges, visibleNodeIds]
  );

  const handleToggleType = useCallback((type: NoteType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  // Fit viewport to show both source and target notes
  const fitBothNotes = useCallback(
    (sourceId: string, targetId: string) => {
      reactFlowInstance.fitView({
        nodes: [{ id: sourceId }, { id: targetId }],
        duration: 500,
        padding: 0.3,
      });
    },
    [reactFlowInstance]
  );

  // Load all notes and edges on mount
  const loadAllNotes = useCallback(async () => {
    const summaries = await api.fetchNotes();
    const fullNotes = await Promise.all(
      summaries.map((n) => api.fetchNote(n.id))
    );
    notesCache.current = new Map(fullNotes.map((n) => [n.id, n]));
    setNodes(fullNotes.map((n) => toFlowNode(n, notesCache.current, fitBothNotes)));
    setEdges(buildEdges(fullNotes));
  }, [setNodes, setEdges, fitBothNotes]);

  useEffect(() => {
    loadAllNotes();
  }, [loadAllNotes]);

  // Restore viewport from localStorage
  useEffect(() => {
    if (initialized.current) return;
    const saved = localStorage.getItem(VIEWPORT_KEY);
    if (saved) {
      try {
        const viewport = JSON.parse(saved);
        reactFlowInstance.setViewport(viewport);
      } catch {
        // ignore invalid stored viewport
      }
    }
    initialized.current = true;
  }, [reactFlowInstance]);

  // Save viewport on move
  const onMoveEnd = useCallback(() => {
    const viewport = reactFlowInstance.getViewport();
    localStorage.setItem(VIEWPORT_KEY, JSON.stringify(viewport));
  }, [reactFlowInstance]);

  // Navigate to a note by ID, offsetting for the sidebar that will open
  const navigateToNote = useCallback(
    (noteId: string) => {
      const note = notesCache.current.get(noteId);
      if (note) {
        const zoom = 1.2;
        const offsetX = SIDEBAR_WIDTH / 2 / zoom;
        reactFlowInstance.setCenter(note.canvas_x - offsetX, note.canvas_y, {
          zoom,
          duration: 500,
        });
        setEditingNoteId(noteId);
      }
    },
    [reactFlowInstance]
  );

  // Create a note at a specific flow position
  const createNoteAtPosition = useCallback(
    async (type: NoteType, flowX: number, flowY: number) => {
      const note = await api.createNote({
        type,
        title: "New Note",
        content: NOTE_TEMPLATES[type],
        canvas_x: flowX,
        canvas_y: flowY,
      });
      const fullNote = await api.fetchNote(note.id);
      notesCache.current.set(fullNote.id, fullNote);
      setNodes((nds) => [...nds, toFlowNode(fullNote, notesCache.current, fitBothNotes)]);
      setEditingNoteId(note.id);
    },
    [setNodes, fitBothNotes]
  );

  // Right-click canvas to open context menu
  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        flowX: position.x,
        flowY: position.y,
      });
    },
    [reactFlowInstance]
  );

  // Right-click a node to open node context menu
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      // Snapshot selected IDs now, before React Flow changes selection
      const selectedIds = nodes.filter((n) => n.selected).map((n) => n.id);
      setNodeContextMenu({
        x: event.clientX,
        y: event.clientY,
        noteId: node.id,
        selectedIds,
      });
    },
    [nodes]
  );

  // Right-click a multi-selection area to open context menu
  const onSelectionContextMenu = useCallback(
    (event: React.MouseEvent, selectedNodes: Node[]) => {
      event.preventDefault();
      const selectedIds = selectedNodes.map((n) => n.id);
      setNodeContextMenu({
        x: event.clientX,
        y: event.clientY,
        noteId: selectedIds[0],
        selectedIds,
      });
    },
    []
  );

  // View All: fit all nodes in viewport
  const handleViewAll = useCallback(() => {
    reactFlowInstance.fitView({ duration: 500 });
  }, [reactFlowInstance]);

  // Toolbar: create note at viewport center (offset for sidebar if open)
  const handleToolbarCreate = useCallback(
    (type: NoteType) => {
      const sidebarOpen = editingNoteId || browsingNoteId;
      const availableWidth = sidebarOpen ? window.innerWidth - SIDEBAR_WIDTH : window.innerWidth;
      const center = reactFlowInstance.screenToFlowPosition({
        x: availableWidth / 2,
        y: window.innerHeight / 2,
      });
      createNoteAtPosition(type, center.x, center.y);
    },
    [reactFlowInstance, createNoteAtPosition, editingNoteId, browsingNoteId]
  );

  // Drag end to save positions for all selected nodes
  const onNodeDragStop: OnNodeDrag = useCallback((_event, _node, draggedNodes) => {
    const positions = getSelectedNodePositions(draggedNodes);
    for (const [id, pos] of positions) {
      api.updateNote(id, { canvas_x: pos.x, canvas_y: pos.y });
      const cached = notesCache.current.get(id);
      if (cached) {
        notesCache.current.set(id, { ...cached, canvas_x: pos.x, canvas_y: pos.y });
      }
    }
  }, []);

  // Handle edge creation by dragging between handles
  const onConnect = useCallback(
    async (connection: Connection) => {
      const sourceNote = notesCache.current.get(connection.source);
      if (!sourceNote) return;

      const newContent = appendMentionIfNew(sourceNote.content, connection.target);
      if (newContent === null) return; // duplicate, no-op

      const updated = await api.updateNote(sourceNote.id, { content: newContent });
      // Re-fetch to get updated links and rebuild canvas
      const fullNote = await api.fetchNote(updated.id);
      notesCache.current.set(fullNote.id, fullNote);

      const allNotes = Array.from(notesCache.current.values());
      setNodes(allNotes.map((n) => toFlowNode(n, notesCache.current, fitBothNotes)));
      setEdges(buildEdges(allNotes));
    },
    [setNodes, setEdges, fitBothNotes]
  );

  // Editor callbacks
  const handleSaved = useCallback(
    async (note: Note) => {
      // Re-fetch to get updated links
      const fullNote = await api.fetchNote(note.id);
      notesCache.current.set(fullNote.id, fullNote);

      // Check if new notes were auto-created by link resolution
      const summaries = await api.fetchNotes();
      const newNoteIds = summaries
        .map((s) => s.id)
        .filter((id) => !notesCache.current.has(id));

      const newNotes = await Promise.all(
        newNoteIds.map((id) => api.fetchNote(id))
      );
      for (const n of newNotes) {
        notesCache.current.set(n.id, n);
      }

      // Rebuild all nodes and edges
      const allNotes = Array.from(notesCache.current.values());
      setNodes(allNotes.map((n) => toFlowNode(n, notesCache.current, fitBothNotes)));
      setEdges(buildEdges(allNotes));
    },
    [setNodes, setEdges, fitBothNotes]
  );

  const handleDeleted = useCallback(
    (noteId: string) => {
      notesCache.current.delete(noteId);
      setNodes((nds) => nds.filter((n) => n.id !== noteId));
      setEdges((eds) =>
        eds.filter((e) => e.source !== noteId && e.target !== noteId)
      );
      setEditingNoteId(null);
    },
    [setNodes, setEdges]
  );

  // Batch-delete nodes by explicit IDs
  const handleDeleteSelected = useCallback(async (idsToDelete: string[]) => {
    if (idsToDelete.length === 0) return;
    const deletedIds = await batchDeleteNotes(idsToDelete, api.deleteNote);
    for (const id of deletedIds) {
      notesCache.current.delete(id);
    }
    const deletedSet = new Set(deletedIds);
    setNodes((nds) => nds.filter((n) => !deletedSet.has(n.id)));
    setEdges((eds) =>
      eds.filter((e) => !deletedSet.has(e.source) && !deletedSet.has(e.target))
    );
    setEditingNoteId(null);
  }, [setNodes, setEdges]);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={filteredNodes}
        edges={filteredEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onPaneClick={() => {
          setEditingNoteId(null);
          setBrowsingNoteId(null);
          setContextMenu(null);
          setNodeContextMenu(null);
        }}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        onSelectionContextMenu={onSelectionContextMenu}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onMoveEnd={onMoveEnd}
        selectionOnDrag
        multiSelectionKeyCode="Shift"
        minZoom={0.1}
        fitView={!localStorage.getItem(VIEWPORT_KEY)}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} color="#313244" />
        <MiniMap
          style={{ background: "#181825" }}
          nodeColor={(node) => TYPE_COLORS[(node.data as NoteNodeData).type] || "#4a90d9"}
          maskColor="rgba(0,0,0,0.4)"
          pannable
          zoomable
        />
      </ReactFlow>

      <SearchBar onNavigate={navigateToNote} />
      <FilterBar
        activeTypes={activeTypes}
        search={filterSearch}
        onToggleType={handleToggleType}
        onSearchChange={setFilterSearch}
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
          notesCache={notesCache.current}
        />
      )}

      {browsingNoteId && (
        <ConnectionsBrowser
          noteId={browsingNoteId}
          notesCache={notesCache.current}
          onNavigate={navigateToNote}
          onClose={() => setBrowsingNoteId(null)}
        />
      )}
    </div>
  );
}
