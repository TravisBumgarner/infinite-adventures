import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "@mui/material";
import type { SearchResult } from "shared";
import * as api from "../api/client";

interface SearchBarProps {
  onNavigate: (noteId: string) => void;
}

export default function SearchBar({ onNavigate }: SearchBarProps) {
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
      const res = await api.searchNotes(query);
      setResults(res);
      setShowDropdown(true);
      setSelectedIndex(0);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as HTMLElement)
      ) {
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
    [onNavigate]
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
    <div ref={containerRef} style={styles.container}>
      <input
        type="text"
        placeholder="Search notes..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (results.length > 0) setShowDropdown(true);
        }}
        onKeyDown={handleKeyDown}
        style={styles.input}
      />
      {showDropdown && results.length > 0 && (
        <div style={styles.dropdown}>
          {results.map((result, i) => (
            <div
              key={result.id}
              style={{
                ...styles.item,
                background:
                  i === selectedIndex ? "var(--color-surface1)" : "transparent",
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                selectResult(result);
              }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <div style={styles.itemHeader}>
                <span
                  style={{
                    ...styles.badge,
                    background: theme.palette.nodeTypes[result.type].light,
                  }}
                >
                  {result.type.toUpperCase()}
                </span>
                <span style={styles.title}>{result.title}</span>
              </div>
              <div
                style={styles.snippet}
                dangerouslySetInnerHTML={{ __html: result.snippet }}
              />
            </div>
          ))}
        </div>
      )}
      {showDropdown && query.trim() && results.length === 0 && (
        <div style={styles.dropdown}>
          <div style={styles.empty}>No results found</div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "fixed",
    top: 16,
    left: 16,
    zIndex: 50,
    width: 320,
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    background: "var(--color-base)",
    border: "1px solid var(--color-surface1)",
    borderRadius: 8,
    color: "var(--color-text)",
    fontSize: 14,
    outline: "none",
    fontFamily: "system-ui, sans-serif",
  },
  dropdown: {
    marginTop: 4,
    background: "var(--color-base)",
    border: "1px solid var(--color-surface1)",
    borderRadius: 8,
    maxHeight: 300,
    overflowY: "auto",
  },
  item: {
    padding: "8px 12px",
    cursor: "pointer",
    borderBottom: "1px solid var(--color-surface0)",
  },
  itemHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  badge: {
    fontSize: 10,
    padding: "1px 5px",
    borderRadius: 3,
    color: "#fff",
    fontWeight: 600,
  },
  title: {
    color: "var(--color-text)",
    fontSize: 14,
    fontWeight: 600,
  },
  snippet: {
    color: "var(--color-subtext0)",
    fontSize: 12,
    lineHeight: 1.4,
  },
  empty: {
    padding: "12px",
    color: "var(--color-overlay0)",
    fontSize: 13,
    textAlign: "center" as const,
  },
};
