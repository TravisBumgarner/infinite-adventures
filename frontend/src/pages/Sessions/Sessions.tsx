import AddIcon from "@mui/icons-material/Add";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ListItemButton from "@mui/material/ListItemButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SIDEBAR_WIDTH } from "../../constants";
import { useCreateItem } from "../../hooks/mutations";
import { useCanvases, useSessions } from "../../hooks/queries";
import { useAppStore } from "../../stores/appStore";
import { useCanvasStore } from "../../stores/canvasStore";

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

  // Session creation mutation
  const createItemMutation = useCreateItem(activeCanvasId ?? "");

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
      {/* Main content */}
      {sessionId ? (
        <Box
          sx={{
            pt: 10,
            px: 3,
            ml: showSettings ? `${SIDEBAR_WIDTH + 16}px` : 0,
            transition: "margin-left 0.2s",
          }}
        >
          <SessionDetail sessionId={sessionId} />
        </Box>
      ) : (
        <Box
          sx={{
            maxWidth: 720,
            ...(showSettings ? { ml: `${SIDEBAR_WIDTH + 32}px` } : { mx: "auto" }),
            pt: 10,
            px: 3,
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
                border: "1px solid var(--color-surface1)",
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
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
              {sessions.map((session) => (
                <ListItemButton
                  key={session.id}
                  onClick={() => navigate(`/sessions/${session.id}`)}
                  sx={{
                    border: "1px solid var(--color-surface1)",
                    bgcolor: "var(--color-base)",
                    "&:hover": session.selectedPhotoUrl
                      ? {
                          transform: "scale(1.05)",
                          zIndex: 10,
                          "& .session-img": { objectFit: "contain" },
                        }
                      : { bgcolor: "var(--color-surface0)" },
                    position: "relative",
                    aspectRatio: session.selectedPhotoUrl ? "1" : undefined,
                    p: session.selectedPhotoUrl ? 0 : 2,
                    overflow: "hidden",
                    transition: "transform 0.2s ease",
                    zIndex: 1,
                  }}
                >
                  {session.selectedPhotoUrl && (
                    <>
                      <Box
                        className="session-img"
                        component="img"
                        src={session.selectedPhotoUrl}
                        alt={session.title}
                        sx={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          transition: "object-fit 0.2s ease",
                        }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)",
                        }}
                      />
                    </>
                  )}
                  <Box
                    sx={{
                      position: session.selectedPhotoUrl ? "absolute" : "relative",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      px: 2,
                      py: 1.5,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: session.selectedPhotoUrl ? "#fff" : "var(--color-text)",
                      }}
                    >
                      {session.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: session.selectedPhotoUrl
                          ? "rgba(255,255,255,0.7)"
                          : "var(--color-subtext0)",
                      }}
                    >
                      {formatDate(session.sessionDate)}
                    </Typography>
                  </Box>
                </ListItemButton>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
