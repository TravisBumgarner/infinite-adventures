import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import InputBase from "@mui/material/InputBase";
import Paper from "@mui/material/Paper";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CanvasItemSearchResult } from "shared";
import { useSearchItems } from "../../../hooks/queries";
import { getContrastText } from "../../../utils/getContrastText";

interface SearchBarProps {
  canvasId: string;
  onNavigate: (itemId: string) => void;
}

export default function SearchBar({ canvasId, onNavigate }: SearchBarProps) {
  const theme = useTheme();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce the query
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setDebouncedQuery("");
      setShowDropdown(false);
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

  // Use React Query for search
  const { data: results = [] } = useSearchItems(debouncedQuery, canvasId);

  // Show dropdown when results arrive
  useEffect(() => {
    if (debouncedQuery.trim() && results.length > 0) {
      setShowDropdown(true);
      setSelectedIndex(0);
    }
  }, [results, debouncedQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as HTMLElement)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectResult = useCallback(
    (result: CanvasItemSearchResult) => {
      onNavigate(result.id);
      setShowDropdown(false);
      setQuery("");
    },
    [onNavigate],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectResult(results[selectedIndex]!);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <Box ref={containerRef} sx={{ position: "relative" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: 0.75,
          bgcolor: "var(--color-chrome-bg)",
          backdropFilter: "blur(8px)",
          border: "1px solid var(--color-surface1)",
          borderRadius: 3,
          minWidth: 280,
          transition: "border-color 0.2s, box-shadow 0.2s",
          "&:focus-within": {
            borderColor: "var(--color-blue)",
            boxShadow: "0 0 0 2px rgba(var(--color-blue-rgb), 0.1)",
          },
        }}
      >
        <SearchIcon sx={{ fontSize: 18, color: "var(--color-overlay0)", flexShrink: 0 }} />
        <InputBase
          size="small"
          placeholder="Search items..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowDropdown(true);
          }}
          onBlur={() => setShowDropdown(false)}
          onKeyDown={handleKeyDown}
          sx={{
            flex: 1,
            fontSize: 14,
            color: "var(--color-text)",
            "& input::placeholder": {
              color: "var(--color-overlay0)",
              opacity: 1,
            },
          }}
        />
      </Box>

      {showDropdown && results.length > 0 && (
        <Paper
          elevation={8}
          sx={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            maxHeight: 320,
            overflowY: "auto",
            bgcolor: "var(--color-base)",
            border: "1px solid var(--color-surface1)",
            borderRadius: 2,
            zIndex: 100,
          }}
        >
          {results.map((result, i) => {
            const bgColor = theme.palette.canvasItemTypes[result.type].light;
            return (
              <Box
                key={result.id}
                sx={{
                  p: 1.5,
                  cursor: "pointer",
                  bgcolor: i === selectedIndex ? "var(--color-surface0)" : "transparent",
                  borderBottom: "1px solid var(--color-surface0)",
                  transition: "background-color 0.1s",
                  "&:last-child": { borderBottom: "none" },
                  "&:hover": { bgcolor: "var(--color-surface0)" },
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectResult(result);
                }}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                    {result.title}
                  </Typography>
                  <Chip
                    label={result.type}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: 10,
                      fontWeight: 600,
                      bgcolor: bgColor,
                      color: getContrastText(bgColor),
                      textTransform: "capitalize",
                    }}
                  />
                </Box>
                {result.snippet && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--color-subtext0)",
                      lineHeight: 1.4,
                      display: "block",
                    }}
                    dangerouslySetInnerHTML={{ __html: result.snippet }}
                  />
                )}
              </Box>
            );
          })}
        </Paper>
      )}

      {showDropdown && query.trim() && results.length === 0 && (
        <Paper
          elevation={8}
          sx={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            bgcolor: "var(--color-base)",
            border: "1px solid var(--color-surface1)",
            borderRadius: 2,
            zIndex: 100,
          }}
        >
          <Typography
            variant="body2"
            sx={{ p: 2, color: "var(--color-overlay0)", textAlign: "center" }}
          >
            No results found
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
