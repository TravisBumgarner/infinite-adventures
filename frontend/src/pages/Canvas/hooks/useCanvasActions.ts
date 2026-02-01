import type { Connection, Edge, Node } from "@xyflow/react";
import { useEdgesState, useNodesState, useReactFlow } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Note, NoteType } from "shared";
import * as api from "../../../api/client";
import { NOTE_TEMPLATES } from "../../../constants";
import { useAppStore } from "../../../stores/appStore";
import { useCanvasStore } from "../../../stores/canvasStore";
import { filterEdges, filterNodes } from "../../../utils/canvasFilter";
import { appendMentionIfNew } from "../../../utils/edgeConnect";
import { findOpenPosition, unstackNodes } from "../../../utils/findOpenPosition";
import { batchDeleteNotes, getSelectedNodePositions } from "../../../utils/multiSelect";
import { formatNoteExport } from "../../../utils/noteExport";
import type { NoteNodeData } from "../components/NoteNode";

const VIEWPORT_KEY = "infinite-adventures-viewport";

function toFlowNode(
  note: Note,
  cache: Map<string, Note>,
  onMentionClick: (sourceNoteId: string, targetNoteId: string) => void,
): Node<NoteNodeData> {
  const mentionLabels: Record<string, string> = {};
  const mentionRegex = /@\{([^}]+)\}/g;
  let match: RegExpExecArray | null = mentionRegex.exec(note.content);
  while (match !== null) {
    const id = match[1];
    const cached = cache.get(id);
    mentionLabels[id] = cached ? cached.title : id;
    match = mentionRegex.exec(note.content);
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
        style: { stroke: "var(--color-surface2)", strokeWidth: 1.5 },
        animated: false,
      });
    }
  }
  return edges;
}

export function useCanvasActions() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NoteNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const reactFlowInstance = useReactFlow();
  const initialized = useRef(false);

  const {
    setNotesCache,
    removeCachedNote,
    activeTypes,
    filterSearch,
    setEditingNoteId,
    setBrowsingNoteId,
    setContextMenu,
    setNodeContextMenu,
    setShowSettings,
  } = useCanvasStore();

  const showToast = useAppStore((s) => s.showToast);

  // Compute filtered nodes and edges for display
  const filteredNodes = useMemo(
    () => filterNodes(nodes, activeTypes, filterSearch),
    [nodes, activeTypes, filterSearch],
  );
  const visibleNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);
  const filteredEdges = useMemo(() => filterEdges(edges, visibleNodeIds), [edges, visibleNodeIds]);

  // Fit viewport to show both source and target notes
  const fitBothNotes = useCallback(
    (sourceId: string, targetId: string) => {
      reactFlowInstance.fitView({
        nodes: [{ id: sourceId }, { id: targetId }],
        duration: 500,
        padding: 0.3,
      });
    },
    [reactFlowInstance],
  );

  // Load all notes and edges on mount
  const loadAllNotes = useCallback(async () => {
    const summaries = await api.fetchNotes();
    const fullNotes = await Promise.all(summaries.map((n) => api.fetchNote(n.id)));
    const cache = new Map(fullNotes.map((n) => [n.id, n]));
    setNotesCache(cache);
    setNodes(fullNotes.map((n) => toFlowNode(n, cache, fitBothNotes)));
    setEdges(buildEdges(fullNotes));
  }, [setNodes, setEdges, fitBothNotes, setNotesCache]);

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

  // Navigate to a note by ID
  const navigateToNote = useCallback(
    (noteId: string) => {
      const note = useCanvasStore.getState().notesCache.get(noteId);
      if (note) {
        reactFlowInstance.setCenter(note.canvas_x, note.canvas_y, {
          zoom: 1.2,
          duration: 500,
        });
        setEditingNoteId(noteId);
      }
    },
    [reactFlowInstance, setEditingNoteId],
  );

  // Create a note at a specific flow position
  const createNoteAtPosition = useCallback(
    async (type: NoteType, flowX: number, flowY: number) => {
      const existing = nodes.map((n) => ({ x: n.position.x, y: n.position.y }));
      const pos = findOpenPosition(flowX, flowY, existing);
      const note = await api.createNote({
        type,
        title: "New Note",
        content: NOTE_TEMPLATES[type],
        canvas_x: pos.x,
        canvas_y: pos.y,
      });
      const fullNote = await api.fetchNote(note.id);
      const cache = useCanvasStore.getState().notesCache;
      const nextCache = new Map(cache);
      nextCache.set(fullNote.id, fullNote);
      setNotesCache(nextCache);
      setNodes((nds) => [...nds, toFlowNode(fullNote, nextCache, fitBothNotes)]);
      setEditingNoteId(note.id);
      setTimeout(() => {
        const zoom = reactFlowInstance.getZoom();
        reactFlowInstance.setCenter(pos.x, pos.y, { zoom, duration: 300 });
      }, 50);
    },
    [nodes, setNodes, fitBothNotes, reactFlowInstance, setNotesCache, setEditingNoteId],
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
    [reactFlowInstance, setContextMenu],
  );

  // Right-click a node to open node context menu
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      const selectedIds = nodes.filter((n) => n.selected).map((n) => n.id);
      setNodeContextMenu({
        x: event.clientX,
        y: event.clientY,
        noteId: node.id,
        selectedIds,
      });
    },
    [nodes, setNodeContextMenu],
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
    [setNodeContextMenu],
  );

  // View All: fit all nodes in viewport
  const handleViewAll = useCallback(() => {
    reactFlowInstance.fitView({ duration: 500 });
  }, [reactFlowInstance]);

  // Unstack overlapping notes
  const handleUnstack = useCallback(async () => {
    const identified = nodes.map((n) => ({
      id: n.id,
      x: n.position.x,
      y: n.position.y,
    }));
    const moves = unstackNodes(identified);
    if (moves.size === 0) return;

    const cache = useCanvasStore.getState().notesCache;
    const nextCache = new Map(cache);
    for (const [id, pos] of moves) {
      api.updateNote(id, { canvas_x: pos.x, canvas_y: pos.y });
      const cached = nextCache.get(id);
      if (cached) {
        nextCache.set(id, { ...cached, canvas_x: pos.x, canvas_y: pos.y });
      }
    }
    setNotesCache(nextCache);

    setNodes((nds) =>
      nds.map((n) => {
        const newPos = moves.get(n.id);
        return newPos ? { ...n, position: newPos } : n;
      }),
    );
  }, [nodes, setNodes, setNotesCache]);

  // Toolbar: create note at viewport center
  const handleToolbarCreate = useCallback(
    (type: NoteType) => {
      const center = reactFlowInstance.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      createNoteAtPosition(type, center.x, center.y);
    },
    [reactFlowInstance, createNoteAtPosition],
  );

  // Drag end to save positions for all selected nodes
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, _node: Node, draggedNodes: Node[]) => {
      const positions = getSelectedNodePositions(draggedNodes);
      const cache = useCanvasStore.getState().notesCache;
      const nextCache = new Map(cache);
      for (const [id, pos] of positions) {
        api.updateNote(id, { canvas_x: pos.x, canvas_y: pos.y });
        const cached = nextCache.get(id);
        if (cached) {
          nextCache.set(id, { ...cached, canvas_x: pos.x, canvas_y: pos.y });
        }
      }
      setNotesCache(nextCache);
    },
    [setNotesCache],
  );

  // Handle edge creation by dragging between handles
  const onConnect = useCallback(
    async (connection: Connection) => {
      const cache = useCanvasStore.getState().notesCache;
      const sourceNote = cache.get(connection.source);
      if (!sourceNote) return;

      const newContent = appendMentionIfNew(sourceNote.content, connection.target);
      if (newContent === null) return;

      const updated = await api.updateNote(sourceNote.id, { content: newContent });
      const fullNote = await api.fetchNote(updated.id);
      const nextCache = new Map(cache);
      nextCache.set(fullNote.id, fullNote);
      setNotesCache(nextCache);

      const allNotes = Array.from(nextCache.values());
      setNodes(allNotes.map((n) => toFlowNode(n, nextCache, fitBothNotes)));
      setEdges(buildEdges(allNotes));
    },
    [setNodes, setEdges, fitBothNotes, setNotesCache],
  );

  // Editor callbacks
  const handleSaved = useCallback(
    async (note: Note) => {
      const fullNote = await api.fetchNote(note.id);
      const cache = useCanvasStore.getState().notesCache;
      const nextCache = new Map(cache);
      nextCache.set(fullNote.id, fullNote);

      const summaries = await api.fetchNotes();
      const newNoteIds = summaries.map((s) => s.id).filter((id) => !nextCache.has(id));
      const newNotes = await Promise.all(newNoteIds.map((id) => api.fetchNote(id)));
      for (const n of newNotes) {
        nextCache.set(n.id, n);
      }
      setNotesCache(nextCache);

      const allNotes = Array.from(nextCache.values());
      setNodes(allNotes.map((n) => toFlowNode(n, nextCache, fitBothNotes)));
      setEdges(buildEdges(allNotes));
    },
    [setNodes, setEdges, fitBothNotes, setNotesCache],
  );

  const handleDeleted = useCallback(
    (noteId: string) => {
      removeCachedNote(noteId);
      setNodes((nds) => nds.filter((n) => n.id !== noteId));
      setEdges((eds) => eds.filter((e) => e.source !== noteId && e.target !== noteId));
      setEditingNoteId(null);
    },
    [setNodes, setEdges, removeCachedNote, setEditingNoteId],
  );

  // Batch-delete nodes by explicit IDs
  const handleDeleteSelected = useCallback(
    async (idsToDelete: string[]) => {
      if (idsToDelete.length === 0) return;
      const deletedIds = await batchDeleteNotes(idsToDelete, api.deleteNote);
      const cache = useCanvasStore.getState().notesCache;
      const nextCache = new Map(cache);
      for (const id of deletedIds) {
        nextCache.delete(id);
      }
      setNotesCache(nextCache);
      const deletedSet = new Set(deletedIds);
      setNodes((nds) => nds.filter((n) => !deletedSet.has(n.id)));
      setEdges((eds) => eds.filter((e) => !deletedSet.has(e.source) && !deletedSet.has(e.target)));
      setEditingNoteId(null);
    },
    [setNodes, setEdges, setNotesCache, setEditingNoteId],
  );

  // Export note and connections as text to clipboard
  const handleExport = useCallback(
    async (noteId: string) => {
      const cache = useCanvasStore.getState().notesCache;
      const note = cache.get(noteId);
      if (!note) return;
      const text = formatNoteExport(note, cache);
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard");
    },
    [showToast],
  );

  // Pane click to close all panels
  const onPaneClick = useCallback(() => {
    setEditingNoteId(null);
    setBrowsingNoteId(null);
    setContextMenu(null);
    setNodeContextMenu(null);
    setShowSettings(false);
  }, [setEditingNoteId, setBrowsingNoteId, setContextMenu, setNodeContextMenu, setShowSettings]);

  return {
    // React Flow state
    nodes,
    edges,
    filteredNodes,
    filteredEdges,
    onNodesChange,
    onEdgesChange,

    // Actions
    loadAllNotes,
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
    onNodeContextMenu,
    onSelectionContextMenu,
    onNodeDragStop,
    onMoveEnd,
    onPaneClick,

    // Viewport key for fitView check
    viewportKey: VIEWPORT_KEY,
  };
}
