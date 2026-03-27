import TuneIcon from "@mui/icons-material/Tune";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Paper from "@mui/material/Paper";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import { CANVAS_ITEM_TYPES } from "../../../constants";
import { TagBadge } from "../../../sharedComponents/LabelBadge";
import { useCanvasStore } from "../../../stores/canvasStore";
import { useTagStore } from "../../../stores/tagStore";
import { FONT_SIZES } from "../../../styles/styleConsts";
import { getContrastText } from "../../../utils/getContrastText";

const sectionLabelSx = {
  color: "var(--color-subtext0)",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  display: "block",
  mb: 1,
} as const;

export default function FilterBar() {
  const theme = useTheme();
  const activeTypes = useCanvasStore((s) => s.activeTypes);
  const activeTags = useCanvasStore((s) => s.activeTags);
  const filterSearch = useCanvasStore((s) => s.filterSearch);
  const toggleType = useCanvasStore((s) => s.toggleType);
  const toggleTag = useCanvasStore((s) => s.toggleTag);
  const setFilterSearch = useCanvasStore((s) => s.setFilterSearch);
  const tagsById = useTagStore((s) => s.tags);
  const allTags = useMemo(() => Object.values(tagsById), [tagsById]);
  const [expanded, setExpanded] = useState(false);
  const hasFilters = activeTypes.size > 0 || activeTags.size > 0 || filterSearch.length > 0;
  const filterCount = activeTypes.size + activeTags.size + (filterSearch.length > 0 ? 1 : 0);

  return (
    <ClickAwayListener onClickAway={() => setExpanded(false)}>
      <Box sx={{ position: "relative" }}>
        <IconButton
          onClick={() => setExpanded(!expanded)}
          title="Filter canvas"
          sx={{
            bgcolor: hasFilters ? "var(--color-blue)" : "var(--color-chrome-bg)",
            backdropFilter: "blur(8px)",
            border: "1px solid",
            borderColor: hasFilters ? "var(--color-blue)" : "var(--color-surface1)",
            color: hasFilters ? "white" : "var(--color-text)",
            height: 40,
            width: 40,
            transition: "all 0.2s",
            "&:hover": {
              bgcolor: hasFilters ? "var(--color-blue)" : "var(--color-surface0)",
            },
          }}
        >
          <TuneIcon sx={{ fontSize: FONT_SIZES.lg }} />
          {filterCount > 0 && (
            <Box
              sx={{
                position: "absolute",
                top: -4,
                right: -4,
                minWidth: 16,
                height: 16,
                borderRadius: 8,
                bgcolor: hasFilters ? "white" : "var(--color-blue)",
                color: hasFilters ? "var(--color-blue)" : "white",
                fontSize: FONT_SIZES.xs,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: 0.5,
              }}
            >
              {filterCount}
            </Box>
          )}
        </IconButton>

        {expanded && (
          <Paper
            elevation={8}
            sx={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              bgcolor: "var(--color-base)",
              border: "1px solid var(--color-surface1)",
              p: 2,
              minWidth: 240,
              zIndex: 100,
            }}
          >
            <Typography variant="caption" sx={sectionLabelSx}>
              Filter by text
            </Typography>
            <InputBase
              placeholder="Type to filter..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              sx={{
                width: "100%",
                px: 1.5,
                py: 0.75,
                border: "1px solid var(--color-surface1)",
                fontSize: FONT_SIZES.sm,
                mb: 2,
              }}
            />

            <Typography variant="caption" sx={sectionLabelSx}>
              Filter by type
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {CANVAS_ITEM_TYPES.map(({ value, label }) => {
                const active = activeTypes.has(value);
                const bgColor = theme.palette.canvasItemTypes[value].light;
                return (
                  <Chip
                    key={value}
                    label={label}
                    size="small"
                    onClick={() => toggleType(value)}
                    sx={{
                      bgcolor: active ? bgColor : "var(--color-surface0)",
                      border: "none",
                      color: active ? getContrastText(bgColor) : "var(--color-text)",
                      fontWeight: 500,
                      fontSize: FONT_SIZES.sm,
                      transition: "all 0.15s",
                      "&:hover": {
                        bgcolor: active ? bgColor : "var(--color-surface1)",
                      },
                    }}
                  />
                );
              })}
            </Box>

            {allTags.length > 0 && (
              <>
                <Typography variant="caption" sx={{ ...sectionLabelSx, mt: 2 }}>
                  Filter by tag
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                  {allTags.map((tag) => {
                    const active = activeTags.has(tag.id);
                    return (
                      <Box
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        sx={{
                          cursor: "pointer",
                          opacity: active ? 1 : 0.5,
                          transition: "opacity 0.15s",
                          "&:hover": { opacity: active ? 0.85 : 0.75 },
                        }}
                      >
                        <TagBadge tag={tag} compact />
                      </Box>
                    );
                  })}
                </Box>
              </>
            )}

            {hasFilters && (
              <Box
                component="button"
                onClick={() => {
                  setFilterSearch("");
                  for (const type of activeTypes) toggleType(type);
                  for (const tagId of activeTags) toggleTag(tagId);
                }}
                sx={{
                  mt: 2,
                  width: "100%",
                  py: 0.75,
                  bgcolor: "transparent",
                  border: "1px solid var(--color-surface1)",
                  color: "var(--color-subtext0)",
                  fontSize: FONT_SIZES.sm,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  "&:hover": {
                    bgcolor: "var(--color-surface0)",
                    color: "var(--color-text)",
                  },
                }}
              >
                Clear all filters
              </Box>
            )}
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
}
