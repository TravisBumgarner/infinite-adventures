import type { Connection, Edge, Node } from "@xyflow/react";
import { useEdgesState, useNodesState, useReactFlow } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { CanvasItem, CanvasItemType } from "shared";
import * as api from "../../../api/client";
import { useAppStore } from "../../../stores/appStore";
import { getViewportKey, useCanvasStore } from "../../../stores/canvasStore";
import { filterEdges, filterNodes } from "../../../utils/canvasFilter";
import { appendMentionIfNew } from "../../../utils/edgeConnect";
import { findOpenPosition, unstackNodes } from "../../../utils/findOpenPosition";
import { batchDeleteItems, getSelectedNodePositions } from "../../../utils/multiSelect";
import { formatItemExport } from "../../../utils/noteExport";
import type { CanvasItemNodeData } from "../components/CanvasItemNode";

function toFlowNode(
  item: CanvasItem,
  cache: Map<string, CanvasItem>,
  onMentionClick: (sourceItemId: string, targetItemId: string) => void,
): Node<CanvasItemNodeData> {
  const mentionLabels: Record<string, string> = {};
  const mentionRegex = /@\{([^}]+)\}/g;
  let match: RegExpExecArray | null = mentionRegex.exec(item.content.notes);
  while (match !== null) {
    const id = match[1];
    const cached = cache.get(id);
    mentionLabels[id] = cached ? cached.title : id;
    match = mentionRegex.exec(item.content.notes);
  }

  // Find selected photo URL
  const selectedPhoto = item.photos.find((p) => p.is_selected);

  return {
    id: item.id,
    type: "canvasItem",
    position: { x: item.canvas_x, y: item.canvas_y },
    data: {
      itemId: item.id,
      type: item.type,
      title: item.title,
      content: item.content.notes,
      selectedPhotoUrl: selectedPhoto?.url,
      mentionLabels,
      onMentionClick,
    },
  };
}

function buildEdges(items: CanvasItem[]): Edge[] {
  const edges: Edge[] = [];
  for (const item of items) {
    if (!item.links_to) continue;
    for (const link of item.links_to) {
      edges.push({
        id: `${item.id}->${link.id}`,
        source: item.id,
        target: link.id,
        style: { stroke: "var(--color-surface2)", strokeWidth: 1.5 },
        animated: false,
      });
    }
  }
  return edges;
}

export function useCanvasActions() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CanvasItemNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const reactFlowInstance = useReactFlow();
  const initialized = useRef(false);

  const {
    setItemsCache,
    removeCachedItem,
    activeTypes,
    filterSearch,
    setEditingItemId,
    setBrowsingItemId,
    setContextMenu,
    setNodeContextMenu,
    setShowSettings,
  } = useCanvasStore();

  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);

  const showToast = useAppStore((s) => s.showToast);

  // Compute filtered nodes and edges for display
  const filteredNodes = useMemo(
    () => filterNodes(nodes, activeTypes, filterSearch),
    [nodes, activeTypes, filterSearch],
  );
  const visibleNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);
  const filteredEdges = useMemo(() => filterEdges(edges, visibleNodeIds), [edges, visibleNodeIds]);

  // Fit viewport to show both source and target items
  const fitBothItems = useCallback(
    (sourceId: string, targetId: string) => {
      reactFlowInstance.fitView({
        nodes: [{ id: sourceId }, { id: targetId }],
        duration: 500,
        padding: 0.3,
      });
    },
    [reactFlowInstance],
  );

  // Load all items and edges for a canvas
  const loadAllItems = useCallback(
    async (canvasId: string) => {
      const summaries = await api.fetchItems(canvasId);
      const fullItems = await Promise.all(summaries.map((s) => api.fetchItem(s.id)));
      const cache = new Map(fullItems.map((i) => [i.id, i]));
      setItemsCache(cache);
      setNodes(fullItems.map((i) => toFlowNode(i, cache, fitBothItems)));
      setEdges(buildEdges(fullItems));
    },
    [setNodes, setEdges, fitBothItems, setItemsCache],
  );

  // Load items when activeCanvasId changes
  useEffect(() => {
    if (activeCanvasId) {
      loadAllItems(activeCanvasId);
    }
  }, [activeCanvasId, loadAllItems]);

  // Restore viewport from localStorage when canvas changes
  useEffect(() => {
    if (!activeCanvasId) return;
    const key = getViewportKey(activeCanvasId);
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const viewport = JSON.parse(saved);
        reactFlowInstance.setViewport(viewport);
      } catch {
        // ignore invalid stored viewport
      }
    }
    initialized.current = true;
  }, [activeCanvasId, reactFlowInstance]);

  // Save viewport on move
  const onMoveEnd = useCallback(() => {
    const canvasId = useCanvasStore.getState().activeCanvasId;
    if (!canvasId) return;
    const viewport = reactFlowInstance.getViewport();
    localStorage.setItem(getViewportKey(canvasId), JSON.stringify(viewport));
  }, [reactFlowInstance]);

  // Navigate to an item by ID
  const navigateToItem = useCallback(
    (itemId: string) => {
      const item = useCanvasStore.getState().itemsCache.get(itemId);
      if (item) {
        reactFlowInstance.setCenter(item.canvas_x, item.canvas_y, {
          zoom: 1.2,
          duration: 500,
        });
        setEditingItemId(itemId);
      }
    },
    [reactFlowInstance, setEditingItemId],
  );

  // Create an item at a specific flow position
  const createItemAtPosition = useCallback(
    async (type: CanvasItemType, flowX: number, flowY: number) => {
      const canvasId = useCanvasStore.getState().activeCanvasId;
      if (!canvasId) return;
      const existing = nodes.map((n) => ({ x: n.position.x, y: n.position.y }));
      const pos = findOpenPosition(flowX, flowY, existing);
      const item = await api.createItem(canvasId, {
        type,
        title: "New Item",
        canvas_x: pos.x,
        canvas_y: pos.y,
      });
      const fullItem = await api.fetchItem(item.id);
      const cache = useCanvasStore.getState().itemsCache;
      const nextCache = new Map(cache);
      nextCache.set(fullItem.id, fullItem);
      setItemsCache(nextCache);
      setNodes((nds) => [...nds, toFlowNode(fullItem, nextCache, fitBothItems)]);
      setEditingItemId(item.id);
      setTimeout(() => {
        const zoom = reactFlowInstance.getZoom();
        reactFlowInstance.setCenter(pos.x, pos.y, { zoom, duration: 300 });
      }, 50);
    },
    [nodes, setNodes, fitBothItems, reactFlowInstance, setItemsCache, setEditingItemId],
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
        itemId: node.id,
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
        itemId: selectedIds[0],
        selectedIds,
      });
    },
    [setNodeContextMenu],
  );

  // View All: fit all nodes in viewport
  const handleViewAll = useCallback(() => {
    reactFlowInstance.fitView({ duration: 500 });
  }, [reactFlowInstance]);

  // Unstack overlapping items
  const handleUnstack = useCallback(async () => {
    const identified = nodes.map((n) => ({
      id: n.id,
      x: n.position.x,
      y: n.position.y,
    }));
    const moves = unstackNodes(identified);
    if (moves.size === 0) return;

    const cache = useCanvasStore.getState().itemsCache;
    const nextCache = new Map(cache);
    for (const [id, pos] of moves) {
      api.updateItem(id, { canvas_x: pos.x, canvas_y: pos.y });
      const cached = nextCache.get(id);
      if (cached) {
        nextCache.set(id, { ...cached, canvas_x: pos.x, canvas_y: pos.y });
      }
    }
    setItemsCache(nextCache);

    setNodes((nds) =>
      nds.map((n) => {
        const newPos = moves.get(n.id);
        return newPos ? { ...n, position: newPos } : n;
      }),
    );
  }, [nodes, setNodes, setItemsCache]);

  // Toolbar: create item at viewport center
  const handleToolbarCreate = useCallback(
    (type: CanvasItemType) => {
      const center = reactFlowInstance.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      createItemAtPosition(type, center.x, center.y);
    },
    [reactFlowInstance, createItemAtPosition],
  );

  // Drag end to save positions for all selected nodes
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, _node: Node, draggedNodes: Node[]) => {
      const positions = getSelectedNodePositions(draggedNodes);
      const cache = useCanvasStore.getState().itemsCache;
      const nextCache = new Map(cache);
      for (const [id, pos] of positions) {
        api.updateItem(id, { canvas_x: pos.x, canvas_y: pos.y });
        const cached = nextCache.get(id);
        if (cached) {
          nextCache.set(id, { ...cached, canvas_x: pos.x, canvas_y: pos.y });
        }
      }
      setItemsCache(nextCache);
    },
    [setItemsCache],
  );

  // Handle edge creation by dragging between handles
  const onConnect = useCallback(
    async (connection: Connection) => {
      const cache = useCanvasStore.getState().itemsCache;
      const sourceItem = cache.get(connection.source);
      if (!sourceItem) return;

      const newContent = appendMentionIfNew(sourceItem.content.notes, connection.target);
      if (newContent === null) return;

      const updated = await api.updateItem(sourceItem.id, { notes: newContent });
      const fullItem = await api.fetchItem(updated.id);
      const nextCache = new Map(cache);
      nextCache.set(fullItem.id, fullItem);
      setItemsCache(nextCache);

      const allItems = Array.from(nextCache.values());
      setNodes(allItems.map((i) => toFlowNode(i, nextCache, fitBothItems)));
      setEdges(buildEdges(allItems));
    },
    [setNodes, setEdges, fitBothItems, setItemsCache],
  );

  // Editor callbacks
  const handleSaved = useCallback(
    async (item: CanvasItem) => {
      const canvasId = useCanvasStore.getState().activeCanvasId;
      if (!canvasId) return;
      const fullItem = await api.fetchItem(item.id);
      const cache = useCanvasStore.getState().itemsCache;
      const nextCache = new Map(cache);
      nextCache.set(fullItem.id, fullItem);

      const summaries = await api.fetchItems(canvasId);
      const newItemIds = summaries.map((s) => s.id).filter((id) => !nextCache.has(id));
      const newItems = await Promise.all(newItemIds.map((id) => api.fetchItem(id)));
      for (const i of newItems) {
        nextCache.set(i.id, i);
      }
      setItemsCache(nextCache);

      const allItems = Array.from(nextCache.values());
      setNodes(allItems.map((i) => toFlowNode(i, nextCache, fitBothItems)));
      setEdges(buildEdges(allItems));
    },
    [setNodes, setEdges, fitBothItems, setItemsCache],
  );

  const handleDeleted = useCallback(
    (itemId: string) => {
      removeCachedItem(itemId);
      setNodes((nds) => nds.filter((n) => n.id !== itemId));
      setEdges((eds) => eds.filter((e) => e.source !== itemId && e.target !== itemId));
      setEditingItemId(null);
    },
    [setNodes, setEdges, removeCachedItem, setEditingItemId],
  );

  // Batch-delete nodes by explicit IDs
  const handleDeleteSelected = useCallback(
    async (idsToDelete: string[]) => {
      if (idsToDelete.length === 0) return;
      const deletedIds = await batchDeleteItems(idsToDelete, api.deleteItem);
      const cache = useCanvasStore.getState().itemsCache;
      const nextCache = new Map(cache);
      for (const id of deletedIds) {
        nextCache.delete(id);
      }
      setItemsCache(nextCache);
      const deletedSet = new Set(deletedIds);
      setNodes((nds) => nds.filter((n) => !deletedSet.has(n.id)));
      setEdges((eds) => eds.filter((e) => !deletedSet.has(e.source) && !deletedSet.has(e.target)));
      setEditingItemId(null);
    },
    [setNodes, setEdges, setItemsCache, setEditingItemId],
  );

  // Export item and connections as text to clipboard
  const handleExport = useCallback(
    async (itemId: string) => {
      const cache = useCanvasStore.getState().itemsCache;
      const item = cache.get(itemId);
      if (!item) return;
      const text = formatItemExport(item, cache);
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard");
    },
    [showToast],
  );

  // Pane click to close all panels
  const onPaneClick = useCallback(() => {
    setEditingItemId(null);
    setBrowsingItemId(null);
    setContextMenu(null);
    setNodeContextMenu(null);
    setShowSettings(false);
  }, [setEditingItemId, setBrowsingItemId, setContextMenu, setNodeContextMenu, setShowSettings]);

  return {
    // React Flow state
    nodes,
    edges,
    filteredNodes,
    filteredEdges,
    onNodesChange,
    onEdgesChange,

    // Actions
    loadAllItems,
    handleSaved,
    handleDeleted,
    handleDeleteSelected,
    navigateToItem,
    createItemAtPosition,
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
    viewportKey: activeCanvasId ? getViewportKey(activeCanvasId) : "",
  };
}
