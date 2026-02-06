import AddIcon from "@mui/icons-material/Add";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import GridViewIcon from "@mui/icons-material/GridView";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SessionSummary } from "shared";
import * as api from "../../api/client";
import { useAppStore } from "../../stores/appStore";
import { useCanvasStore } from "../../stores/canvasStore";
import CanvasPicker from "../Canvas/components/CanvasPicker";
import { SettingsButton, SettingsSidebar } from "../Canvas/components/SettingsModal";
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

interface SelectedSession {
  id: string;
  session_date: string;
}

export default function Sessions() {
  const navigate = useNavigate();

  const canvases = useCanvasStore((s) => s.canvases);
  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const setCanvases = useCanvasStore((s) => s.setCanvases);
  const setActiveCanvasId = useCanvasStore((s) => s.setActiveCanvasId);
  const initActiveCanvas = useCanvasStore((s) => s.initActiveCanvas);
  const showSettings = useCanvasStore((s) => s.showSettings);
  const setShowSettings = useCanvasStore((s) => s.setShowSettings);
  const showToast = useAppStore((s) => s.showToast);

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split("T")[0]!);
  const [selectedSession, setSelectedSession] = useState<SelectedSession | null>(null);

  // Fetch canvases on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const list = await api.fetchCanvases();
        if (!cancelled) initActiveCanvas(list);
      } catch {
        if (!cancelled) {
          await new Promise((r) => setTimeout(r, 500));
          try {
            const list = await api.fetchCanvases();
            if (!cancelled) initActiveCanvas(list);
          } catch {
            // session likely invalid
          }
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [initActiveCanvas]);

  // Fetch sessions when canvas changes
  useEffect(() => {
    if (!activeCanvasId) return;
    let cancelled = false;
    setLoading(true);
    api
      .fetchSessions(activeCanvasId)
      .then((data) => {
        if (!cancelled) setSessions(data);
      })
      .catch(() => {
        if (!cancelled) setSessions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeCanvasId]);

  // Canvas picker handlers
  const handleSwitchCanvas = useCallback(
    (canvasId: string) => setActiveCanvasId(canvasId),
    [setActiveCanvasId],
  );

  const handleCreateCanvas = useCallback(
    async (name: string) => {
      const canvas = await api.createCanvas({ name });
      setCanvases([...useCanvasStore.getState().canvases, canvas]);
      setActiveCanvasId(canvas.id);
    },
    [setCanvases, setActiveCanvasId],
  );

  const handleRenameCanvas = useCallback(
    async (canvasId: string, newName: string) => {
      const updated = await api.updateCanvas(canvasId, { name: newName });
      setCanvases(
        useCanvasStore.getState().canvases.map((c) => (c.id === updated.id ? updated : c)),
      );
    },
    [setCanvases],
  );

  const handleDeleteCanvas = useCallback(
    async (canvasId: string) => {
      await api.deleteCanvas(canvasId);
      const remaining = useCanvasStore.getState().canvases.filter((c) => c.id !== canvasId);
      setCanvases(remaining);
      if (activeCanvasId === canvasId && remaining.length > 0) {
        setActiveCanvasId(remaining[0].id);
      }
    },
    [setCanvases, setActiveCanvasId, activeCanvasId],
  );

  const handleCreateSession = async () => {
    if (!activeCanvasId || !newTitle.trim()) return;
    try {
      await api.createItem(activeCanvasId, {
        type: "session",
        title: newTitle.trim(),
        session_date: newDate,
      });
      const updated = await api.fetchSessions(activeCanvasId);
      setSessions(updated);
      setNewTitle("");
      setNewDate(new Date().toISOString().split("T")[0]!);
      setShowCreate(false);
    } catch {
      showToast("Failed to create session");
    }
  };

  const handleBackFromDetail = useCallback(() => {
    setSelectedSession(null);
    // Refresh the session list to pick up any title/date changes
    if (activeCanvasId) {
      api
        .fetchSessions(activeCanvasId)
        .then(setSessions)
        .catch(() => {});
    }
  }, [activeCanvasId]);

  if (!activeCanvasId) return null;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "var(--color-base)" }}>
      {/* TopBar */}
      <Box
        sx={{
          position: "fixed",
          top: 16,
          left: showSettings ? 376 : 16,
          right: 16,
          zIndex: 50,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          pointerEvents: "none",
          transition: "left 0.2s",
          "& > *": { pointerEvents: "auto" },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CanvasPicker
            canvases={canvases}
            activeCanvasId={activeCanvasId}
            onSwitch={handleSwitchCanvas}
            onCreate={handleCreateCanvas}
            onRename={handleRenameCanvas}
            onDelete={handleDeleteCanvas}
          />
          <IconButton
            onClick={() => navigate("/canvas")}
            title="Canvas View"
            sx={{
              bgcolor: "var(--color-base)",
              border: "1px solid var(--color-surface1)",
              color: "var(--color-text)",
              "&:hover": { bgcolor: "var(--color-surface0)" },
            }}
          >
            <GridViewIcon />
          </IconButton>
        </Box>
        <SettingsButton onClick={() => setShowSettings(true)} />
      </Box>

      {/* Main content */}
      {selectedSession ? (
        <Box
          sx={{
            pt: 10,
            px: 3,
            ml: showSettings ? "360px" : 0,
            transition: "margin-left 0.2s",
          }}
        >
          <SessionDetail
            sessionId={selectedSession.id}
            initialSessionDate={selectedSession.session_date}
            onBack={handleBackFromDetail}
          />
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
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CalendarTodayIcon sx={{ color: "var(--color-subtext0)" }} />
              <Typography variant="h5" sx={{ fontWeight: 600, color: "var(--color-text)" }}>
                Sessions
              </Typography>
            </Box>
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
                  onClick={() =>
                    setSelectedSession({
                      id: session.id,
                      session_date: session.session_date,
                    })
                  }
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
                    secondary={formatDate(session.session_date)}
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

      {showSettings && <SettingsSidebar />}
    </Box>
  );
}
