import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Background,
  useNodesState,
  useReactFlow,
  BackgroundVariant,
} from "@xyflow/react";
import type { Node, NodeTypes, OnNodeDrag } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import NoteNodeComponent from "./NoteNode";
import type { NoteNodeData } from "./NoteNode";
import NoteEditor from "./NoteEditor";
import type { Note, NoteSummary } from "../types";
import * as api from "../api/client";

const nodeTypes: NodeTypes = {
  note: NoteNodeComponent,
};

const VIEWPORT_KEY = "infinite-adventures-viewport";

function toFlowNode(note: NoteSummary & { content?: string }): Node<NoteNodeData> {
  return {
    id: note.id,
    type: "note",
    position: { x: note.canvas_x, y: note.canvas_y },
    data: {
      noteId: note.id,
      type: note.type,
      title: note.title,
      content: (note as { content?: string }).content ?? "",
    },
  };
}

export default function Canvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NoteNodeData>>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const reactFlowInstance = useReactFlow();
  const initialized = useRef(false);

  // Load notes on mount
  useEffect(() => {
    api.fetchNotes().then((notes) => {
      // We need content for preview — fetch each note's full data
      Promise.all(notes.map((n) => api.fetchNote(n.id))).then((fullNotes) => {
        setNodes(fullNotes.map(toFlowNode));
      });
    });
  }, [setNodes]);

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
  }, []);

  // Editor callbacks
  const handleSaved = useCallback(
    (note: Note) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === note.id ? toFlowNode(note) : n
        )
      );
    },
    [setNodes]
  );

  const handleDeleted = useCallback(
    (noteId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== noteId));
      setEditingNoteId(null);
    },
    [setNodes]
  );

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={[]}
        onNodesChange={onNodesChange}
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

      {editingNoteId && (
        <NoteEditor
          noteId={editingNoteId}
          onClose={() => setEditingNoteId(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
