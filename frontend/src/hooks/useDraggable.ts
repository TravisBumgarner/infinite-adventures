import { useCallback, useRef } from "react";

interface UseDraggableOptions {
  position: { x: number; y: number };
  onPositionChange: (pos: { x: number; y: number }) => void;
}

export function useDraggable({ position, onPositionChange }: UseDraggableOptions) {
  const offsetRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      offsetRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };

      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";

      const onMouseMove = (ev: MouseEvent) => {
        const x = Math.max(0, Math.min(ev.clientX - offsetRef.current.x, window.innerWidth - 100));
        const y = Math.max(0, Math.min(ev.clientY - offsetRef.current.y, window.innerHeight - 100));
        onPositionChange({ x, y });
      };

      const onMouseUp = () => {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [position.x, position.y, onPositionChange],
  );

  return { handleMouseDown };
}
