import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  BackgroundVariant,
} from "@xyflow/react";
import type { Node, Edge, NodeTypes, OnNodeDrag } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import NoteNodeComponent from "./NoteNode";
import type { NoteNodeData } from "./NoteNode";
import NoteEditor from "./NoteEditor";
import SearchBar from "./SearchBar";
import type { Note } from "../types";
import * as api from "../api/client";

const nodeTypes: NodeTypes = {
  note: NoteNodeComponent,
};

const VIEWPORT_KEY = "infinite-adventures-viewport";

function toFlowNode(note: Note): Node<NoteNodeData> {
  return {
    id: note.id,
    type: "note",
    position: { x: note.canvas_x, y: note.canvas_y },
    data: {
      noteId: note.id,
      type: note.type,
      title: note.title,
      content: note.content,
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
  const reactFlowInstance = useReactFlow();
  const initialized = useRef(false);
  const notesCache = useRef<Map<string, Note>>(new Map());

  // Load all notes and edges on mount
  const loadAllNotes = useCallback(async () => {
    const summaries = await api.fetchNotes();
    const fullNotes = await Promise.all(
      summaries.map((n) => api.fetchNote(n.id))
    );
    notesCache.current = new Map(fullNotes.map((n) => [n.id, n]));
    setNodes(fullNotes.map(toFlowNode));
    setEdges(buildEdges(fullNotes));
  }, [setNodes, setEdges]);

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
      const note = notesCache.current.get(noteId);
      if (note) {
        reactFlowInstance.setCenter(note.canvas_x, note.canvas_y, {
          zoom: 1.2,
          duration: 500,
        });
        setEditingNoteId(noteId);
      }
    },
    [reactFlowInstance]
  );

  // Double-click canvas to create new note
  const onPaneDoubleClick = useCallback(
    async (event: React.MouseEvent) => {
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const note = await api.createNote({
        type: "npc",
        title: "New Note",
        content: "",
        canvas_x: position.x,
        canvas_y: position.y,
      });
      const fullNote = await api.fetchNote(note.id);
      notesCache.current.set(fullNote.id, fullNote);
      setNodes((nds) => [...nds, toFlowNode(fullNote)]);
      setEditingNoteId(note.id);
    },
    [reactFlowInstance, setNodes]
  );

  // Click node to edit
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setEditingNoteId(node.id);
    },
    []
  );

  // Drag end to save position
  const onNodeDragStop: OnNodeDrag = useCallback((_event, node) => {
    api.updateNote(node.id, {
      canvas_x: node.position.x,
      canvas_y: node.position.y,
    });
    // Update cache
    const cached = notesCache.current.get(node.id);
    if (cached) {
      notesCache.current.set(node.id, {
        ...cached,
        canvas_x: node.position.x,
        canvas_y: node.position.y,
      });
    }
  }, []);

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
      setNodes(allNotes.map(toFlowNode));
      setEdges(buildEdges(allNotes));
    },
    [setNodes, setEdges]
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

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onPaneClick={() => setEditingNoteId(null)}
        onDoubleClick={onPaneDoubleClick}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        onMoveEnd={onMoveEnd}
        fitView={!localStorage.getItem(VIEWPORT_KEY)}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} color="#313244" />
        <MiniMap
          style={{ background: "#181825" }}
          nodeColor="#4a90d9"
          maskColor="rgba(0,0,0,0.4)"
        />
      </ReactFlow>

      <SearchBar onNavigate={navigateToNote} />

      {editingNoteId && (
        <NoteEditor
          noteId={editingNoteId}
          onClose={() => setEditingNoteId(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
          onNavigate={navigateToNote}
        />
      )}
    </div>
  );
}
