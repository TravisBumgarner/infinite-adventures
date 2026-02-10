import ImageIcon from "@mui/icons-material/Image";
import NoteIcon from "@mui/icons-material/Note";
import SortIcon from "@mui/icons-material/Sort";
import TimelineIcon from "@mui/icons-material/Timeline";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import { useTheme } from "@mui/material/styles";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CanvasItemType, TimelineEntry } from "shared";
import { CANVAS_ITEM_TYPES, SIDEBAR_WIDTH } from "../../constants";
import { useCreateCanvas, useDeleteCanvas, useUpdateCanvas } from "../../hooks/mutations";
import { useCanvases, useTimeline } from "../../hooks/queries";
import { useCanvasStore } from "../../stores/canvasStore";
import { getContrastText } from "../../utils/getContrastText";
import CanvasPicker from "../Canvas/components/CanvasPicker";

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Timeline() {
  const navigate = useNavigate();
  const theme = useTheme();

  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const setActiveCanvasId = useCanvasStore((s) => s.setActiveCanvasId);
  const initActiveCanvas = useCanvasStore((s) => s.initActiveCanvas);
  const setEditingItemId = useCanvasStore((s) => s.setEditingItemId);
  const showSettings = useCanvasStore((s) => s.showSettings);

  const [sort, setSort] = useState<"created_at" | "updated_at">("created_at");
  const [activeFilters, setActiveFilters] = useState<Set<CanvasItemType>>(
    () => new Set(CANVAS_ITEM_TYPES.map((t) => t.value)),
  );

  // Fetch canvases and initialize active canvas
  const { data: canvases = [] } = useCanvases();
  useEffect(() => {
    if (canvases.length > 0) {
      initActiveCanvas(canvases);
    }
  }, [canvases, initActiveCanvas]);

  // Fetch timeline data
  const { data: entries = [], isLoading } = useTimeline(activeCanvasId ?? undefined, sort);

  // Canvas mutations
  const createCanvasMutation = useCreateCanvas();
  const updateCanvasMutation = useUpdateCanvas();
  const deleteCanvasMutation = useDeleteCanvas();

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

  const toggleFilter = (type: CanvasItemType) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // Client-side filtering by parent item type
  const filtered = useMemo(
    () => entries.filter((e) => activeFilters.has(e.parent_item_type)),
    [entries, activeFilters],
  );

  const handleRowClick = (entry: TimelineEntry) => {
    setEditingItemId(entry.parent_item_id);
    navigate("/canvas");
  };

  if (!activeCanvasId) return null;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "var(--color-base)" }}>
      {/* Canvas picker */}
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
      <Box
        sx={{
          maxWidth: 720,
          mx: "auto",
          pt: 10,
          px: 3,
          ml: showSettings ? "calc((100vw - 720px) / 2 + 180px)" : "auto",
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
            <TimelineIcon sx={{ color: "var(--color-subtext0)" }} />
            <Typography variant="h5" sx={{ fontWeight: 600, color: "var(--color-text)" }}>
              Timeline
            </Typography>
          </Box>
        </Box>

        {/* Controls bar */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 3,
            flexWrap: "wrap",
          }}
        >
          {/* Sort toggle */}
          <ToggleButtonGroup
            value={sort}
            exclusive
            onChange={(_, val) => {
              if (val) setSort(val);
            }}
            size="small"
          >
            <ToggleButton value="created_at" sx={{ textTransform: "none", gap: 0.5 }}>
              <SortIcon fontSize="small" />
              Created
            </ToggleButton>
            <ToggleButton value="updated_at" sx={{ textTransform: "none", gap: 0.5 }}>
              <SortIcon fontSize="small" />
              Last Updated
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Type filter chips */}
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            {CANVAS_ITEM_TYPES.map((t) => {
              const colors = theme.palette.canvasItemTypes[t.value];
              const isActive = activeFilters.has(t.value);
              return (
                <Chip
                  key={t.value}
                  label={t.label}
                  size="small"
                  onClick={() => toggleFilter(t.value)}
                  sx={{
                    bgcolor: isActive ? colors.light : "transparent",
                    color: isActive ? getContrastText(colors.light) : "var(--color-subtext0)",
                    border: isActive ? "none" : "1px solid var(--color-surface1)",
                    fontWeight: 600,
                    fontSize: 11,
                    cursor: "pointer",
                    "&:hover": { opacity: 0.8 },
                  }}
                />
              );
            })}
          </Box>
        </Box>

        {/* Timeline list */}
        {isLoading ? (
          <Typography sx={{ color: "var(--color-subtext0)", textAlign: "center", mt: 4 }}>
            Loading timeline...
          </Typography>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, color: "var(--color-subtext0)" }}>
            <TimelineIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              No entries yet
            </Typography>
            <Typography variant="body2">
              Notes and photos from your canvas items will appear here.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {filtered.map((entry) => {
              const colors = theme.palette.canvasItemTypes[entry.parent_item_type];
              const typeLabel =
                CANVAS_ITEM_TYPES.find((t) => t.value === entry.parent_item_type)?.label ??
                entry.parent_item_type;
              return (
                <ListItemButton
                  key={`${entry.kind}-${entry.id}`}
                  onClick={() => handleRowClick(entry)}
                  sx={{
                    mb: 1,
                    borderRadius: 2,
                    border: "1px solid var(--color-surface1)",
                    bgcolor: "var(--color-base)",
                    "&:hover": { bgcolor: "var(--color-surface0)" },
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    py: 1.5,
                  }}
                >
                  {/* Parent type chip */}
                  <Chip
                    label={typeLabel}
                    size="small"
                    sx={{
                      bgcolor: colors.light,
                      color: getContrastText(colors.light),
                      fontSize: 10,
                      fontWeight: 600,
                      height: 22,
                      minWidth: 60,
                    }}
                  />

                  {/* Parent title */}
                  <Typography
                    sx={{
                      fontWeight: 600,
                      color: "var(--color-text)",
                      minWidth: 100,
                      maxWidth: 160,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {entry.parent_item_title}
                  </Typography>

                  {/* Entry kind icon */}
                  {entry.kind === "note" ? (
                    <NoteIcon sx={{ fontSize: 16, color: "var(--color-subtext0)" }} />
                  ) : (
                    <ImageIcon sx={{ fontSize: 16, color: "var(--color-subtext0)" }} />
                  )}

                  {/* Content preview */}
                  <Typography
                    variant="body2"
                    sx={{
                      flex: 1,
                      color: "var(--color-subtext0)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {entry.kind === "note"
                      ? entry.content || "Empty note"
                      : entry.original_name || "Photo"}
                  </Typography>

                  {/* Timestamp */}
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--color-overlay0)",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {formatTimestamp(sort === "updated_at" ? entry.updated_at : entry.created_at)}
                  </Typography>
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
}
