import CasinoIcon from "@mui/icons-material/Casino";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useDraggable } from "../../../hooks/useDraggable";
import { useDiceStore } from "../../../stores/diceStore";
import { PALETTE_MOCHA } from "../../../styles/styleConsts";

const STANDARD_DICE = [2, 4, 6, 8, 10, 12, 20, 100];

const DIE_COLORS: Record<number, string> = {
  2: PALETTE_MOCHA.teal,
  4: PALETTE_MOCHA.red,
  6: PALETTE_MOCHA.blue,
  8: PALETTE_MOCHA.green,
  10: PALETTE_MOCHA.yellow,
  12: PALETTE_MOCHA.mauve,
  20: PALETTE_MOCHA.peach,
  100: PALETTE_MOCHA.flamingo,
};

function getDieColor(sides: number): string {
  return DIE_COLORS[sides] ?? PALETTE_MOCHA.surface2;
}

function formatDiceFormula(dice: { sides: number }[]): string {
  const counts = new Map<number, number>();
  for (const d of dice) {
    counts.set(d.sides, (counts.get(d.sides) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([sides, count]) => `${count}D${sides}`)
    .join(" + ");
}

function formatTimestamp(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function RollerTab() {
  const dice = useDiceStore((s) => s.dice);
  const lastRoll = useDiceStore((s) => s.lastRoll);
  const addDie = useDiceStore((s) => s.addDie);
  const removeDie = useDiceStore((s) => s.removeDie);
  const clearDice = useDiceStore((s) => s.clearDice);
  const roll = useDiceStore((s) => s.roll);
  const [customSides, setCustomSides] = useState("");

  const handleAddCustom = () => {
    const n = Number.parseInt(customSides, 10);
    if (n >= 2) {
      addDie(n);
      setCustomSides("");
    }
  };

  // Group dice by sides for display
  const grouped = new Map<number, { ids: string[]; sides: number }>();
  for (const d of dice) {
    const entry = grouped.get(d.sides);
    if (entry) {
      entry.ids.push(d.id);
    } else {
      grouped.set(d.sides, { ids: [d.id], sides: d.sides });
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {/* Standard dice buttons */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
        {STANDARD_DICE.map((sides) => (
          <Button
            key={sides}
            size="small"
            onClick={() => addDie(sides)}
            sx={{
              minWidth: 0,
              px: 1,
              fontSize: 12,
              fontWeight: 600,
              bgcolor: getDieColor(sides),
              color: PALETTE_MOCHA.base,
              "&:hover": { bgcolor: getDieColor(sides), filter: "brightness(1.15)" },
            }}
          >
            D{sides}
          </Button>
        ))}
      </Box>

      {/* Custom dice input */}
      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="d?"
          value={customSides}
          onChange={(e) => setCustomSides(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
          sx={{ width: 64, "& input": { fontSize: 12, py: 0.5, px: 1 } }}
        />
        <Button
          variant="outlined"
          size="small"
          onClick={handleAddCustom}
          sx={{ fontSize: 12, minWidth: 0 }}
        >
          +
        </Button>
      </Box>

      {/* Current handful */}
      {dice.length > 0 && (
        <>
          <Divider />
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {[...grouped.entries()]
              .sort((a, b) => a[0] - b[0])
              .map(([sides, { ids }]) => (
                <Chip
                  key={sides}
                  label={`D${sides} × ${ids.length}`}
                  size="small"
                  onDelete={() => removeDie(ids[ids.length - 1])}
                  sx={{
                    fontSize: 12,
                    bgcolor: getDieColor(sides),
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
              onClick={roll}
              sx={{ flex: 1, fontSize: 12 }}
            >
              Roll
            </Button>
            <Button variant="outlined" size="small" onClick={clearDice} sx={{ fontSize: 12 }}>
              Clear
            </Button>
          </Box>
        </>
      )}

      {/* Results */}
      {lastRoll && (
        <>
          <Divider />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
              Results
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
              {lastRoll.map((r, i) => (
                <Chip
                  key={`${i}-${r.sides}-${r.result}`}
                  label={`D${r.sides}: ${r.result}`}
                  size="small"
                  sx={{
                    fontSize: 12,
                    bgcolor: getDieColor(r.sides),
                    color: PALETTE_MOCHA.base,
                  }}
                />
              ))}
            </Box>
            <Typography variant="body2" fontWeight={700}>
              Total: {lastRoll.reduce((sum, r) => sum + r.result, 0)}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
}

function HistoryTab() {
  const history = useDiceStore((s) => s.history);
  const clearHistory = useDiceStore((s) => s.clearHistory);

  if (history.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
        No rolls yet
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Box
        sx={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1 }}
      >
        {history.map((entry) => (
          <Paper key={entry.id} variant="outlined" sx={{ p: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="caption" fontWeight={600}>
                {formatDiceFormula(entry.dice)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatTimestamp(entry.timestamp)}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 0.5 }}>
              {entry.dice.map((r, i) => (
                <Chip
                  key={`${i}-${r.sides}-${r.result}`}
                  label={`D${r.sides}: ${r.result}`}
                  size="small"
                  sx={{
                    fontSize: 11,
                    height: 20,
                    bgcolor: getDieColor(r.sides),
                    color: PALETTE_MOCHA.base,
                  }}
                />
              ))}
            </Box>
            <Typography variant="caption" fontWeight={700}>
              Total: {entry.total}
            </Typography>
          </Paper>
        ))}
      </Box>
      <Button
        variant="outlined"
        size="small"
        color="error"
        startIcon={<DeleteIcon />}
        onClick={clearHistory}
        sx={{ fontSize: 12 }}
      >
        Clear History
      </Button>
    </Box>
  );
}

export default function DiceRoller() {
  const isOpen = useDiceStore((s) => s.isOpen);
  const position = useDiceStore((s) => s.position);
  const setPosition = useDiceStore((s) => s.setPosition);
  const toggle = useDiceStore((s) => s.toggle);
  const activeTab = useDiceStore((s) => s.activeTab);
  const setActiveTab = useDiceStore((s) => s.setActiveTab);

  const { handleMouseDown } = useDraggable({ position, onPositionChange: setPosition });

  if (!isOpen) return null;

  return (
    <Paper
      elevation={8}
      sx={{
        position: "fixed",
        top: position.y,
        left: position.x,
        width: 320,
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
          Dice Roller
        </Typography>
        <IconButton size="small" onClick={toggle}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        variant="fullWidth"
        sx={{ minHeight: 36, "& .MuiTab-root": { minHeight: 36, fontSize: 12, py: 0 } }}
      >
        <Tab label="Roller" value="roller" />
        <Tab label="History" value="history" />
      </Tabs>

      {/* Content */}
      <Box sx={{ p: 1.5 }}>{activeTab === "roller" ? <RollerTab /> : <HistoryTab />}</Box>
    </Paper>
  );
}
