import { useCallback, useEffect, useRef } from "react";

interface UseDraggableOptions {
  position: { x: number; y: number };
  onPositionChange: (pos: { x: number; y: number }) => void;
}

function findFloatingPanel(el: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = el;
  while (current) {
    if (getComputedStyle(current).position === "fixed") return current;
    current = current.parentElement;
  }
  return null;
}

function clampToViewport(
  x: number,
  y: number,
  elWidth: number,
  elHeight: number,
): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(x, window.innerWidth - elWidth)),
    y: Math.max(0, Math.min(y, window.innerHeight - elHeight)),
  };
}

export function useDraggable({ position, onPositionChange }: UseDraggableOptions) {
  const offsetRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef(position);
  const elementRef = useRef<HTMLElement | null>(null);
  positionRef.current = position;

  // Clamp position when window is resized
  useEffect(() => {
    const handleResize = () => {
      const { x, y } = positionRef.current;
      const el = elementRef.current;
      const w = el?.offsetWidth ?? 200;
      const h = el?.offsetHeight ?? 200;
      const clamped = clampToViewport(x, y, w, h);
      if (clamped.x !== x || clamped.y !== y) {
        onPositionChange(clamped);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [onPositionChange]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const panel = findFloatingPanel(e.currentTarget as HTMLElement);
      if (panel) elementRef.current = panel;

      offsetRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };

      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";

      const w = elementRef.current?.offsetWidth ?? 200;
      const h = elementRef.current?.offsetHeight ?? 200;

      const onMouseMove = (ev: MouseEvent) => {
        const clamped = clampToViewport(
          ev.clientX - offsetRef.current.x,
          ev.clientY - offsetRef.current.y,
          w,
          h,
        );
        onPositionChange(clamped);
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
