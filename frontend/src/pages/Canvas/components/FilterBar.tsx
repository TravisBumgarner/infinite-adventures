import CloseIcon from "@mui/icons-material/Close";
import FilterListIcon from "@mui/icons-material/FilterList";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import { useState } from "react";
import { CANVAS_ITEM_TYPES } from "../../../constants";
import { useCanvasStore } from "../../../stores/canvasStore";
import { getContrastText } from "../../../utils/getContrastText";

export default function FilterBar() {
  const theme = useTheme();
  const activeTypes = useCanvasStore((s) => s.activeTypes);
  const filterSearch = useCanvasStore((s) => s.filterSearch);
  const toggleType = useCanvasStore((s) => s.toggleType);
  const setFilterSearch = useCanvasStore((s) => s.setFilterSearch);
  const [expanded, setExpanded] = useState(false);
  const hasFilters = activeTypes.size > 0 || filterSearch.length > 0;

  if (!expanded) {
    return (
      <IconButton
        onClick={() => setExpanded(true)}
        title="Filter"
        sx={{
          bgcolor: "var(--color-base)",
          border: "1px solid var(--color-surface1)",
          borderRadius: 2,
          color: "var(--color-text)",
          height: 40,
          width: 40,
          "&:hover": { bgcolor: "var(--color-surface0)" },
        }}
      >
        <FilterListIcon fontSize="small" />
        {hasFilters && (
          <Box
            sx={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 6,
              height: 6,
              borderRadius: "50%",
              bgcolor: "primary.main",
            }}
          />
        )}
      </IconButton>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: "var(--color-base)",
        border: "1px solid var(--color-surface1)",
        borderRadius: 2,
        p: 1,
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
      }}
    >
      <Box sx={{ display: "flex", gap: 0.75, alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Filter by text..."
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
          sx={{ width: 180 }}
        />
        <IconButton
          onClick={() => setExpanded(false)}
          size="small"
          sx={{ color: "var(--color-subtext0)" }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
        {CANVAS_ITEM_TYPES.map(({ value, label }) => {
          const active = activeTypes.has(value);
          const bgColor = theme.palette.canvasItemTypes[value].light;
          return (
            <Chip
              key={value}
              label={label}
              size="small"
              onClick={() => toggleType(value)}
              variant={active ? "filled" : "outlined"}
              sx={{
                bgcolor: active ? bgColor : "transparent",
                borderColor: bgColor,
                color: active ? getContrastText(bgColor) : "var(--color-subtext0)",
                fontWeight: 600,
                fontSize: 11,
                "&:hover": {
                  bgcolor: active ? bgColor : "transparent",
                },
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}
