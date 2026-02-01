import { useState, useRef, useEffect, useCallback } from "react";
import type { NoteSummary } from "../types";
import * as api from "../api/client";

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  style?: React.CSSProperties;
}

export default function MentionInput({
  value,
  onChange,
  style,
}: MentionInputProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [filter, setFilter] = useState("");
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch notes for autocomplete when popup opens
  useEffect(() => {
    if (showPopup) {
      api.fetchNotes().then(setNotes);
    }
  }, [showPopup]);

  const filtered = notes.filter((n) =>
    n.title.toLowerCase().includes(filter.toLowerCase())
  );

  const insertMention = useCallback(
    (title: string) => {
      if (mentionStart === null) return;

      // The text from @ to current cursor
      const before = value.slice(0, mentionStart);
      const textarea = textareaRef.current;
      const cursorPos = textarea?.selectionStart ?? value.length;
      const after = value.slice(cursorPos);

      // Use brackets for multi-word, plain for single-word
      const mentionText = title.includes(" ") ? `@[${title}]` : `@${title}`;
      const newValue = before + mentionText + " " + after;
      onChange(newValue);

      setShowPopup(false);
      setFilter("");
      setMentionStart(null);

      // Move cursor after the inserted mention
      setTimeout(() => {
        if (textarea) {
          const pos = before.length + mentionText.length + 1;
          textarea.selectionStart = pos;
          textarea.selectionEnd = pos;
          textarea.focus();
        }
      }, 0);
    },
    [mentionStart, value, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showPopup) return;

    const items = filtered.length > 0 ? filtered : [];
    const hasCreateOption = filter.length > 0;
    const totalItems = items.length + (hasCreateOption ? 1 : 0);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + totalItems) % totalItems);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      if (selectedIndex < items.length) {
        insertMention(items[selectedIndex]!.title);
      } else if (hasCreateOption) {
        // "Create new" option
        insertMention(filter);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowPopup(false);
      setFilter("");
      setMentionStart(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    onChange(newValue);

    // Check if we're in a mention context
    const textBefore = newValue.slice(0, cursorPos);
    const atIndex = textBefore.lastIndexOf("@");

    if (atIndex >= 0) {
      const textAfterAt = textBefore.slice(atIndex + 1);
      // Only show popup if there's no space before @ (or @ is at start), and no newline in the typed text
      const charBefore = atIndex > 0 ? newValue[atIndex - 1] : " ";
      if (
        (charBefore === " " || charBefore === "\n" || atIndex === 0) &&
        !textAfterAt.includes("\n")
      ) {
        setMentionStart(atIndex);
        setFilter(textAfterAt);
        setShowPopup(true);
        setSelectedIndex(0);
        return;
      }
    }

    setShowPopup(false);
    setFilter("");
    setMentionStart(null);
  };

  return (
    <div style={{ position: "relative" }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Delay to allow click on popup item
          setTimeout(() => setShowPopup(false), 200);
        }}
        style={style}
      />
      {showPopup && (
        <div style={popupStyles.container}>
          {filtered.map((note, i) => (
            <div
              key={note.id}
              style={{
                ...popupStyles.item,
                background:
                  i === selectedIndex ? "#45475a" : "transparent",
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(note.title);
              }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span style={popupStyles.badge}>{note.type.toUpperCase()}</span>
              {note.title}
            </div>
          ))}
          {filter.length > 0 && (
            <div
              style={{
                ...popupStyles.item,
                ...popupStyles.createItem,
                background:
                  selectedIndex === filtered.length
                    ? "#45475a"
                    : "transparent",
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(filter);
              }}
              onMouseEnter={() => setSelectedIndex(filtered.length)}
            >
              Create &ldquo;{filter}&rdquo;
            </div>
          )}
          {filtered.length === 0 && filter.length === 0 && (
            <div style={popupStyles.empty}>Type to search...</div>
          )}
        </div>
      )}
    </div>
  );
}

const popupStyles: Record<string, React.CSSProperties> = {
  container: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    right: 0,
    maxHeight: 200,
    overflowY: "auto",
    background: "#313244",
    border: "1px solid #45475a",
    borderRadius: 6,
    marginBottom: 4,
    zIndex: 200,
  },
  item: {
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: 13,
    color: "#cdd6f4",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    fontSize: 10,
    padding: "1px 4px",
    borderRadius: 3,
    background: "#585b70",
    color: "#bac2de",
    fontWeight: 600,
  },
  createItem: {
    fontStyle: "italic",
    color: "#a6adc8",
  },
  empty: {
    padding: "8px 10px",
    fontSize: 13,
    color: "#6c7086",
  },
};
