import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import { useDraggable } from "../../../hooks/useDraggable";
import { useCanvasStore } from "../../../stores/canvasStore";
import { useInitiativeStore } from "../../../stores/initiativeStore";
import { PALETTE_MOCHA } from "../../../styles/styleConsts";

export default function InitiativeTracker() {
  const isOpen = useInitiativeStore((s) => s.isOpen);
  const position = useInitiativeStore((s) => s.position);
  const setPosition = useInitiativeStore((s) => s.setPosition);
  const toggle = useInitiativeStore((s) => s.toggle);
  const combatants = useInitiativeStore((s) => s.combatants);
  const activeTurnIndex = useInitiativeStore((s) => s.activeTurnIndex);
  const round = useInitiativeStore((s) => s.round);
  const addCombatant = useInitiativeStore((s) => s.addCombatant);
  const removeCombatant = useInitiativeStore((s) => s.removeCombatant);
  const nextTurn = useInitiativeStore((s) => s.nextTurn);
  const previousTurn = useInitiativeStore((s) => s.previousTurn);
  const clearAll = useInitiativeStore((s) => s.clearAll);

  const itemsCache = useCanvasStore((s) => s.itemsCache);
  const personNames = useMemo(
    () =>
      [...itemsCache.values()]
        .filter((item) => item.type === "person")
        .map((item) => item.title)
        .sort((a, b) => a.localeCompare(b)),
    [itemsCache],
  );

  const [name, setName] = useState("");
  const [initiative, setInitiative] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(true);
  const [expanded, setExpanded] = useState(true);

  const { handleMouseDown } = useDraggable({
    position,
    onPositionChange: setPosition,
  });

  const handleAdd = () => {
    const trimmed = name.trim();
    const parsed = Number.parseInt(initiative, 10);
    if (trimmed && !Number.isNaN(parsed)) {
      addCombatant(trimmed, parsed);
      setName("");
      setInitiative("");
    }
  };

  const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative);
  const isAtStart = round === 1 && activeTurnIndex === 0;

  if (!isOpen) return null;

  return (
    <>
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
          borderRadius: 2,
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
            Initiative Tracker
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
            <Tooltip title={showAddForm ? "Hide add form" : "Add combatant"}>
              <IconButton size="small" onClick={() => setShowAddForm((v) => !v)} sx={{ p: 0.25 }}>
                <EditIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            {sorted.length > 0 && (
              <Tooltip title={expanded ? "Show current only" : "Show all"}>
                <IconButton size="small" onClick={() => setExpanded((v) => !v)} sx={{ p: 0.25 }}>
                  {expanded ? (
                    <UnfoldLessIcon sx={{ fontSize: 16 }} />
                  ) : (
                    <UnfoldMoreIcon sx={{ fontSize: 16 }} />
                  )}
                </IconButton>
              </Tooltip>
            )}
            {sorted.length > 0 && (
              <Tooltip title="Clear all">
                <IconButton
                  size="small"
                  onClick={() => setConfirmOpen(true)}
                  sx={{ color: "var(--color-overlay0)", p: 0.25 }}
                >
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
            <IconButton size="small" onClick={toggle}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
          {/* Add combatant form */}
          {showAddForm && (
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "stretch" }}>
              <Autocomplete
                freeSolo
                options={personNames}
                inputValue={name}
                onInputChange={(_, value) => setName(value)}
                size="small"
                sx={{ flex: 1 }}
                slotProps={{ popper: { style: { zIndex: 200 } } }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Name"
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    sx={{ height: "100%", "& input": { fontSize: 12 } }}
                  />
                )}
              />
              <TextField
                size="small"
                placeholder="Init"
                value={initiative}
                onChange={(e) => setInitiative(e.target.value.replace(/[^0-9-]/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                sx={{ width: 56, "& input": { fontSize: 12 } }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleAdd}
                sx={{ fontSize: 12, minWidth: 0 }}
              >
                +
              </Button>
            </Box>
          )}

          {/* Round counter + navigation */}
          {sorted.length > 0 && (
            <>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                }}
              >
                <IconButton size="small" onClick={previousTurn} disabled={isAtStart}>
                  <NavigateBeforeIcon fontSize="small" />
                </IconButton>
                <Typography variant="body2" fontWeight={600}>
                  Round {round}
                </Typography>
                <IconButton size="small" onClick={nextTurn}>
                  <NavigateNextIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* Combatant list */}
              <Box
                sx={{
                  maxHeight: 300,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                }}
              >
                {(expanded
                  ? sorted
                  : [sorted[activeTurnIndex], sorted[(activeTurnIndex + 1) % sorted.length]].filter(
                      Boolean,
                    )
                ).map((combatant) => {
                  const index = sorted.indexOf(combatant);
                  const isActive = index === activeTurnIndex;
                  return (
                    <Paper
                      key={combatant.id}
                      variant="outlined"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        p: 0.75,
                        borderLeft: `3px solid ${isActive ? PALETTE_MOCHA.green : PALETTE_MOCHA.surface2}`,
                        bgcolor: isActive ? `${PALETTE_MOCHA.green}18` : "transparent",
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={isActive ? 700 : 400}
                        sx={{ flex: 1, fontSize: 13 }}
                      >
                        {combatant.name}
                      </Typography>
                      <Chip
                        label={combatant.initiative}
                        size="small"
                        sx={{
                          fontSize: 11,
                          height: 20,
                          bgcolor: PALETTE_MOCHA.lavender,
                          color: PALETTE_MOCHA.base,
                          mr: 0.5,
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => removeCombatant(combatant.id)}
                        sx={{ p: 0.25 }}
                      >
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Paper>
                  );
                })}
              </Box>
            </>
          )}
        </Box>
      </Paper>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Clear Initiative?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will remove all combatants and reset the round counter.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => {
              clearAll();
              setConfirmOpen(false);
            }}
          >
            Clear All
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
