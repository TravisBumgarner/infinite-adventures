import StickyNote2Icon from "@mui/icons-material/StickyNote2";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { SIDEBAR_WIDTH } from "../../../constants";
import { useCanvasStore } from "../../../stores/canvasStore";
import { useDice3dStore } from "../../../stores/dice3dStore";
import { useDiceStore } from "../../../stores/diceStore";
import { useInitiativeStore } from "../../../stores/initiativeStore";
import { useQuickNotesStore } from "../../../stores/quickNotesStore";
import Dice3dIcon from "./Dice3dIcon";
import DiceIcon from "./DiceIcon";
import InitiativeIcon from "./InitiativeIcon";

export default function ToolSidebar() {
  const showSettings = useCanvasStore((s) => s.showSettings);
  const toggle = useDiceStore((s) => s.toggle);
  const toggle3d = useDice3dStore((s) => s.toggle);
  const toggleInitiative = useInitiativeStore((s) => s.toggle);
  const toggleQuickNotes = useQuickNotesStore((s) => s.toggle);

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: "5%",
        left: showSettings ? SIDEBAR_WIDTH + 8 : 8,
        zIndex: 50,
        pointerEvents: "auto",
        transition: "left 0.2s",
      }}
    >
      <Box
        data-tour="tool-sidebar"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.5,
          px: 0.5,
          py: 1,
          bgcolor: "var(--color-chrome-bg)",
          backdropFilter: "blur(8px)",
          border: "1px solid var(--color-surface1)",
        }}
      >
        <Tooltip title="Dice Roller" placement="right">
          <IconButton onClick={toggle} size="small">
            <DiceIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="3D Dice" placement="right">
          <IconButton onClick={toggle3d} size="small">
            <Dice3dIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Initiative Tracker" placement="right">
          <IconButton onClick={toggleInitiative} size="small">
            <InitiativeIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Quick Notes" placement="right">
          <IconButton onClick={toggleQuickNotes} size="small">
            <StickyNote2Icon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
