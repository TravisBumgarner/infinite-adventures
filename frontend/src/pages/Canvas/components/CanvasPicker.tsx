import Box from "@mui/material/Box";
import type { CanvasSummary } from "shared";

export interface CanvasPickerProps {
  canvases: CanvasSummary[];
  activeCanvasId: string;
  onSwitch: (canvasId: string) => void;
  onCreate: () => void;
  onRename: (canvasId: string, newName: string) => void;
  onDelete: (canvasId: string) => void;
}

export default function CanvasPicker(_props: CanvasPickerProps) {
  return <Box />;
}
