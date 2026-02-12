import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import MapIcon from "@mui/icons-material/Map";
import SortIcon from "@mui/icons-material/Sort";
import StarIcon from "@mui/icons-material/Star";
import TimelineIcon from "@mui/icons-material/Timeline";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import List from "@mui/material/List";
import { useTheme } from "@mui/material/styles";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CanvasItemType } from "shared";
import { CANVAS_ITEM_TYPES, SIDEBAR_WIDTH } from "../../constants";
import { useCreateCanvas, useDeleteCanvas, useUpdateCanvas } from "../../hooks/mutations";
import { useCanvases, useTimeline, useTimelineCounts } from "../../hooks/queries";
import BlurImage from "../../sharedComponents/BlurImage";
import { useCanvasStore } from "../../stores/canvasStore";
import { getContrastText } from "../../utils/getContrastText";
import { getNotePreview } from "../../utils/getNotePreview";
import CanvasPicker from "../Canvas/components/CanvasPicker";
import TimelineCalendar, { getCalendarRange } from "./TimelineCalendar";

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

function formatDateLabel(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getDateKey(isoString: string): string {
  return new Date(isoString).toDateString();
}

function timelineNotePreview(content: string): string {
  return getNotePreview(content, undefined, 0);
}

export default function Timeline() {
  const navigate = useNavigate();
  const theme = useTheme();

  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const setActiveCanvasId = useCanvasStore((s) => s.setActiveCanvasId);
  const initActiveCanvas = useCanvasStore((s) => s.initActiveCanvas);
  const setEditingItemId = useCanvasStore((s) => s.setEditingItemId);
  const showSettings = useCanvasStore((s) => s.showSettings);

  const [sort, setSort] = useState<"createdAt" | "updatedAt">("createdAt");
  const [activeFilters, setActiveFilters] = useState<Set<CanvasItemType>>(
    () => new Set(CANVAS_ITEM_TYPES.map((t) => t.value)),
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [importantOnly, setImportantOnly] = useState(false);

  // Calendar window state
  const now = new Date();
  const [calEndYear, setCalEndYear] = useState(now.getFullYear());
  const [calEndMonth, setCalEndMonth] = useState(now.getMonth());

  // Fetch canvases and initialize active canvas
  const { data: canvases = [] } = useCanvases();
  useEffect(() => {
    if (canvases.length > 0) {
      initActiveCanvas(canvases);
    }
  }, [canvases, initActiveCanvas]);

  // Fetch timeline data (infinite query)
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useTimeline(
    activeCanvasId ?? undefined,
    sort,
  );

  // Flatten pages into entries
  const allEntries = useMemo(() => data?.pages.flatMap((p) => p.entries) ?? [], [data]);

  // Calendar counts query
  const { start: calStart, end: calEnd } = useMemo(
    () => getCalendarRange(calEndYear, calEndMonth),
    [calEndYear, calEndMonth],
  );
  const { data: countsData } = useTimelineCounts(activeCanvasId ?? undefined, calStart, calEnd);
  const calCounts = countsData?.counts ?? {};

  const handleShiftMonth = useCallback((delta: number) => {
    setCalEndMonth((m) => {
      let newM = m + delta;
      if (newM > 11) {
        setCalEndYear((y) => y + 1);
        newM -= 12;
      } else if (newM < 0) {
        setCalEndYear((y) => y - 1);
        newM += 12;
      }
      return newM;
    });
  }, []);

  const handleShiftYear = useCallback((delta: number) => {
    setCalEndYear((y) => y + delta);
  }, []);

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

  // Client-side filtering by parent item type + selected date + importance
  const filtered = useMemo(
    () =>
      allEntries.filter((e) => {
        if (!activeFilters.has(e.parentItemType)) return false;
        if (selectedDate) {
          const entryDate = e.createdAt.slice(0, 10);
          if (entryDate !== selectedDate) return false;
        }
        if (importantOnly && !e.isImportant) return false;
        return true;
      }),
    [allEntries, activeFilters, selectedDate, importantOnly],
  );

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!activeCanvasId) return null;

  return (
    <Box sx={{ height: "100vh", overflow: "auto", bgcolor: "var(--color-base)" }}>
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

      {/* Main content: two-column layout */}
      <Box
        sx={{
          display: "flex",
          gap: 3,
          maxWidth: 1040,
          mx: "auto",
          pt: 10,
          px: 3,
          ml: showSettings ? "calc((100vw - 1040px) / 2 + 180px)" : "auto",
          transition: "margin-left 0.2s",
        }}
      >
        {/* Left column: calendar sidebar */}
        <Box
          sx={{
            width: 280,
            flexShrink: 0,
            position: "sticky",
            top: 80,
            alignSelf: "flex-start",
          }}
        >
          <TimelineCalendar
            endYear={calEndYear}
            endMonth={calEndMonth}
            counts={calCounts}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onShiftMonth={handleShiftMonth}
            onShiftYear={handleShiftYear}
          />
          {selectedDate && (
            <Typography
              variant="caption"
              sx={{
                display: "block",
                textAlign: "center",
                mt: 1,
                color: "var(--color-blue)",
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
              onClick={() => setSelectedDate(null)}
            >
              Clear date filter
            </Typography>
          )}
        </Box>

        {/* Right column: timeline feed */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
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
              <ToggleButton value="createdAt" sx={{ textTransform: "none", gap: 0.5 }}>
                <SortIcon fontSize="small" />
                Created
              </ToggleButton>
              <ToggleButton value="updatedAt" sx={{ textTransform: "none", gap: 0.5 }}>
                <SortIcon fontSize="small" />
                Last Updated
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Pinned only filter */}
            <Chip
              label="Pinned only"
              icon={<StarIcon sx={{ fontSize: 14 }} />}
              size="small"
              onClick={() => setImportantOnly(!importantOnly)}
              sx={{
                bgcolor: importantOnly ? "var(--color-yellow)" : "transparent",
                color: importantOnly ? "var(--color-base)" : "var(--color-subtext0)",
                border: importantOnly ? "none" : "1px solid var(--color-surface1)",
                fontWeight: 600,
                fontSize: 11,
                cursor: "pointer",
                "&:hover": { opacity: 0.8 },
              }}
            />

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
              {filtered.map((entry, idx) => {
                const colors = theme.palette.canvasItemTypes[entry.parentItemType];
                const typeLabel =
                  CANVAS_ITEM_TYPES.find((t) => t.value === entry.parentItemType)?.label ??
                  entry.parentItemType;
                const ts = sort === "updatedAt" ? entry.updatedAt : entry.createdAt;
                const currentDateKey = getDateKey(ts);
                const prevEntry = idx > 0 ? filtered[idx - 1] : null;
                const prevTs = prevEntry
                  ? sort === "updatedAt"
                    ? prevEntry.updatedAt
                    : prevEntry.createdAt
                  : null;
                const showDivider = !prevTs || getDateKey(prevTs) !== currentDateKey;

                return (
                  <Box key={`${entry.kind}-${entry.id}`}>
                    {/* Date divider */}
                    {showDivider && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          my: 2,
                        }}
                      >
                        <Box sx={{ flex: 1, height: "1px", bgcolor: "var(--color-surface1)" }} />
                        <Typography
                          variant="caption"
                          sx={{
                            color: "var(--color-subtext0)",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatDateLabel(ts)}
                        </Typography>
                        <Box sx={{ flex: 1, height: "1px", bgcolor: "var(--color-surface1)" }} />
                      </Box>
                    )}

                    <Box
                      sx={{
                        mb: 1,
                        borderRadius: 2,
                        border: "1px solid var(--color-surface1)",
                        bgcolor: "var(--color-base)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "stretch",
                        gap: 1,
                        py: 1.5,
                        px: 2,
                      }}
                    >
                      {/* Row 1: type chip + title + date */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
                        <Typography
                          sx={{
                            fontWeight: 600,
                            color: "var(--color-text)",
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {entry.parentItemTitle}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "var(--color-overlay0)",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          {formatTimestamp(ts)}
                        </Typography>
                      </Box>

                      {/* Row 2: full content */}
                      {entry.kind === "photo" ? (
                        <BlurImage
                          src={entry.photoUrl!}
                          alt={entry.originalName ?? ""}
                          blurhash={entry.blurhash}
                          sx={{
                            width: "100%",
                            maxHeight: 300,
                            borderRadius: 1,
                          }}
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          component="div"
                          sx={{
                            color: "var(--color-subtext0)",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                          dangerouslySetInnerHTML={{
                            __html: timelineNotePreview(entry.content || ""),
                          }}
                        />
                      )}

                      {/* Row 3: action buttons */}
                      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<MapIcon sx={{ fontSize: 14 }} />}
                          onClick={() => {
                            setEditingItemId(entry.parentItemId);
                            navigate("/canvas");
                          }}
                          sx={{
                            textTransform: "none",
                            fontSize: 12,
                            color: "var(--color-subtext0)",
                            "&:hover": { color: "var(--color-text)" },
                          }}
                        >
                          Open in Canvas
                        </Button>
                        {entry.parentItemType === "session" && (
                          <Button
                            size="small"
                            startIcon={<CalendarMonthIcon sx={{ fontSize: 14 }} />}
                            onClick={() => navigate(`/sessions/${entry.parentItemId}`)}
                            sx={{
                              textTransform: "none",
                              fontSize: 12,
                              color: "var(--color-subtext0)",
                              "&:hover": { color: "var(--color-text)" },
                            }}
                          >
                            Open in Session
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </List>
          )}

          {/* Infinite scroll sentinel */}
          <Box ref={sentinelRef} sx={{ height: 1 }} />

          {/* Loading indicator for next page */}
          {isFetchingNextPage && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
