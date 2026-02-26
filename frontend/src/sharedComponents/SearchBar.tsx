import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import InputBase from "@mui/material/InputBase";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CanvasItemSearchResult, CanvasItemType } from "shared";
import { useSearchItems } from "../hooks/queries";
import { useCanvasStore } from "../stores/canvasStore";
import { FONT_SIZES } from "../styles/styleConsts";
import { canvasItemTypeIcon, LabelBadge } from "./LabelBadge";

type Destination = "Canvas" | "Sessions" | "Timeline" | "Gallery";

const DESTINATIONS_BY_TYPE: Record<CanvasItemType, Destination[]> = {
  session: ["Canvas", "Sessions", "Timeline", "Gallery"],
  person: ["Canvas", "Timeline", "Gallery"],
  place: ["Canvas", "Timeline", "Gallery"],
  thing: ["Canvas", "Timeline", "Gallery"],
  event: ["Canvas", "Timeline", "Gallery"],
};

const NOTE_DESTINATIONS: Destination[] = ["Canvas"];

function getDestinations(result: CanvasItemSearchResult): Destination[] {
  return result.noteId ? NOTE_DESTINATIONS : DESTINATIONS_BY_TYPE[result.type];
}

export default function SearchBar() {
  const theme = useTheme();
  const navigate = useNavigate();

  const showSearchBar = useCanvasStore((s) => s.showSearchBar);
  const setShowSearchBar = useCanvasStore((s) => s.setShowSearchBar);
  const activeCanvasId = useCanvasStore((s) => s.activeCanvasId);
  const setEditingItemId = useCanvasStore((s) => s.setEditingItemId);
  const setPanelTab = useCanvasStore((s) => s.setPanelTab);
  const setHighlightNoteId = useCanvasStore((s) => s.setHighlightNoteId);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedPillIndex, setSelectedPillIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const resultRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Debounce the query
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setDebouncedQuery("");
      return;
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const { data: results = [] } = useSearchItems(debouncedQuery, activeCanvasId ?? undefined);

  // Reset selection when results change
  useEffect(() => {
    if (results.length >= 0) {
      setSelectedIndex(0);
      setSelectedPillIndex(0);
    }
  }, [results]);

  // Scroll selected result into view
  useEffect(() => {
    const el = resultRefs.current.get(selectedIndex);
    if (el) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!showSearchBar) {
      setQuery("");
      setDebouncedQuery("");
      setSelectedIndex(0);
      setSelectedPillIndex(0);
    }
  }, [showSearchBar]);

  const navigateToDestination = useCallback(
    (result: CanvasItemSearchResult, destination: Destination) => {
      setShowSearchBar(false);
      switch (destination) {
        case "Canvas":
          navigate("/canvas");
          setEditingItemId(result.itemId);
          setPanelTab("notes");
          setHighlightNoteId(result.noteId);
          break;
        case "Sessions":
          navigate(`/sessions/${result.itemId}`);
          break;
        case "Timeline":
          navigate("/timeline");
          break;
        case "Gallery":
          navigate("/gallery");
          break;
      }
    },
    [navigate, setEditingItemId, setShowSearchBar, setPanelTab, setHighlightNoteId],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const hasResults = debouncedQuery.trim() && results.length > 0;

    if (e.key === "ArrowDown" && hasResults) {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % results.length);
      setSelectedPillIndex(0);
    } else if (e.key === "ArrowUp" && hasResults) {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + results.length) % results.length);
      setSelectedPillIndex(0);
    } else if (e.key === "ArrowRight" && hasResults) {
      e.preventDefault();
      const result = results[selectedIndex];
      if (result) {
        const destinations = getDestinations(result);
        setSelectedPillIndex((i) => (i + 1) % destinations.length);
      }
    } else if (e.key === "ArrowLeft" && hasResults) {
      e.preventDefault();
      const result = results[selectedIndex];
      if (result) {
        const destinations = getDestinations(result);
        setSelectedPillIndex((i) => (i - 1 + destinations.length) % destinations.length);
      }
    } else if (e.key === "Enter" && hasResults) {
      e.preventDefault();
      const result = results[selectedIndex];
      if (result) {
        const destinations = getDestinations(result);
        navigateToDestination(result, destinations[selectedPillIndex]!);
      }
    }
  };

  return (
    <Dialog
      open={showSearchBar}
      onClose={() => setShowSearchBar(false)}
      maxWidth={false}
      PaperProps={{
        sx: {
          position: "fixed",
          top: 80,
          m: 0,
          width: 560,
          maxHeight: "70vh",
          border: "1px solid var(--color-surface1)",
          overflow: "hidden",
        },
      }}
      slotProps={{
        backdrop: {
          sx: { bgcolor: "rgba(0, 0, 0, 0.5)" },
        },
      }}
    >
      {/* Search input */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 1.5,
          borderBottom: "1px solid var(--color-surface1)",
        }}
      >
        <SearchIcon
          sx={{
            fontSize: FONT_SIZES.xl,
            color: "var(--color-overlay0)",
            flexShrink: 0,
          }}
        />
        <InputBase
          autoFocus
          fullWidth
          placeholder="Search items..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{
            fontSize: FONT_SIZES.md,
            color: "var(--color-text)",
            "& input::placeholder": {
              color: "var(--color-overlay0)",
              opacity: 1,
            },
          }}
        />
      </Box>

      {/* Results */}
      {debouncedQuery.trim() && results.length > 0 && (
        <Box sx={{ overflowY: "auto", maxHeight: "calc(70vh - 110px)" }}>
          {results.map((result, i) => {
            const bgColor = theme.palette.canvasItemTypes[result.type].light;
            const destinations = getDestinations(result);
            const isSelected = i === selectedIndex;
            const resultKey = result.noteId ?? result.itemId;

            return (
              <Box
                key={resultKey}
                ref={(el: HTMLDivElement | null) => {
                  if (el) {
                    resultRefs.current.set(i, el);
                  } else {
                    resultRefs.current.delete(i);
                  }
                }}
                sx={{
                  px: 2,
                  py: 1.5,
                  cursor: "pointer",
                  bgcolor: isSelected ? "var(--color-surface0)" : "transparent",
                  borderBottom: "1px solid var(--color-surface0)",
                  transition: "background-color 0.1s",
                  "&:last-child": { borderBottom: "none" },
                  "&:hover": {
                    bgcolor: "var(--color-surface0)",
                  },
                }}
                onClick={() => {
                  const dest = isSelected ? destinations[selectedPillIndex]! : destinations[0]!;
                  navigateToDestination(result, dest);
                }}
                onMouseEnter={() => {
                  setSelectedIndex(i);
                  setSelectedPillIndex(0);
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    mb: 0.5,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                    {result.title}
                  </Typography>
                  <LabelBadge
                    label={result.type}
                    accentColor={bgColor}
                    icon={canvasItemTypeIcon(result.type)}
                    height={18}
                    fontSize={FONT_SIZES.xs}
                    sx={{ textTransform: "capitalize" }}
                  />
                  {result.noteId && (
                    <LabelBadge
                      label="Note"
                      accentColor="var(--color-surface2)"
                      height={18}
                      fontSize={FONT_SIZES.xs}
                      sx={{ color: "var(--color-subtext0)" }}
                    />
                  )}
                </Box>
                {result.snippet && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--color-subtext0)",
                      lineHeight: 1.4,
                      display: "block",
                      mb: 0.75,
                    }}
                    dangerouslySetInnerHTML={{
                      __html: result.snippet,
                    }}
                  />
                )}
                {/* Destination pills */}
                {isSelected && (
                  <Box
                    sx={{
                      display: "flex",
                      gap: 0.5,
                      mt: 0.5,
                    }}
                  >
                    {destinations.map((dest, di) => (
                      <Chip
                        key={dest}
                        label={dest}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToDestination(result, dest);
                        }}
                        sx={{
                          height: 22,
                          fontSize: FONT_SIZES.xs,
                          fontWeight: 500,
                          bgcolor:
                            di === selectedPillIndex
                              ? "var(--color-blue)"
                              : "var(--color-surface1)",
                          color: di === selectedPillIndex ? "#fff" : "var(--color-subtext0)",
                          cursor: "pointer",
                          "&:hover": {
                            bgcolor:
                              di === selectedPillIndex
                                ? "var(--color-blue)"
                                : "var(--color-surface2)",
                          },
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      )}

      {/* No results */}
      {debouncedQuery.trim() && results.length === 0 && (
        <Typography
          variant="body2"
          sx={{
            p: 3,
            color: "var(--color-overlay0)",
            textAlign: "center",
          }}
        >
          No results found
        </Typography>
      )}

      {/* Footer with keyboard hints */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          px: 2,
          py: 1,
          borderTop: "1px solid var(--color-surface1)",
          bgcolor: "var(--color-mantle)",
        }}
      >
        {[
          { keys: "↑↓", label: "navigate" },
          { keys: "←→", label: "destination" },
          { keys: "↵", label: "open" },
          { keys: "esc", label: "close" },
        ].map(({ keys, label }) => (
          <Box
            key={keys}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <Typography
              variant="caption"
              component="kbd"
              sx={{
                px: 0.5,
                py: 0.25,
                fontSize: FONT_SIZES.xs,
                fontFamily: "inherit",
                border: "1px solid var(--color-surface1)",
                color: "var(--color-subtext0)",
              }}
            >
              {keys}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: FONT_SIZES.xs,
                color: "var(--color-overlay0)",
              }}
            >
              {label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Dialog>
  );
}
