import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useMemo } from "react";

const DAY_LABELS = [
  { key: "sun", label: "S" },
  { key: "mon", label: "M" },
  { key: "tue", label: "T" },
  { key: "wed", label: "W" },
  { key: "thu", label: "T" },
  { key: "fri", label: "F" },
  { key: "sat", label: "S" },
];

interface TimelineCalendarProps {
  endYear: number;
  endMonth: number;
  counts: Record<string, number>;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  onShiftMonth: (delta: number) => void;
  onShiftYear: (delta: number) => void;
}

function formatYYYYMMDD(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function MonthGrid({
  year,
  month,
  counts,
  selectedDate,
  onSelectDate,
}: {
  year: number;
  month: number;
  counts: Record<string, number>;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}) {
  const monthName = new Date(year, month, 1).toLocaleString("en-US", { month: "long" });
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = formatYYYYMMDD(today.getFullYear(), today.getMonth(), today.getDate());

  const cells: { key: string; day: number | null }[] = [];
  for (let i = 0; i < firstDayOfWeek; i++)
    cells.push({ key: `pad-${year}-${month}-${i}`, day: null });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ key: formatYYYYMMDD(year, month, d), day: d });

  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          color: "var(--color-text)",
          display: "block",
          mb: 0.5,
          fontSize: 12,
        }}
      >
        {monthName} {year}
      </Typography>

      {/* Day-of-week headers */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", mb: "2px" }}>
        {DAY_LABELS.map((d) => (
          <Typography
            key={d.key}
            variant="caption"
            sx={{
              textAlign: "center",
              color: "var(--color-overlay0)",
              fontSize: 10,
              fontWeight: 600,
              lineHeight: "20px",
            }}
          >
            {d.label}
          </Typography>
        ))}
      </Box>

      {/* Day cells */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
        {cells.map((cell) => {
          if (cell.day === null) {
            return <Box key={cell.key} sx={{ height: 28 }} />;
          }
          const dateStr = formatYYYYMMDD(year, month, cell.day);
          const count = counts[dateStr] ?? 0;
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === todayStr;

          return (
            <Box
              key={dateStr}
              onClick={() => onSelectDate(isSelected ? null : dateStr)}
              sx={{
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                cursor: "pointer",
                border: isSelected
                  ? "2px solid var(--color-blue)"
                  : isToday
                    ? "1px solid var(--color-overlay0)"
                    : "1px solid transparent",
                bgcolor: count > 0 ? "var(--color-surface0)" : "transparent",
                "&:hover": {
                  bgcolor: "var(--color-surface1)",
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: count > 0 ? 700 : 400,
                  color: count > 0 ? "var(--color-text)" : "var(--color-overlay0)",
                  lineHeight: 1,
                }}
              >
                {cell.day}
              </Typography>
              {count > 0 && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 1,
                    right: 1,
                    bgcolor: "var(--color-blue)",
                    color: "#fff",
                    borderRadius: "50%",
                    width: 12,
                    height: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 8,
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  {count > 99 ? "+" : count}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

/** Compute the 3 months displayed: endMonth, endMonth-1, endMonth-2 */
export function getCalendarRange(endYear: number, endMonth: number) {
  const months: { year: number; month: number }[] = [];
  for (let i = 0; i < 3; i++) {
    let m = endMonth - i;
    let y = endYear;
    while (m < 0) {
      m += 12;
      y -= 1;
    }
    months.push({ year: y, month: m });
  }
  const earliest = months[months.length - 1]!;
  const latest = months[0]!;
  const start = `${earliest.year}-${String(earliest.month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(latest.year, latest.month + 1, 0).getDate();
  const end = `${latest.year}-${String(latest.month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { months, start, end };
}

export default function TimelineCalendar({
  endYear,
  endMonth,
  counts,
  selectedDate,
  onSelectDate,
  onShiftMonth,
  onShiftYear,
}: TimelineCalendarProps) {
  const { months } = useMemo(() => getCalendarRange(endYear, endMonth), [endYear, endMonth]);

  return (
    <Box>
      {/* Navigation */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton size="small" onClick={() => onShiftYear(-1)} title="Previous year">
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "var(--color-subtext0)" }}>
              {"<<"}
            </Typography>
          </IconButton>
          <IconButton size="small" onClick={() => onShiftMonth(-1)} title="Previous month">
            <ChevronLeftIcon sx={{ fontSize: 18, color: "var(--color-subtext0)" }} />
          </IconButton>
        </Box>

        <Typography
          variant="caption"
          sx={{ fontWeight: 700, color: "var(--color-text)", fontSize: 12 }}
        >
          {endYear}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton size="small" onClick={() => onShiftMonth(1)} title="Next month">
            <ChevronRightIcon sx={{ fontSize: 18, color: "var(--color-subtext0)" }} />
          </IconButton>
          <IconButton size="small" onClick={() => onShiftYear(1)} title="Next year">
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "var(--color-subtext0)" }}>
              {">>"}
            </Typography>
          </IconButton>
        </Box>
      </Box>

      {/* Month grids */}
      {months.map(({ year, month }) => (
        <MonthGrid
          key={`${year}-${month}`}
          year={year}
          month={month}
          counts={counts}
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
        />
      ))}
    </Box>
  );
}
