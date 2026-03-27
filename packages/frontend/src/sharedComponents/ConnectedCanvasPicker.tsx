import { useCallback } from "react";
import { useCreateCanvas, useDeleteCanvas, useUpdateCanvas } from "../hooks/mutations";
import { useCanvases } from "../hooks/queries";
import CanvasPicker from "../pages/Canvas/components/CanvasPicker";
import { useCanvasStore } from "../stores/canvasStore";

export default function ConnectedCanvasPicker() {
  const { data: canvases = [] } = useCanvases();
  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const setActiveCanvasId = useCanvasStore((s) => s.setActiveCanvasId);

  const createCanvasMutation = useCreateCanvas();
  const updateCanvasMutation = useUpdateCanvas();
  const deleteCanvasMutation = useDeleteCanvas();

  const handleSwitch = useCallback(
    (canvasId: string) => {
      setActiveCanvasId(canvasId);
    },
    [setActiveCanvasId],
  );

  const handleCreate = useCallback(
    async (name: string) => {
      const canvas = await createCanvasMutation.mutateAsync({ name });
      setActiveCanvasId(canvas.id);
    },
    [createCanvasMutation, setActiveCanvasId],
  );

  const handleRename = useCallback(
    async (canvasId: string, newName: string) => {
      await updateCanvasMutation.mutateAsync({ id: canvasId, input: { name: newName } });
    },
    [updateCanvasMutation],
  );

  const handleDelete = useCallback(
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

  if (!activeCanvasId) return null;

  return (
    <CanvasPicker
      canvases={canvases}
      activeCanvasId={activeCanvasId}
      onSwitch={handleSwitch}
      onCreate={handleCreate}
      onRename={handleRename}
      onDelete={handleDelete}
    />
  );
}
