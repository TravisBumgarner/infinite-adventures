import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import { useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SearchResult } from "shared";
import * as api from "../../../api/client";
import { getContrastText } from "../../../utils/getContrastText";

interface SearchBarProps {
  canvasId: string;
  onNavigate: (itemId: string) => void;
}

export default function SearchBar({ canvasId, onNavigate }: SearchBarProps) {
  const theme = useTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const res = await api.searchItems(query, canvasId);
      setResults(res);
      setShowDropdown(true);
      setSelectedIndex(0);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, canvasId]);

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
    (result: SearchResult) => {
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
    <Box ref={containerRef} sx={{ position: "relative", width: 320 }}>
      <TextField
        variant="filled"
        size="small"
        fullWidth
        placeholder="Search items..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (results.length > 0) setShowDropdown(true);
        }}
        onBlur={() => setShowDropdown(false)}
        onKeyDown={handleKeyDown}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 20, color: "var(--color-overlay0)" }} />
              </InputAdornment>
            ),
          },
        }}
      />
      {showDropdown && results.length > 0 && (
        <Paper
          sx={{
            mt: 0.5,
            maxHeight: 300,
            overflowY: "auto",
            bgcolor: "var(--color-base)",
            border: "1px solid var(--color-surface1)",
          }}
        >
          {results.map((result, i) => {
            const bgColor = theme.palette.canvasItemTypes[result.type].light;
            return (
              <Box
                key={result.id}
                sx={{
                  p: "8px 12px",
                  cursor: "pointer",
                  bgcolor: i === selectedIndex ? "var(--color-surface1)" : "transparent",
                  borderBottom: "1px solid var(--color-surface0)",
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectResult(result);
                }}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.25 }}>
                  <Chip
                    label={result.type.toUpperCase()}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: 10,
                      fontWeight: 600,
                      bgcolor: bgColor,
                      color: getContrastText(bgColor),
                    }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {result.title}
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  sx={{ color: "var(--color-subtext0)", lineHeight: 1.4 }}
                  dangerouslySetInnerHTML={{ __html: result.snippet }}
                />
              </Box>
            );
          })}
        </Paper>
      )}
      {showDropdown && query.trim() && results.length === 0 && (
        <Paper
          sx={{
            mt: 0.5,
            bgcolor: "var(--color-base)",
            border: "1px solid var(--color-surface1)",
          }}
        >
          <Typography
            variant="body2"
            sx={{ p: 1.5, color: "var(--color-overlay0)", textAlign: "center" }}
          >
            No results found
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
