import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { SIDEBAR_WIDTH } from "../../../constants";
import { useCanvasStore } from "../../../stores/canvasStore";
import { useDiceStore } from "../../../stores/diceStore";
import DiceIcon from "./DiceIcon";

export default function ToolSidebar() {
  const showSettings = useCanvasStore((s) => s.showSettings);
  const toggle = useDiceStore((s) => s.toggle);

  return (
    <div
      style={{
        position: "fixed",
        top: 72,
        left: showSettings ? SIDEBAR_WIDTH : 0,
        width: 48,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 8,
        gap: 4,
        background: "var(--color-chrome-bg)",
        backdropFilter: "blur(8px)",
        borderRight: "1px solid var(--color-surface1)",
        borderBottom: "1px solid var(--color-surface1)",
        borderRadius: "0 0 8px 0",
        zIndex: 50,
        pointerEvents: "auto",
        transition: "left 0.2s",
      }}
    >
      <Tooltip title="Dice Roller" placement="right">
        <IconButton onClick={toggle} size="small">
          <DiceIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </div>
  );
}
