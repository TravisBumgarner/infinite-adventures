import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import FilterListIcon from "@mui/icons-material/FilterList";
import MapIcon from "@mui/icons-material/Map";
import SortIcon from "@mui/icons-material/Sort";
import StarIcon from "@mui/icons-material/Star";
import TimelineIcon from "@mui/icons-material/Timeline";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import { useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { CANVAS_ITEM_TYPES } from "../../constants";
import { useCanvases, useItems, useTimeline, useTimelineCounts } from "../../hooks/queries";
import BlurImage from "../../sharedComponents/BlurImage";
import { canvasItemTypeIcon, LabelBadge } from "../../sharedComponents/LabelBadge";
import QueryErrorDisplay from "../../sharedComponents/QueryErrorDisplay";
import { useCanvasStore } from "../../stores/canvasStore";
import { FONT_SIZES } from "../../styles/styleConsts";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const parentItemId = searchParams.get("parentItemId") ?? undefined;

  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const initActiveCanvas = useCanvasStore((s) => s.initActiveCanvas);
  const showSettings = useCanvasStore((s) => s.showSettings);
  const itemsCache = useCanvasStore((s) => s.itemsCache);
  const setEditingItemId = useCanvasStore((s) => s.setEditingItemId);

  const [sort, setSort] = useState<"createdAt" | "updatedAt">("updatedAt");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [importantOnly, setImportantOnly] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

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

  // Fetch items for filter autocomplete
  const { data: rawItems = [] } = useItems(activeCanvasId ?? undefined);
  const items = useMemo(
    () =>
      [...rawItems].sort(
        (a, b) =>
          a.type.localeCompare(b.type) ||
          a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
      ),
    [rawItems],
  );

  // Fetch timeline data (infinite query)
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, error, refetch } =
    useTimeline(activeCanvasId ?? undefined, sort, parentItemId);

  // Flatten pages into entries
  const allEntries = useMemo(() => data?.pages.flatMap((p) => p.entries) ?? [], [data]);

  // Calendar counts query
  const { start: calStart, end: calEnd } = useMemo(
    () => getCalendarRange(calEndYear, calEndMonth),
    [calEndYear, calEndMonth],
  );
  const { data: countsData } = useTimelineCounts(
    activeCanvasId ?? undefined,
    calStart,
    calEnd,
    parentItemId,
  );
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

  // Client-side filtering by selected date + importance
  const filtered = useMemo(
    () =>
      allEntries.filter((e) => {
        if (selectedDate) {
          const entryDate = toLocalDateString(e.createdAt);
          if (entryDate !== selectedDate) return false;
        }
        if (importantOnly && !e.isImportant) return false;
        return true;
      }),
    [allEntries, selectedDate, importantOnly],
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
      <Box
        sx={{
          maxWidth: 1040,
          mx: "auto",
          px: 3,
          pt: 2,
          ml: showSettings ? "calc((100vw - 1040px) / 2 + 180px)" : "auto",
          transition: "margin-left 0.2s",
        }}
      >
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
            <ToggleButton
              value="updatedAt"
              sx={{ gap: 0.5, py: 0, px: 1, height: 32, fontSize: FONT_SIZES.xs }}
            >
              <SortIcon sx={{ fontSize: FONT_SIZES.md }} />
              Last Updated
            </ToggleButton>
            <ToggleButton
              value="createdAt"
              sx={{ gap: 0.5, py: 0, px: 1, height: 32, fontSize: FONT_SIZES.xs }}
            >
              <SortIcon sx={{ fontSize: FONT_SIZES.md }} />
              Created
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Item filter */}
          <Autocomplete
            size="small"
            options={items}
            getOptionLabel={(opt) => opt.title}
            value={items.find((i) => i.id === parentItemId) ?? null}
            onChange={(_e, item) => {
              if (item) {
                searchParams.set("parentItemId", item.id);
              } else {
                searchParams.delete("parentItemId");
              }
              setSearchParams(searchParams, { replace: true });
            }}
            renderOption={(props, option) => {
              const colors = theme.palette.canvasItemTypes[option.type];
              return (
                <li
                  {...props}
                  key={option.id}
                  style={{
                    ...props.style,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  <LabelBadge
                    label={option.type}
                    accentColor={colors.light}
                    icon={canvasItemTypeIcon(option.type)}
                    height={18}
                    fontSize={FONT_SIZES.xs}
                    sx={{ mr: 1, flexShrink: 0, textTransform: "capitalize" }}
                  />
                  <span
                    style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {option.title}
                  </span>
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="All items"
                variant="outlined"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <FilterListIcon
                        sx={{ fontSize: FONT_SIZES.lg, color: "var(--color-overlay0)", mr: 0.5 }}
                      />
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
              />
            )}
            sx={{
              minWidth: 250,
              maxWidth: 350,
              "& .MuiInputBase-root": {
                py: 0,
                height: 32,
                fontSize: FONT_SIZES.xs,
                "& input": { py: 0 },
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "var(--color-surface1)",
              },
            }}
            blurOnSelect
            clearOnBlur={false}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
          />

          {/* Pinned only filter */}
          <Chip
            label="Pinned only"
            icon={<StarIcon sx={{ fontSize: FONT_SIZES.md }} />}
            onClick={() => setImportantOnly(!importantOnly)}
            sx={{
              height: 32,
              bgcolor: importantOnly ? "var(--color-yellow)" : "transparent",
              color: importantOnly ? "var(--color-base)" : "var(--color-subtext0)",
              border: importantOnly ? "none" : "1px solid var(--color-surface1)",
              fontWeight: 600,
              fontSize: FONT_SIZES.xs,
              cursor: "pointer",
              "&:hover": { opacity: 0.8 },
            }}
          />

          {/* Calendar toggle */}
          <Chip
            label={showCalendar ? "Hide calendar" : "Show calendar"}
            icon={<CalendarMonthIcon sx={{ fontSize: FONT_SIZES.md }} />}
            onClick={() => setShowCalendar(!showCalendar)}
            sx={{
              height: 32,
              bgcolor: showCalendar ? "var(--color-blue)" : "transparent",
              color: showCalendar ? "#fff" : "var(--color-subtext0)",
              border: showCalendar ? "none" : "1px solid var(--color-surface1)",
              fontWeight: 600,
              fontSize: FONT_SIZES.xs,
              cursor: "pointer",
              "&:hover": { opacity: 0.8 },
            }}
          />
        </Box>

        {/* Two-column layout: timeline feed + optional calendar sidebar */}
        <Box sx={{ display: "flex", gap: 3 }}>
          {/* Left column: timeline feed */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
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
              <List
                disablePadding
                onClick={(e) => {
                  const target = (e.target as HTMLElement).closest(
                    ".mention-link",
                  ) as HTMLElement | null;
                  if (target) {
                    e.stopPropagation();
                    const itemId = target.dataset.itemId;
                    if (itemId) setEditingItemId(itemId);
                  }
                }}
              >
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

          {/* Right column: calendar sidebar */}
          {showCalendar && (
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
          )}
        </Box>
      </Box>
    </Box>
  );
}
