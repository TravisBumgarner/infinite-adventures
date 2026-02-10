import AddIcon from "@mui/icons-material/Add";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SIDEBAR_WIDTH } from "../../constants";
import {
  useCreateCanvas,
  useCreateItem,
  useDeleteCanvas,
  useUpdateCanvas,
} from "../../hooks/mutations";
import { useCanvases, useSessions } from "../../hooks/queries";
import { useAppStore } from "../../stores/appStore";
import { useCanvasStore } from "../../stores/canvasStore";
import CanvasPicker from "../Canvas/components/CanvasPicker";
import SessionDetail from "./SessionDetail";

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  if (!year || !month || !day) return dateStr;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Sessions() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const setActiveCanvasId = useCanvasStore((s) => s.setActiveCanvasId);
  const initActiveCanvas = useCanvasStore((s) => s.initActiveCanvas);
  const showSettings = useCanvasStore((s) => s.showSettings);
  const showToast = useAppStore((s) => s.showToast);

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split("T")[0]!);

  // Fetch canvases via React Query and initialize the active canvas
  const { data: canvases = [] } = useCanvases();
  useEffect(() => {
    if (canvases.length > 0) {
      initActiveCanvas(canvases);
    }
  }, [canvases, initActiveCanvas]);

  // Fetch sessions via React Query
  const { data: sessions = [], isLoading: loading } = useSessions(activeCanvasId ?? undefined);

  // Canvas mutations
  const createCanvasMutation = useCreateCanvas();
  const updateCanvasMutation = useUpdateCanvas();
  const deleteCanvasMutation = useDeleteCanvas();

  // Session creation mutation
  const createItemMutation = useCreateItem(activeCanvasId ?? "");

  // Canvas picker handlers
  const handleSwitchCanvas = useCallback(
    (canvasId: string) => setActiveCanvasId(canvasId),
    [setActiveCanvasId],
  );

  const handleCreateCanvas = useCallback(
    async (name: string) => {
      const canvas = await createCanvasMutation.mutateAsync({ name });
      setActiveCanvasId(canvas.id);
    },
    [createCanvasMutation, setActiveCanvasId],
  );

  const handleRenameCanvas = useCallback(
    async (canvasId: string, newName: string) => {
      await updateCanvasMutation.mutateAsync({ id: canvasId, input: { name: newName } });
    },
    [updateCanvasMutation],
  );

  const handleDeleteCanvas = useCallback(
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

  const handleCreateSession = async () => {
    if (!activeCanvasId || !newTitle.trim()) return;
    try {
      await createItemMutation.mutateAsync({
        type: "session",
        title: newTitle.trim(),
        sessionDate: newDate,
      });
      setNewTitle("");
      setNewDate(new Date().toISOString().split("T")[0]!);
      setShowCreate(false);
    } catch {
      showToast("Failed to create session");
    }
  };

  if (!activeCanvasId) return null;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "var(--color-base)" }}>
      <Box
        sx={{
          position: "fixed",
          bottom: 16,
          left: showSettings ? SIDEBAR_WIDTH + 16 : 16,
          zIndex: 50,
          pointerEvents: "auto",
          transition: "left 0.2s",
        }}
      >
        <Box
          sx={{
            bgcolor: "var(--color-chrome-bg)",
            backdropFilter: "blur(8px)",
            border: "1px solid var(--color-surface1)",
            borderRadius: 2,
          }}
        >
          <CanvasPicker
            canvases={canvases}
            activeCanvasId={activeCanvasId}
            onSwitch={handleSwitchCanvas}
            onCreate={handleCreateCanvas}
            onRename={handleRenameCanvas}
            onDelete={handleDeleteCanvas}
          />
        </Box>
      </Box>

      {/* Main content */}
      {sessionId ? (
        <Box
          sx={{
            pt: 10,
            px: 3,
            ml: showSettings ? "360px" : 0,
            transition: "margin-left 0.2s",
          }}
        >
          <SessionDetail sessionId={sessionId} />
        </Box>
      ) : (
        <Box
          sx={{
            maxWidth: 720,
            mx: "auto",
            pt: 10,
            px: 3,
            ml: showSettings ? `calc((100vw - 720px) / 2 + 180px)` : "auto",
            transition: "margin-left 0.2s",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowCreate(true)}
              sx={{ textTransform: "none" }}
            >
              New Session
            </Button>
          </Box>

          {/* Create form */}
          {showCreate && (
            <Box
              sx={{
                mb: 3,
                p: 2,
                bgcolor: "var(--color-surface0)",
                border: "1px solid var(--color-surface1)",
                borderRadius: 2,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <TextField
                label="Session Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                size="small"
                fullWidth
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTitle.trim()) handleCreateSession();
                  if (e.key === "Escape") setShowCreate(false);
                }}
              />
              <TextField
                label="Date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                size="small"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                <Button
                  variant="outlined"
                  onClick={() => setShowCreate(false)}
                  sx={{ textTransform: "none" }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleCreateSession}
                  disabled={!newTitle.trim()}
                  sx={{ textTransform: "none" }}
                >
                  Create
                </Button>
              </Box>
            </Box>
          )}

          {/* Session list */}
          {loading ? (
            <Typography sx={{ color: "var(--color-subtext0)", textAlign: "center", mt: 4 }}>
              Loading sessions...
            </Typography>
          ) : sessions.length === 0 ? (
            <Box
              sx={{
                textAlign: "center",
                py: 8,
                color: "var(--color-subtext0)",
              }}
            >
              <CalendarTodayIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                No sessions yet
              </Typography>
              <Typography variant="body2">
                Create your first session to start tracking your adventures.
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {sessions.map((session) => (
                <ListItemButton
                  key={session.id}
                  onClick={() => navigate(`/sessions/${session.id}`)}
                  sx={{
                    mb: 1,
                    borderRadius: 2,
                    border: "1px solid var(--color-surface1)",
                    bgcolor: "var(--color-base)",
                    "&:hover": { bgcolor: "var(--color-surface0)" },
                  }}
                >
                  <ListItemText
                    primary={session.title}
                    secondary={formatDate(session.sessionDate)}
                    slotProps={{
                      primary: {
                        sx: { fontWeight: 600, color: "var(--color-text)" },
                      },
                      secondary: {
                        sx: { color: "var(--color-subtext0)" },
                      },
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>
      )}
    </Box>
  );
}
