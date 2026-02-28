import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import MapIcon from "@mui/icons-material/Map";
import SortIcon from "@mui/icons-material/Sort";
import StarIcon from "@mui/icons-material/Star";
import TimelineIcon from "@mui/icons-material/Timeline";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import { useTheme } from "@mui/material/styles";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CanvasItemType } from "shared";
import { CANVAS_ITEM_TYPES } from "../../constants";

import { useCanvases, useTimeline, useTimelineCounts } from "../../hooks/queries";
import BlurImage from "../../sharedComponents/BlurImage";
import { canvasItemTypeIcon, LabelBadge } from "../../sharedComponents/LabelBadge";
import QueryErrorDisplay from "../../sharedComponents/QueryErrorDisplay";
import { useCanvasStore } from "../../stores/canvasStore";
import { FONT_SIZES } from "../../styles/styleConsts";
import { getContrastText } from "../../utils/getContrastText";
import { getNotePreview } from "../../utils/getNotePreview";
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

function toLocalDateString(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Timeline() {
  const navigate = useNavigate();
  const theme = useTheme();

  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const initActiveCanvas = useCanvasStore((s) => s.initActiveCanvas);
  const showSettings = useCanvasStore((s) => s.showSettings);
  const itemsCache = useCanvasStore((s) => s.itemsCache);

  const [sort, setSort] = useState<"createdAt" | "updatedAt">("createdAt");
  const [activeFilters, setActiveFilters] = useState<Set<CanvasItemType>>(() => new Set());
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
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, error, refetch } =
    useTimeline(activeCanvasId ?? undefined, sort);

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
        if (activeFilters.size > 0 && !activeFilters.has(e.parentItemType)) return false;
        if (selectedDate) {
          const entryDate = toLocalDateString(e.createdAt);
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
    <Box sx={{ height: "100%", overflow: "auto", bgcolor: "var(--color-base)" }}>
      {/* Main content: two-column layout */}
      <Box
        sx={{
          display: "flex",
          gap: 3,
          maxWidth: 1040,
          mx: "auto",
          px: 3,
          pt: 2,
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
              <ToggleButton value="createdAt" sx={{ gap: 0.5 }}>
                <SortIcon fontSize="small" />
                Created
              </ToggleButton>
              <ToggleButton value="updatedAt" sx={{ gap: 0.5 }}>
                <SortIcon fontSize="small" />
                Last Updated
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Pinned only filter */}
            <Chip
              label="Pinned only"
              icon={<StarIcon sx={{ fontSize: FONT_SIZES.md }} />}
              size="small"
              onClick={() => setImportantOnly(!importantOnly)}
              sx={{
                bgcolor: importantOnly ? "var(--color-yellow)" : "transparent",
                color: importantOnly ? "var(--color-base)" : "var(--color-subtext0)",
                border: importantOnly ? "none" : "1px solid var(--color-surface1)",
                fontWeight: 600,
                fontSize: FONT_SIZES.xs,
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
                      fontSize: FONT_SIZES.xs,
                      cursor: "pointer",
                      "&:hover": { opacity: 0.8 },
                    }}
                  />
                );
              })}
            </Box>
          </Box>

          {/* Timeline list */}
          {error ? (
            <QueryErrorDisplay error={error} onRetry={refetch} />
          ) : isLoading ? (
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
                      {/* Row 1: type chip + title + date + action buttons */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <LabelBadge
                          label={typeLabel}
                          accentColor={colors.light}
                          icon={canvasItemTypeIcon(entry.parentItemType)}
                          height={22}
                          fontSize={FONT_SIZES.xs}
                          sx={{ minWidth: 60 }}
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
                        <Tooltip title="Open in Canvas">
                          <IconButton
                            size="small"
                            onClick={() => {
                              navigate(`/canvas?focus=${entry.parentItemId}`);
                            }}
                            sx={{
                              color: "var(--color-subtext0)",
                              "&:hover": { color: "var(--color-text)" },
                              p: 0.5,
                            }}
                          >
                            <MapIcon sx={{ fontSize: FONT_SIZES.lg }} />
                          </IconButton>
                        </Tooltip>
                        {entry.parentItemType === "session" && (
                          <Tooltip title="Open in Session Viewer">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/sessions/${entry.parentItemId}`)}
                              sx={{
                                color: "var(--color-subtext0)",
                                "&:hover": { color: "var(--color-text)" },
                                p: 0.5,
                              }}
                            >
                              <CalendarMonthIcon sx={{ fontSize: FONT_SIZES.lg }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>

                      {/* Row 2: date */}
                      <Typography variant="caption" sx={{ color: "var(--color-overlay0)" }}>
                        {formatTimestamp(ts)}
                      </Typography>

                      {/* Row 3: full content */}
                      {entry.kind === "photo" ? (
                        <BlurImage
                          src={entry.photoUrl!}
                          alt={entry.originalName ?? ""}
                          blurhash={entry.blurhash}
                          sx={{
                            width: "100%",
                            maxHeight: "80vh",
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
                            __html: getNotePreview(entry.content || "", itemsCache, 0),
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                );
              })}
            </List>
          )}

          {/* Infinite scroll sentinel */}
          <Box ref={sentinelRef} sx={{ height: "1px" }} />

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
