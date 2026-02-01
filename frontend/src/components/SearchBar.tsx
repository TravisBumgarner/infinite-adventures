import { useState, useRef, useEffect, useCallback } from "react";
import type { SearchResult, NoteType } from "../types";
import * as api from "../api/client";

const TYPE_COLORS: Record<NoteType, string> = {
  pc: "#4a90d9",
  npc: "#d94a4a",
  item: "#d9a74a",
  quest: "#8b5cf6",
  location: "#22c55e",
  goal: "#ec4899",
  session: "#6b7280",
};

interface SearchBarProps {
  onNavigate: (noteId: string) => void;
}

export default function SearchBar({ onNavigate }: SearchBarProps) {
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
                  i === selectedIndex ? "#45475a" : "transparent",
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
                    background: TYPE_COLORS[result.type],
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
    background: "#1e1e2e",
    border: "1px solid #45475a",
    borderRadius: 8,
    color: "#cdd6f4",
    fontSize: 14,
    outline: "none",
    fontFamily: "system-ui, sans-serif",
  },
  dropdown: {
    marginTop: 4,
    background: "#1e1e2e",
    border: "1px solid #45475a",
    borderRadius: 8,
    maxHeight: 300,
    overflowY: "auto",
  },
  item: {
    padding: "8px 12px",
    cursor: "pointer",
    borderBottom: "1px solid #313244",
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
    color: "#cdd6f4",
    fontSize: 14,
    fontWeight: 600,
  },
  snippet: {
    color: "#a6adc8",
    fontSize: 12,
    lineHeight: 1.4,
  },
  empty: {
    padding: "12px",
    color: "#6c7086",
    fontSize: 13,
    textAlign: "center" as const,
  },
};
