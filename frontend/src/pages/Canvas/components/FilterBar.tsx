import CloseIcon from "@mui/icons-material/Close";
import FilterListIcon from "@mui/icons-material/FilterList";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import { useState } from "react";
import type { NoteType } from "shared";
import { NOTE_TYPES } from "../../../constants";
import { getContrastText } from "../../../utils/getContrastText";

interface FilterBarProps {
  activeTypes: Set<NoteType>;
  search: string;
  onToggleType: (type: NoteType) => void;
  onSearchChange: (search: string) => void;
}

export default function FilterBar({
  activeTypes,
  search,
  onToggleType,
  onSearchChange,
}: FilterBarProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const hasFilters = activeTypes.size > 0 || search.length > 0;

  if (!expanded) {
    return (
      <IconButton
        onClick={() => setExpanded(true)}
        title="Filter"
        sx={{
          position: "fixed",
          top: 16,
          left: 344,
          zIndex: 50,
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
        position: "fixed",
        top: 16,
        left: 344,
        zIndex: 50,
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
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
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
        {NOTE_TYPES.map(({ value, label }) => {
          const active = activeTypes.has(value);
          const bgColor = theme.palette.nodeTypes[value].light;
          return (
            <Chip
              key={value}
              label={label}
              size="small"
              onClick={() => onToggleType(value)}
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
