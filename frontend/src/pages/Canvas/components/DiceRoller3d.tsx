import CasinoIcon from "@mui/icons-material/Casino";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useEffect, useRef } from "react";
import { useDraggable } from "../../../hooks/useDraggable";
import { LabelBadge } from "../../../sharedComponents/LabelBadge";
import { useDice3dStore } from "../../../stores/dice3dStore";
import { PALETTE_MOCHA } from "../../../styles/styleConsts";
import { createEngine } from "./dice3dEngine";

const DIE_TYPES = ["d4", "d6", "d8", "d10", "d12", "d20"] as const;

const DIE_COLORS: Record<string, string> = {
  d4: PALETTE_MOCHA.red,
  d6: PALETTE_MOCHA.blue,
  d8: PALETTE_MOCHA.green,
  d10: PALETTE_MOCHA.yellow,
  d12: PALETTE_MOCHA.mauve,
  d20: PALETTE_MOCHA.peach,
};

const CANVAS_W = 300;
const CANVAS_H = 200;

export default function DiceRoller3d() {
  const isOpen = useDice3dStore((s) => s.isOpen);
  const position = useDice3dStore((s) => s.position);
  const setPosition = useDice3dStore((s) => s.setPosition);
  const toggle = useDice3dStore((s) => s.toggle);
  const tray = useDice3dStore((s) => s.tray);
  const results = useDice3dStore((s) => s.results);
  const rolling = useDice3dStore((s) => s.rolling);
  const addDie = useDice3dStore((s) => s.addDie);
  const removeDie = useDice3dStore((s) => s.removeDie);
  const clearTray = useDice3dStore((s) => s.clearTray);
  const setResults = useDice3dStore((s) => s.setResults);
  const setRolling = useDice3dStore((s) => s.setRolling);

  const { handleMouseDown } = useDraggable({ position, onPositionChange: setPosition });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ReturnType<typeof createEngine> | null>(null);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const engine = createEngine(canvasRef.current, CANVAS_W, CANVAS_H);
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRoll = () => {
    if (!engineRef.current || tray.length === 0 || rolling) return;
    setRolling(true);
    setResults(null);
    engineRef.current.rollDice(tray, (r) => {
      setResults(r);
      setRolling(false);
    });
  };

  const handleClear = () => {
    clearTray();
  };

  // Group tray for display
  const counts = new Map<string, number>();
  for (const t of tray) counts.set(t, (counts.get(t) ?? 0) + 1);

  const total = results ? results.reduce((sum, r) => sum + r.value, 0) : null;

  return (
    <Paper
      elevation={8}
      sx={{
        position: "fixed",
        top: position.y,
        left: position.x,
        width: CANVAS_W + 40,
        zIndex: 100,
        bgcolor: "var(--color-chrome-bg)",
        backdropFilter: "blur(8px)",
        border: "1px solid var(--color-surface1)",
        overflow: "hidden",
      }}
    >
      {/* Drag handle / title bar */}
      <Box
        onMouseDown={handleMouseDown}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.5,
          py: 0.75,
          cursor: "grab",
          borderBottom: "1px solid var(--color-surface1)",
          "&:active": { cursor: "grabbing" },
        }}
      >
        <Typography variant="subtitle2" fontWeight={600}>
          3D Dice
        </Typography>
        <IconButton size="small" onClick={toggle}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {/* Die-add buttons */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {DIE_TYPES.map((type) => (
            <Button
              key={type}
              size="small"
              onClick={() => addDie(type)}
              sx={{
                minWidth: 0,
                px: 1,
                fontSize: 12,
                fontWeight: 600,
                bgcolor: DIE_COLORS[type],
                color: PALETTE_MOCHA.base,
                "&:hover": { bgcolor: DIE_COLORS[type], filter: "brightness(1.15)" },
              }}
            >
              {type.toUpperCase()}
            </Button>
          ))}
        </Box>

        {/* Tray chips */}
        {tray.length > 0 && (
          <>
            <Divider />
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {[...counts.entries()]
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([type, n]) => (
                  <Chip
                    key={type}
                    label={`${type.toUpperCase()} \u00d7 ${n}`}
                    size="small"
                    onDelete={() => removeDie(type)}
                    sx={{
                      fontSize: 12,
                      bgcolor: DIE_COLORS[type],
                      color: PALETTE_MOCHA.base,
                      "& .MuiChip-deleteIcon": { color: PALETTE_MOCHA.base },
                    }}
                  />
                ))}
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<CasinoIcon />}
                onClick={handleRoll}
                disabled={rolling}
                sx={{ flex: 1, fontSize: 12 }}
              >
                {rolling ? "Rolling..." : "Roll"}
              </Button>
              <Button variant="outlined" size="small" onClick={handleClear} sx={{ fontSize: 12 }}>
                Clear
              </Button>
            </Box>
          </>
        )}

        {/* Canvas viewport */}
        <Box
          sx={{
            overflow: "hidden",
            border: "1px solid var(--color-surface1)",
            lineHeight: 0,
          }}
        >
          <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} style={{ display: "block" }} />
        </Box>

        {/* Results */}
        {results && (
          <>
            <Divider />
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mb: 0.5, display: "block" }}
              >
                Results
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
                {results.map((r, i) => (
                  <LabelBadge
                    key={`${i}-${r.type}-${r.value}`}
                    label={`${r.type.toUpperCase()}: ${r.value}`}
                    accentColor={DIE_COLORS[r.type]}
                    fontSize={12}
                  />
                ))}
              </Box>
              <Typography variant="body2" fontWeight={700}>
                Total: {total}
              </Typography>
            </Box>
          </>
        )}
      </Box>
    </Paper>
  );
}
